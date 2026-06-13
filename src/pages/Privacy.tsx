import { Link } from 'react-router-dom'
import { p, grain, playfair, crimson, mono } from '../lib/theme'
import { useTranslation } from '../lib/i18n'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontFamily: playfair, fontSize: 20, fontWeight: 700, color: p.text, marginBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontFamily: crimson, fontSize: 17, lineHeight: 1.7, color: p.textMuted }}>
        {children}
      </div>
    </div>
  )
}

export default function Privacy() {
  const t = useTranslation('privacy')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: p.bg, ...grain, color: p.text }}>

      <header style={{ textAlign: 'center', padding: '24px 20px 16px', borderBottom: `1px solid ${p.borderMid}` }}>
        <Link to="/">
          <img src="/logo.png" alt="Güorld Coin" style={{ width: 200, display: 'inline-block' }} />
        </Link>
      </header>

      <main style={{ maxWidth: 620, margin: '0 auto', padding: '36px 24px 64px' }}>
        <h1 style={{ fontFamily: playfair, fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: p.text, marginBottom: 6 }}>
          {t.title}
        </h1>
        <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.15em', color: p.textFaint, textTransform: 'uppercase', marginBottom: 36 }}>
          {t.lastUpdated}
        </p>

        <Section title={t.s1Title}>
          <p>{t.s1Intro}</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>{t.s1Item1}</li>
            <li>{t.s1Item2}</li>
            <li>{t.s1Item3}</li>
            <li>{t.s1Item4}</li>
            <li>{t.s1Item5}</li>
          </ul>
        </Section>

        <Section title={t.s2Title}>
          <p>{t.s2Body1}</p>
          <p style={{ marginTop: 10 }}>{t.s2Body2}</p>
        </Section>

        <Section title={t.s3Title}>
          <p>{t.s3Body}</p>
        </Section>

        <Section title={t.s4Title}>
          <p>{t.s4Body}</p>
        </Section>

        <Section title={t.s5Title}>
          <p>
            {t.s5Body}{' '}
            <a href="mailto:hello@guorld.com" style={{ color: p.amber }}>hello@guorld.com</a>.
          </p>
        </Section>
      </main>

      <footer style={{ textAlign: 'center', padding: '24px 20px', borderTop: `1px solid ${p.borderMid}` }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <Link to="/" style={{ fontFamily: mono, fontSize: 11, color: p.textFaint, letterSpacing: '0.1em', textDecoration: 'none' }}>Home</Link>
          <Link to="/terms" style={{ fontFamily: mono, fontSize: 11, color: p.textFaint, letterSpacing: '0.1em', textDecoration: 'none' }}>Terms</Link>
        </div>
      </footer>

    </div>
  )
}
