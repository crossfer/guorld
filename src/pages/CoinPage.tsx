import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Coin, Entry } from '../types'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function formatKm(km: number) {
  return km >= 1000
    ? `${(km / 1000).toFixed(1)}k km`
    : `${Math.round(km)} km`
}

function KeeperTag({ entry, index }: { entry: Entry; index: number }) {
  const name = entry.keeper?.display_name ?? 'Anonymous'
  const ig = entry.keeper?.instagram

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono text-amber-500 font-semibold">#{index + 1}</span>
      <span className="font-medium text-gray-900">{name}</span>
      {ig && (
        <a
          href={`https://instagram.com/${ig.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          @{ig.replace('@', '')}
        </a>
      )}
    </div>
  )
}

function EntryCard({ entry, index, isLast }: { entry: Entry; index: number; isLast: boolean }) {
  return (
    <div className="relative flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-200 shrink-0 mt-1" />
        {!isLast && <div className="w-px flex-1 bg-gray-200 mt-1" />}
      </div>

      {/* Card */}
      <div className="pb-8 flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
          <KeeperTag entry={entry} index={index} />
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {entry.location_name && <span>{entry.location_name}</span>}
            <span>{formatDate(entry.created_at)}</span>
            {entry.days_held != null && (
              <span>{entry.days_held}d held</span>
            )}
          </div>
        </div>

        {entry.photo_url && (
          <img
            src={entry.photo_url}
            alt={`Photo by ${entry.keeper?.display_name ?? 'keeper'}`}
            className="w-full max-h-64 object-cover rounded-lg mb-3 bg-gray-100"
          />
        )}

        {entry.story && (
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{entry.story}</p>
        )}
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !coin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-gray-500">
        <p className="text-lg font-medium text-gray-900">Coin not found</p>
        <p className="text-sm">The coin <span className="font-mono">#{slug}</span> doesn't exist yet.</p>
        <Link to="/" className="mt-4 text-sm text-amber-600 hover:underline">← Back to home</Link>
      </div>
    )
  }

  const keeperCount = entries.length

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-4 py-5">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                  #{coin.slug}
                </span>
                {coin.is_active && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">active</span>
                )}
              </div>
              <h1 className="text-xl font-semibold text-gray-900">{coin.name ?? `Coin #${coin.slug}`}</h1>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <div className="font-semibold text-gray-900">{formatKm(coin.total_km)}</div>
              <div className="text-xs text-gray-400">traveled</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{keeperCount}</div>
              <div className="text-xs text-gray-400">{keeperCount === 1 ? 'keeper' : 'keepers'}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Map placeholder */}
      <div className="bg-gray-50 border-b border-gray-100 h-48 flex items-center justify-center">
        <span className="text-sm text-gray-400">Map coming soon</span>
      </div>

      {/* Story So Far */}
      {coin.story_so_far && (
        <section className="px-4 py-6 border-b border-gray-100 bg-amber-50">
          <div className="max-w-xl mx-auto">
            <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">Story so far</p>
            <p className="text-sm text-gray-700 leading-relaxed italic">{coin.story_so_far}</p>
          </div>
        </section>
      )}

      {/* Timeline */}
      <main className="px-4 py-6 max-w-xl mx-auto">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No stories yet. This coin is just getting started.</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-6">Journey</p>
            {entries.map((entry, i) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                index={i}
                isLast={i === entries.length - 1}
              />
            ))}
          </div>
        )}

        {/* Waitlist CTA */}
        <div className="mt-10 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Want your own coin to start its journey?
          </p>
          <button className="bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors">
            Join the waitlist
          </button>
        </div>
      </main>
    </div>
  )
}
