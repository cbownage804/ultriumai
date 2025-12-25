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
    const { action, email, phone, domain, user_id } = await req.json();
    console.log(`[Dark Web Monitor] action: ${action}, email: ${email}, phone: ${phone}, domain: ${domain}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const hibpKey = Deno.env.get('HAVEIBEENPWNED_API_KEY');

    let results: any = { breaches: [], pastes: [], exposures: [] };

    // Validate inputs
    if (action === 'check_email' && email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid email format',
          breaches: [],
          risk_level: 'unknown',
          checked_at: new Date().toISOString()
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (hibpKey) {
        console.log('[Dark Web Monitor] Checking HIBP for email breaches...');
        
        try {
          // Check Have I Been Pwned for email breaches
          const breachResponse = await fetch(
            `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
            {
              headers: {
                'hibp-api-key': hibpKey,
                'User-Agent': 'Vanguard-Security-Platform'
              }
            }
          );

          console.log(`[Dark Web Monitor] HIBP breach response status: ${breachResponse.status}`);

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
            console.log(`[Dark Web Monitor] Found ${results.breaches.length} breaches`);
          } else if (breachResponse.status === 404) {
            results.breaches = [];
            results.message = 'Good news! No breaches found for this email.';
            console.log('[Dark Web Monitor] No breaches found (404)');
          } else if (breachResponse.status === 429) {
            console.log('[Dark Web Monitor] Rate limited by HIBP');
            results.error = 'Rate limited - please try again in a few seconds';
          }

          // Add delay to respect HIBP rate limits (1.5 seconds between requests)
          await new Promise(resolve => setTimeout(resolve, 1600));

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

          console.log(`[Dark Web Monitor] HIBP paste response status: ${pasteResponse.status}`);

          if (pasteResponse.ok) {
            const pasteData = await pasteResponse.json();
            results.pastes = pasteData.map((paste: any) => ({
              source: paste.Source,
              id: paste.Id,
              title: paste.Title,
              date: paste.Date,
              email_count: paste.EmailCount
            }));
            console.log(`[Dark Web Monitor] Found ${results.pastes.length} pastes`);
          }
        } catch (e) {
          console.error('[Dark Web Monitor] HIBP API error:', e);
          results.api_error = e.message;
        }
      } else {
        console.log('[Dark Web Monitor] No HIBP API key configured - using simulated check');
        // Simulate a check for demo purposes
        results.message = 'HIBP API key not configured. For real breach detection, add your Have I Been Pwned API key.';
        results.simulated = true;
      }

      // Calculate risk level
      const breachCount = results.breaches?.length || 0;
      const pasteCount = results.pastes?.length || 0;
      
      results.risk_level = breachCount > 5 || pasteCount > 3 ? 'critical' :
                           breachCount > 2 || pasteCount > 1 ? 'high' :
                           breachCount > 0 || pasteCount > 0 ? 'medium' : 'low';

      // Store monitoring result in database
      if (user_id) {
        console.log('[Dark Web Monitor] Saving to database for user:', user_id);
        
        const { error: upsertError } = await supabase.from('dark_web_monitors').upsert({
          user_id,
          email,
          monitor_type: 'email',
          breach_count: breachCount,
          paste_count: pasteCount,
          latest_breach: results.breaches?.[0]?.name || null,
          breach_data: results.breaches,
          paste_data: results.pastes,
          last_checked: new Date().toISOString(),
          is_active: true,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,email',
          ignoreDuplicates: false 
        });

        if (upsertError) {
          console.error('[Dark Web Monitor] Database upsert error:', upsertError);
          // Try insert instead
          const { error: insertError } = await supabase.from('dark_web_monitors').insert({
            user_id,
            email,
            monitor_type: 'email',
            breach_count: breachCount,
            paste_count: pasteCount,
            latest_breach: results.breaches?.[0]?.name || null,
            breach_data: results.breaches,
            paste_data: results.pastes,
            last_checked: new Date().toISOString(),
            is_active: true
          });
          
          if (insertError) {
            console.error('[Dark Web Monitor] Database insert error:', insertError);
          } else {
            console.log('[Dark Web Monitor] Inserted new monitor record');
          }
        } else {
          console.log('[Dark Web Monitor] Upserted monitor record successfully');
        }
      }
    }

    // Phone number check removed - HIBP email scans already reveal phone data in data_classes
    }

    // Domain check
    if (action === 'check_domain' && domain && hibpKey) {
      console.log('[Dark Web Monitor] Checking domain breaches...');
      
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

        console.log(`[Dark Web Monitor] Domain breach response status: ${domainResponse.status}`);

        if (domainResponse.ok) {
          const domainData = await domainResponse.json();
          results.breaches = domainData.map((breach: any) => ({
            name: breach.Name,
            title: breach.Title,
            domain: breach.Domain,
            breach_date: breach.BreachDate,
            pwn_count: breach.PwnCount,
            data_classes: breach.DataClasses,
            is_verified: breach.IsVerified
          }));
        }
      } catch (e) {
        console.error('[Dark Web Monitor] Domain breach check error:', e);
      }

      results.risk_level = results.breaches?.length > 3 ? 'critical' :
                           results.breaches?.length > 1 ? 'high' :
                           results.breaches?.length > 0 ? 'medium' : 'low';
    }

    results.checked_at = new Date().toISOString();

    console.log(`[Dark Web Monitor] Returning results with risk_level: ${results.risk_level}, breaches: ${results.breaches?.length || 0}`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Dark Web Monitor] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
