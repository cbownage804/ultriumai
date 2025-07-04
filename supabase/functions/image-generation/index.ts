import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, size = "1024x1024", quality = "high", style = "auto" } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('Generating image with prompt:', prompt);

    // Map size options to DALL-E 3 supported sizes
    let dalleSize = "1024x1024"; // default
    if (size === "1536x1024" || size === "1792x1024") {
      dalleSize = "1792x1024";
    } else if (size === "1024x1536" || size === "1024x1792") {
      dalleSize = "1024x1792";
    } else {
      dalleSize = "1024x1024";
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        size: dalleSize,
        quality: quality === "high" ? "hd" : "standard",
        n: 1
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const imageData = data.data[0];

    console.log('Image generated successfully');

    return new Response(JSON.stringify({ 
      image: imageData.b64_json ? `data:image/webp;base64,${imageData.b64_json}` : imageData.url,
      prompt: prompt 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in image-generation function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});