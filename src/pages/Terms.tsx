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

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: p.bg, ...grain, color: p.text }}>

      <header style={{ textAlign: 'center', padding: '24px 20px 16px', borderBottom: `1px solid ${p.borderMid}` }}>
        <Link to="/">
          <img src="/logo.png" alt="Güorld Coin" style={{ width: 200, display: 'inline-block' }} />
        </Link>
      </header>

      <main style={{ maxWidth: 620, margin: '0 auto', padding: '36px 24px 64px' }}>
        <h1 style={{ fontFamily: playfair, fontSize: 30, fontWeight: 700, fontStyle: 'italic', color: p.text, marginBottom: 6 }}>
          Terms of Use
        </h1>
        <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.15em', color: p.textFaint, textTransform: 'uppercase', marginBottom: 36 }}>
          Last updated: June 2025
        </p>

        <Section title="Content license">
          <p>
            By submitting a story, photo, or any content to Güorld Coin, you grant Güorld Coin a perpetual,
            irrevocable, worldwide, royalty-free license to display, reproduce, and share that content
            publicly as part of the coin's journey record. This includes display on the website, social media,
            and any other promotional materials.
          </p>
          <p style={{ marginTop: 10 }}>
            You retain ownership of your content. You represent that you have the right to submit it.
          </p>
        </Section>

        <Section title="Content standards">
          <p>Stories and photos must be:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li>Original — created by you or shared with permission</li>
            <li>Inoffensive — no hate speech, explicit material, or harassment</li>
            <li>Honest — genuine accounts of your experience with the coin</li>
          </ul>
          <p style={{ marginTop: 10 }}>
            Güorld Coin reserves the right to remove any content that violates these standards,
            without prior notice.
          </p>
        </Section>

        <Section title="Location data">
          <p>
            By tapping the coin and submitting a story, you consent to your GPS coordinates being
            recorded and displayed publicly as part of the coin's route on the map. This location
            is permanent and visible to all visitors.
          </p>
        </Section>

        <Section title="Service">
          <p>
            Güorld Coin is provided as-is, without warranties of any kind. We do not guarantee
            uninterrupted availability. We reserve the right to modify or discontinue any part of
            the service at any time.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For any questions about these terms, write to us at{' '}
            <a href="mailto:hello@guorld.com" style={{ color: p.amber }}>hello@guorld.com</a>.
          </p>
        </Section>
      </main>

      <footer style={{ textAlign: 'center', padding: '24px 20px', borderTop: `1px solid ${p.borderMid}` }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <Link to="/" style={{ fontFamily: mono, fontSize: 11, color: p.textFaint, letterSpacing: '0.1em', textDecoration: 'none' }}>Home</Link>
          <Link to="/privacy" style={{ fontFamily: mono, fontSize: 11, color: p.textFaint, letterSpacing: '0.1em', textDecoration: 'none' }}>Privacy</Link>
        </div>
      </footer>

    </div>
  )
}
