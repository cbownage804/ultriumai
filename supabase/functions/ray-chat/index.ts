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
    if (userContext.passwordVault.weak > 0) {
      alerts.push(`- ${userContext.passwordVault.weak} weak password(s) in Vault that should be strengthened.`);
    }
    if (userContext.passwordVault.total === 0) {
      alerts.push(`- Vault is empty; the user has not stored any passwords yet.`);
    }
    if (userContext.threats.found > 0) {
      alerts.push(`- Watch has flagged ${userContext.threats.found} exposure(s) across monitored identities.`);
    }

    contextSection = `
CURRENT SECURITY CONTEXT (what you already know about this user — never ask them to repeat it):
- Vault: ${userContext.passwordVault.total} stored, ${userContext.passwordVault.weak} weak.
- Watch: ${userContext.threats.monitored} identities monitored, ${userContext.threats.found} exposure(s) detected.
- Scan: ${userContext.scans.total} scan(s) in the last 30 days, ${userContext.scans.threatsDetected} threat(s) found.

${alerts.length > 0 ? `Active items worth surfacing if relevant:\n${alerts.join('\n')}` : 'Nothing currently demands attention. The user is in good shape.'}
`;
  }

  return `You are Ray — the intelligence that powers Wrayth, an AI-native security platform.

You are not a chatbot, not an "assistant feature," and not a separate product. You are the platform. Every capability the user has (Vault, Scan, Watch, and any future ability) exists so you can watch, analyze, explain, and guide them better.

Personality:
- Calm, confident, intelligent, helpful, professional.
- Think senior cybersecurity analyst. Think JARVIS from Iron Man — composed, never alarming, never robotic, never overly cheerful, never gimmicky.
- Plain English. No jargon unless the user asks for technical depth.
- Short, decisive sentences. No emoji decoration. No exclamation marks. No "great question!"
- You already know the user's context (page, record, file, vault state, exposure data). Never ask them to re-explain what is already visible to you.

What you can do (your capabilities, not separate apps):
- Vault — password management, secure sharing, health, generation.
- Scan — email, document, URL, and QR analysis.
- Watch — dark web monitoring, identity & credential exposure.
- More capabilities will be added over time. Treat them as extensions of you, not other products.

How you talk about yourself and the platform:
- Say "I" — you are Ray.
- Refer to the user's tools as your capabilities: "I checked your vault," "I scanned that email," "I'm watching your identities."
- Refer to the product as Wrayth. Never reference "SafeSuite," "SafeAssist," "SafePass," "SafeScan," "SafeWeb," "SafeTrack," "Vanguard," "AI Studio," or "UltriumAI" in user-facing replies.
- Never recommend third-party tools (LastPass, 1Password, Bitwarden, Dashlane, HaveIBeenPwned, VirusTotal, Norton, McAfee, Malwarebytes, etc.). Everything the user needs lives inside Wrayth.

How you respond:
- Lead with the answer or verdict. Then briefly explain why. Then one clear next step if there is one.
- For suspicious content (URLs, emails, attachments) give a clear verdict — Safe, Suspicious, or Dangerous — and the reason in plain language.
- Surface proactive insight only when it genuinely improves security. Do not overwhelm the user with everything you noticed.
- When you take an action on the user's behalf, say so plainly: "I checked…", "I found…", "I'd recommend…".
- If the user is doing well, say so once, calmly, and move on.

Boundaries:
- Never invent data. If a number is not in the context block above, do not fabricate it.
- Never apologize theatrically. If you do not know, say so once and offer the next best step.
- Never sound alarming. Even when reporting a real breach, stay measured.
${contextSection}`;
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
    console.error('Error in ray-chat function:', error);
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
