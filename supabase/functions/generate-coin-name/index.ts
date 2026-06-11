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

async function generateName(apiKey: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 32,
      messages: [{
        role: 'user',
        content: `You are naming a physical coin that will travel the world collecting human stories from strangers. Each coin needs a unique poetic name — 2-3 words, evocative, wanderlust.

Draw inspiration from: geography, weather, celestial objects, metals, ancient trade routes, compass directions, tides, seasons, languages, spices, colors, animals, myths.

Examples of good names: Silver Meridian, The Monsoon Letter, Copper Solstice, Desert Frequency, The Jade Horizon, Iron Latitude, Saffron Transit, The Bone Compass.

Return ONLY the name, nothing else. No explanation, no quotes.
Make it feel like it could be the name of a ship, a wind, or a forgotten road.`,
      }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API returned ${res.status}`)
  const data = await res.json()
  return data.content[0].text.trim().replace(/^["']|["']$/g, '')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Try up to 3 times to get a name not already in use
  for (let attempt = 0; attempt < 3; attempt++) {
    const name = await generateName(apiKey)

    const { data: existing } = await supabase
      .from('coins')
      .select('id')
      .eq('name', name)
      .maybeSingle()

    if (!existing) {
      return json({ name })
    }
  }

  // All attempts produced duplicates — return the last one anyway
  // (extremely unlikely in practice)
  const name = await generateName(apiKey)
  return json({ name })
})
