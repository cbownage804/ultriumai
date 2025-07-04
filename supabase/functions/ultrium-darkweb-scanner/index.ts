import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DarkWebScanResult {
  query: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  breaches_found: string[];
  compromised_data: {
    emails: string[];
    passwords: number;
    credit_cards: number;
    personal_info: string[];
  };
  scan_details: {
    sources_checked: number;
    total_records: number;
    latest_breach_date: string;
    scan_date: string;
  };
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, user_id, gpt_id } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check user subscription
    if (user_id) {
      const { data: subscription } = await supabase
        .from('subscribers')
        .select('subscription_tier')
        .eq('user_id', user_id)
        .single();

      const { data: appSubscription } = await supabase
        .from('security_app_subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('app_id', 'darkweb')
        .eq('status', 'active')
        .single();

      if (!subscription || 
          (subscription.subscription_tier !== 'enterprise' && 
           subscription.subscription_tier !== 'premium' && 
           !appSubscription)) {
        throw new Error('DarkWeb scanning requires Premium, Enterprise subscription or DarkWeb app subscription');
      }
    }

    let breaches: string[] = [];
    let riskLevel: DarkWebScanResult['risk_level'] = 'safe';
    let compromisedEmails: string[] = [];
    let passwordCount = 0;
    let creditCardCount = 0;
    let personalInfo: string[] = [];
    const recommendations: string[] = [];

    // Simulate dark web monitoring (in production, integrate with services like HaveIBeenPwned, etc.)
    const commonBreaches = [
      'Adobe (2013)', 'Yahoo (2014)', 'Equifax (2017)', 'Facebook (2019)',
      'LinkedIn (2021)', 'Marriott (2018)', 'Capital One (2019)', 'Target (2013)'
    ];

    const suspiciousPatterns = [
      /@gmail\.com$/i, /@yahoo\.com$/i, /@hotmail\.com$/i,
      /admin/i, /password/i, /123/i
    ];

    // Check if query looks like an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(query)) {
      // Simulate breach checking
      const randomBreachCount = Math.floor(Math.random() * 3);
      if (randomBreachCount > 0) {
        breaches = commonBreaches.slice(0, randomBreachCount);
        compromisedEmails = [query];
        passwordCount = randomBreachCount;
        riskLevel = randomBreachCount > 1 ? 'high' : 'medium';
      }
      
      // Check for suspicious patterns
      if (suspiciousPatterns.some(pattern => pattern.test(query))) {
        personalInfo.push('Email pattern indicates common vulnerability');
        if (riskLevel === 'safe') riskLevel = 'low';
      }
    }

    // Check if query looks like a domain
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (domainRegex.test(query)) {
      // Simulate domain breach checking
      const randomBreachCount = Math.floor(Math.random() * 2);
      if (randomBreachCount > 0) {
        breaches = [`${query} breach (simulated)`];
        personalInfo.push('Domain found in breach databases');
        riskLevel = 'medium';
      }
    }

    // Generate recommendations based on findings
    if (breaches.length === 0) {
      recommendations.push('No breaches found - continue monitoring');
      recommendations.push('Enable breach notifications for ongoing protection');
    } else {
      recommendations.push('Change passwords for all accounts associated with breached services');
      recommendations.push('Enable two-factor authentication where possible');
      recommendations.push('Monitor credit reports for unauthorized activity');
      if (passwordCount > 1) {
        recommendations.push('Consider using a password manager with unique passwords');
      }
    }

    const result: DarkWebScanResult = {
      query: query,
      safe: breaches.length === 0,
      risk_level: riskLevel,
      breaches_found: breaches,
      compromised_data: {
        emails: compromisedEmails,
        passwords: passwordCount,
        credit_cards: creditCardCount,
        personal_info: personalInfo
      },
      scan_details: {
        sources_checked: 847, // Simulated number of dark web sources
        total_records: breaches.length > 0 ? Math.floor(Math.random() * 1000000) + 50000 : 0,
        latest_breach_date: breaches.length > 0 ? '2024-01-15' : '',
        scan_date: new Date().toISOString()
      },
      recommendations: recommendations
    };

    // Log the scan activity
    if (user_id) {
      await supabase.from('gpt_analytics').insert({
        gpt_id: gpt_id || null,
        user_id: user_id,
        interaction_type: 'security_scan',
        metadata: {
          scan_type: 'darkweb',
          query: query,
          risk_level: riskLevel,
          breaches_count: breaches.length
        }
      });

      // Update usage count
      const { data: appSubscription } = await supabase
        .from('security_app_subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('app_id', 'darkweb')
        .eq('status', 'active')
        .single();

      if (appSubscription) {
        await supabase
          .from('security_app_subscriptions')
          .update({ usage_current: (appSubscription.usage_current || 0) + 1 })
          .eq('id', appSubscription.id);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('DarkWeb scanner error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      safe: false,
      risk_level: 'critical',
      breaches_found: ['Scan failed'],
      recommendations: ['Unable to complete scan - please try again later']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});