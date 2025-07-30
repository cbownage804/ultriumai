import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityScanResult {
  password_checks: {
    weak_passwords: number;
    reused_passwords: number;
    old_passwords: number;
    breached_passwords: number;
  };
  threats_detected: Array<{
    type: string;
    severity: string;
    entry_id: string;
    details: any;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Starting security scan for user:', user_id);

    // Get all user's password entries
    const { data: entries, error: entriesError } = await supabase
      .from('safepass_entries')
      .select('*')
      .eq('user_id', user_id)
      .eq('entry_type', 'password');

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      throw entriesError;
    }

    const scanResult: SecurityScanResult = {
      password_checks: {
        weak_passwords: 0,
        reused_passwords: 0,
        old_passwords: 0,
        breached_passwords: 0
      },
      threats_detected: []
    };

    const passwordHashes = new Map<string, string[]>();
    const now = new Date();

    // Analyze each entry
    for (const entry of entries || []) {
      let isWeak = false;
      let isOld = false;
      let isBreached = false;

      // Check password strength
      if (entry.password_strength_score < 70) {
        scanResult.password_checks.weak_passwords++;
        isWeak = true;
        
        scanResult.threats_detected.push({
          type: 'weak_password',
          severity: 'medium',
          entry_id: entry.id,
          details: {
            title: entry.title,
            strength_score: entry.password_strength_score,
            recommendation: 'Consider using a stronger password with more complexity'
          }
        });
      }

      // Check password age (>90 days)
      const entryAge = now.getTime() - new Date(entry.created_at).getTime();
      const daysSinceCreated = entryAge / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreated > 90) {
        scanResult.password_checks.old_passwords++;
        isOld = true;
        
        scanResult.threats_detected.push({
          type: 'old_password',
          severity: 'low',
          entry_id: entry.id,
          details: {
            title: entry.title,
            days_old: Math.floor(daysSinceCreated),
            recommendation: 'Consider updating this password regularly for better security'
          }
        });
      }

      // Check for compromised passwords
      if (entry.is_compromised) {
        scanResult.password_checks.breached_passwords++;
        isBreached = true;
        
        scanResult.threats_detected.push({
          type: 'breached_password',
          severity: 'critical',
          entry_id: entry.id,
          details: {
            title: entry.title,
            compromise_details: entry.compromise_details,
            recommendation: 'Change this password immediately as it has been found in data breaches'
          }
        });
      }

      // Track password reuse
      const passwordHash = entry.encrypted_data; // In real app, this would be a hash
      if (!passwordHashes.has(passwordHash)) {
        passwordHashes.set(passwordHash, []);
      }
      passwordHashes.get(passwordHash)!.push(entry.id);

      // Create/update security monitoring entry
      const alertType = isBreached ? 'breach_check' : 
                        isWeak ? 'weak_password' : 
                        isOld ? 'old_password' : null;
      
      if (alertType) {
        const threatLevel = isBreached ? 'critical' : 
                           isWeak ? 'medium' : 'low';

        await supabase
          .from('safepass_security_monitoring')
          .upsert({
            user_id,
            entry_id: entry.id,
            monitoring_type: alertType,
            threat_level: threatLevel,
            status: 'active',
            details: {
              scan_timestamp: now.toISOString(),
              findings: {
                is_weak: isWeak,
                is_old: isOld,
                is_breached: isBreached,
                strength_score: entry.password_strength_score,
                days_old: Math.floor(daysSinceCreated)
              }
            },
            detected_at: now.toISOString()
          }, {
            onConflict: 'user_id,entry_id,monitoring_type'
          });
      }
    }

    // Check for reused passwords
    for (const [hash, entryIds] of passwordHashes.entries()) {
      if (entryIds.length > 1) {
        scanResult.password_checks.reused_passwords += entryIds.length;
        
        for (const entryId of entryIds) {
          scanResult.threats_detected.push({
            type: 'reused_password',
            severity: 'medium',
            entry_id: entryId,
            details: {
              reused_count: entryIds.length,
              recommendation: 'Use unique passwords for each account to improve security'
            }
          });

          // Create reused password alert
          await supabase
            .from('safepass_security_monitoring')
            .upsert({
              user_id,
              entry_id: entryId,
              monitoring_type: 'reused_password',
              threat_level: 'medium',
              status: 'active',
              details: {
                scan_timestamp: now.toISOString(),
                reused_with: entryIds.filter(id => id !== entryId),
                reused_count: entryIds.length
              },
              detected_at: now.toISOString()
            }, {
              onConflict: 'user_id,entry_id,monitoring_type'
            });
        }
      }
    }

    console.log('Security scan completed:', scanResult);

    return new Response(
      JSON.stringify({
        success: true,
        scan_result: scanResult,
        scanned_entries: entries?.length || 0,
        scan_timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Security scan error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during security scan',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});