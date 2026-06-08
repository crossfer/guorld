import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Coin, Entry } from '../types'

// Parchment palette — all colors in one place
const p = {
  bg:         '#F5F0E8',   // main parchment
  bgCard:     '#FDF9F3',   // cards: lighter, floats off page
  bgMap:      '#E8E1D2',   // map zone: noticeably different
  bgCta:      '#EDE6D8',   // CTA card
  border:     '#D6CCBA',   // warm tan border
  borderMid:  '#C9BFA9',   // slightly stronger border / divider
  text:       '#1C1917',   // stone-950 equivalent — near-black brown
  textMuted:  '#6B5C4E',   // mid warm brown
  textFaint:  '#9C8E7E',   // faint labels
  amber:      '#92650A',   // amber-700 — readable on parchment
  amberDot:   '#D97706',   // amber-600 — timeline dot
  dotGrid:    '#C5BAA5',   // map dot grid
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function formatKm(km: number) {
  if (km === 0) return '0 km'
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`
  return `${Math.round(km)} km`
}

function EntryCard({ entry, index, isLast }: { entry: Entry; index: number; isLast: boolean }) {
  const name = entry.keeper?.display_name ?? 'Anonymous'
  const ig = entry.keeper?.instagram?.replace('@', '')

  return (
    <div className="relative flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center w-4 shrink-0 pt-1">
        <div
          className="w-2.5 h-2.5 rounded-full z-10 shrink-0"
          style={{ backgroundColor: p.amberDot, boxShadow: `0 0 0 4px ${p.bg}` }}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1" style={{ backgroundColor: p.borderMid }} />
        )}
      </div>

      {/* Card */}
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-4' : 'pb-7'}`}>
        <div
          className="rounded-xl overflow-hidden shadow-sm"
          style={{ backgroundColor: p.bgCard, border: `1px solid ${p.border}` }}
        >
          {entry.photo_url && (
            <img
              src={entry.photo_url}
              alt=""
              className="w-full aspect-[4/3] object-cover"
            />
          )}

          <div className="p-4">
            {/* Keeper row */}
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[11px] font-mono tracking-widest"
                  style={{ color: p.amber }}
                >
                  #{String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium" style={{ color: p.text }}>{name}</span>
              </div>
              {ig && (
                <a
                  href={`https://instagram.com/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] transition-colors shrink-0"
                  style={{ color: p.textFaint }}
                >
                  @{ig}
                </a>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] mb-3" style={{ color: p.textMuted }}>
              {entry.location_name && <span>{entry.location_name}</span>}
              <span>{formatDate(entry.created_at)}</span>
              {entry.days_held != null && <span>{entry.days_held}d held</span>}
            </div>

            {/* Story */}
            {entry.story && (
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: p.text }}>
                {entry.story}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CoinPage() {
  const { slug } = useParams<{ slug: string }>()
  const [coin, setCoin] = useState<Coin | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: coinData, error } = await supabase
        .from('coins')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !coinData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setCoin(coinData)

      const { data: entriesData } = await supabase
        .from('entries')
        .select('*, keeper:keepers(*)')
        .eq('coin_id', coinData.id)
        .order('created_at', { ascending: true })

      setEntries(entriesData ?? [])
      setLoading(false)
    }

    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: p.bg }}>
        <div
          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: p.amberDot, borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (notFound || !coin) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-2 px-6 text-center"
        style={{ backgroundColor: p.bg }}
      >
        <p className="font-medium text-lg" style={{ color: p.text }}>Coin not found</p>
        <p className="text-sm" style={{ color: p.textMuted }}>
          <span className="font-mono" style={{ color: p.textFaint }}>#{slug}</span> doesn't exist or hasn't been activated yet.
        </p>
        <Link
          to="/"
          className="mt-5 text-xs transition-colors"
          style={{ color: p.amber }}
        >
          ← Back to home
        </Link>
      </div>
    )
  }

  const keeperCount = entries.length

  return (
    <div className="min-h-screen" style={{ backgroundColor: p.bg, color: p.text }}>

      {/* Header */}
      <header className="px-5 pt-8 pb-6" style={{ borderBottom: `1px solid ${p.borderMid}` }}>
        <div className="max-w-xl mx-auto">

          {/* Serial + status */}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-[11px] font-mono tracking-[0.2em] uppercase"
              style={{ color: p.amber }}
            >
              Coin #{coin.slug}
            </span>
            {coin.is_active && (
              <span
                className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full"
                style={{ color: '#166534', backgroundColor: '#dcfce7' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                active
              </span>
            )}
          </div>

          {/* Name */}
          <h1
            className="text-2xl font-semibold tracking-tight mb-6"
            style={{ color: p.text }}
          >
            {coin.name ?? `Güorld Coin #${coin.slug}`}
          </h1>

          {/* Stats */}
          <div className="flex items-end gap-8">
            <div>
              <div className="text-3xl font-bold tracking-tight leading-none" style={{ color: p.text }}>
                {formatKm(coin.total_km)}
              </div>
              <div className="text-[11px] mt-1.5 uppercase tracking-widest" style={{ color: p.textFaint }}>
                traveled
              </div>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: p.borderMid }} />
            <div>
              <div className="text-3xl font-bold tracking-tight leading-none" style={{ color: p.text }}>
                {keeperCount}
              </div>
              <div className="text-[11px] mt-1.5 uppercase tracking-widest" style={{ color: p.textFaint }}>
                {keeperCount === 1 ? 'keeper' : 'keepers'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Map */}
      <div
        className="h-[40vh] flex items-center justify-center"
        style={{
          backgroundColor: p.bgMap,
          backgroundImage: `radial-gradient(circle, ${p.dotGrid} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          borderBottom: `1px solid ${p.borderMid}`,
        }}
      >
        <div className="text-center select-none">
          <div className="text-sm" style={{ color: p.textFaint }}>Map coming soon</div>
          <div className="text-xs mt-1 font-mono" style={{ color: p.dotGrid }}>Leaflet / Mapbox</div>
        </div>
      </div>

      {/* Story So Far */}
      {coin.story_so_far && (
        <section style={{ borderBottom: `1px solid ${p.borderMid}` }}>
          <div className="max-w-xl mx-auto px-5 py-6">
            <p
              className="text-[11px] font-mono tracking-widest uppercase mb-3"
              style={{ color: p.amber }}
            >
              Story so far
            </p>
            <p
              className="text-sm leading-relaxed italic pl-4"
              style={{
                color: p.textMuted,
                borderLeft: `2px solid ${p.amberDot}50`,
              }}
            >
              {coin.story_so_far}
            </p>
          </div>
        </section>
      )}

      {/* Timeline */}
      <main className="max-w-xl mx-auto px-5 py-8">
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-5">🌍</div>
            <p className="font-medium text-base mb-1" style={{ color: p.text }}>
              No stories yet.
            </p>
            <p className="text-sm" style={{ color: p.textMuted }}>Be the first Keeper.</p>
          </div>
        ) : (
          <>
            <p
              className="text-[11px] font-mono tracking-widest uppercase mb-6"
              style={{ color: p.textFaint }}
            >
              Journey
            </p>
            {entries.map((entry, i) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                index={i}
                isLast={i === entries.length - 1}
              />
            ))}
          </>
        )}

        {/* Waitlist CTA */}
        <div
          className="mt-12 rounded-2xl p-7 text-center"
          style={{
            backgroundColor: p.bgCta,
            border: `1px solid ${p.border}`,
          }}
        >
          <p className="font-semibold text-base mb-1" style={{ color: p.text }}>
            This coin travels free.
          </p>
          <p className="text-sm mb-6" style={{ color: p.textMuted }}>
            Get your own coin and start a story that outlives you.
          </p>
          <button
            className="inline-flex items-center text-sm font-bold px-7 py-3 rounded-full transition-colors tracking-wide"
            style={{ backgroundColor: p.amberDot, color: '#fff' }}
          >
            Join the waitlist
          </button>
        </div>
      </main>
    </div>
  )
}
