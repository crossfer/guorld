import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { p } from '../lib/theme'

type GpsStatus = 'idle' | 'loading' | 'done' | 'error'

const STORY_MAX = 500

const inputStyle = {
  backgroundColor: p.bgCard,
  border: `1px solid ${p.border}`,
  color: p.text,
} as const

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  color: p.textFaint,
  marginBottom: '8px',
}

export default function AddStory() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

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

  const fileRef = useRef<HTMLInputElement>(null)

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
    if (fileRef.current) fileRef.current.value = ''
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }
    setGpsStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLat(coords.latitude)
        setLng(coords.longitude)
        // Reverse geocode via Nominatim (free, no key required)
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
          // GPS coords saved; user can type location name manually
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

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: p.bg, color: p.text }}>

      {/* Header */}
      <header className="px-5 pt-7 pb-5" style={{ borderBottom: `1px solid ${p.borderMid}` }}>
        <div className="max-w-xl mx-auto">
          <Link
            to={`/coin/${slug}`}
            className="text-xs mb-4 inline-block"
            style={{ color: p.amber }}
          >
            ← Coin #{slug}
          </Link>
          <img src="/logo.png" alt="Güorld Coin" style={{ width: 220, display: 'block', marginBottom: 12 }} />
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: p.text }}>
            Add your story
          </h1>
          <p className="text-sm mt-1" style={{ color: p.textMuted }}>
            You are now a Keeper of this coin.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-5 pt-7 space-y-6">

        {/* Photo */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhoto}
            className="hidden"
          />
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
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-xl flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: p.bgCard, border: `2px dashed ${p.border}` }}
            >
              <span className="text-2xl">📷</span>
              <span className="text-sm" style={{ color: p.textMuted }}>Add a photo</span>
              <span className="text-[11px]" style={{ color: p.textFaint }}>optional · JPEG, PNG or WebP · max 5 MB</span>
            </button>
          )}
        </div>

        {/* Name */}
        <div>
          <label style={labelStyle}>Your name</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="How should we remember you?"
            className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        {/* Instagram */}
        <div>
          <label style={labelStyle}>
            Instagram <span style={{ color: p.dotGrid }}>— optional</span>
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
          <div className="flex items-baseline justify-between mb-2">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Your story</label>
            <span
              className="text-[11px]"
              style={{ color: story.length > 450 ? p.amber : p.textFaint }}
            >
              {story.length}/{STORY_MAX}
            </span>
          </div>
          <textarea
            required
            value={story}
            onChange={e => setStory(e.target.value.slice(0, STORY_MAX))}
            placeholder="Where are you? What brought you here? What will you carry with you?"
            rows={5}
            className="w-full rounded-xl px-4 py-3.5 text-sm outline-none resize-none"
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div>
          <label style={labelStyle}>Location</label>

          <button
            type="button"
            onClick={detectLocation}
            disabled={gpsStatus === 'loading' || gpsStatus === 'done'}
            className="w-full rounded-xl px-4 py-3.5 text-sm font-medium flex items-center justify-center gap-2 mb-3 disabled:opacity-60"
            style={
              gpsStatus === 'done'
                ? { backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534' }
                : { ...inputStyle }
            }
          >
            {gpsStatus === 'loading' && (
              <div
                className="w-4 h-4 rounded-full animate-spin shrink-0"
                style={{ border: `2px solid ${p.amberDot}`, borderTopColor: 'transparent' }}
              />
            )}
            {gpsStatus === 'idle' && '📍'}
            {gpsStatus === 'error' && '📍'}
            {gpsStatus === 'done'
              ? '✓ Location detected'
              : gpsStatus === 'loading'
                ? 'Detecting…'
                : 'Detect my location'}
          </button>

          {gpsStatus === 'error' && (
            <p className="text-xs mb-2" style={{ color: p.amber }}>
              GPS unavailable — type your location below.
            </p>
          )}

          <input
            type="text"
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            placeholder="City, Country"
            className="w-full rounded-xl px-4 py-3.5 text-sm outline-none"
            style={inputStyle}
          />
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
            disabled={submitting}
            className="w-full rounded-full py-4 text-sm font-bold tracking-wide disabled:opacity-60"
            style={{ backgroundColor: p.amberDot, color: '#fff' }}
          >
            {submitting ? 'Saving your story…' : 'Leave my story'}
          </button>
          <p className="text-xs text-center" style={{ color: p.textFaint }}>
            Once you leave your story, you're a Keeper forever.
          </p>
        </div>

      </form>
    </div>
  )
}
