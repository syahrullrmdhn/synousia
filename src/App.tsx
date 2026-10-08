import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

import VaporCountdown from '@/components/ui/countdown-vapor-digits'

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5" aria-label="Synousia">
      <span className="relative grid size-9 place-items-center rounded-full border-[3px] border-secondary">
        <span className="size-2.5 rotate-45 rounded-[2px] bg-primary" />
        <span className="absolute inset-1 rounded-full border border-secondary/60" />
      </span>
      <span className="font-display text-xl font-bold tracking-[-0.04em]">synousia</span>
    </div>
  )
}

export default function App() {
  const [target] = useState(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  )
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('synousia-theme')
    return stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('synousia-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute -top-40 -left-32 size-96 rounded-full bg-accent/70 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-48 size-[30rem] rounded-full bg-muted/80 blur-3xl" />

      <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-b border-border py-5">
        <BrandMark />
        <div className="flex items-center gap-4">
          <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:block">
            Ilmu menyala dari kebersamaan
          </span>
          <button
            type="button"
            onClick={() => setDark((current) => !current)}
            className="relative grid size-10 place-items-center overflow-hidden rounded-full border border-border bg-card/70 text-foreground shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-secondary"
            aria-label={dark ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
          >
            {dark ? <Sun className="size-4.5 text-primary" /> : <Moon className="size-4.5 text-secondary" />}
          </button>
        </div>
      </nav>

      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary">
          Lingkaran berikutnya dimulai dalam
        </p>
        <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold tracking-[-0.045em] text-balance sm:text-6xl">
          Duduk bersama, menyala bersama.
        </h1>

        <div className="my-16 flex min-h-40 items-center justify-center sm:my-20">
          <VaporCountdown
            targetDate={target}
            labels={['JAM', 'MENIT', 'DETIK']}
          />
        </div>

        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Tak ada panggung, hanya lingkaran. Bawa pertanyaan dan apa pun yang sedang kamu pelajari.
        </p>
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-border py-5 text-xs text-muted-foreground">
        <span>Synousia</span>
        <span>Komunitas pengetahuan</span>
      </footer>
    </main>
  )
}
