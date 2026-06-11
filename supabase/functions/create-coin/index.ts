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
    const { slug, name } = await req.json()

    if (!slug?.trim()) {
      return json({ error: 'slug is required' }, 400)
    }

    const cleanSlug = slug.trim().toUpperCase()
    const write_token = crypto.randomUUID().replace(/-/g, '')

    const { error } = await supabase.from('coins').insert({
      slug: cleanSlug,
      name: name ?? null,
      write_token,
    })

    if (error) {
      return json({ error: error.message }, 400)
    }

    return json({ success: true })
  } catch (err) {
    console.error('create-coin error:', err)
    return json({ error: err instanceof Error ? err.message : 'Internal server error' }, 500)
  }
})
