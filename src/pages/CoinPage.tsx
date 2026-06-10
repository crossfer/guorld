import { useEffect, useState, lazy, Suspense, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { p, grain, playfair, crimson, mono } from '../lib/theme'
import { useTranslation, detectLang } from '../lib/i18n'
import type { Coin, Entry } from '../types'

const CoinMap = lazy(() =>
  import('../components/CoinMap').then(m => ({ default: m.CoinMap }))
)

// ── Error boundary ───────────────────────────────────────────
class MapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CoinMap] error boundary caught:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="h-[40vh] flex items-center justify-center"
          style={{ backgroundColor: p.bgMap, borderBottom: `1px solid ${p.borderMid}` }}
        >
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
        <line x1="10" y1="1"    x2="10" y2="7.5"  stroke={p.amber} strokeWidth="0.8" />
        <line x1="10" y1="12.5" x2="10" y2="19"   stroke={p.amber} strokeWidth="0.8" />
        <line x1="1"  y1="10"   x2="7.5" y2="10"  stroke={p.amber} strokeWidth="0.8" />
        <line x1="12.5" y1="10" x2="19"  y2="10"  stroke={p.amber} strokeWidth="0.8" />
        <polygon points="10,1.5 11.3,6.5 10,8 8.7,6.5" fill={p.amberDot} opacity="0.9" />
      </svg>
      <div style={{ flex: 1, borderTop: `1px dashed ${p.borderMid}` }} />
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

function formatKm(km: number) {
  if (km === 0) return '0 km'
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`
  return `${Math.round(km)} km`
}

// ── Entry card ───────────────────────────────────────────────
function EntryCard({ entry, index, isLast }: { entry: Entry; index: number; isLast: boolean }) {
  const name = entry.keeper?.display_name ?? 'Anonymous'
  const ig = entry.keeper?.instagram?.replace('@', '')

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center w-4 shrink-0 pt-1">
        <div
          className="w-2.5 h-2.5 rounded-full z-10 shrink-0"
          style={{ backgroundColor: p.amberDot, boxShadow: `0 0 0 4px ${p.bg}` }}
        />
        {!isLast && <div className="w-px flex-1 mt-1" style={{ backgroundColor: p.borderMid }} />}
      </div>

      <div className={`flex-1 min-w-0 ${isLast ? 'pb-4' : 'pb-7'}`}>
        <div style={{ backgroundColor: p.bgCard, border: `1px solid ${p.border}`, overflow: 'hidden' }}>
          {entry.photo_url && (
            <img src={entry.photo_url} alt="" className="w-full aspect-[4/3] object-cover" />
          )}
          <div className="p-4">
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.15em', color: p.amber }}>
                  #{String(index + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: crimson, fontSize: 16, fontWeight: 600, color: p.text }}>{name}</span>
              </div>
              {ig && (
                <a
                  href={`https://instagram.com/${ig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: mono, fontSize: 10, color: p.textFaint, flexShrink: 0, textDecoration: 'none' }}
                >
                  @{ig}
                </a>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginBottom: 10 }}>
              {entry.location_name && <span style={{ fontFamily: mono, fontSize: 10, color: p.textMuted }}>{entry.location_name}</span>}
              <span style={{ fontFamily: mono, fontSize: 10, color: p.textFaint }}>{formatDate(entry.created_at)}</span>
              {entry.days_held != null && <span style={{ fontFamily: mono, fontSize: 10, color: p.textFaint }}>{entry.days_held}d held</span>}
            </div>
            {entry.story && (
              <p style={{ fontFamily: crimson, fontSize: 16, lineHeight: 1.65, color: p.text, whiteSpace: 'pre-line', margin: 0 }}>
                {entry.story}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
export default function CoinPage() {
  const { slug } = useParams<{ slug: string }>()
  const [coin, setCoin] = useState<Coin | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistDone, setWaitlistDone] = useState(false)
  const [translatedStory, setTranslatedStory] = useState<string | null>(null)
  const [translatingStory, setTranslatingStory] = useState(false)

  async function translateStory(text: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Translate this travel story to Spanish. Keep the poetic tone. Return only the translated text, nothing else:\n\n${text}`
        }]
      })
    })
    const data = await response.json()
    return data.content[0].text
  }

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

      if (detectLang() === 'es' && coinData.story_so_far) {
        setTranslatingStory(true)
        translateStory(coinData.story_so_far)
          .then(setTranslatedStory)
          .catch(console.error)
          .finally(() => setTranslatingStory(false))
      }

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: p.bg }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${p.amberDot}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (notFound || !coin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 24px', textAlign: 'center', backgroundColor: p.bg }}>
        <p style={{ fontFamily: playfair, fontSize: 20, fontStyle: 'italic', color: p.text }}>Coin not found</p>
        <p style={{ fontFamily: crimson, fontSize: 15, color: p.textMuted }}>
          <span style={{ fontFamily: mono, color: p.textFaint }}>#{slug}</span> doesn't exist or hasn't been activated yet.
        </p>
        <Link to="/" style={{ marginTop: 20, fontFamily: mono, fontSize: 11, letterSpacing: '0.1em', color: p.amber, textDecoration: 'none' }}>← Back to home</Link>
      </div>
    )
  }

  const t = useTranslation('coin')
  const keeperCount = entries.length
  const poisticName = coin.name && !/^Güorld Coin #/i.test(coin.name) ? coin.name : null

  return (
    <div style={{ minHeight: '100vh', backgroundColor: p.bg, ...grain, color: p.text }}>

      {/* ── Header ───────────────────────────────────────── */}
      <header style={{ textAlign: 'center', paddingTop: 4 }}>
        <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 20px' }}>
          <img
            src="/logo.png"
            alt="Güorld Coin"
            style={{ width: 260, display: 'block', margin: '0 auto 2px' }}
          />

          {poisticName && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.textFaint }}>
                {t.coinNameLabel}
              </div>
              <p style={{ fontFamily: playfair, fontStyle: 'italic', fontSize: 22, color: p.amber, margin: '2px 0 0', letterSpacing: '0.04em' }}>
                {poisticName}
              </p>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 32, paddingBottom: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: playfair, fontSize: 30, fontWeight: 700, lineHeight: 1, color: p.text }}>
                {formatKm(coin.total_km)}
              </div>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.textFaint, marginTop: 5 }}>
                {t.traveled}
              </div>
            </div>
            <div style={{ width: 1, height: 32, backgroundColor: p.borderMid }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: playfair, fontSize: 30, fontWeight: 700, lineHeight: 1, color: p.text }}>
                {keeperCount}
              </div>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.textFaint, marginTop: 5 }}>
                {keeperCount === 1 ? t.keeper : t.keepers}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Map ──────────────────────────────────────────── */}
      <div style={{ filter: 'sepia(28%) saturate(0.85) brightness(0.97)' }}>
        <MapErrorBoundary>
          <Suspense
            fallback={
              <div
                className="h-[40vh] flex items-center justify-center"
                style={{ backgroundColor: p.bgMap, borderBottom: `1px solid ${p.borderMid}` }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${p.amberDot}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
              </div>
            }
          >
            <CoinMap entries={entries} />
          </Suspense>
        </MapErrorBoundary>
      </div>

      {/* ── Story So Far ─────────────────────────────────── */}
      {coin.story_so_far && (
        <section style={{ borderBottom: `1px dashed ${p.borderMid}` }}>
          <div style={{ maxWidth: 580, margin: '0 auto', padding: '20px 20px 20px' }}>
            <div style={{ maxWidth: 580, margin: '0 auto', padding: '0 0 12px' }}>
              <CompassDivider />
            </div>
            <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: p.amber, marginBottom: 14 }}>
              {t.storySoFar}
            </p>
            {translatingStory ? (
              <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: '0.15em', color: p.textFaint, fontStyle: 'normal' }}>
                Traduciendo…
              </p>
            ) : (
              <p
                style={{
                  fontFamily: crimson,
                  fontStyle: 'italic',
                  fontSize: 18,
                  lineHeight: 1.75,
                  color: p.textMuted,
                  paddingLeft: 18,
                  borderLeft: `3px solid ${p.amberDot}55`,
                  margin: 0,
                }}
              >
                {translatedStory ?? coin.story_so_far}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Journey ──────────────────────────────────────── */}
      <main style={{ maxWidth: 580, margin: '0 auto', padding: '24px 20px' }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🌍</div>
            <p style={{ fontFamily: playfair, fontStyle: 'italic', fontSize: 18, color: p.text, marginBottom: 4 }}>{t.noStories}</p>
            <p style={{ fontFamily: crimson, fontSize: 15, color: p.textMuted }}>{t.beFirst}</p>
          </div>
        ) : (
          <>
            <div style={{ maxWidth: 580 }}>
              <CompassDivider />
            </div>
            <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: p.textFaint, margin: '12px 0 20px' }}>
              {t.keeperLog}
            </p>
            {entries.map((entry, i) => (
              <EntryCard key={entry.id} entry={entry} index={i} isLast={i === entries.length - 1} />
            ))}
          </>
        )}

        {/* ── Waitlist CTA ─────────────────────────────── */}
        <div style={{ marginTop: 40, padding: '24px 20px', border: `2px solid ${p.borderMid}`, outline: `1px solid ${p.border}`, outlineOffset: 4, backgroundColor: p.bgCta, textAlign: 'center' }}>
          <p style={{ fontFamily: playfair, fontStyle: 'italic', fontSize: 20, color: p.text, marginBottom: 6 }}>
            {t.ctaHeading}
          </p>
          <p style={{ fontFamily: crimson, fontSize: 16, color: p.textMuted, marginBottom: 20 }}>
            {t.ctaBody}
          </p>

          {waitlistDone ? (
            <p style={{ fontFamily: crimson, fontStyle: 'italic', fontSize: 16, color: p.amber }}>
              {t.waitlistDone}
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                value={waitlistEmail}
                onChange={e => setWaitlistEmail(e.target.value)}
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
                onClick={async () => {
                  if (!waitlistEmail.trim()) return
                  const { error } = await supabase.from('waitlist').insert({ email: waitlistEmail.trim() })
                  if (!error || error.code === '23505') setWaitlistDone(true)
                }}
                style={{
                  padding: '11px 18px',
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
                }}
              >
                {t.joinBtn}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
