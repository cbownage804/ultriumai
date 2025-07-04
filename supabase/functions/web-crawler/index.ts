import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirecrawlResponse {
  success: boolean;
  data?: any[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, url, gptId, apiKey, options } = await req.json();

    // Get Firecrawl API key from environment or request
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY') || apiKey;
    
    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Firecrawl API key not configured' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'test') {
      // Test API key with a simple scrape
      const testResponse = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
        }),
      });

      const testResult = await testResponse.json();
      
      return new Response(JSON.stringify({ 
        success: testResponse.ok && testResult.success 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'scrape') {
      // Single page scrape
      const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          formats: options?.formats || ['markdown', 'html'],
        }),
      });

      const result = await response.json();
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'crawl') {
      // Multi-page crawl
      const crawlResponse = await fetch('https://api.firecrawl.dev/v0/crawl', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          crawlerOptions: {
            limit: options?.limit || 50,
          },
          pageOptions: {
            formats: options?.scrapeOptions?.formats || ['markdown', 'html'],
          },
        }),
      });

      const crawlResult = await crawlResponse.json();
      
      if (!crawlResult.success) {
        return new Response(JSON.stringify(crawlResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If we have a GPT ID, store the crawled data in the database
      if (gptId && crawlResult.data) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get the auth header to identify the user
        const authHeader = req.headers.get('authorization');
        let userId = null;
        
        if (authHeader) {
          try {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id;
          } catch (error) {
            console.error('Error getting user:', error);
          }
        }

        // Store each crawled page as a document
        for (const page of crawlResult.data) {
          if (page.markdown || page.html) {
            const { error } = await supabase
              .from('gpt_documents')
              .insert({
                gpt_id: gptId,
                user_id: userId,
                file_name: page.metadata?.title || new URL(page.url).pathname || 'Crawled Page',
                file_path: page.url,
                file_size: (page.markdown || page.html).length,
                mime_type: 'text/html',
                processed_content: page.markdown || page.html
              });

            if (error) {
              console.error('Error storing crawled data:', error);
            }
          }
        }
      }

      return new Response(JSON.stringify(crawlResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in web-crawler function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});