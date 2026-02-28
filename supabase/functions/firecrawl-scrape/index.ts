const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

const fallback = (error: string) =>
  new Response(
    JSON.stringify({ success: false, isFallback: true, error, data: null }),
    { status: 200, headers: jsonHeaders }
  );

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, options } = await req.json();

    if (!url) {
      console.warn('[firecrawl-scrape] Missing URL in request body');
      return fallback('URL is required');
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('[firecrawl-scrape] FIRECRAWL_API_KEY not configured');
      return fallback('Firecrawl connector not configured');
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Validate URL has a proper structure
    try {
      const parsed = new URL(formattedUrl);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        console.warn('[firecrawl-scrape] Invalid URL (no valid domain):', formattedUrl);
        return fallback('Invalid URL: must have a valid domain');
      }
    } catch (e) {
      console.warn('[firecrawl-scrape] Invalid URL format:', formattedUrl, e);
      return fallback(`Invalid URL format: ${formattedUrl}`);
    }

    console.log('[firecrawl-scrape] Scraping URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: options?.formats || ['markdown'],
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor,
        location: options?.location,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[firecrawl-scrape] Firecrawl API error:', data);
      return fallback(data.error || `Request failed with status ${response.status}`);
    }

    console.log('[firecrawl-scrape] Scrape successful');
    return new Response(
      JSON.stringify({ success: true, isFallback: false, data }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error) {
    console.error('[firecrawl-scrape] Error scraping:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return fallback(errorMessage);
  }
});
