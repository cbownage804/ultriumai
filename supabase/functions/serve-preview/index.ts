import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const host = req.headers.get('host') || ''

  // Try slug from subdomain first (e.g. my-app.apps.ultriumai.com)
  let slug = extractSlug(host, url)

  // If no slug from subdomain, try custom domain lookup
  if (!slug) {
    const customSlug = await resolveCustomDomain(host)
    if (customSlug) {
      slug = customSlug
    }
  }

  if (!slug) {
    return new Response('<!DOCTYPE html><html><body><h1>UltriumAI App Hosting</h1><p>Visit <code>your-app.apps.ultriumai.com</code> to see your app.</p></body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // === FAST PATH: Try live_previews table first (DB read, ~5ms) ===
    const { data: livePreview, error: liveError } = await supabase
      .from('app_builder_live_previews')
      .select('compiled_html, version_hash, updated_at')
      .eq('project_slug', slug)
      .limit(1)
      .maybeSingle()

    if (!liveError && livePreview?.compiled_html) {
      return new Response(livePreview.compiled_html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=10, s-maxage=30',
          'ETag': `"${livePreview.version_hash}"`,
          'X-Served-By': 'ultrium-preview-live',
          'X-Preview-Updated': livePreview.updated_at,
          'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "frame-ancestors *",
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      })
    }

    // === FALLBACK: Search storage bucket ===
    const { data: userDirs, error: listError } = await supabase.storage
      .from('published-apps')
      .list('', { limit: 1000 })

    if (listError) {
      console.error('Storage list error:', listError)
      return errorPage(500, 'Internal error')
    }

    let htmlContent: string | null = null

    for (const userDir of (userDirs || [])) {
      if (userDir.id === null && userDir.name) {
        const paths = [
          `${userDir.name}/previews/${slug}/index.html`,
          `${userDir.name}/${slug}/index.html`,
        ]

        for (const filePath of paths) {
          const { data, error } = await supabase.storage
            .from('published-apps')
            .download(filePath)

          if (!error && data) {
            htmlContent = await data.text()
            break
          }
        }

        if (htmlContent) break
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
        'X-Served-By': 'ultrium-preview-storage',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "frame-ancestors *",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    })
  } catch (err) {
    console.error('Serve preview error:', err)
    return errorPage(500, 'Internal server error')
  }
})

/** Resolve a custom domain (e.g. myapp.example.com) to a project slug via the DB */
async function resolveCustomDomain(host: string): Promise<string | null> {
  if (!host) return null
  if (host.endsWith('.ultriumai.com') || host.endsWith('.ultriumai.app') || host.endsWith('.supabase.co')) {
    return null
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data, error } = await supabase
      .from('app_builder_domains')
      .select('project_slug')
      .eq('domain', host.toLowerCase())
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Custom domain lookup error:', error)
      return null
    }

    if (data?.project_slug) {
      console.log(`[serve-preview] Custom domain ${host} → slug ${data.project_slug}`)
      return data.project_slug
    }
  } catch (err) {
    console.error('Custom domain resolution failed:', err)
  }

  return null
}

function extractSlug(host: string, url: URL): string | null {
  if (host.endsWith('.apps.ultriumai.com')) {
    const subdomain = host.replace('.apps.ultriumai.com', '').split('.')[0]
    if (subdomain && subdomain !== 'www') return subdomain
  }

  const slugParam = url.searchParams.get('slug')
  if (slugParam) return slugParam

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
