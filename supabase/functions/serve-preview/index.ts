import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const url = new URL(req.url)

  // The slug comes from the Host header: <slug>.ultriumai.app
  const host = req.headers.get('host') || ''
  const slug = extractSlug(host, url)

  if (!slug) {
    return new Response('<!DOCTYPE html><html><body><h1>UltriumAI App Hosting</h1><p>Visit <code>your-app.ultriumai.app</code> to see your app.</p></body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Look up the preview file in storage — search across all user directories
    // Storage path: previews/{userId}/{slug}/index.html
    const { data: files, error: listError } = await supabase.storage
      .from('published-apps')
      .list('previews', { limit: 1000 })

    if (listError) {
      console.error('Storage list error:', listError)
      return errorPage(500, 'Internal error')
    }

    // Search through user directories for the matching slug
    let htmlContent: string | null = null

    for (const userDir of (files || [])) {
      if (!userDir.id && userDir.name) {
        // This is a folder (user ID directory)
        const filePath = `previews/${userDir.name}/${slug}/index.html`
        const { data, error } = await supabase.storage
          .from('published-apps')
          .download(filePath)

        if (!error && data) {
          htmlContent = await data.text()
          break
        }
      }
    }

    if (!htmlContent) {
      return errorPage(404, `App "${slug}" not found`)
    }

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Served-By': 'ultrium-preview',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    })
  } catch (err) {
    console.error('Serve preview error:', err)
    return errorPage(500, 'Internal server error')
  }
})

function extractSlug(host: string, url: URL): string | null {
  // Option 1: Subdomain — <slug>.ultriumai.app
  if (host.endsWith('.ultriumai.app')) {
    const subdomain = host.replace('.ultriumai.app', '').split('.')[0]
    if (subdomain && subdomain !== 'www') return subdomain
  }

  // Option 2: Query param fallback — ?slug=my-app (for edge function direct calls)
  const slugParam = url.searchParams.get('slug')
  if (slugParam) return slugParam

  // Option 3: Path-based — /preview/my-app
  const pathMatch = url.pathname.match(/^\/preview\/([a-z0-9-]+)/i)
  if (pathMatch) return pathMatch[1]

  return null
}

function errorPage(status: number, message: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${status === 404 ? 'App Not Found' : 'Error'} — UltriumAI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0a0a14; color: #fff; font-family: system-ui, sans-serif; }
    .card { text-align: center; max-width: 400px; padding: 2rem; }
    h1 { font-size: 4rem; font-weight: 800; background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    p { margin-top: 1rem; color: #ffffff60; font-size: 0.95rem; line-height: 1.6; }
    a { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${status}</h1>
    <p>${message}</p>
    <p style="margin-top:2rem"><a href="https://ultriumai.com">← Back to UltriumAI</a></p>
  </div>
</body>
</html>`
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
