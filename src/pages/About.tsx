import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { p, grain, playfair, crimson, mono } from '../lib/theme'
import { useTranslation } from '../lib/i18n'

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
  const t = useTranslation('about')
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

        <h1 style={{
          fontFamily: playfair,
          fontSize: 20,
          fontWeight: 700,
          color: p.amber,
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {t.welcomeTo}
        </h1>

        <div style={{ textAlign: 'center', marginBottom: 2 }}>
          <Link to="/">
            <img src="/logo.png" alt="Güorld Coin" style={{ width: 200, display: 'inline-block' }} />
          </Link>
        </div>

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
          {t.openingLine}
        </p>

        <p style={body}>{t.someThings}</p>
        <p style={body}>{t.longBefore}</p>
        <p style={body}>{t.bornIdea}</p>

        <div style={{ textAlign: 'center', color: p.amber, opacity: 0.4, fontSize: 18, margin: '20px 0' }}>✦</div>

        <p style={body}>{t.moreThanToken}</p>
        <p style={{ ...punchy, fontSize: 30, marginBottom: 24 }}>{t.isInvitation}</p>
        <p style={body}>{t.inviteBelong}</p>
        <p style={body}>{t.becomePart}</p>
        <p style={body}>{t.leaveYourMark}</p>
        <p style={body}>{t.neverCollected}</p>
        <p style={{ ...punchy, marginBottom: 32 }}>{t.createdToMove}</p>

        <div style={{ textAlign: 'center', color: p.amber, opacity: 0.4, fontSize: 18, margin: '8px 0 28px' }}>✦</div>

        <p style={body}>{t.eachPerson}</p>
        <p style={punchy}>{t.notAnOwner}</p>
        <p style={{ ...punchy, marginBottom: 32 }}>{t.aKeeper}</p>
        <p style={body}>{t.temporaryGuardian}</p>
        <p style={body}>{t.acrossOceans}</p>
        <p style={body}>{t.strangersFriends}</p>
        <p style={body}>{t.addMemories}</p>
        <p style={{ ...body, marginTop: 8 }}>{t.circleGrows}</p>

        <div style={{ textAlign: 'center', color: p.amber, opacity: 0.4, fontSize: 18, margin: '20px 0' }}>✦</div>

        <p style={punchy}>{t.diffLanguages}</p>
        <p style={punchy}>{t.diffCultures}</p>
        <p style={{ ...punchy, color: p.amber, marginBottom: 32 }}>{t.onePurpose}</p>
        <p style={body}>{t.remindConnected}</p>
        <p style={body}>{t.worldSmaller}</p>
        <p style={body}>{t.meaningCreated}</p>
        <p style={{ ...punchy, fontSize: 24, marginBottom: 40 }}>{t.butPassOn}</p>

        <div style={{ textAlign: 'center', color: p.amber, opacity: 0.4, fontSize: 18, margin: '0 0 36px' }}>✦</div>

        <p style={{
          fontFamily: crimson,
          fontSize: 26,
          fontStyle: 'italic',
          color: p.text,
          textAlign: 'center',
          marginBottom: 28,
        }}>
          {t.whereBegin}
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
          {t.tapWord}&nbsp;&nbsp;{t.shareWord}&nbsp;&nbsp;{t.travelWord}
        </p>

        <p style={{ ...body, marginBottom: 48 }}>{t.becomeKeeper}</p>

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
          <p style={{ fontFamily: crimson, fontSize: 18, color: p.textMuted, marginBottom: 20 }}>
            {t.alreadyHaveCoin}
          </p>

          <div style={{ fontFamily: mono, fontSize: 13, color: p.textFaint, letterSpacing: '0.2em', marginBottom: 20 }}>
            · · ·
          </div>

          <p style={{ fontFamily: playfair, fontStyle: 'italic', fontSize: 19, color: p.text, marginBottom: 16 }}>
            {t.dontHaveOne}
          </p>

          {waitlistState === 'done' ? (
            <p style={{ fontFamily: crimson, fontStyle: 'italic', fontSize: 17, color: p.amber }}>
              {t.waitlistDone}
            </p>
          ) : (
            <form onSubmit={handleWaitlist} style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); if (waitlistState === 'error') setWaitlistState('idle') }}
                placeholder={t.emailPlaceholder}
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
                {waitlistState === 'loading' ? '…' : t.joinWaitlist}
              </button>
            </form>
          )}

          {waitlistState === 'error' && (
            <p style={{ fontFamily: mono, fontSize: 11, color: '#8B1A1A', marginTop: 8 }}>
              {t.waitlistError}
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
