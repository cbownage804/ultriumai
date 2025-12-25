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
    const dehashedKey = Deno.env.get('DEHASHED_API_KEY');
    const dehashedEmail = Deno.env.get('DEHASHED_EMAIL');

    let results: any = { breaches: [], pastes: [], exposures: [], leakedData: [] };

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

      // Check HIBP for breach metadata
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
        results.message = 'HIBP API key not configured. For real breach detection, add your Have I Been Pwned API key.';
        results.simulated = true;
      }

      // Check Dehashed for actual leaked data values (Dehashed API v2)
      if (dehashedKey) {
        console.log('[Dark Web Monitor] Checking Dehashed v2 for leaked credentials...');
        
        try {
          results.dehashedChecked = true;
          results.dehashedApiVersion = 'v2';
          results.dehashedEndpoint = 'https://api.dehashed.com/v2/search';

          const q = `email:"${email}"`;
          results.dehashedQueriesTried = [q];
          results.dehashedQueryUsed = q;

          const { status, data, rawText } = await dehashedV2Search({
            apiKey: dehashedKey,
            query: q,
            size: 1000,
          });

          console.log(`[Dark Web Monitor] Dehashed v2 response status: ${status}`);
          results.dehashedStatus = status;

          if (status === 200 && data) {
            results.dehashedTotal = data.total || 0;
            results.dehashedBalance = data.balance ?? null;

            if (Array.isArray(data.entries) && data.entries.length > 0) {
              results.leakedData = data.entries.slice(0, 50).map(mapDehashedEntry);
              results.hasActualLeakedData = true;
            } else {
              results.dehashedMessage = 'No matches found';
            }
          } else {
            results.dehashedError = getDehashedErrorMessage(data, rawText, status);
            results.dehashedErrorBody = safeTruncate(rawText, 400);
          }
        } catch (e) {
          console.error('[Dark Web Monitor] Dehashed API error:', e);
          results.dehashedChecked = true;
          results.dehashedError = e?.message || 'Dehashed request failed';
        }
      } else {
        console.log('[Dark Web Monitor] Dehashed credentials not configured');
      }

      // Calculate risk level
      const breachCount = results.breaches?.length || 0;
      const pasteCount = results.pastes?.length || 0;
      const leakedDataCount = results.leakedData?.length || 0;
      
      // Having actual leaked credentials increases risk
      const hasPasswords = results.leakedData?.some((d: any) => d.password || d.hashed_password);
      const hasPhones = results.leakedData?.some((d: any) => d.phone);
      const hasAddresses = results.leakedData?.some((d: any) => d.address);
      
      if (hasPasswords && (hasPhones || hasAddresses)) {
        results.risk_level = 'critical';
      } else if (breachCount > 5 || pasteCount > 3 || leakedDataCount > 10) {
        results.risk_level = 'critical';
      } else if (breachCount > 2 || pasteCount > 1 || leakedDataCount > 5 || hasPasswords) {
        results.risk_level = 'high';
      } else if (breachCount > 0 || pasteCount > 0 || leakedDataCount > 0) {
        results.risk_level = 'medium';
      } else {
        results.risk_level = 'low';
      }

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

    // Domain check
    if (action === 'check_domain' && domain) {
      console.log('[Dark Web Monitor] Checking domain breaches...');
      
      // Check HIBP for breaches where this domain was the source
      if (hibpKey) {
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

          console.log(`[Dark Web Monitor] HIBP Domain breach response status: ${domainResponse.status}`);

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
            console.log(`[Dark Web Monitor] HIBP found ${results.breaches.length} domain breaches`);
          }
        } catch (e) {
          console.error('[Dark Web Monitor] HIBP Domain breach check error:', e);
        }
      }

      // Check Dehashed for leaked credentials from this domain (Dehashed API v2)
      if (dehashedKey) {
        console.log('[Dark Web Monitor] Checking Dehashed v2 for domain credentials...');

        try {
          results.dehashedChecked = true;
          results.dehashedApiVersion = 'v2';
          results.dehashedEndpoint = 'https://api.dehashed.com/v2/search';

          // "Domain Scan" in Dehashed aligns most closely to querying the domain field.
          // We also try the common "@domain" email search used by third-party tools.
          const queriesToTry = [`domain:${domain}`, `email:@${domain}`, `@${domain}`];
          results.dehashedQueriesTried = queriesToTry;

          for (const q of queriesToTry) {
            console.log(`[Dark Web Monitor] Dehashed v2 domain query: ${q}`);

            const { status, data, rawText } = await dehashedV2Search({
              apiKey: dehashedKey,
              query: q,
              size: 1000,
            });

            console.log(`[Dark Web Monitor] Dehashed v2 domain response status: ${status}`);

            results.dehashedStatus = status;
            results.dehashedQueryUsed = q;

            if (status === 200 && data) {
              results.dehashedTotal = data.total || 0;
              results.dehashedBalance = data.balance ?? null;

              if (Array.isArray(data.entries) && data.entries.length > 0) {
                results.leakedData = data.entries.slice(0, 50).map(mapDehashedEntry);
                results.hasActualLeakedData = true;
                break;
              }

              // No matches for this query; try the next one.
              results.dehashedMessage = 'No matches found';
              continue;
            }

            results.dehashedError = getDehashedErrorMessage(data, rawText, status);
            results.dehashedErrorBody = safeTruncate(rawText, 400);
            break;
          }
        } catch (e) {
          console.error('[Dark Web Monitor] Dehashed domain check error:', e);
          results.dehashedError = e?.message || 'Dehashed domain request failed';
        }
      }

      // Calculate risk level based on both sources
      const breachCount = results.breaches?.length || 0;
      const leakedDataCount = results.leakedData?.length || 0;
      const hasPasswords = results.leakedData?.some((d: any) => d.password || d.hashed_password);
      
      if (hasPasswords && leakedDataCount > 10) {
        results.risk_level = 'critical';
      } else if (breachCount > 3 || leakedDataCount > 20) {
        results.risk_level = 'critical';
      } else if (breachCount > 1 || leakedDataCount > 5 || hasPasswords) {
        results.risk_level = 'high';
      } else if (breachCount > 0 || leakedDataCount > 0) {
        results.risk_level = 'medium';
      } else {
        results.risk_level = 'low';
      }
    }

    results.checked_at = new Date().toISOString();

    console.log(`[Dark Web Monitor] Returning results with risk_level: ${results.risk_level}, breaches: ${results.breaches?.length || 0}, leakedData: ${results.leakedData?.length || 0}`);

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

// Mask passwords for security - show first 2 and last 2 chars
function maskPassword(password: string): string {
  if (!password || password.length <= 4) {
    return '****';
  }
  return `${password.substring(0, 2)}${'*'.repeat(Math.min(password.length - 4, 8))}${password.substring(password.length - 2)}`;
}

function safeTruncate(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function pickDehashedValue(entry: any, key: string): string | null {
  const v = entry?.[key];
  if (Array.isArray(v)) return v[0] ?? null;
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

function mapDehashedEntry(entry: any) {
  const password = pickDehashedValue(entry, 'password');
  const hashed = pickDehashedValue(entry, 'hashed_password');

  return {
    database_name: pickDehashedValue(entry, 'database_name') || 'Unknown',
    email: pickDehashedValue(entry, 'email'),
    username: pickDehashedValue(entry, 'username'),
    password: password ? maskPassword(password) : null,
    hashed_password: hashed ? `${hashed.substring(0, 20)}...` : null,
    name: pickDehashedValue(entry, 'name'),
    phone: pickDehashedValue(entry, 'phone'),
    address: pickDehashedValue(entry, 'address'),
    ip_address: pickDehashedValue(entry, 'ip_address'),
    vin: pickDehashedValue(entry, 'vin'),
    obtained_from: pickDehashedValue(entry, 'obtained_from'),
  };
}

function getDehashedErrorMessage(data: any, rawText: string, status: number): string {
  if (data?.error) return String(data.error);
  if (data?.message) return String(data.message);
  if (data?.details) return String(data.details);
  if (rawText) return `Dehashed request failed (${status})`;
  return `Dehashed request failed (${status})`;
}

async function dehashedV2Search(opts: { apiKey: string; query: string; size: number }) {
  const res = await fetch('https://api.dehashed.com/v2/search', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Dehashed-Api-Key': opts.apiKey,
    },
    body: JSON.stringify({
      query: opts.query,
      size: opts.size,
      page: 1,
      de_dupe: true,
      wildcard: false,
      regex: false,
    }),
  });

  const rawText = await res.text();
  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  return { status: res.status, data, rawText };
}
