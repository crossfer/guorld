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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const { text, language } = await req.json()

    if (!text || !language) {
      return json({ error: 'text and language are required' }, 400)
    }

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
        messages: [{
          role: 'user',
          content: `Translate this travel story to ${language}. Keep the poetic tone. Return only the translated text, nothing else:\n\n${text}`,
        }],
      }),
    })

    if (!res.ok) throw new Error(`Anthropic API returned ${res.status}`)

    const data = await res.json()
    return json({ translated: data.content[0].text })
  } catch (err) {
    console.error('translate-story error:', err)
    // Fall back silently — caller will use the original text
    return json({ translated: null }, 200)
  }
})
