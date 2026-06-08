import { useEffect, useState, lazy, Suspense, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { p } from '../lib/theme'
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
        <div
          className="flex items-center justify-center"
          style={{ height: '50vh', backgroundColor: p.bgMap, borderBottom: `1px solid ${p.borderMid}` }}
        >
          <p className="text-sm" style={{ color: p.textMuted }}>Map unavailable</p>
        </div>
      )
    }
    return this.props.children
  }
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
        entriesRes.data
          ?.map(e => e.location_name?.split(',').pop()?.trim())
          .filter(Boolean)
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
      // unique violation = already on the list, treat as success
      setWaitlistState(error.code === '23505' ? 'done' : 'error')
    } else {
      setWaitlistState('done')
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: p.bg, color: p.text }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-6 pt-14 pb-10">
        <img src="/logo.png" alt="Güorld Coin" style={{ width: 200, marginBottom: 24 }} />
        <p className="text-xl font-semibold tracking-tight max-w-xs leading-snug" style={{ color: p.text }}>
          A coin that travels the world,<br />collecting human stories.
        </p>
        <p className="mt-3 text-sm" style={{ color: p.textMuted }}>
          Tap a coin. Leave your story. Pass it on.
        </p>
      </section>

      {/* ── Stats bar ────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${p.borderMid}`, borderBottom: `1px solid ${p.borderMid}`, backgroundColor: p.bgCta }}>
        <div className="max-w-xl mx-auto flex" style={{ borderColor: p.borderMid }}>
          {[
            { label: 'km traveled', value: stats ? formatKm(stats.totalKm) : '—' },
            { label: 'keepers', value: stats ? stats.totalKeepers.toString() : '—' },
            { label: 'countries', value: stats ? stats.totalCountries.toString() : '—' },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center py-5 px-2"
              style={i > 0 ? { borderLeft: `1px solid ${p.borderMid}` } : undefined}
            >
              <span className="text-2xl font-bold tracking-tight leading-none" style={{ color: p.text }}>
                {value}
              </span>
              <span className="text-[11px] mt-1.5 uppercase tracking-widest" style={{ color: p.textFaint }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Global map ───────────────────────────────────── */}
      <MapErrorBoundary>
        <Suspense
          fallback={
            <div
              className="flex items-center justify-center"
              style={{ height: '50vh', backgroundColor: p.bgMap, borderBottom: `1px solid ${p.borderMid}` }}
            >
              <div
                className="w-5 h-5 rounded-full animate-spin"
                style={{ border: `2px solid ${p.amberDot}`, borderTopColor: 'transparent' }}
              />
            </div>
          }
        >
          <GlobalMap points={mapPoints} />
        </Suspense>
      </MapErrorBoundary>

      {/* ── Latest stories ───────────────────────────────── */}
      <section className="max-w-xl mx-auto px-5 py-8">
        <p className="text-[11px] font-mono tracking-widest uppercase mb-5" style={{ color: p.textFaint }}>
          Latest stories
        </p>

        {feed.length === 0 ? (
          <div className="flex justify-center py-10">
            <div
              className="w-5 h-5 rounded-full animate-spin"
              style={{ border: `2px solid ${p.amberDot}`, borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {feed.map(entry => (
              <Link
                key={entry.id}
                to={`/coin/${entry.coin?.slug}`}
                className="block rounded-xl p-4"
                style={{ backgroundColor: p.bgCard, border: `1px solid ${p.border}` }}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-sm font-medium truncate" style={{ color: p.text }}>
                      {entry.keeper?.display_name ?? 'Anonymous'}
                    </span>
                    {entry.location_name && (
                      <span className="text-[11px] truncate" style={{ color: p.textMuted }}>
                        {entry.location_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono" style={{ color: p.amber }}>
                      #{entry.coin?.slug}
                    </span>
                    <span className="text-[11px]" style={{ color: p.textFaint }}>
                      {timeAgo(entry.created_at)}
                    </span>
                  </div>
                </div>
                {entry.story && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: p.textMuted,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {entry.story}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Waitlist CTA ─────────────────────────────────── */}
      <section className="px-5 pb-16">
        <div
          className="max-w-xl mx-auto rounded-2xl p-7 text-center"
          style={{ backgroundColor: p.bgCta, border: `1px solid ${p.border}` }}
        >
          <p className="font-semibold text-base mb-1" style={{ color: p.text }}>
            Want your own Güorld Coin?
          </p>
          <p className="text-sm mb-6" style={{ color: p.textMuted }}>
            We're minting new coins. Join the waitlist and we'll let you know.
          </p>

          {waitlistState === 'done' ? (
            <p className="text-sm font-medium" style={{ color: p.amber }}>
              You're on the list. We'll be in touch.
            </p>
          ) : (
            <form onSubmit={handleWaitlist} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-full px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: p.bgCard, border: `1px solid ${p.border}`, color: p.text }}
              />
              <button
                type="submit"
                disabled={waitlistState === 'loading'}
                className="rounded-full px-5 py-3 text-sm font-bold tracking-wide shrink-0 disabled:opacity-60"
                style={{ backgroundColor: p.amberDot, color: '#fff' }}
              >
                {waitlistState === 'loading' ? '…' : 'Join'}
              </button>
            </form>
          )}

          {waitlistState === 'error' && (
            <p className="text-xs mt-2" style={{ color: '#991b1b' }}>
              Something went wrong. Try again.
            </p>
          )}
        </div>
      </section>

    </div>
  )
}
