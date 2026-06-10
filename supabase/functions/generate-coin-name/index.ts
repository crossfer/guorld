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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500)

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
        content: 'Give a physical coin that travels the world collecting human stories a short poetic name. 2-4 words. Evocative, wanderlust. No explanation, just the name.',
      }],
    }),
  })

  if (!res.ok) return json({ error: `Claude API returned ${res.status}` }, 502)

  const data = await res.json()
  const name = data.content[0].text.trim().replace(/^["']|["']$/g, '')

  return json({ name })
})
