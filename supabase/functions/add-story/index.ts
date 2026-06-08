import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function callClaude(system: string, user: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API returned ${res.status}`)
  const data = await res.json()
  return data.content[0].text
}

async function generateAIContent(
  supabase: ReturnType<typeof createClient>,
  coinId: string,
  newEntryId: string,
  totalKm: number,
) {
  const { data: entries } = await supabase
    .from('entries')
    .select('id, story, location_name, keeper:keepers(display_name)')
    .eq('coin_id', coinId)
    .order('created_at', { ascending: true })

  if (!entries?.length) return

  // 1. Generate Story So Far
  const entriesText = entries
    .map((e: { keeper: { display_name: string | null } | null; location_name: string | null; story: string | null }, i: number) => {
      const name = e.keeper?.display_name ?? 'Anonymous'
      return `Keeper #${i + 1} (${name}) in ${e.location_name ?? 'unknown location'}: "${e.story}"`
    })
    .join('\n\n')

  const storySoFar = await callClaude(
    `You are the voice of a physical coin that travels the world.
Given the following entries left by Keepers, write a vivid 2-3 paragraph narrative of this coin's journey so far.
Write in first person present tense, as if the coin is telling its story.
Be poetic but concise. Mention real places and real emotions.`,
    `Entries (chronological):\n${entriesText}\n\nTotal distance: ${totalKm.toFixed(0)} km | Keepers: ${entries.length}`,
  )

  await supabase
    .from('coins')
    .update({ story_so_far: storySoFar, story_so_far_updated_at: new Date().toISOString() })
    .eq('id', coinId)

  // 2. Translate the new entry to English
  const newEntry = entries.find((e: { id: string }) => e.id === newEntryId)
  if (newEntry?.story) {
    const translation = await callClaude(
      `You are a translator. Translate the given text to English.
If it is already in English, return the original text unchanged.
Return only the translated text, no explanations or prefixes.`,
      newEntry.story,
    )
    await supabase
      .from('entries_translations')
      .upsert({ entry_id: newEntryId, language: 'en', story: translation })
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    const body = await req.json()
    const { slug, display_name, instagram, story, photo_url, lat, lng, location_name } = body

    if (!slug || !display_name?.trim() || !story?.trim()) {
      return json({ error: 'slug, display_name, and story are required' }, 400)
    }

    // 1. Find coin
    const { data: coin, error: coinError } = await supabase
      .from('coins')
      .select('id, slug, total_km, is_active')
      .eq('slug', slug)
      .single()

    if (coinError || !coin) {
      return json({ error: 'Coin not found' }, 404)
    }
    if (!coin.is_active) {
      return json({ error: 'This coin is no longer active' }, 403)
    }

    // 2. Find or create keeper
    let keeperId: string

    if (instagram?.trim()) {
      const cleanIg = instagram.trim().replace(/^@/, '')
      const { data: existing } = await supabase
        .from('keepers')
        .select('id')
        .eq('instagram', cleanIg)
        .maybeSingle()

      if (existing) {
        keeperId = existing.id
        await supabase
          .from('keepers')
          .update({ display_name: display_name.trim() })
          .eq('id', keeperId)
      } else {
        const { data: created, error } = await supabase
          .from('keepers')
          .insert({ display_name: display_name.trim(), instagram: cleanIg })
          .select('id')
          .single()
        if (error || !created) throw new Error('Failed to create keeper')
        keeperId = created.id
      }
    } else {
      const { data: created, error } = await supabase
        .from('keepers')
        .insert({ display_name: display_name.trim() })
        .select('id')
        .single()
      if (error || !created) throw new Error('Failed to create keeper')
      keeperId = created.id
    }

    // 3. Get last entry to calculate km
    const { data: lastEntry } = await supabase
      .from('entries')
      .select('lat, lng')
      .eq('coin_id', coin.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const newKm =
      lastEntry?.lat != null && lastEntry?.lng != null && lat != null && lng != null
        ? haversineKm(lastEntry.lat, lastEntry.lng, lat, lng)
        : 0

    // 4. Update coin and keeper total_km
    await supabase
      .from('coins')
      .update({ total_km: coin.total_km + newKm })
      .eq('id', coin.id)

    const { data: keeperRow } = await supabase
      .from('keepers')
      .select('total_km')
      .eq('id', keeperId)
      .single()

    await supabase
      .from('keepers')
      .update({ total_km: (keeperRow?.total_km ?? 0) + newKm })
      .eq('id', keeperId)

    // 5. Close current coin_keeper record (the outgoing keeper)
    const { data: openCoinKeeper } = await supabase
      .from('coin_keepers')
      .select('id, received_at')
      .eq('coin_id', coin.id)
      .is('passed_at', null)
      .maybeSingle()

    const now = new Date()
    let daysHeld: number | null = null

    if (openCoinKeeper) {
      daysHeld = Math.ceil(
        (now.getTime() - new Date(openCoinKeeper.received_at).getTime()) / (1000 * 60 * 60 * 24),
      )
      await supabase
        .from('coin_keepers')
        .update({ passed_at: now.toISOString(), days_held: daysHeld })
        .eq('id', openCoinKeeper.id)
    }

    // 6. Insert the new entry
    const { data: newEntry, error: entryError } = await supabase
      .from('entries')
      .insert({
        coin_id: coin.id,
        keeper_id: keeperId,
        story: story.trim(),
        photo_url: photo_url ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        location_name: location_name?.trim() ?? null,
        days_held: daysHeld,
      })
      .select('id')
      .single()

    if (entryError || !newEntry) throw new Error('Failed to insert entry')

    // 7. Insert new coin_keeper record for the incoming keeper
    await supabase.from('coin_keepers').insert({
      coin_id: coin.id,
      keeper_id: keeperId,
      received_at: now.toISOString(),
    })

    // 8. Fire-and-forget: translate + generate Story So Far
    generateAIContent(supabase, coin.id, newEntry.id, coin.total_km + newKm).catch((err) =>
      console.error('AI generation failed (non-fatal):', err),
    )

    return json({ success: true, entry_id: newEntry.id, coin_slug: coin.slug })
  } catch (err) {
    console.error('add-story error:', err)
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      500,
    )
  }
})
