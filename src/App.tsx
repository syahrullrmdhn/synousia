import { useEffect, useState } from 'react'
import { ArrowRight, Moon, Sun } from 'lucide-react'

import VaporCountdown from '@/components/ui/countdown-vapor-digits'

function SynousiaMark() {
  return (
    <svg
      className="synousia-mark"
      viewBox="0 0 100 100"
      role="img"
      aria-label="Tanda Synousia"
    >
      <path
        className="synousia-mark-seats"
        d="M73.4 79.94A38 38 0 0 1 26.6 79.94M12.37 55.29A38 38 0 0 1 35.76 14.77M64.24 14.77A38 38 0 0 1 87.63 55.29"
        fill="none"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        className="synousia-mark-spark"
        d="M50 28 54.95 45.05 72 50 54.95 54.95 50 72 45.05 54.95 28 50 45.05 45.05Z"
      />
    </svg>
  )
}

function BrandMark() {
  return (
    <a className="brand" href="#top" aria-label="Synousia">
      <span className="brand-mark" aria-hidden="true">
        <SynousiaMark />
      </span>
      <span className="brand-wordmark">synousia</span>
    </a>
  )
}

export default function App() {
  const [target] = useState(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  )
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('synousia-theme')
    return stored ? stored === 'dark' : true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('synousia-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <main id="top" className="site-shell">
      <header className="site-header">
        <div className="site-wrap header-inner">
          <BrandMark />

          <nav className="main-nav" aria-label="Navigasi utama">
            <a href="#tentang">Tentang</a>
            <a href="#agenda">Agenda</a>
            <a href="#catatan">Catatan</a>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              onClick={() => setDark((current) => !current)}
              className="theme-toggle"
              aria-label={dark ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a className="header-cta" href="#agenda">
              Ikut belajar
            </a>
          </div>
        </div>
      </header>

      <section id="agenda" className="hero-section">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />

        <div className="site-wrap hero-content">
          <div className="eyebrow">
            <span className="status-dot" />
            BELAJAR BARENG · TANPA SOK TAHU
          </div>

          <h1>
            Ngobrol santai.
            <br />
            <span>Pulang bawa insight.</span>
          </h1>

          <p className="hero-description">
            Gak perlu jago dulu. Bawa rasa penasaran, duduk bareng, lalu kita
            ulik rame-rame tanpa hierarki dan tanpa jargon yang bikin jauh.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="#countdown">
              Lihat pertemuan <ArrowRight size={15} />
            </a>
            <a className="outline-button" href="#tentang">
              Kenali Synousia <ArrowRight size={14} />
            </a>
          </div>

          <div id="countdown" className="countdown-panel">
            <div className="countdown-header">
              <span>NEXT SESSION</span>
              <span className="countdown-live">
                <i /> COUNTDOWN ACTIVE
              </span>
            </div>
            <div className="countdown-body">
              <div>
                <p>Ketemu lagi dalam</p>
                <h2>Ruang belajar berikutnya segera dibuka.</h2>
              </div>
              <VaporCountdown
                targetDate={target}
                labels={['JAM', 'MENIT', 'DETIK']}
                className="synousia-countdown"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="manifesto-section">
        <div className="site-wrap manifesto-grid">
          <span className="section-label">01 / CARA KAMI BELAJAR</span>
          <p>
            Pengetahuan tidak turun dari panggung. Ia tumbuh saat orang-orang
            duduk setara, bertanya dengan jujur, dan berani bilang
            <span> “aku belum tahu.”</span>
          </p>
        </div>
      </section>

      <footer id="catatan" className="site-footer">
        <div className="site-wrap footer-inner">
          <span>© 2026 SYNOUSIA</span>
          <span className="footer-status"><i /> RUANG BELAJAR TERBUKA</span>
          <a href="#top">KEMBALI KE ATAS ↑</a>
        </div>
      </footer>
    </main>
  )
}
