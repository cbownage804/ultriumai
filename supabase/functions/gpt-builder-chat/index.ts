import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract URLs from text
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s,)>"']+|(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s,)>"']*)?/gi;
  const matches = text.match(urlRegex) || [];
  return matches.map(u => u.startsWith('http') ? u : `https://${u}`).slice(0, 2);
}

// Fetch a website and extract relevant branding info
async function fetchWebsiteContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GPTBuilder/1.0)',
        'Accept': 'text/html',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    
    if (!resp.ok) return null;
    
    const html = await resp.text();
    
    // Extract useful metadata
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is);
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/is);
    const favicon = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["'](.*?)["']/is);
    const themeColor = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["'](.*?)["']/is);
    
    // Extract colors from CSS/inline styles
    const colorMatches = html.match(/#[0-9a-fA-F]{3,8}/g) || [];
    const uniqueColors = [...new Set(colorMatches)].slice(0, 10);
    
    // Extract text content (first ~2000 chars, stripped of HTML)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/is);
    let textContent = '';
    if (bodyMatch) {
      textContent = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000);
    }
    
    // Resolve relative URLs
    const baseUrl = new URL(url);
    const resolveUrl = (u: string | undefined) => {
      if (!u) return null;
      try { return new URL(u, baseUrl).href; } catch { return u; }
    };
    
    const result = {
      url,
      title: titleMatch?.[1]?.trim() || null,
      description: metaDesc?.[1]?.trim() || null,
      logo: resolveUrl(favicon?.[1]) || resolveUrl(ogImage?.[1]),
      ogImage: resolveUrl(ogImage?.[1]),
      themeColor: themeColor?.[1] || null,
      colorsFound: uniqueColors,
      textContent: textContent.slice(0, 1500),
    };
    
    return JSON.stringify(result, null, 2);
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err);
    return null;
  }
}

const SYSTEM_PROMPT = `You are a GPT Builder AI assistant. Your job is to help users create custom AI assistants by configuring them through conversation.

When a user describes what they want, you should:
1. Understand their intent and suggest a configuration
2. Output a JSON config block with the GPT settings
3. Explain what you configured and why

IMPORTANT - Web Browsing Capability:
When website content is provided in [WEBSITE_DATA], use it to:
- Extract the company/brand name for the GPT name
- Pick the primary brand color for theme_color (use the actual hex color from the site)
- Reference the logo URL for avatar_url if available
- Tailor the system_prompt to the company's products/services mentioned on their site
- Create relevant starter_questions based on the company's actual offerings

ALWAYS output your configuration updates as a JSON code block like this:
\`\`\`json
{
  "name": "Customer Support Bot",
  "description": "A friendly AI assistant for customer support",
  "system_prompt": "You are a helpful customer support agent...",
  "welcome_message": "Hi! How can I help you today?",
  "starter_questions": ["How do I reset my password?", "What are your business hours?"],
  "theme_color": "#6366f1",
  "avatar_url": "",
  "communication_style": "Professional and friendly",
  "expertise_areas": "Customer service, product knowledge",
  "category": "support",
  "enable_web_search": false,
  "placeholder_prompt": "Ask me anything about our products..."
}
\`\`\`

Rules:
- Only include fields that need to change in the JSON block
- Write detailed, high-quality system prompts (at least 2-3 sentences)
- Be conversational and helpful in your text response
- If the user asks to change something specific, only update that field
- Suggest improvements proactively
- For the system_prompt field, write it as instructions TO the GPT (e.g., "You are a...")
- Keep starter_questions to 2-4 items max
- Choose appropriate theme_color hex values that match the GPT's personality
- When website data is available, use the ACTUAL brand colors from the site, not generic ones
- When a logo/favicon URL is found, include it as avatar_url
- Always respond with both a natural language explanation AND the JSON config block

Available categories: general, business, creative, developer, education, support`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, currentConfig } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Check the latest user message for URLs and fetch website content
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
    let websiteContext = '';
    
    if (lastUserMsg) {
      const urls = extractUrls(lastUserMsg.content);
      if (urls.length > 0) {
        console.log('Fetching URLs:', urls);
        const results = await Promise.all(urls.map(fetchWebsiteContent));
        const validResults = results.filter(Boolean);
        if (validResults.length > 0) {
          websiteContext = `\n\n[WEBSITE_DATA]\n${validResults.join('\n---\n')}\n[/WEBSITE_DATA]`;
          console.log('Website data fetched successfully');
        }
      }
    }

    const systemMessage = `${SYSTEM_PROMPT}\n\nCurrent GPT Configuration:\n${currentConfig}${websiteContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("gpt-builder-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});