import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Product logo mappings with base64 placeholders
// These will be replaced with actual logo data
const PRODUCT_LOGOS = [
  'safepass-logo.png',
  'safescan-logo.png', 
  'safeweb-logo.png',
  'safetrack-logo.png',
  'safeassist-logo.png',
  'safesuite-logo.png',
  'ultrium-gpt-logo.png',
  'vanguard-logo.png',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if logos folder exists by listing files
    const { data: existingFiles } = await supabase.storage
      .from('social-media-images')
      .list('logos');

    const existingNames = new Set(existingFiles?.map(f => f.name) || []);
    const results: string[] = [];

    // For each logo, we need to fetch from the published app's assets
    const baseAssetUrl = 'https://ultriumai.lovable.app/assets';
    
    for (const logoName of PRODUCT_LOGOS) {
      if (existingNames.has(logoName)) {
        results.push(`${logoName}: already exists`);
        continue;
      }

      try {
        // Try to fetch the logo from the published app
        // Note: This may not work if assets have hashed names
        // In that case, logos need to be manually uploaded
        const response = await fetch(`${baseAssetUrl}/${logoName}`);
        
        if (!response.ok) {
          results.push(`${logoName}: not found at ${baseAssetUrl}/${logoName}`);
          continue;
        }

        const blob = await response.blob();
        const buffer = new Uint8Array(await blob.arrayBuffer());

        const { error } = await supabase.storage
          .from('social-media-images')
          .upload(`logos/${logoName}`, buffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (error) {
          results.push(`${logoName}: upload failed - ${error.message}`);
        } else {
          results.push(`${logoName}: uploaded successfully`);
        }
      } catch (err) {
        results.push(`${logoName}: error - ${err.message}`);
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Logo seeding complete',
      results 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('seed-product-logos error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
