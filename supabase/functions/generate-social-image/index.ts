import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // Must include all headers sent by supabase-js in browsers.
  'Access-Control-Allow-Headers': [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    'x-supabase-client-platform',
    'x-supabase-client-platform-version',
    'x-supabase-client-runtime',
    'x-supabase-client-runtime-version',
  ].join(', '),
};

// Facebook requires aspect ratio <= 1.91.
// 1200x628 is actually 1.9108 (> 1.91), so we use 1200x629 (~1.9078).
const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 629;

// Product logo URLs (from public folder - available after deploy)
const getProductLogoUrl = (product: string, origin?: string | null): string => {
  const logoMap: Record<string, string> = {
    safepass: 'safepass-logo.png',
    safescan: 'safescan-logo.png',
    safeweb: 'safeweb-logo.png',
    safetrack: 'safetrack-logo.png',
    safeassist: 'safeassist-logo-horizontal.png',
    safesuite: 'safesuite-logo.png',
    ultriumgpt: 'ultrium-gpt-logo.png',
    aistudio: 'ultrium-gpt-logo.png', // AI Studio uses the same logo as UltriumGPT
    vanguard: 'vanguard-logo.png',
  };

  const base = origin || 'https://ultriumai.lovable.app';
  const file = logoMap[product] || 'safesuite-logo.png';
  return new URL(`/logos/${file}`, base).toString();
};

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
}

async function fetchLogoBytes(logoUrl: string, fallbackOrigin: string): Promise<Uint8Array | null> {
  const tryUrls: string[] = [];

  tryUrls.push(logoUrl);
  // If the request origin isn't available (or fetch fails due to preview/published mismatch),
  // also try the published domain.
  try {
    const u = new URL(logoUrl);
    const fallback = new URL(u.pathname, fallbackOrigin).toString();
    if (fallback !== logoUrl) tryUrls.push(fallback);
  } catch {
    // ignore malformed URL
  }

  for (const url of tryUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
      console.warn('Logo fetch failed:', res.status, url);
    } catch (e) {
      console.warn('Logo fetch error:', url, e);
    }
  }

  return null;
}

async function ensurePng1200x629AndWatermark(params: {
  imageDataUrl: string;
  logoUrl?: string | null;
  logoFallbackOrigin?: string;
}): Promise<string> {
  const baseBytes = dataUrlToBytes(params.imageDataUrl);
  let img = await Image.decode(baseBytes);

  // Full-bleed: always cover-crop to exact social dimensions.
  img = img.cover(TARGET_WIDTH, TARGET_HEIGHT);

  if (params.logoUrl) {
    const fallbackOrigin = params.logoFallbackOrigin || 'https://ultriumai.lovable.app';
    const logoBytes = await fetchLogoBytes(params.logoUrl, fallbackOrigin);
    if (logoBytes) {
      let logo = await Image.decode(logoBytes);

      // Size: ~16% of width, maintain aspect ratio.
      const targetLogoWidth = Math.max(120, Math.round(TARGET_WIDTH * 0.16));
      logo = logo.resize(targetLogoWidth, Image.RESIZE_AUTO);

      // Slight transparency to feel like a watermark.
      logo.opacity(0.85);

      const padding = Math.round(TARGET_WIDTH * 0.02); // ~24px
      const x = Math.max(0, TARGET_WIDTH - logo.width - padding);
      const y = Math.max(0, TARGET_HEIGHT - logo.height - padding);
      img.composite(logo, x, y);
    }
  }

  const pngBytes = await img.encode(1);
  return `data:image/png;base64,${encodeBase64(pngBytes)}`;
}

// Keywords to detect product mentions - ORDER MATTERS: SafeSuite checked first as umbrella product
const PRODUCT_KEYWORDS: [string, string[]][] = [
  // SafeSuite MUST be checked first - it's the umbrella brand that includes multiple products
  ['safesuite', ['safesuite', 'safe suite', 'security suite', 'all-in-one security', 'complete security', 'security solution', 'safesuite provides', 'see safesuite']],
  // Individual products checked after SafeSuite
  ['safepass', ['safepass', 'password manager', 'password vault', 'password management']],
  ['safescan', ['safescan', 'email scan', 'url scan', 'document scan', 'threat scan']],
  ['safeweb', ['safeweb', 'dark web monitoring', 'breach monitoring', 'exposed credential']],
  ['safetrack', ['safetrack', 'asset management', 'asset tracking', 'it asset']],
  ['safeassist', ['safeassist', 'ai assistant', 'security assistant']],
  ['ultriumgpt', ['ultriumgpt', 'custom gpt', 'ai builder', 'custom ai']],
  ['aistudio', ['ai studio', 'aistudio', 'gpt builder', 'ai control plane', 'business ai', 'white-label ai', 'msp ai', 'ai capacity', 'custom assistants']],
  ['vanguard', ['vanguard', 'rmm', 'endpoint management', 'remote monitoring']],
];

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
  ai_studio: 'Futuristic AI control panel imagery with glowing violet/purple accents, neural network patterns, custom AI assistants, dashboard interfaces, enterprise AI deployment. Premium tech aesthetic with dark backgrounds and neon violet glows. Sophisticated, powerful, innovative.',
  threat_alert: 'Dramatic cybersecurity scene with red/orange warning tones, digital shields, network visualization, hacker silhouettes, or malware patterns. Dark moody atmosphere.',
  service_highlight: 'Professional business technology scene showing servers, dashboards, team collaboration, or enterprise infrastructure. Corporate blue tones.',
  industry_news: 'Modern tech news aesthetic with abstract data visualizations, global networks, or futuristic cityscape elements. Dynamic and current feeling.',
  compliance_update: 'Official, structured visuals with documents, checklists, certification badges, or regulatory symbols. Clean and trustworthy.',
  success_story: 'Positive, achievement-oriented imagery with upward graphs, trophy elements, handshakes, or celebrating team silhouettes. Warm, optimistic colors.',
  
  // UltriumAI Product Promos
  safepass_promo: 'Premium password vault imagery with golden amber accents, secure key icons, digital vault doors, biometric authentication, master passwords. Luxurious security aesthetic with dark backgrounds and warm amber/gold glows. Trustworthy, secure, premium.',
  safescan_promo: 'Threat detection imagery with red warning accents, email scanning visualizations, URL analysis, document inspection, shield barriers catching malware. Alert-focused aesthetic with dark backgrounds and crimson red glows. Vigilant, protective, proactive.',
  safeweb_promo: 'Dark web monitoring imagery with cyan/teal accents, deep web visualizations, breach detection alerts, credential monitoring dashboards, hidden threat discovery. Mysterious yet protective aesthetic with dark backgrounds and cyan glows. Watchful, comprehensive, revealing.',
  safetrack_promo: 'IT asset management imagery with emerald green accents, inventory dashboards, device tracking maps, asset lifecycle visualizations, organized equipment grids. Organized and efficient aesthetic with dark backgrounds and green accents. Orderly, efficient, complete.',
  safeassist_promo: 'AI security advisor imagery with emerald green accents. Show a friendly AI assistant helping employees with security - conversation interfaces, protective guidance, security education. Imagery of AI helping humans navigate threats safely. Modern robot or AI face with welcoming expression surrounded by security icons (shields, locks, checkmarks). Employees getting real-time security advice. Dark backgrounds with emerald/teal glows. Helpful, intelligent, accessible, protective.',
  vanguard_promo: 'Enterprise RMM imagery with cyan accents, endpoint management dashboards, network monitoring visualizations, remote access connections, security agent deployment. Command center aesthetic with dark backgrounds and cyan highlights. Powerful, comprehensive, enterprise-grade.',
  
  // General
  security_tip: 'Clean, helpful visual with lock icons, checkmarks, protective shields, or secure connections. Bright, approachable colors like blues and greens.',
  awareness_campaign: 'Educational cybersecurity visuals with protective symbols, awareness ribbons, or community-focused security imagery. Accessible and inclusive.',
  custom_topic: 'Professional technology and cybersecurity themed imagery with modern digital aesthetics.',
};

// Map content types to forced product watermarks
const CONTENT_TYPE_TO_PRODUCT: Record<string, string> = {
  safepass_promo: 'safepass',
  safescan_promo: 'safescan',
  safeweb_promo: 'safeweb',
  safetrack_promo: 'safetrack',
  safeassist_promo: 'safeassist',
  vanguard_promo: 'vanguard',
  ai_studio: 'aistudio',
};

// Detect which product is mentioned in the content
function detectProduct(text: string, contentType?: string): string | null {
  // If content type maps to a product, use that
  if (contentType && CONTENT_TYPE_TO_PRODUCT[contentType]) {
    return CONTENT_TYPE_TO_PRODUCT[contentType];
  }
  
  const lowerText = text.toLowerCase();
  // Check in order - SafeSuite first as umbrella brand
  for (const [product, keywords] of PRODUCT_KEYWORDS) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        return product;
      }
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio = '1.91:1', contentType, postContent } = await req.json();
    if (!prompt) throw new Error('Prompt is required');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Detect product from content type first, then prompt, then post content
    const detectedProduct = detectProduct(prompt, contentType) || (postContent ? detectProduct(postContent) : null);
    console.log('Detected product:', detectedProduct || 'none', 'from contentType:', contentType);

    // Get visual style based on content type
    const visualStyle = contentType && VISUAL_STYLES[contentType] 
      ? VISUAL_STYLES[contentType] 
      : VISUAL_STYLES.custom_topic;

    // Enhanced prompt for beautiful, text-free images optimized for social feeds
    // Facebook requires aspect ratio <= 1.91:1. We enforce 1200x629 (~1.9078) in post-processing.
    const enhancedPrompt = `Create a stunning, high-quality LANDSCAPE social media image.

TOPIC: ${prompt}

VISUAL DIRECTION: ${visualStyle}

CRITICAL IMAGE DIMENSIONS:
- MUST be a WIDE LANDSCAPE format (approximately 1200x629 pixels, <= 1.91:1 ratio)
- Width must be significantly greater than height (almost 2x wider than tall)
- This is NOT a square or portrait image - it MUST be a wide horizontal banner

CRITICAL REQUIREMENTS (MUST FOLLOW):
- ABSOLUTELY NO text, words, letters, numbers, or typography of any kind
- ABSOLUTELY NO logos, brand marks, watermarks, or symbols that look like text
- Avoid any badges, emblems, seals, labels, UI icons, or logo-like marks of any kind
- Image must be 100% visual - purely imagery with zero text elements
- No UI elements, buttons, or interface components

QUALITY REQUIREMENTS:
- Ultra high resolution and sharp details
- Professional composition with strong focal point
- Cinematic lighting and depth
- Rich, vibrant colors that pop on social feeds
- Modern, premium aesthetic suitable for business content

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
    let generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      console.error('No image in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image generated');
    }

    // Deterministic post-processing (no AI editing):
    // - enforce exact 1200x628 full-bleed dimensions
    // - ALWAYS overlay the REAL logo from /public/logos (prevents model re-drawing)
    //   If no product detected, default to SafeSuite as the umbrella Ultrium brand watermark.
    const origin = req.headers.get('origin');
    const watermarkProduct = detectedProduct || 'safesuite';
    const logoUrl = getProductLogoUrl(watermarkProduct, origin);
    generatedImage = await ensurePng1200x629AndWatermark({
      imageDataUrl: generatedImage,
      logoUrl,
      // If the origin points at preview, we still want a stable fallback.
      logoFallbackOrigin: 'https://ultriumai.lovable.app',
    });

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
        isBase64: true,
        detectedProduct: detectedProduct || null
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
      isBase64: false,
      detectedProduct: detectedProduct || null
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
