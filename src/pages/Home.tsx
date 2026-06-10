import { useEffect, useState, lazy, Suspense, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { p, grain, playfair, crimson, mono } from '../lib/theme'
import type { Entry, Keeper } from '../types'

const GlobalMap = lazy(() =>
  import('../components/GlobalMap').then(m => ({ default: m.GlobalMap }))
)

// ── Error boundary ───────────────────────────────────────────
class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[GlobalMap] error boundary caught:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: p.bgMap, borderBottom: `1px solid ${p.borderMid}` }}>
          <p style={{ color: p.textMuted, fontFamily: mono, fontSize: 12 }}>Map unavailable</p>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Compass divider ──────────────────────────────────────────
function CompassDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 0', opacity: 0.6 }}>
      <div style={{ flex: 1, borderTop: `1px dashed ${p.borderMid}` }} />
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2" fill={p.amber} />
        <line x1="10" y1="1" x2="10" y2="7.5"  stroke={p.amber} strokeWidth="0.8" />
        <line x1="10" y1="12.5" x2="10" y2="19" stroke={p.amber} strokeWidth="0.8" />
        <line x1="1" y1="10" x2="7.5" y2="10"  stroke={p.amber} strokeWidth="0.8" />
        <line x1="12.5" y1="10" x2="19" y2="10" stroke={p.amber} strokeWidth="0.8" />
        <polygon points="10,1.5 11.3,6.5 10,8 8.7,6.5" fill={p.amberDot} opacity="0.9" />
      </svg>
      <div style={{ flex: 1, borderTop: `1px dashed ${p.borderMid}` }} />
    </div>
  )
}

// ── Section label ────────────────────────────────────────────
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
      <div style={{ flex: 1, borderTop: `1px solid ${p.borderMid}` }} />
      <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.22em', color: p.textFaint, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      <div style={{ flex: 1, borderTop: `1px solid ${p.borderMid}` }} />
    </div>
  )
}

// ── Types ────────────────────────────────────────────────────
interface Stats {
  totalKm: number
  totalKeepers: number
  totalCountries: number
}

interface FeedEntry extends Entry {
  keeper: Keeper | null
  coin: { slug: string; name: string | null } | null
}

// ── Helpers ──────────────────────────────────────────────────
function formatKm(km: number) {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k`
  return `${Math.round(km)}`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ── Component ────────────────────────────────────────────────
export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [mapPoints, setMapPoints] = useState<{ lat: number; lng: number }[]>([])
  const [feed, setFeed] = useState<FeedEntry[]>([])
  const [email, setEmail] = useState('')
  const [waitlistState, setWaitlistState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  useEffect(() => {
    async function load() {
      const [coinsRes, keepersRes, entriesRes, feedRes] = await Promise.all([
        supabase.from('coins').select('total_km'),
        supabase.from('keepers').select('id', { count: 'exact', head: true }),
        supabase.from('entries').select('lat, lng, location_name').not('lat', 'is', null),
        supabase
          .from('entries')
          .select('*, keeper:keepers(id, display_name, instagram, total_km, created_at), coin:coins(slug, name)')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const totalKm = coinsRes.data?.reduce((sum, c) => sum + (c.total_km ?? 0), 0) ?? 0
      const totalKeepers = keepersRes.count ?? 0
      const countries = new Set(
        entriesRes.data?.map(e => e.location_name?.split(',').pop()?.trim()).filter(Boolean)
      )

      setStats({ totalKm, totalKeepers, totalCountries: countries.size })
      setMapPoints(
        (entriesRes.data ?? [])
          .filter(e => e.lat != null && e.lng != null)
          .map(e => ({ lat: e.lat as number, lng: e.lng as number }))
      )
      setFeed((feedRes.data ?? []) as FeedEntry[])
    }
    load()
  }, [])

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

  const stamps = [
    { label: 'KM\nTRAVELED', value: stats ? formatKm(stats.totalKm) : '—', rotate: '-1.5deg' },
    { label: 'KEEPERS', value: stats ? stats.totalKeepers.toString() : '—', rotate: '1deg' },
    { label: 'COUNTRIES', value: stats ? stats.totalCountries.toString() : '—', rotate: '-0.8deg' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: p.bg, ...grain, color: p.text }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '10px 10px 10px' }}>
        <img src="/logo.png" alt="Güorld Coin" style={{ width: 280, marginBottom: -20, display: 'inline-block' }} />
        <p style={{
          fontFamily: playfair,
          fontSize: 28,
          fontStyle: 'italic',
          fontWeight: 700,
          color: p.text,
          lineHeight: 1.2,
          maxWidth: 360,
          margin: '0 auto 14px',
        }}>
          A coin that travels the world, collecting human stories.
        </p>
        <p style={{ fontFamily: mono, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.textMuted }}>
          Tap &nbsp;·&nbsp; Leave your story &nbsp;·&nbsp; Pass it on
        </p>
      </section>

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 20px' }}>
        <CompassDivider />
      </div>

      {/* ── Stats — passport stamps ───────────────────── */}
      <section style={{ padding: '12px 24px 16px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', gap: 14 }}>
          {stamps.map(({ label, value, rotate }) => (
            <div
              key={label}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '14px 8px 12px',
                border: `2px solid ${p.amber}`,
                outline: `1px solid ${p.amber}`,
                outlineOffset: 3,
                transform: `rotate(${rotate})`,
                backgroundColor: p.bgCard,
              }}
            >
              <div style={{ fontFamily: playfair, fontSize: 42, fontWeight: 700, color: p.text, lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontFamily: mono, fontSize: 13, letterSpacing: '0.18em', color: p.textFaint, marginTop: 8, whiteSpace: 'pre', textTransform: 'uppercase' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 20px' }}>
        <CompassDivider />
      </div>

      {/* ── Map ──────────────────────────────────────────── */}
      <div>
        <p style={{ fontFamily: mono, fontSize: 12, letterSpacing: '0.25em', textTransform: 'uppercase', color: p.textFaint, textAlign: 'center', padding: '6px 0 4px' }}>
          ⊕ &nbsp;Known Territories
        </p>
        <div style={{ filter: 'sepia(28%) saturate(0.85) brightness(0.97)' }}>
          <MapErrorBoundary>
            <Suspense
              fallback={
                <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: p.bgMap, borderBottom: `1px solid ${p.borderMid}` }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${p.amberDot}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                </div>
              }
            >
              <GlobalMap points={mapPoints} />
            </Suspense>
          </MapErrorBoundary>
        </div>
      </div>

      {/* ── Latest stories ───────────────────────────────── */}
      <section style={{ maxWidth: 580, margin: '0 auto', padding: '24px 20px 8px' }}>
        <SectionLabel>Dispatches from the field</SectionLabel>

        {feed.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${p.amberDot}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {feed.map(entry => (
              <Link
                key={entry.id}
                to={`/coin/${entry.coin?.slug}`}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  backgroundColor: p.bgCard,
                  border: `1px solid ${p.border}`,
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                    <span style={{ fontFamily: crimson, fontSize: 16, fontWeight: 600, color: p.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.keeper?.display_name ?? 'Anonymous'}
                    </span>
                    {entry.location_name && (
                      <span style={{ fontFamily: mono, fontSize: 10, color: p.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.location_name}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: mono, fontSize: 10, color: p.amber }}>#{entry.coin?.slug}</span>
                    <span style={{ fontFamily: mono, fontSize: 10, color: p.textFaint }}>{timeAgo(entry.created_at)}</span>
                  </div>
                </div>
                {entry.story && (
                  <p style={{
                    fontFamily: crimson,
                    fontSize: 15,
                    lineHeight: 1.5,
                    color: p.textMuted,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {entry.story}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Waitlist CTA ─────────────────────────────────── */}
      <section style={{ maxWidth: 580, margin: '0 auto', padding: '20px 20px 48px' }}>
        <div style={{ padding: '28px 24px', border: `2px solid ${p.borderMid}`, outline: `1px solid ${p.border}`, outlineOffset: 4, backgroundColor: p.bgCta, textAlign: 'center' }}>
          <p style={{ fontFamily: playfair, fontSize: 22, fontStyle: 'italic', color: p.text, marginBottom: 6 }}>
            Want your own Güorld Coin?
          </p>
          <p style={{ fontFamily: crimson, fontSize: 16, color: p.textMuted, marginBottom: 20 }}>
            We're minting new coins. Join the waitlist and we'll let you know.
          </p>

          {waitlistState === 'done' ? (
            <p style={{ fontFamily: crimson, fontSize: 16, fontStyle: 'italic', color: p.amber }}>
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
                  fontSize: 14,
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
                  padding: '11px 20px',
                  fontSize: 13,
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
                {waitlistState === 'loading' ? '…' : 'Join'}
              </button>
            </form>
          )}

          {waitlistState === 'error' && (
            <p style={{ fontFamily: mono, fontSize: 11, color: '#8B1A1A', marginTop: 8 }}>Something went wrong. Try again.</p>
          )}
        </div>
      </section>

    </div>
  )
}
