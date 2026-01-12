import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BreachCheckResult {
  entry_id: string;
  website: string;
  username: string;
  is_breached: boolean;
  breach_sources: string[];
  exposed_data_types: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  last_checked: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, user_id, password_hashes, entry_ids } = await req.json();
    console.log(`[SafePass Breach Check] action: ${action}, user_id: ${user_id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const dehashedKey = Deno.env.get('DEHASHED_API_KEY');
    const dehashedEmail = Deno.env.get('DEHASHED_EMAIL');

    // Action: Check specific passwords against breach databases
    if (action === 'check_passwords' && password_hashes && entry_ids) {
      console.log(`[SafePass Breach Check] Checking ${password_hashes.length} password hashes`);
      
      const results: BreachCheckResult[] = [];
      
      if (!dehashedKey) {
        console.log('[SafePass Breach Check] No Dehashed API key configured');
        return new Response(JSON.stringify({
          error: 'Dehashed API not configured',
          results: [],
          checked_at: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check each password hash against Dehashed
      for (let i = 0; i < password_hashes.length; i++) {
        const hash = password_hashes[i];
        const entryId = entry_ids[i];
        
        try {
          // Query Dehashed for this password hash
          const response = await fetch('https://api.dehashed.com/v2/search', {
            method: 'POST',
            headers: {
              'Dehashed-Api-Key': dehashedKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `hashed_password:"${hash}"`,
              size: 10,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const isBreached = data.total > 0;
            
            if (isBreached) {
              const sources = new Set<string>();
              const dataTypes = new Set<string>();
              
              (data.entries || []).forEach((entry: any) => {
                if (entry.database_name) sources.add(entry.database_name);
                if (entry.email) dataTypes.add('email');
                if (entry.username) dataTypes.add('username');
                if (entry.password) dataTypes.add('password');
                if (entry.phone) dataTypes.add('phone');
                if (entry.address) dataTypes.add('address');
              });

              results.push({
                entry_id: entryId,
                website: '',
                username: '',
                is_breached: true,
                breach_sources: Array.from(sources),
                exposed_data_types: Array.from(dataTypes),
                severity: dataTypes.has('password') ? 'critical' : 'high',
                last_checked: new Date().toISOString(),
              });
            }
          }

          // Rate limit protection
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.error(`[SafePass Breach Check] Error checking hash: ${e}`);
        }
      }

      return new Response(JSON.stringify({
        results,
        total_checked: password_hashes.length,
        breached_count: results.length,
        checked_at: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: Daily automated scan for a user
    if (action === 'daily_scan' && user_id) {
      console.log(`[SafePass Breach Check] Running daily scan for user: ${user_id}`);
      
      // Fetch all password entries for this user
      const { data: entries, error: fetchError } = await supabase
        .from('safepass_entries')
        .select('id, website, username, password_hash, email')
        .eq('user_id', user_id);

      if (fetchError) {
        console.error('[SafePass Breach Check] Error fetching entries:', fetchError);
        throw fetchError;
      }

      if (!entries || entries.length === 0) {
        return new Response(JSON.stringify({
          message: 'No password entries to check',
          results: [],
          checked_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[SafePass Breach Check] Found ${entries.length} entries to check`);
      
      const breachResults: BreachCheckResult[] = [];
      
      if (dehashedKey) {
        for (const entry of entries) {
          try {
            // Check by email if available
            if (entry.email) {
              const response = await fetch('https://api.dehashed.com/v2/search', {
                method: 'POST',
                headers: {
                  'Dehashed-Api-Key': dehashedKey,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  query: `email:"${entry.email}"`,
                  size: 50,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                
                if (data.total > 0) {
                  const sources = new Set<string>();
                  const dataTypes = new Set<string>();
                  let hasPasswordLeak = false;
                  
                  (data.entries || []).forEach((e: any) => {
                    if (e.database_name) sources.add(e.database_name);
                    if (e.email) dataTypes.add('email');
                    if (e.username) dataTypes.add('username');
                    if (e.password || e.hashed_password) {
                      dataTypes.add('password');
                      hasPasswordLeak = true;
                    }
                    if (e.phone) dataTypes.add('phone');
                  });

                  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
                  if (hasPasswordLeak) {
                    severity = 'critical';
                  } else if (sources.size > 3) {
                    severity = 'high';
                  }

                  breachResults.push({
                    entry_id: entry.id,
                    website: entry.website,
                    username: entry.username || entry.email,
                    is_breached: true,
                    breach_sources: Array.from(sources),
                    exposed_data_types: Array.from(dataTypes),
                    severity,
                    last_checked: new Date().toISOString(),
                  });
                }
              }

              // Rate limit protection
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (e) {
            console.error(`[SafePass Breach Check] Error checking entry ${entry.id}:`, e);
          }
        }
      }

      // Store breach monitoring results
      for (const result of breachResults) {
        await supabase.from('safepass_security_monitoring').upsert({
          user_id,
          entry_id: result.entry_id,
          threat_type: 'breach',
          threat_details: {
            sources: result.breach_sources,
            exposed_data: result.exposed_data_types,
          },
          severity: result.severity,
          status: 'active',
          detected_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,entry_id,threat_type',
        });
      }

      // Update last scan timestamp
      await supabase.from('safepass_user_settings').upsert({
        user_id,
        last_breach_scan: new Date().toISOString(),
        breach_monitoring_enabled: true,
      }, {
        onConflict: 'user_id',
      });

      console.log(`[SafePass Breach Check] Scan complete. Found ${breachResults.length} breached entries.`);

      return new Response(JSON.stringify({
        message: 'Daily scan complete',
        total_entries: entries.length,
        breached_entries: breachResults.length,
        results: breachResults,
        checked_at: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Action: Get breach status for all user entries
    if (action === 'get_breach_status' && user_id) {
      const { data: monitoring, error } = await supabase
        .from('safepass_security_monitoring')
        .select('*')
        .eq('user_id', user_id)
        .eq('threat_type', 'breach')
        .eq('status', 'active');

      if (error) throw error;

      return new Response(JSON.stringify({
        breached_entries: monitoring || [],
        total_breaches: monitoring?.length || 0,
        checked_at: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SafePass Breach Check] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
