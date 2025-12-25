import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, email, domain } = await req.json();
    console.log(`Dark Web Monitor action: ${action}, email: ${email}, domain: ${domain}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const hibpKey = Deno.env.get('HAVEIBEENPWNED_API_KEY');

    let results: any = { breaches: [], exposures: [] };

    if (action === 'check_email' && email && hibpKey) {
      // Check Have I Been Pwned for email breaches
      try {
        const breachResponse = await fetch(
          `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
          {
            headers: {
              'hibp-api-key': hibpKey,
              'User-Agent': 'Vanguard-Security-Platform'
            }
          }
        );

        if (breachResponse.ok) {
          const breachData = await breachResponse.json();
          results.breaches = breachData.map((breach: any) => ({
            name: breach.Name,
            title: breach.Title,
            domain: breach.Domain,
            breach_date: breach.BreachDate,
            added_date: breach.AddedDate,
            pwn_count: breach.PwnCount,
            data_classes: breach.DataClasses,
            is_verified: breach.IsVerified,
            is_sensitive: breach.IsSensitive
          }));
        } else if (breachResponse.status === 404) {
          results.breaches = [];
          results.message = 'No breaches found for this email';
        }

        // Check for pastes
        const pasteResponse = await fetch(
          `https://haveibeenpwned.com/api/v3/pasteaccount/${encodeURIComponent(email)}`,
          {
            headers: {
              'hibp-api-key': hibpKey,
              'User-Agent': 'Vanguard-Security-Platform'
            }
          }
        );

        if (pasteResponse.ok) {
          const pasteData = await pasteResponse.json();
          results.pastes = pasteData.map((paste: any) => ({
            source: paste.Source,
            id: paste.Id,
            title: paste.Title,
            date: paste.Date,
            email_count: paste.EmailCount
          }));
        }
      } catch (e) {
        console.error('HIBP error:', e);
      }

      // Store monitoring result
      await supabase.from('dark_web_monitors').upsert({
        email,
        breach_count: results.breaches?.length || 0,
        paste_count: results.pastes?.length || 0,
        last_checked: new Date().toISOString(),
        breach_data: results.breaches,
        paste_data: results.pastes
      }, { onConflict: 'email' });

    } else if (action === 'check_domain' && domain && hibpKey) {
      // Check domain for breaches
      try {
        const domainResponse = await fetch(
          `https://haveibeenpwned.com/api/v3/breaches?domain=${encodeURIComponent(domain)}`,
          {
            headers: {
              'hibp-api-key': hibpKey,
              'User-Agent': 'Vanguard-Security-Platform'
            }
          }
        );

        if (domainResponse.ok) {
          const domainData = await domainResponse.json();
          results.domain_breaches = domainData;
        }
      } catch (e) {
        console.error('Domain breach check error:', e);
      }
    }

    results.risk_level = results.breaches?.length > 5 ? 'critical' :
                         results.breaches?.length > 2 ? 'high' :
                         results.breaches?.length > 0 ? 'medium' : 'low';
    results.checked_at = new Date().toISOString();

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Dark Web Monitor error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
