import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Coin, Entry } from '../types'

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
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-stone-950 z-10" />
        {!isLast && <div className="w-px flex-1 bg-stone-800 mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 min-w-0 ${isLast ? 'pb-4' : 'pb-8'}`}>
        <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
          {entry.photo_url && (
            <img
              src={entry.photo_url}
              alt=""
              className="w-full aspect-[4/3] object-cover"
            />
          )}

          <div className="p-4">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-mono text-amber-400 tracking-widest">
                  #{String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium text-stone-100">{name}</span>
              </div>
              {ig && (
                <a
                  href={`https://instagram.com/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-stone-500 hover:text-stone-300 transition-colors shrink-0"
                >
                  @{ig}
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-stone-500 mb-3">
              {entry.location_name && <span>{entry.location_name}</span>}
              <span>{formatDate(entry.created_at)}</span>
              {entry.days_held != null && <span>{entry.days_held}d held</span>}
            </div>

            {entry.story && (
              <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">
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
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !coin) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-stone-100 font-medium text-lg">Coin not found</p>
        <p className="text-stone-500 text-sm">
          <span className="font-mono text-stone-400">#{slug}</span> doesn't exist or hasn't been activated yet.
        </p>
        <Link to="/" className="mt-5 text-xs text-amber-500 hover:text-amber-400 transition-colors">
          ← Back to home
        </Link>
      </div>
    )
  }

  const keeperCount = entries.length

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">

      {/* Header */}
      <header className="px-5 pt-8 pb-6 border-b border-stone-800/60">
        <div className="max-w-xl mx-auto">

          {/* Serial + status */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-mono tracking-[0.2em] text-amber-400 uppercase">
              Coin #{coin.slug}
            </span>
            {coin.is_active && (
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                active
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-semibold tracking-tight text-stone-100 mb-6">
            {coin.name ?? `Güorld Coin #${coin.slug}`}
          </h1>

          {/* Stats */}
          <div className="flex items-end gap-8">
            <div>
              <div className="text-3xl font-bold tracking-tight text-stone-100 leading-none">
                {formatKm(coin.total_km)}
              </div>
              <div className="text-[11px] text-stone-500 mt-1.5 uppercase tracking-widest">traveled</div>
            </div>
            <div className="w-px h-8 bg-stone-800" />
            <div>
              <div className="text-3xl font-bold tracking-tight text-stone-100 leading-none">
                {keeperCount}
              </div>
              <div className="text-[11px] text-stone-500 mt-1.5 uppercase tracking-widest">
                {keeperCount === 1 ? 'keeper' : 'keepers'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Map */}
      <div
        className="h-[40vh] border-b border-stone-800/60 flex items-center justify-center"
        style={{
          backgroundColor: '#0c0a09',
          backgroundImage: 'radial-gradient(circle, #292524 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      >
        <div className="text-center select-none">
          <div className="text-stone-600 text-sm">Map coming soon</div>
          <div className="text-stone-700 text-xs mt-1 font-mono">Leaflet / Mapbox</div>
        </div>
      </div>

      {/* Story So Far */}
      {coin.story_so_far && (
        <section className="border-b border-stone-800/60">
          <div className="max-w-xl mx-auto px-5 py-6">
            <p className="text-[11px] font-mono text-amber-400 tracking-widest uppercase mb-3">
              Story so far
            </p>
            <p className="text-stone-300 text-sm leading-relaxed italic border-l-2 border-amber-400/30 pl-4">
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
            <p className="text-stone-200 font-medium text-base mb-1">No stories yet.</p>
            <p className="text-stone-500 text-sm">Be the first Keeper.</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-mono text-stone-600 tracking-widest uppercase mb-6">
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
        <div className="mt-12 rounded-2xl border border-stone-800 bg-stone-900 p-7 text-center">
          <p className="text-stone-100 font-semibold text-base mb-1">This coin travels free.</p>
          <p className="text-stone-500 text-sm mb-6">
            Get your own coin and start a story that outlives you.
          </p>
          <button className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 text-sm font-bold px-7 py-3 rounded-full transition-colors tracking-wide">
            Join the waitlist
          </button>
        </div>
      </main>
    </div>
  )
}
