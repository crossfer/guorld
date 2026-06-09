import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { p } from '../lib/theme'

interface CoinRow {
  id: string
  slug: string
  name: string | null
  write_token: string
  total_km: number
  is_active: boolean
  created_at: string
}

const NFC_BASE = 'https://guorld.com/coin'

function nfcUrl(slug: string, token: string) {
  return `${NFC_BASE}/${slug}/add?token=${token}`
}

export default function Admin() {
  const [coins, setCoins] = useState<CoinRow[]>([])
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState('')
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  async function loadCoins() {
    const { data } = await supabase
      .from('coins')
      .select('id, slug, name, write_token, total_km, is_active, created_at')
      .order('created_at', { ascending: false })
    setCoins((data ?? []) as CoinRow[])
    setLoading(false)
  }

  useEffect(() => { loadCoins() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)

    const cleanSlug = slug.trim().toUpperCase()
    const { error } = await supabase.from('coins').insert({
      slug: cleanSlug,
      name: name.trim() || null,
    })

    if (error) {
      setCreateError(error.message)
      setCreating(false)
      return
    }

    setSlug('')
    setName('')
    setCreating(false)
    loadCoins()
  }

  async function copyUrl(url: string, id: string) {
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const inputStyle = {
    backgroundColor: p.bgCard,
    border: `1px solid ${p.border}`,
    color: p.text,
  } as const

  return (
    <div className="min-h-screen pb-16" style={{ backgroundColor: p.bg, color: p.text }}>

      {/* Header */}
      <header className="px-5 pt-8 pb-6" style={{ borderBottom: `1px solid ${p.borderMid}` }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-[11px] font-mono tracking-widest uppercase mb-1" style={{ color: p.amber }}>
            Admin
          </p>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: p.text }}>
            Güorld Coin Dashboard
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-8 space-y-10">

        {/* ── Create coin ─────────────────────────────── */}
        <section>
          <p className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: p.textFaint }}>
            New coin
          </p>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={e => setSlug(e.target.value.replace(/\s/g, '').toUpperCase())}
                  placeholder="Slug — e.g. 001"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none font-mono"
                  style={inputStyle}
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Name — optional"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            {createError && (
              <p className="text-xs px-1" style={{ color: '#991b1b' }}>{createError}</p>
            )}

            <button
              type="submit"
              disabled={creating}
              className="rounded-full px-6 py-2.5 text-sm font-bold tracking-wide disabled:opacity-60"
              style={{ backgroundColor: p.amberDot, color: '#fff' }}
            >
              {creating ? 'Creating…' : 'Create coin'}
            </button>
          </form>
        </section>

        {/* ── Coins list ──────────────────────────────── */}
        <section>
          <p className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: p.textFaint }}>
            All coins
          </p>

          {loading ? (
            <div className="flex justify-center py-10">
              <div
                className="w-5 h-5 rounded-full animate-spin"
                style={{ border: `2px solid ${p.amberDot}`, borderTopColor: 'transparent' }}
              />
            </div>
          ) : coins.length === 0 ? (
            <p className="text-sm" style={{ color: p.textMuted }}>No coins yet.</p>
          ) : (
            <div className="space-y-3">
              {coins.map(coin => {
                const url = nfcUrl(coin.slug, coin.write_token)
                return (
                  <div
                    key={coin.id}
                    className="rounded-xl p-4"
                    style={{ backgroundColor: p.bgCard, border: `1px solid ${coin.is_active ? p.border : p.borderMid}` }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold" style={{ color: p.amber }}>
                          #{coin.slug}
                        </span>
                        {coin.name && (
                          <span className="text-sm" style={{ color: p.text }}>{coin.name}</span>
                        )}
                        {!coin.is_active && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                          >
                            inactive
                          </span>
                        )}
                      </div>
                      <span className="text-[11px]" style={{ color: p.textFaint }}>
                        {Math.round(coin.total_km)} km
                      </span>
                    </div>

                    {/* NFC URL */}
                    <div
                      className="flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ backgroundColor: p.bg, border: `1px solid ${p.borderMid}` }}
                    >
                      <span
                        className="flex-1 text-[11px] font-mono truncate"
                        style={{ color: p.textMuted }}
                      >
                        {url}
                      </span>
                      <button
                        onClick={() => copyUrl(url, coin.id)}
                        className="text-[11px] font-medium shrink-0 px-2 py-1 rounded"
                        style={{
                          color: copied === coin.id ? '#166534' : p.amber,
                          backgroundColor: copied === coin.id ? '#dcfce7' : 'transparent',
                        }}
                      >
                        {copied === coin.id ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-[10px] mt-1.5 px-1" style={{ color: p.textFaint }}>
                      Program this URL into the NFC tag with NFC Tools.
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
