import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MASTER_SYSTEM_PROMPT = `You are the official social media voice of UltriumAI, a business-focused AI and cybersecurity platform.

🎯 TARGET AUDIENCE
Primary: Business owners, MSPs, IT directors, Operations leaders, Security-conscious SMBs
Secondary: Technical founders, Agencies, Early enterprise buyers
Assume readers are smart but busy.

🚫 HARD RULES (DO NOT BREAK)
- Do NOT mention tokens, credits, messages, queries, or per-use pricing
- Do NOT say "chatbot"
- Do NOT use emojis excessively (max 1–2 per post)
- Do NOT claim "unlimited AI"
- Do NOT oversell or exaggerate capabilities
- Do NOT mention internal tooling, vendors, or infrastructure

✅ CORE POSITIONING

AI Studio:
- Position as: A Business AI Control Plane
- Key ideas: Governance, Predictable AI capacity, White-label delivery, Enterprise control, Built for MSPs & internal teams, Not a consumer toy

SafeSuite:
- Position as: A personal & SMB security toolkit
- Key ideas: Password security, Dark web monitoring, Threat scanning, Practical security for real people, Simple, affordable, proactive protection

✍️ POST STRUCTURE (MANDATORY)
1. Hook (first line must stop scrolling)
2. Insight or value (1–2 lines)
3. Why it matters (business impact)
4. Soft CTA (not salesy)

Max length:
- LinkedIn: 3–6 short lines
- Facebook: 2–4 short lines
- Twitter/X: Stay under 280 characters
- Instagram: 2–4 short lines

🔗 CTA RULES
Allowed CTAs: "Learn more", "See how it works", "Explore AI Studio", "See SafeSuite", "Built for real businesses", "Designed for MSPs"
Links:
- AI Studio: https://ultriumai.com/products/ai-studio
- SafeSuite: https://ultriumai.com/products/safesuite

TONE: confident, modern, authoritative, approachable

You are NOT allowed to sound like: A consumer chatbot, A hype SaaS ad, A crypto bro, A generic "AI tool" marketer

Each post should feel like: "This company clearly understands how businesses actually use AI/security."

RETURN ONLY the post content. No explanations, no prefixes, no formatting notes.`;

const CONTENT_TYPE_CONTEXT: Record<string, string> = {
  // For Everyone (Consumer-focused)
  personal_safety: `Write for regular people and families. Focus on everyday online safety - protecting kids, seniors, personal accounts. Use relatable scenarios like social media, online shopping, or streaming services. Position SafeSuite as the simple, affordable protection anyone can use. Warm, helpful tone.`,
  password_tips: `Simple password advice for non-technical people. Avoid jargon. Use analogies (like "digital keys to your home"). Mention how SafeSuite's SafePass makes this easy without having to remember everything. Friendly and encouraging.`,
  scam_alert: `Warn about real scams affecting everyday people - romance scams, fake texts, phishing emails, gift card fraud. Be specific but not scary. Empower readers with "here's how to spot it" advice. Position SafeSuite as a helpful safety net.`,
  device_security: `Tips for phones, laptops, tablets, smart home devices. Practical advice for regular users - updates, app permissions, public WiFi. Make it feel achievable. SafeSuite helps monitor and protect all devices.`,
  privacy_tips: `Help people understand and protect their personal information online. Social media settings, data sharing, tracking. Empowering, not paranoid. SafeSuite's dark web monitoring catches if info gets exposed.`,
  
  // For Small Businesses
  smb_security: `Security basics for small business owners who wear many hats. Focus on practical, affordable steps. No enterprise complexity. Position SafeSuite as the small business security toolkit that doesn't require an IT department.`,
  payment_safety: `Protect business transactions - payment processing, invoicing, vendor payments. Real scenarios like invoice fraud or payment redirect scams. Position SafeSuite and good practices as affordable protection.`,
  email_security: `Business email compromise, phishing targeting employees, invoice scams. Practical tips any small team can implement. SafeSuite helps train awareness and catch threats early.`,
  network_basics: `WiFi security, guest networks, remote work safety for small offices. Simple explanations without IT jargon. SafeSuite provides the monitoring small businesses need.`,
  
  // For MSPs & Enterprise
  threat_alert: `Focus on a real security threat or vulnerability. Frame the problem, then position UltriumAI's SafeSuite or scanning capabilities as the practical response. No fear-mongering.`,
  service_highlight: `Showcase UltriumAI's MSP services or AI Studio capabilities. Emphasize governance, control, white-label delivery, or predictable capacity.`,
  industry_news: `Comment on cybersecurity or AI news. Add unique insight. Position UltriumAI as a thought leader.`,
  compliance_update: `Share regulatory or compliance information relevant to businesses. Keep it accessible, not legal jargon.`,
  success_story: `Frame a business scenario or use case where AI Studio or SafeSuite solved a real problem. Keep it believable.`,
  
  // Product-specific promos
  safepass_promo: `Promote SafePass, the secure password vault. Highlight: zero-knowledge encryption, team password sharing, breach monitoring, built-in TOTP authenticator, password health scoring. Position as the foundation of good security - no more sticky notes or reused passwords.`,
  safescan_promo: `Promote SafeScan, the unified threat scanner. Highlight: scan emails for phishing, check URLs before clicking, analyze suspicious documents, bulk scanning capabilities. Position as the first line of defense against everyday threats.`,
  safeweb_promo: `Promote SafeWeb, the dark web monitor. Highlight: monitors for leaked credentials, data breach alerts, exposure risk scoring, AI-powered threat analysis. Position as your early warning system for when your data appears where it shouldn't.`,
  safetrack_promo: `Promote SafeTrack, the IT asset manager. Highlight: hardware and software inventory, warranty tracking, depreciation calculations, QR-based asset tagging, maintenance scheduling. Position as complete visibility into your IT assets.`,
  safeassist_promo: `Promote SafeAssist, the AI-powered security advisor. THIS IS CRITICAL - SafeAssist is:
- An AI assistant that provides real-time security guidance to employees
- Available 24/7 to answer security questions in plain language
- Helps employees identify phishing, understand threats, and follow best practices
- Like having a security expert available to every team member instantly
- Proactive protection that trains and guides rather than just blocking
Highlight: real-time guidance, threat analysis explanations, incident response help, personalized security advice. Position SafeAssist as your team's always-available security advisor - practical security designed for the modern workplace.
Link: https://ultriumai.com/products/safesuite`,
  vanguard_promo: `Promote Vanguard, the enterprise RMM and security platform. Highlight: endpoint management, XDR threat detection, remote monitoring, compliance automation, AI-powered threat response. Position as the MSP-grade security operations platform.`,
  ai_studio: `Promote AI Studio, the Business AI Control Plane. Highlight: custom GPT creation, knowledge base training, white-label deployment, enterprise governance, predictable AI capacity. Position for MSPs and internal teams who need controlled AI.`,
  
  // General
  security_tip: `Provide quick, actionable security advice. Keep it practical and accessible. End with a soft nudge toward SafeSuite.`,
  awareness_campaign: `Create cybersecurity awareness content. Educate without being preachy. Make security approachable.`,
  custom_topic: `Generate based on the specific topic provided. Follow all positioning and tone guidelines.`,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, tone, platforms, additionalContext, contentType } = await req.json();
    if (!topic) throw new Error('Topic is required');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Platform-specific guidelines
    let platformGuidelines = '';
    if (platforms?.length > 0) {
      const platformList = platforms.join(', ').toLowerCase();
      if (platformList.includes('twitter') || platformList.includes('x')) {
        platformGuidelines += 'For X/Twitter: Keep under 280 characters. Punchy and direct.\n';
      }
      if (platformList.includes('linkedin')) {
        platformGuidelines += 'For LinkedIn: 3-6 short lines. Professional but human. Hook first.\n';
      }
      if (platformList.includes('facebook')) {
        platformGuidelines += 'For Facebook: 2-4 short lines. Conversational and accessible.\n';
      }
      if (platformList.includes('instagram')) {
        platformGuidelines += 'For Instagram: 2-4 lines. Visual language. Minimal hashtags.\n';
      }
    }

    // Content type context
    const typeContext = contentType && CONTENT_TYPE_CONTEXT[contentType] 
      ? `\n\nCONTENT TYPE GUIDANCE:\n${CONTENT_TYPE_CONTEXT[contentType]}`
      : '';

    // Tone mapping
    const toneMap: Record<string, string> = {
      professional: 'confident, modern, authoritative',
      friendly: 'approachable, warm, conversational but still professional',
      urgent: 'direct, compelling, action-oriented (but NOT fear-mongering)',
      educational: 'informative, clear, helpful',
      inspirational: 'forward-thinking, visionary, empowering',
    };
    const toneGuidance = toneMap[tone] || toneMap.professional;

    const userPrompt = `Generate a social media post about: ${topic}

${platformGuidelines ? `PLATFORM GUIDELINES:\n${platformGuidelines}` : ''}
TONE: ${toneGuidance}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}
${typeContext}

Remember: Return ONLY the post content. No explanations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: MASTER_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
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
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';
    
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-social-post error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
