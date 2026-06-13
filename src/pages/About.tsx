import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { p, grain, playfair, crimson, mono } from '../lib/theme'

const body: React.CSSProperties = {
  fontFamily: crimson,
  fontSize: 19,
  lineHeight: 1.75,
  color: p.textMuted,
  textAlign: 'center',
  margin: '0 auto 20px',
  maxWidth: 580,
}

const punchy: React.CSSProperties = {
  fontFamily: playfair,
  fontSize: 26,
  fontWeight: 700,
  color: p.text,
  textAlign: 'center',
  margin: '28px auto 4px',
  maxWidth: 580,
}

export default function About() {
  const [email, setEmail] = useState('')
  const [waitlistState, setWaitlistState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setWaitlistState('loading')
    const { error } = await supabase.from('waitlist').insert({ email: email.trim() })
    if (error) {
      setWaitlistState(error.code === '23505' ? 'done' : 'error')
    } else {
      setWaitlistState('done')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: p.bg, ...grain, color: p.text }}>

      <main style={{ maxWidth: 660, margin: '0 auto', padding: '18px 24px 42px' }}>

        {/* Title first */}
        <h1 style={{
          fontFamily: playfair,
          fontSize: 20,
          fontWeight: 700,
          color: p.amber,
          textAlign: 'center',
          marginBottom: 4,
        }}>
          Welcome to
        </h1>

        {/* Logo below the title */}
        <div style={{ textAlign: 'center', marginBottom: 2 }}>
          <Link to="/">
            <img src="/logo.png" alt="Güorld Coin" style={{ width: 200, display: 'inline-block' }} />
          </Link>
        </div>

        {/* Opening line */}
        <p style={{
          fontFamily: crimson,
          fontSize: 22,
          fontStyle: 'italic',
          color: p.amber,
          textAlign: 'center',
          margin: '0 auto 32px',
          maxWidth: 580,
          lineHeight: 1.5,
        }}>
          Not everything valuable is meant to be owned.
        </p>

        <p style={body}>Some things are meant to be shared.</p>

        <p style={body}>
          Long before screens, algorithms, and endless feeds, people connected through stories, symbols,
          and journeys. A simple object passed from one hand to another could carry memories, friendships,
          and the spirit of those who came before.
        </p>

        <p style={body}>Güorld was born from that idea.</p>

        <div style={{ textAlign: 'center', color: p.amber, opacity: 0.4, fontSize: 18, margin: '20px 0' }}>✦</div>

        <p style={body}>Every Güorld coin is more than a token.</p>

        <p style={{ ...punchy, fontSize: 30, marginBottom: 24 }}>It is an invitation.</p>

        <p style={body}>An invitation to belong to something larger than yourself.</p>
        <p style={body}>To become part of a living journey.</p>
        <p style={body}>To leave your mark, your story, and then let go.</p>

        <p style={body}>Because Güorld was never created to be collected.</p>

        <p style={{ ...punchy, marginBottom: 32 }}>It was created to move.</p>

        <div style={{ textAlign: 'center', color: p.amber, opacity: 0.4, fontSize: 18, margin: '8px 0 28px' }}>✦</div>

        <p style={body}>Each person who receives a Güorld becomes a Keeper.</p>

        <p style={punchy}>Not an owner.</p>
        <p style={{ ...punchy, marginBottom: 32 }}>A Keeper.</p>

        <p style={body}>
          A temporary guardian entrusted with preserving its story and helping it continue its journey.
        </p>

        <p style={body}>Some Keepers will carry it across oceans.</p>
        <p style={body}>Some will leave it with strangers who become friends.</p>
        <p style={body}>Some will add memories, photographs, and stories that future Keepers will discover.</p>

        <p style={{ ...body, marginTop: 8 }}>And with every hand it touches, the circle grows.</p>

        <div style={{ textAlign: 'center', color: p.amber, opacity: 0.4, fontSize: 18, margin: '20px 0' }}>✦</div>

        <p style={punchy}>Different languages.</p>
        <p style={punchy}>Different cultures.</p>
        <p style={{ ...punchy, color: p.amber, marginBottom: 32 }}>One shared purpose.</p>

        <p style={body}>To remind ourselves that we are all connected.</p>
        <p style={body}>That the world becomes smaller when stories are shared.</p>
        <p style={body}>And that meaning is created not by what we keep…</p>
        <p style={{ ...punchy, fontSize: 24, marginBottom: 40 }}>But by what we pass on.</p>

        <div style={{ textAlign: 'center', color: p.amber, opacity: 0.4, fontSize: 18, margin: '0 0 36px' }}>✦</div>

        {/* Closing lines */}
        <p style={{
          fontFamily: crimson,
          fontSize: 26,
          fontStyle: 'italic',
          color: p.text,
          textAlign: 'center',
          marginBottom: 28,
        }}>
          Where will your journey begin?
        </p>

        <p style={{
          fontFamily: mono,
          fontSize: 15,
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          color: p.amber,
          textAlign: 'center',
          marginBottom: 16,
        }}>
          Tap.&nbsp;&nbsp;Share.&nbsp;&nbsp;Travel.
        </p>

        <p style={{ ...body, marginBottom: 48 }}>And become a Keeper.</p>

        {/* CTA card */}
        <div style={{
          padding: '32px 24px',
          border: `2px solid ${p.borderMid}`,
          outline: `1px solid ${p.border}`,
          outlineOffset: 4,
          backgroundColor: p.bgCta,
          textAlign: 'center',
          maxWidth: 520,
          margin: '0 auto',
        }}>
          {/* Already have a coin */}
          <p style={{ fontFamily: crimson, fontSize: 18, color: p.textMuted, marginBottom: 20 }}>
            Already have a coin?{' '}
            <span style={{ color: p.text, fontStyle: 'italic' }}>Tap it and begin.</span>
          </p>

          {/* Divider */}
          <div style={{ fontFamily: mono, fontSize: 13, color: p.textFaint, letterSpacing: '0.2em', marginBottom: 20 }}>
            · · ·
          </div>

          {/* Waitlist */}
          <p style={{ fontFamily: playfair, fontStyle: 'italic', fontSize: 19, color: p.text, marginBottom: 16 }}>
            Don't have one yet?
          </p>

          {waitlistState === 'done' ? (
            <p style={{ fontFamily: crimson, fontStyle: 'italic', fontSize: 17, color: p.amber }}>
              You're on the list. We'll be in touch.
            </p>
          ) : (
            <form onSubmit={handleWaitlist} style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); if (waitlistState === 'error') setWaitlistState('idle') }}
                placeholder="your@email.com"
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  fontSize: 15,
                  fontFamily: crimson,
                  outline: 'none',
                  backgroundColor: p.bgCard,
                  border: `1px solid ${p.border}`,
                  color: p.text,
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                disabled={waitlistState === 'loading'}
                style={{
                  padding: '11px 18px',
                  fontSize: 12,
                  fontFamily: mono,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  backgroundColor: p.amberDot,
                  color: '#FAF5E9',
                  cursor: 'pointer',
                  border: 'none',
                  flexShrink: 0,
                  opacity: waitlistState === 'loading' ? 0.6 : 1,
                }}
              >
                {waitlistState === 'loading' ? '…' : 'Join the waitlist'}
              </button>
            </form>
          )}

          {waitlistState === 'error' && (
            <p style={{ fontFamily: mono, fontSize: 11, color: '#8B1A1A', marginTop: 8 }}>
              Something went wrong. Try again.
            </p>
          )}
        </div>

      </main>

      <footer style={{ textAlign: 'center', padding: '16px 20px 32px', borderTop: `1px solid ${p.borderMid}` }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <Link to="/" style={{ fontFamily: mono, fontSize: 11, color: p.textFaint, letterSpacing: '0.1em', textDecoration: 'none' }}>Home</Link>
          <Link to="/privacy" style={{ fontFamily: mono, fontSize: 11, color: p.textFaint, letterSpacing: '0.1em', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms" style={{ fontFamily: mono, fontSize: 11, color: p.textFaint, letterSpacing: '0.1em', textDecoration: 'none' }}>Terms</Link>
        </div>
      </footer>

    </div>
  )
}
