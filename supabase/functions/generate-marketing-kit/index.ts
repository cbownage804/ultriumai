import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEMPLATES: Record<string, { title: (client: string) => string; generateContent: (ctx: any) => string }> = {
  proposal: {
    title: (client) => `Security Proposal - ${client}`,
    generateContent: (ctx) => `
# Security Proposal for ${ctx.client_name}

Prepared by: **${ctx.partner_company}** | ${new Date().toLocaleDateString()}

---

## Executive Summary
${ctx.client_name} faces growing cybersecurity challenges in the ${ctx.industry || 'technology'} sector. ${ctx.partner_company} offers a comprehensive managed security platform powered by Vanguard to address these risks.

## Recommended Solution
${ctx.enabled_modules?.map((m: string) => `- **Vanguard ${m.charAt(0).toUpperCase() + m.slice(1)}**: Enterprise-grade ${m} capabilities`).join('\n') || '- Full Vanguard Platform Suite'}

## Key Benefits
- 24/7 Threat Monitoring & Response
- Compliance-Ready Reporting (SOC 2, HIPAA, ISO 27001)
- AI-Powered Threat Detection via Cortex
- Dedicated Account Management

## Investment
| Item | Per User/Mo |
|------|------------|
| Platform License | $${ctx.price_per_seat || '15.00'} |
| 24/7 Monitoring | Included |
| Compliance Reports | Included |

## ROI Analysis
- **Average breach cost**: $4.45M (IBM 2025)
- **Your investment**: ~$${(ctx.price_per_seat || 15) * (ctx.seat_count || 50) * 12}/year
- **ROI**: ${Math.round(4450000 / ((ctx.price_per_seat || 15) * (ctx.seat_count || 50) * 12) * 100)}x return on security investment

${ctx.additional_context ? `\n## Additional Notes\n${ctx.additional_context}` : ''}

---
${ctx.hide_branding ? '' : `*${ctx.powered_by_text || 'Powered by UltriumAI Vanguard'}*`}
    `.trim(),
  },
  one_pager: {
    title: (client) => `One-Pager - ${client}`,
    generateContent: (ctx) => `
# ${ctx.partner_company} — Managed Security Platform

**Protecting ${ctx.industry || 'businesses'} with enterprise-grade cybersecurity**

## Why ${ctx.partner_company}?
✅ AI-Powered Threat Detection | ✅ Compliance Automation | ✅ 24/7 SOC Monitoring

## Platform Capabilities
🛡️ **Endpoint Protection** — Real-time EDR with ransomware rollback
🔍 **Vulnerability Management** — Automated scanning and patch management
📊 **Compliance** — SOC 2, HIPAA, PCI-DSS, ISO 27001 ready
🤖 **AI Copilot** — Cortex AI for automated triage and response

## For ${ctx.client_name}
${ctx.additional_context || 'Tailored security solution for your organization\'s unique needs.'}

📞 Contact: ${ctx.partner_company}
    `.trim(),
  },
  slide_deck: {
    title: (client) => `Presentation - ${client}`,
    generateContent: (ctx) => `
# Slide Deck: ${ctx.partner_company} Security Brief

---
## Slide 1: Title
**${ctx.partner_company}**
Managed Security for ${ctx.client_name}
${ctx.industry ? `Industry: ${ctx.industry}` : ''}

---
## Slide 2: The Threat Landscape
- 68% of breaches involve human element
- Average detection time: 204 days
- Ransomware attacks up 37% YoY

---
## Slide 3: Our Solution
- Vanguard Horizon — RMM & Monitoring
- Vanguard Pursuit — XDR & Threat Hunting
- Vanguard Cortex — AI-Powered Automation
- Vanguard Comply — Compliance Management

---
## Slide 4: ROI & Investment
- Per-user pricing starting at $${ctx.price_per_seat || 15}/mo
- No hardware required
- Immediate deployment

---
## Slide 5: Next Steps
1. Security Assessment (complimentary)
2. Custom deployment plan
3. 30-day pilot program
    `.trim(),
  },
  email_template: {
    title: (client) => `Email - ${client}`,
    generateContent: (ctx) => `
Subject: Strengthen ${ctx.client_name}'s Security Posture — Free Assessment

Hi {{first_name}},

I wanted to reach out because ${ctx.industry || 'organizations like yours'} face increasing cybersecurity threats, and many lack the resources for 24/7 monitoring.

At **${ctx.partner_company}**, we provide enterprise-grade security through our managed platform:

• **Real-time threat detection** with AI-powered analysis
• **Compliance automation** for SOC 2, HIPAA, and more
• **24/7 SOC monitoring** without the cost of building in-house

We're offering a **complimentary security assessment** for ${ctx.client_name} to identify vulnerabilities and provide actionable recommendations.

Would you be open to a 15-minute call this week?

Best regards,
${ctx.partner_company}
    `.trim(),
  },
  case_study: {
    title: (client) => `Case Study - ${client}`,
    generateContent: (ctx) => `
# Case Study: How ${ctx.partner_company} Secured ${ctx.client_name}

## Challenge
${ctx.client_name}, a ${ctx.industry || 'mid-market'} organization, needed to improve their security posture while maintaining compliance with industry regulations.

## Solution
${ctx.partner_company} deployed the Vanguard platform:
- Endpoint detection and response across all devices
- Automated compliance monitoring and reporting
- AI-powered threat triage reducing alert fatigue by 90%

## Results
- **95%** reduction in mean time to detect (MTTD)
- **80%** reduction in manual security tasks
- **100%** compliance audit pass rate
- **$${Math.round((ctx.seat_count || 50) * 200)}K** estimated savings vs. in-house SOC

${ctx.additional_context ? `\n## Client Feedback\n"${ctx.additional_context}"` : ''}
    `.trim(),
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const { partner_id, asset_type, client_name, industry, additional_context, partner_company, partner_tier } = body

    if (!partner_id || !asset_type || !client_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify partner
    const { data: partner, error: partnerError } = await supabase
      .from('reseller_partners')
      .select('*')
      .eq('id', partner_id)
      .single()

    if (partnerError || !partner || partner.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Partner not found' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get active theme for branding
    const { data: theme } = await supabase
      .from('reseller_themes')
      .select('*')
      .eq('partner_id', partner_id)
      .eq('is_active', true)
      .maybeSingle()

    const template = TEMPLATES[asset_type]
    if (!template) {
      return new Response(JSON.stringify({ error: 'Invalid asset type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const ctx = {
      client_name,
      industry,
      additional_context,
      partner_company: partner_company || partner.company_name,
      partner_tier: partner_tier || partner.tier,
      hide_branding: theme?.hide_ultrium_branding || false,
      powered_by_text: theme?.powered_by_text || 'Powered by UltriumAI',
      price_per_seat: 15,
      seat_count: 50,
    }

    const content = template.generateContent(ctx)
    const title = template.title(client_name)

    // Store as a text blob in storage
    const fileName = `marketing-assets/${partner_id}/${Date.now()}-${asset_type}.md`
    const { error: uploadError } = await supabase.storage
      .from('social-media-images')
      .upload(fileName, new Blob([content], { type: 'text/markdown' }), { contentType: 'text/markdown', upsert: true })

    let fileUrl = null
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('social-media-images').getPublicUrl(fileName)
      fileUrl = urlData.publicUrl
    }

    // Save asset record
    const { data: asset, error: assetError } = await supabase
      .from('reseller_marketing_assets')
      .insert({
        partner_id,
        asset_type,
        title,
        description: `Generated for ${client_name} (${industry || 'general'})`,
        file_url: fileUrl,
        is_co_branded: partner.tier !== 'silver',
        metadata: { client_name, industry, additional_context },
      })
      .select()
      .single()

    if (assetError) throw assetError

    return new Response(JSON.stringify({
      success: true,
      asset,
      content,
      message: `${asset_type} generated for ${client_name}`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Marketing kit error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
