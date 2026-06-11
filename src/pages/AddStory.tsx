import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { p, grain, playfair, crimson } from '../lib/theme'
import { useTranslation } from '../lib/i18n'

type GpsStatus = 'idle' | 'loading' | 'done' | 'error'

const STORY_MAX = 500

const inputStyle = {
  backgroundColor: p.bgCard,
  border: `1px solid ${p.border}`,
  color: p.text,
} as const

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: p.textFaint,
  marginBottom: '2px',
}

export default function AddStory() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const writeToken = searchParams.get('token')

  const t = useTranslation('addStory')

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => { document.head.removeChild(meta) }
  }, [])

  const [displayName, setDisplayName] = useState('')
  const [instagram, setInstagram] = useState('')
  const [story, setStory] = useState('')
  const [locationName, setLocationName] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [handoffLoaded, setHandoffLoaded] = useState(false)
  const [currentKeeperName, setCurrentKeeperName] = useState<string | null>(null)
  const [coinPoeticName, setCoinPoeticName] = useState<string | null>(null)

  useEffect(() => {
    async function loadHandoff() {
      const { data: coinData } = await supabase
        .from('coins')
        .select('id, name')
        .eq('slug', slug)
        .single()

      if (!coinData) { setHandoffLoaded(true); return }

      const poetic = coinData.name && !/^Güorld Coin #/i.test(coinData.name)
        ? coinData.name
        : null
      setCoinPoeticName(poetic)

      const { data: ckData } = await supabase
        .from('coin_keepers')
        .select('keepers(display_name)')
        .eq('coin_id', coinData.id)
        .is('passed_at', null)
        .maybeSingle()

      const keepers = ckData?.keepers as unknown as { display_name: string | null }[] | { display_name: string | null } | null
      const name = Array.isArray(keepers)
        ? (keepers[0]?.display_name ?? null)
        : (keepers?.display_name ?? null)
      setCurrentKeeperName(name)
      setHandoffLoaded(true)
    }
    loadHandoff()
  }, [slug])

  const cameraRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhoto(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    if (cameraRef.current)  cameraRef.current.value  = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLat(coords.latitude)
        setLng(coords.longitude)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.address ?? {}
          const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? ''
          const country = addr.country ?? ''
          if (city || country) setLocationName([city, country].filter(Boolean).join(', '))
        } catch {
          // coords saved; name will be blank
        }
        setGpsStatus('done')
      },
      () => setGpsStatus('error'),
      { timeout: 10000 }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Upload photo first if provided
      let photoUrl: string | null = null
      if (photo) {
        const ext = photo.name.split('.').pop() ?? 'jpg'
        const path = `${slug}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('entry-photos')
          .upload(path, photo, { contentType: photo.type })
        if (uploadError) throw new Error('Photo upload failed. Try again.')
        const { data: urlData } = supabase.storage.from('entry-photos').getPublicUrl(path)
        photoUrl = urlData.publicUrl
      }

      // POST to edge function
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-story`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            slug,
            write_token: writeToken,
            display_name: displayName.trim(),
            instagram: instagram.trim() || null,
            story: story.trim(),
            photo_url: photoUrl,
            lat,
            lng,
            location_name: locationName.trim() || null,
          }),
        }
      )

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Submission failed. Try again.')
      }

      navigate(`/coin/${slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  if (!writeToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: p.bg }}>
        <div className="text-4xl mb-5">🪙</div>
        <p className="font-semibold text-lg mb-2" style={{ color: p.text }}>
          {t.lockedHeading}
        </p>
        <p className="text-sm max-w-xs" style={{ color: p.textMuted }}>
          {t.lockedBody}
        </p>
        <Link to={`/coin/${slug}`} className="mt-8 text-xs" style={{ color: p.amber }}>
          {t.viewJourney}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: p.bg, color: p.text }}>

      {/* Header */}
      <header className="px-5 pt-3 pb-5" style={{ borderBottom: `1px solid ${p.borderMid}` }}>
        <div className="max-w-xl mx-auto">
          <img src="/logo.png" alt="Güorld Coin" style={{ width: 220, display: 'block', margin: '0 auto', marginBottom: -50 }} />
        </div>
      </header>

      {/* Handoff banner */}
      {handoffLoaded && (
        <div style={{ maxWidth: 580, margin: '0 auto', padding: '10px 10px 0' }}>
          <div style={{
            padding: '10px 10px',
            backgroundColor: p.bgCard,
            border: `1px solid ${p.border}`,
            textAlign: 'center',
            ...grain,
          }}>
            {currentKeeperName ? (
              <>
                <p style={{ fontFamily: crimson, fontSize: 19, lineHeight: 1.5, color: p.text, marginBottom: 8 }}>
                  <span style={{ color: p.amber, fontWeight: 600 }}>{currentKeeperName}</span>{' '}{t.handoffPassing}
                </p>
                <p style={{ fontFamily: crimson, fontStyle: 'italic', fontSize: 17, color: p.textMuted, margin: 0 }}>
                  {t.handoffBecomePartOf}{' '}
                  {coinPoeticName
                    ? <em style={{ fontFamily: playfair, color: p.amber }}>{coinPoeticName}</em>
                    : t.handoffThisJourney
                  }.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontFamily: crimson, fontSize: 19, lineHeight: 1.5, color: p.text, marginBottom: 8 }}>
                  {t.handoffFirstKeeper}
                  {coinPoeticName
                    ? <> {t.handoffOf} <em style={{ fontFamily: playfair, color: p.amber }}>{coinPoeticName}</em></>
                    : ''
                  }.
                </p>
                <p style={{ fontFamily: crimson, fontStyle: 'italic', fontSize: 15, color: p.textMuted, margin: 0 }}>
                  {t.handoffStartJourney}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-5 pt-7 space-y-6">

        {/* Name */}
        <div>
          <label style={labelStyle}>{t.yourName}</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        {/* Instagram */}
        <div>
          <label style={labelStyle}>
            {t.instagram} <span style={{ color: p.dotGrid }}>{t.optional}</span>
          </label>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm select-none"
              style={{ color: p.textMuted }}
            >
              @
            </span>
            <input
              type="text"
              value={instagram}
              onChange={e => setInstagram(e.target.value.replace(/^@/, ''))}
              placeholder="yourhandle"
              className="w-full rounded-xl pl-8 pr-4 py-3.5 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Story */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <label style={{ ...labelStyle, marginBottom: 0 }}>{t.yourStory}</label>
            <span
              className="text-[11px]"
              style={{ color: story.length > 450 ? p.amber : p.textFaint }}
            >
              {story.length}/{STORY_MAX}
            </span>
          </div>
          <p style={{ fontFamily: crimson, fontStyle: 'italic', fontSize: 19, color: p.amber, opacity: 0.75, textAlign: 'center', margin: '0 0 8px' }}>
            Carve your story into history. Be part of something bigger.
          </p>
          <textarea
            required
            value={story}
            onChange={e => setStory(e.target.value.slice(0, STORY_MAX))}
            placeholder={t.storyPlaceholder}
            rows={5}
            className="w-full rounded-xl px-4 py-3.5 text-sm outline-none resize-none"
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>{t.location}</label>

          {gpsStatus === 'idle' && (
            <button
              type="button"
              onClick={detectLocation}
              className="w-full rounded-xl px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: p.amberDot, color: '#FAF5E9', border: 'none' }}
            >
              📍 Detect my location
            </button>
          )}

          {gpsStatus === 'loading' && (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3.5" style={{ ...inputStyle }}>
              <div
                className="w-4 h-4 rounded-full animate-spin shrink-0"
                style={{ border: `2px solid ${p.amberDot}`, borderTopColor: 'transparent' }}
              />
              <span className="text-sm" style={{ color: p.textMuted }}>Detecting your location…</span>
            </div>
          )}

          {gpsStatus === 'done' && (
            <div className="rounded-xl px-4 py-3.5" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}>
              <span className="text-sm font-medium" style={{ color: '#166534' }}>
                📍 {locationName || 'Location detected'} ✓
              </span>
            </div>
          )}

          {gpsStatus === 'error' && (
            <div className="rounded-xl px-4 py-4 space-y-2" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <p className="text-sm font-medium" style={{ color: '#991b1b' }}>
                Location required — please enable GPS
              </p>
              <p className="text-xs" style={{ color: '#b91c1c' }}>
                Your location is part of the coin's journey. Please enable GPS to leave your story.
              </p>
              <button
                type="button"
                onClick={detectLocation}
                className="text-xs font-medium mt-1"
                style={{ color: '#991b1b', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Photo */}
        <div>
          <label style={labelStyle}>{t.photoLabel}</label>
          <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          <input ref={galleryRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full aspect-[4/3] object-cover rounded-xl"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: 'rgba(28,25,23,0.65)', color: '#fff' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex-1 rounded-xl py-4 flex flex-col items-center justify-center gap-1.5"
                style={{ backgroundColor: p.bgCard, border: `1px solid ${p.border}` }}
              >
                <span className="text-2xl">📷</span>
                <span className="text-xs font-medium" style={{ color: p.textMuted }}>Take a photo</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex-1 rounded-xl py-4 flex flex-col items-center justify-center gap-1.5"
                style={{ backgroundColor: p.bgCard, border: `1px solid ${p.border}` }}
              >
                <span className="text-2xl">🖼️</span>
                <span className="text-xs font-medium" style={{ color: p.textMuted }}>Choose from gallery</span>
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
          >
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={submitting || lat === null}
            className="w-full rounded-full py-4 text-sm font-bold tracking-wide disabled:opacity-60"
            style={{ backgroundColor: p.amberDot, color: '#fff' }}
          >
            {submitting ? t.submitting : t.submit}
          </button>
          {lat === null && (
            <p className="text-xs text-center" style={{ color: p.textFaint }}>
              Location required to submit
            </p>
          )}
          <p className="text-xs text-center" style={{ color: p.textFaint }}>
            {t.keeperForever}
          </p>
        </div>

      </form>
    </div>
  )
}
