'use client'

import { useEffect, useRef } from 'react'

function hash2(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

function vnoise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash2(xi, yi)
  const b = hash2(xi + 1, yi)
  const c = hash2(xi, yi + 1)
  const d = hash2(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function noise2(x: number, y: number) {
  return 0.65 * vnoise(x, y) + 0.35 * vnoise(x * 2.1 + 19.7, y * 2.1 + 7.3)
}

const FLOATS = 6
const MAX_GRAINS = 2500
const SAMPLE_STRIDE = 3
const SPRING_K = 90
const ZETA = 0.55
const DRAG = 0.92
const DT_MAX = 0.032
const FIELD_SCALE = 0.008
const CURL_EPS = 0.75
const PAD_X = 40
const PAD_TOP = 110
const PAD_BOTTOM = 20

const DEFAULT_LABELS = ['HOURS', 'MINUTES', 'SECONDS'] as const

type Slot = {
  g: Float32Array
  v: Float32Array
  gc: number
  vc: number
  active: boolean
}

export function VaporCountdown({
  targetDate,
  labels = DEFAULT_LABELS,
  className = '',
}: {
  targetDate?: Date | string | number
  labels?: readonly [string, string, string] | null
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef<HTMLTimeElement>(null)
  const targetKey = targetDate instanceof Date ? targetDate.getTime() : targetDate

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const timeEl = timeRef.current
    if (!root || !canvas || !timeEl) return

    const digitEls = Array.from(
      root.querySelectorAll<HTMLSpanElement>('[data-vc-digit]'),
    )
    if (digitEls.length !== 6) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targetMs =
      targetKey == null
        ? Date.now() + 86_400_000
        : typeof targetKey === 'number'
          ? targetKey
          : new Date(targetKey).getTime()

    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let digits = '000000'

    const remaining = () => Math.max(0, targetMs - Date.now())
    const toDigits = () => {
      const rem = Math.round(remaining() / 1000)
      const h = Math.min(99, Math.floor(rem / 3600))
      const m = Math.floor((rem % 3600) / 60)
      const s = rem % 60
      return (
        String(h).padStart(2, '0') +
        String(m).padStart(2, '0') +
        String(s).padStart(2, '0')
      )
    }
    const applyDateTime = () => {
      timeEl.setAttribute(
        'datetime',
        `PT${digits.slice(0, 2)}H${digits.slice(2, 4)}M${digits.slice(4)}S`,
      )
    }

    const ctx = canvas.getContext('2d')
    let grainColor = '#ededed'
    const updateGrainColor = () => {
      grainColor = getComputedStyle(digitEls[0]).color || grainColor
    }
    updateGrainColor()

    const slots: Slot[] = Array.from({ length: 6 }, () => ({
      g: new Float32Array(MAX_GRAINS * FLOATS),
      v: new Float32Array(MAX_GRAINS * FLOATS),
      gc: 0,
      vc: 0,
      active: false,
    }))
    let glyphs: Float32Array[] | null = null
    let cells: { x: number; y: number }[] = []
    let cw = 0
    let ch = 0
    let lastW = 0
    let lastH = 0
    let raf = 0
    let last = 0
    const dampC = 2 * ZETA * Math.sqrt(SPRING_K)

    const loop = (now: number) => {
      if (!ctx) return
      const dt = Math.min(Math.max((now - last) / 1000, 0), DT_MAX)
      last = now
      ctx.clearRect(0, 0, cw, ch)
      ctx.fillStyle = grainColor
      let anyActive = false

      for (let s = 0; s < 6; s++) {
        const slot = slots[s]
        const g = slot.g
        const vapor = slot.v

        if (!slot.active) {
          ctx.globalAlpha = 0.5
          for (let i = 0; i < slot.gc; i++) {
            const offset = i * FLOATS
            ctx.fillRect(g[offset] - 1, g[offset + 1] - 1, 2, 2)
          }
          continue
        }

        anyActive = true
        let settled = true

        for (let i = 0; i < slot.gc; i++) {
          const offset = i * FLOATS
          let x = g[offset]
          let y = g[offset + 1]
          let vx = g[offset + 2]
          let vy = g[offset + 3]
          const hx = g[offset + 4]
          const hy = g[offset + 5]

          vx = (vx + (SPRING_K * (hx - x) - dampC * vx) * dt) * DRAG
          vy = (vy + (SPRING_K * (hy - y) - dampC * vy) * dt) * DRAG
          x += vx * dt
          y += vy * dt

          g[offset] = x
          g[offset + 1] = y
          g[offset + 2] = vx
          g[offset + 3] = vy

          if (
            Math.abs(x - hx) > 0.5 ||
            Math.abs(y - hy) > 0.5 ||
            Math.abs(vx) > 2 ||
            Math.abs(vy) > 2
          ) {
            settled = false
          }

          const speed = Math.hypot(vx, vy)
          ctx.globalAlpha = 0.5 + 0.5 * Math.min(1, speed / 500)
          ctx.fillRect(x - 1, y - 1, 2, 2)
        }

        let j = 0
        while (j < slot.vc) {
          const offset = j * FLOATS
          const age = vapor[offset + 4] + dt * 1000
          const life = vapor[offset + 5]
          if (age >= life) {
            const lastOffset = (slot.vc - 1) * FLOATS
            for (let k = 0; k < FLOATS; k++) vapor[offset + k] = vapor[lastOffset + k]
            slot.vc--
            continue
          }

          vapor[offset + 4] = age
          let x = vapor[offset]
          let y = vapor[offset + 1]
          let vx = vapor[offset + 2]
          let vy = vapor[offset + 3]
          const nx = x * FIELD_SCALE
          const ny = y * FIELD_SCALE
          const dndx = noise2(nx + CURL_EPS, ny) - noise2(nx - CURL_EPS, ny)
          const dndy = noise2(nx, ny + CURL_EPS) - noise2(nx, ny - CURL_EPS)
          let wx = dndy
          let wy = -dndx
          const curlLength = Math.hypot(wx, wy) || 1
          const speed = 40 + 50 * hash2(j * 1.31, s * 7.7)
          wx = (wx / curlLength) * speed * 0.6
          wy = (wy / curlLength) * speed * 0.6 - speed * 0.8
          const mix = Math.min(1, dt * 5)
          vx += (wx - vx) * mix
          vy += (wy - vy) * mix
          x += vx * dt
          y += vy * dt

          vapor[offset] = x
          vapor[offset + 1] = y
          vapor[offset + 2] = vx
          vapor[offset + 3] = vy

          const velocity = Math.hypot(vx, vy)
          ctx.globalAlpha =
            (1 - age / life) * (0.5 + 0.5 * Math.min(1, velocity / 500))
          ctx.fillRect(x - 1, y - 1, 2, 2)
          j++
        }

        if (slot.vc > 0) settled = false
        if (settled) {
          for (let i = 0; i < slot.gc; i++) {
            const offset = i * FLOATS
            g[offset] = g[offset + 4]
            g[offset + 1] = g[offset + 5]
            g[offset + 2] = 0
            g[offset + 3] = 0
          }
          slot.active = false
        }
      }

      ctx.globalAlpha = 1
      raf = anyActive ? requestAnimationFrame(loop) : 0
    }

    const wake = () => {
      if (!raf && ctx) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }

    const transition = (slotIndex: number, digit: number) => {
      if (!glyphs) return
      const slot = slots[slotIndex]
      const g = slot.g
      const vapor = slot.v
      let vaporCount = 0

      for (let i = 0; i < slot.gc && vaporCount < MAX_GRAINS; i++) {
        const offset = i * FLOATS
        const vaporOffset = vaporCount * FLOATS
        vapor[vaporOffset] = g[offset]
        vapor[vaporOffset + 1] = g[offset + 1]
        vapor[vaporOffset + 2] = g[offset + 2] * 0.4
        vapor[vaporOffset + 3] = g[offset + 3] * 0.4 - 12
        vapor[vaporOffset + 4] = 0
        vapor[vaporOffset + 5] = 600 + Math.random() * 300
        vaporCount++
      }
      slot.vc = vaporCount

      const homes = glyphs[digit]
      const cell = cells[slotIndex]
      const count = homes.length / 2
      slot.gc = count
      for (let i = 0; i < count; i++) {
        const offset = i * FLOATS
        const hx = cell.x + homes[i * 2]
        const hy = cell.y + homes[i * 2 + 1]
        if (vaporCount > 0) {
          const source = ((Math.random() * vaporCount) | 0) * FLOATS
          g[offset] = vapor[source] + (Math.random() - 0.5) * 10
          g[offset + 1] = vapor[source + 1] + (Math.random() - 0.5) * 10
          g[offset + 2] = (Math.random() - 0.5) * 40
          g[offset + 3] = -20 - Math.random() * 40
        } else {
          g[offset] = hx
          g[offset + 1] = hy
          g[offset + 2] = 0
          g[offset + 3] = 0
        }
        g[offset + 4] = hx
        g[offset + 5] = hy
      }
      slot.active = true
    }

    const init = () => {
      if (!ctx) return
      const rootRect = root.getBoundingClientRect()
      const width = Math.round(rootRect.width)
      const height = Math.round(rootRect.height)
      if (width < 2 || height < 2) return
      lastW = width
      lastH = height
      cw = width + PAD_X * 2
      ch = height + PAD_TOP + PAD_BOTTOM
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = cw * dpr
      canvas.height = ch * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cells = digitEls.map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          x: rect.left - rootRect.left + PAD_X,
          y: rect.top - rootRect.top + PAD_TOP,
        }
      })

      const cellRect = digitEls[0].getBoundingClientRect()
      const glyphWidth = Math.max(2, Math.ceil(cellRect.width))
      const glyphHeight = Math.max(2, Math.ceil(cellRect.height))
      const offscreen = document.createElement('canvas')
      offscreen.width = glyphWidth
      offscreen.height = glyphHeight
      const offscreenContext = offscreen.getContext('2d', { willReadFrequently: true })
      if (!offscreenContext) return
      const styles = getComputedStyle(digitEls[0])
      offscreenContext.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`
      offscreenContext.textAlign = 'center'
      offscreenContext.textBaseline = 'middle'
      offscreenContext.fillStyle = '#ffffff'
      glyphs = []

      for (let digit = 0; digit < 10; digit++) {
        offscreenContext.clearRect(0, 0, glyphWidth, glyphHeight)
        offscreenContext.fillText(String(digit), glyphWidth / 2, glyphHeight / 2)
        const alpha = offscreenContext.getImageData(0, 0, glyphWidth, glyphHeight).data
        const points: number[] = []
        for (let y = 1; y < glyphHeight; y += SAMPLE_STRIDE) {
          const row = y * glyphWidth
          for (let x = 1; x < glyphWidth; x += SAMPLE_STRIDE) {
            if (alpha[(row + x) * 4 + 3] > 128) points.push(x, y)
          }
        }

        const total = points.length / 2
        const keepEvery = Math.max(1, Math.ceil(total / MAX_GRAINS))
        const homes = new Float32Array(Math.ceil(total / keepEvery) * 2)
        let count = 0
        for (let i = 0; i < total; i += keepEvery) {
          homes[count * 2] = points[i * 2]
          homes[count * 2 + 1] = points[i * 2 + 1]
          count++
        }
        glyphs.push(homes.subarray(0, count * 2))
      }

      for (let slotIndex = 0; slotIndex < 6; slotIndex++) {
        const slot = slots[slotIndex]
        const homes = glyphs[Number(digits.charAt(slotIndex))]
        const cell = cells[slotIndex]
        const count = homes.length / 2
        slot.gc = count
        slot.vc = 0
        slot.active = false
        for (let i = 0; i < count; i++) {
          const offset = i * FLOATS
          const hx = cell.x + homes[i * 2]
          const hy = cell.y + homes[i * 2 + 1]
          slot.g[offset] = hx
          slot.g[offset + 1] = hy
          slot.g[offset + 2] = 0
          slot.g[offset + 3] = 0
          slot.g[offset + 4] = hx
          slot.g[offset + 5] = hy
        }
      }
      wake()
    }

    const schedule = () => {
      timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 15)
    }
    const tick = () => {
      const next = toDigits()
      if (next !== digits) {
        for (let slotIndex = 0; slotIndex < 6; slotIndex++) {
          if (next.charAt(slotIndex) !== digits.charAt(slotIndex)) {
            digitEls[slotIndex].textContent = next.charAt(slotIndex)
            if (!reduced) transition(slotIndex, Number(next.charAt(slotIndex)))
          }
        }
        digits = next
        applyDateTime()
        if (!reduced) wake()
      }
      if (remaining() > 0) schedule()
    }

    digits = toDigits()
    for (let slotIndex = 0; slotIndex < 6; slotIndex++) {
      digitEls[slotIndex].textContent = digits.charAt(slotIndex)
    }
    applyDateTime()
    if (remaining() > 0) schedule()

    if (reduced || !ctx) {
      return () => {
        disposed = true
        if (timer) clearTimeout(timer)
      }
    }

    let resizeObserver: ResizeObserver | undefined
    document.fonts.ready.then(() => {
      if (disposed) return
      init()
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry) return
        const width = Math.round(entry.contentRect.width)
        const height = Math.round(entry.contentRect.height)
        if (width !== lastW || height !== lastH) init()
      })
      resizeObserver.observe(root)
    })

    const onThemeChange = () => {
      updateGrainColor()
      wake()
    }
    const mutationObserver = new MutationObserver(onThemeChange)
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    colorScheme.addEventListener('change', onThemeChange)

    return () => {
      disposed = true
      if (timer) clearTimeout(timer)
      cancelAnimationFrame(raf)
      raf = 0
      resizeObserver?.disconnect()
      mutationObserver.disconnect()
      colorScheme.removeEventListener('change', onThemeChange)
    }
  }, [targetKey])

  return (
    <div
      ref={rootRef}
      className={`relative inline-grid select-none ${className}`}
      style={{
        gridTemplateColumns: 'repeat(3, auto)',
        columnGap: '0.45em',
        rowGap: '0.75rem',
        fontSize: 'clamp(2.5rem, 8vw, 5rem)',
      }}
    >
      <time ref={timeRef} aria-live="off" style={{ display: 'contents' }}>
        {[0, 1, 2].map((group) => (
          <span
            key={group}
            className="flex justify-center font-mono font-semibold leading-none tracking-[-0.06em] text-foreground opacity-0 tabular-nums motion-reduce:opacity-100"
          >
            <span data-vc-digit>0</span>
            <span data-vc-digit>0</span>
          </span>
        ))}
      </time>
      {labels?.map((label) => (
        <span
          key={label}
          className="text-center font-mono text-[10px] font-semibold tracking-[0.22em] text-ns-muted"
        >
          {label}
        </span>
      ))}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute motion-reduce:hidden"
        style={{
          left: -PAD_X,
          top: -PAD_TOP,
          width: `calc(100% + ${PAD_X * 2}px)`,
          height: `calc(100% + ${PAD_TOP + PAD_BOTTOM}px)`,
        }}
      />
    </div>
  )
}

export default VaporCountdown
