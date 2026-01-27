import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content-type specific visual styles for better image matching
const VISUAL_STYLES: Record<string, string> = {
  // For Everyone (Consumer-focused) - warm, friendly, relatable imagery
  personal_safety: 'Warm, protective family-oriented imagery. Happy people using devices safely, cozy home settings with subtle security elements, protective shields around family silhouettes. Soft blues, greens, warm lighting.',
  password_tips: 'Friendly key and lock imagery, digital vault doors, secure padlocks with warm glows, fingerprint scans. Approachable and non-technical feeling. Bright, clean colors.',
  scam_alert: 'Warning imagery without being scary - caution signs, magnifying glass over suspicious elements, protective barriers catching threats. Orange and yellow alert tones balanced with calming blues.',
  device_security: 'Modern devices (phones, laptops, tablets) with protective shields or glowing security auras. Clean, lifestyle photography feel. Bright, optimistic colors.',
  privacy_tips: 'Privacy-focused imagery - secure envelopes, private browsing concepts, data protection symbols. People in control of their information. Soft purples and teals.',
  
  // For Small Businesses - professional but accessible
  smb_security: 'Small business scenes - small office, coffee shop, retail store with subtle security elements. Professional but approachable. Clean blues and warm accents.',
  payment_safety: 'Secure payment imagery - protected credit cards, safe transactions, digital payment shields. Trust-building visuals. Green and blue tones for security and trust.',
  email_security: 'Email security visuals - protected inbox, spam filtering concepts, secure envelope imagery. Clean, professional. Blues and protective shield elements.',
  network_basics: 'WiFi and network security - protected routers, secure connection symbols, small office network diagrams. Approachable tech imagery. Blue and cyan tones.',
  
  // For MSPs & Enterprise
  threat_alert: 'Dramatic cybersecurity scene with red/orange warning tones, digital shields, network visualization, hacker silhouettes, or malware patterns. Dark moody atmosphere.',
  service_highlight: 'Professional business technology scene showing servers, dashboards, team collaboration, or enterprise infrastructure. Corporate blue tones.',
  industry_news: 'Modern tech news aesthetic with abstract data visualizations, global networks, or futuristic cityscape elements. Dynamic and current feeling.',
  compliance_update: 'Official, structured visuals with documents, checklists, certification badges, or regulatory symbols. Clean and trustworthy.',
  success_story: 'Positive, achievement-oriented imagery with upward graphs, trophy elements, handshakes, or celebrating team silhouettes. Warm, optimistic colors.',
  
  // General
  security_tip: 'Clean, helpful visual with lock icons, checkmarks, protective shields, or secure connections. Bright, approachable colors like blues and greens.',
  awareness_campaign: 'Educational cybersecurity visuals with protective symbols, awareness ribbons, or community-focused security imagery. Accessible and inclusive.',
  custom_topic: 'Professional technology and cybersecurity themed imagery with modern digital aesthetics.',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio = '16:9', contentType } = await req.json();
    if (!prompt) throw new Error('Prompt is required');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Get visual style based on content type
    const visualStyle = contentType && VISUAL_STYLES[contentType] 
      ? VISUAL_STYLES[contentType] 
      : VISUAL_STYLES.custom_topic;

    // Enhanced prompt for beautiful, text-free images
    const enhancedPrompt = `Create a stunning, high-quality social media thumbnail image.

TOPIC: ${prompt}

VISUAL DIRECTION: ${visualStyle}

CRITICAL REQUIREMENTS (MUST FOLLOW):
- ABSOLUTELY NO text, words, letters, numbers, or typography of any kind
- ABSOLUTELY NO logos, brand marks, watermarks, or symbols that look like text
- Image must be 100% visual - purely imagery with zero text elements
- No UI elements, buttons, or interface components

QUALITY REQUIREMENTS:
- Ultra high resolution and sharp details
- Professional composition with strong focal point
- Cinematic lighting and depth
- Rich, vibrant colors that pop on social feeds
- Modern, premium aesthetic suitable for business content

ASPECT RATIO: ${aspectRatio} (optimize composition for this ratio)

COLOR PALETTE: Deep blues, cyans, teals, with accent colors. Dark backgrounds preferred for contrast.`;

    console.log('Generating image for content type:', contentType || 'custom');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${LOVABLE_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [{ role: 'user', content: enhancedPrompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), { 
          status: 402, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      const errorText = await response.text();
      console.error('AI image generation error:', response.status, errorText);
      throw new Error('Failed to generate image');
    }

    const data = await response.json();
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      console.error('No image in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image generated');
    }

    // Upload to Supabase storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to buffer
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `ai-generated/${Date.now()}-${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from('social-media-images')
      .upload(fileName, imageBuffer, { 
        contentType: 'image/png',
        upsert: false 
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Fall back to returning base64 if storage upload fails
      return new Response(JSON.stringify({ 
        imageUrl: generatedImage, 
        isBase64: true 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('social-media-images')
      .getPublicUrl(fileName);

    console.log('Image uploaded successfully:', publicUrlData.publicUrl);

    return new Response(JSON.stringify({ 
      imageUrl: publicUrlData.publicUrl, 
      isBase64: false 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('generate-social-image error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
