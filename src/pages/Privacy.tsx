import { Link } from 'react-router-dom'
import { p, grain, playfair, crimson, mono } from '../lib/theme'

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
  return (
    <div style={{ minHeight: '100vh', backgroundColor: p.bg, ...grain, color: p.text }}>

      <header style={{ textAlign: 'center', padding: '24px 20px 16px', borderBottom: `1px solid ${p.borderMid}` }}>
        <Link to="/">
          <img src="/logo.png" alt="Güorld Coin" style={{ width: 200, display: 'inline-block' }} />
        </Link>
      </header>

      <main style={{ maxWidth: 620, margin: '0 auto', padding: '36px 24px 64px' }}>
        <h1 style={{ fontFamily: playfair, fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: p.text, marginBottom: 6 }}>
          Privacy Policy
        </h1>
        <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.15em', color: p.textFaint, textTransform: 'uppercase', marginBottom: 36 }}>
          Last updated: June 2025
        </p>

        <Section title="What we collect">
          <p>When you interact with Güorld Coin, we may collect:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Your name and Instagram handle (provided when leaving a story)</li>
            <li>Your email address (provided when joining the waitlist or opting into notifications)</li>
            <li>Your GPS coordinates and derived location name at the time of your story</li>
            <li>The story text you write</li>
            <li>Photos you upload</li>
          </ul>
        </Section>

        <Section title="How we use it">
          <p>
            Your story, name, location, and photo are displayed publicly on the coin's journey page at{' '}
            <span style={{ color: p.amber }}>guorld.com/coin/[slug]</span>. This is the core purpose of the platform —
            building a permanent, public record of the coin's travels.
          </p>
          <p style={{ marginTop: 10 }}>
            Your email address is used solely to send you notifications when the coin you held receives a new story,
            and to communicate waitlist updates. We do not use it for marketing beyond this.
          </p>
        </Section>

        <Section title="Public and permanent content">
          <p>
            Stories, photos, and location data submitted to a coin's journey are <strong>public and permanent</strong>.
            Once submitted, they form part of the coin's record and are visible to anyone who visits the coin's page.
            Please do not submit content you would not want to be permanently public.
          </p>
        </Section>

        <Section title="Data sharing">
          <p>
            We do not sell your personal data to third parties. Your data may be processed by the following
            infrastructure providers under their own privacy terms: Supabase (database and storage),
            Vercel (hosting), and Resend (email delivery).
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any privacy-related questions, write to us at{' '}
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
