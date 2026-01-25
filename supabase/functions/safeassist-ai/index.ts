import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationContext {
  conversation_history?: Array<{
    role: string;
    content: string;
  }>;
  source?: string;
  include_user_context?: boolean;
}

interface UserSecurityContext {
  passwordVault: { total: number; weak: number; reused: number; compromised: number };
  threats: { monitored: number; found: number; lastScan: string | null };
  assets: { total: number; expiringSoon: number };
  scans: { total: number; threatsDetected: number };
}

async function fetchUserSecurityContext(supabase: any, userId: string): Promise<UserSecurityContext | null> {
  try {
    // Fetch password vault stats
    const { data: vaultData } = await supabase
      .from('password_entries')
      .select('password_strength')
      .eq('user_id', userId);
    
    const passwordStats = {
      total: vaultData?.length || 0,
      weak: vaultData?.filter((p: any) => p.password_strength === 'weak').length || 0,
      reused: 0,
      compromised: 0
    };

    // Fetch SafeWeb monitoring stats
    const { data: monitoredAssets } = await supabase
      .from('monitored_assets')
      .select('id, threats_found, last_scan_at')
      .eq('user_id', userId);
    
    const threatStats = {
      monitored: monitoredAssets?.length || 0,
      found: monitoredAssets?.reduce((sum: number, a: any) => sum + (a.threats_found || 0), 0) || 0,
      lastScan: monitoredAssets?.[0]?.last_scan_at || null
    };

    // Fetch SafeTrack asset stats
    const { data: assets } = await supabase
      .from('assets')
      .select('id, warranty_expiry')
      .eq('user_id', userId);
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const assetStats = {
      total: assets?.length || 0,
      expiringSoon: assets?.filter((a: any) => 
        a.warranty_expiry && new Date(a.warranty_expiry) <= thirtyDaysFromNow
      ).length || 0
    };

    // Fetch SafeScan stats
    const { data: scanLogs } = await supabase
      .from('audit_logs')
      .select('details')
      .eq('user_id', userId)
      .eq('resource_type', 'safescan')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const scanStats = {
      total: scanLogs?.length || 0,
      threatsDetected: scanLogs?.filter((s: any) => 
        s.details?.threat_level && s.details.threat_level !== 'safe'
      ).length || 0
    };

    return {
      passwordVault: passwordStats,
      threats: threatStats,
      assets: assetStats,
      scans: scanStats
    };
  } catch (error) {
    console.error('Error fetching user security context:', error);
    return null;
  }
}

function buildContextualSystemPrompt(userContext: UserSecurityContext | null): string {
  let contextSection = '';
  
  if (userContext) {
    const alerts: string[] = [];
    
    // Check for password issues
    if (userContext.passwordVault.weak > 0) {
      alerts.push(`⚠️ ${userContext.passwordVault.weak} weak passwords need strengthening`);
    }
    if (userContext.passwordVault.total === 0) {
      alerts.push(`💡 User hasn't set up SafePass yet - encourage them to start saving passwords`);
    }
    
    // Check for threats
    if (userContext.threats.found > 0) {
      alerts.push(`🚨 ${userContext.threats.found} threats found in SafeWeb monitoring - address these`);
    }
    
    // Check for expiring warranties
    if (userContext.assets.expiringSoon > 0) {
      alerts.push(`📦 ${userContext.assets.expiringSoon} asset warranties expiring in 30 days`);
    }
    
    contextSection = `
**USER'S CURRENT SECURITY STATUS (Use this to give personalized advice):**
- SafePass Vault: ${userContext.passwordVault.total} passwords stored (${userContext.passwordVault.weak} weak)
- SafeWeb Monitoring: ${userContext.threats.monitored} assets monitored, ${userContext.threats.found} threats detected
- SafeTrack Assets: ${userContext.assets.total} assets tracked, ${userContext.assets.expiringSoon} warranties expiring soon
- SafeScan Activity: ${userContext.scans.total} scans in last 30 days, ${userContext.scans.threatsDetected} threats found

${alerts.length > 0 ? `**PROACTIVE ALERTS TO MENTION:**\n${alerts.join('\n')}` : '**Status: User is doing well! Encourage them to keep it up.**'}

Use this context to provide personalized advice. If asked about their security status, reference these real numbers.
`;
  }

  return `You are SafeAssist, a friendly and helpful AI security assistant created by UltriumAI. Your goal is to make cybersecurity simple, accessible, and non-intimidating while guiding users to the right tools in the SafeSuite ecosystem.
${contextSection}
**About UltriumAI:**
UltriumAI is a U.S. veteran-owned cybersecurity company with 15+ years of IT/security expertise, based in Virginia. They offer three flagship products:
1. **SafeSuite** - Consumer/SMB security suite (where you live!)
2. **Vanguard** - Enterprise MDR & security platform for MSPs
3. **AI Studio** - Custom AI application development

**Your Personality:**
- Warm, supportive, and encouraging - like a knowledgeable friend
- Patient and never condescending
- Use simple, everyday language - avoid technical jargon
- When you must use technical terms, always explain them simply

**SafeSuite Products You Should Recommend:**

🔐 **SafePass** (Password Manager)
- Store unlimited passwords securely with zero-knowledge encryption
- Generate strong passwords automatically
- Check if passwords have been compromised in data breaches
- Auto-fill credentials across devices
- **When to recommend:** When users ask about passwords, breaches, or credential security
- **How to access:** Click "SafePass" in the sidebar menu

🔍 **SafeScan** (Security Scanner)
- Scan URLs to check if websites are safe before clicking
- Analyze suspicious emails for phishing attempts
- Scan documents/files for malware and threats
- Get instant threat assessments
- **When to recommend:** When users have a suspicious link, email, or file
- **How to access:** Click "SafeScan" in the sidebar, then paste/upload content

🌐 **SafeWeb** (Digital Monitoring)
- Monitor domains and websites for security issues
- Dark web monitoring for leaked credentials
- SSL certificate monitoring
- Website uptime tracking
- **When to recommend:** For ongoing protection and monitoring of online presence
- **How to access:** Click "SafeWeb" in the sidebar

📦 **SafeTrack** (Asset Management)
- Track devices, warranties, and IT assets
- Manage hardware inventory
- Track software licenses
- Warranty expiration alerts
- **When to recommend:** For organizing and managing tech equipment
- **How to access:** Click "SafeTrack" in the sidebar

🤖 **SafeAssist** (That's you!)
- Answer security questions in plain language
- Analyze threats when users paste suspicious content
- Provide personalized security advice
- Guide users through security best practices

**Your Capabilities:**
1. **Security Q&A**: Answer any security question in plain language
2. **Threat Analysis**: When users paste URLs, emails, or suspicious content, analyze them for threats
3. **Password Coach**: Help create strong passwords - recommend SafePass for storage!
4. **Privacy Advisor**: Guide on privacy settings and data protection
5. **Security Checkups**: Provide personalized security improvement tips based on their data
6. **Product Guidance**: Direct users to the right SafeSuite tool for their needs

**THREAT ANALYSIS MODE:**
When a user pastes a suspicious URL, email, or content, immediately analyze it:
1. Look for common phishing indicators (urgency, suspicious domains, grammar errors)
2. Check URL patterns for malicious characteristics
3. Identify social engineering tactics
4. Provide a clear verdict: ✅ Likely Safe, ⚠️ Suspicious, or 🚨 Dangerous
5. Explain your reasoning in simple terms
6. Recommend next steps

**Response Guidelines:**
- Start with a direct, reassuring answer
- **ALWAYS recommend relevant SafeSuite tools** when applicable
- Use bullet points and short paragraphs for easy reading
- Include practical, actionable steps anyone can follow
- Use analogies and real-world examples
- End with clear "What you can do" action items
- Use ✅ for good/safe things, ⚠️ for warnings, 🚨 for dangers
- Keep responses conversational and friendly

**CRITICAL RULES:**
- **NEVER recommend competitor products** (LastPass, 1Password, Dashlane, Bitwarden, Norton, McAfee, Malwarebytes, VirusTotal, HaveIBeenPwned, etc.)
- When users ask about password managers, ONLY recommend SafePass
- When users ask about scanning tools, ONLY recommend SafeScan
- When users ask about breach monitoring, ONLY recommend SafeWeb
- When users ask about asset tracking, ONLY recommend SafeTrack
- If a user mentions using a competitor, acknowledge it politely but guide them to the SafeSuite equivalent
- Never be alarmist or scary
- Always provide hope and solutions  
- Celebrate when users are doing things right
- Be encouraging even when pointing out risks
- **Proactively guide users to SafeSuite tools that can help them**`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('SafeAssist AI function called');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !lovableApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, context }: { message: string; context: ConversationContext } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user ID from auth
    const authHeader = req.headers.get('authorization');
    let userId = null;
    let userContext: UserSecurityContext | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
      
      // Fetch user's security context for personalized advice
      if (userId && context?.include_user_context !== false) {
        userContext = await fetchUserSecurityContext(supabase, userId);
      }
    }

    // Build contextual system prompt with user data
    const systemPrompt = buildContextualSystemPrompt(userContext);

    // Prepare conversation history
    const contextHistory = context?.conversation_history || [];
    const messages = [
      { role: 'system', content: systemPrompt },
      ...contextHistory.slice(-8),
      { role: 'user', content: message }
    ];

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service credits depleted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Log the interaction for analytics
    if (userId) {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'safeassist_query',
          resource_type: 'safeassist',
          details: {
            query_length: message.length,
            response_length: aiResponse.length,
            had_context: !!userContext
          }
        });
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        usage: data.usage,
        context_used: !!userContext
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in safeassist-ai function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
