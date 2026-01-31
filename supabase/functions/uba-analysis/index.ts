import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UBARequest {
  action: 'analyze' | 'get_risk_scores' | 'acknowledge_anomaly' | 'create_baseline';
  user_email?: string;
  anomaly_id?: string;
  days_back?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: UBARequest = await req.json();
    const { action, user_email, anomaly_id, days_back = 30 } = body;

    let result: Record<string, unknown> = {};

    switch (action) {
      case 'analyze': {
        // Get audit logs for analysis
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days_back);

        const { data: logs, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(1000);

        if (logsError) throw logsError;

        // Analyze patterns
        const userActivity: Record<string, {
          actions: string[];
          ips: Set<string>;
          timestamps: Date[];
          riskScore: number;
        }> = {};

        const anomalies: Array<{
          type: string;
          severity: string;
          user_id: string;
          description: string;
          evidence: Record<string, unknown>;
        }> = [];

        for (const log of logs || []) {
          const userId = log.user_id || 'unknown';
          
          if (!userActivity[userId]) {
            userActivity[userId] = {
              actions: [],
              ips: new Set(),
              timestamps: [],
              riskScore: 0,
            };
          }

          userActivity[userId].actions.push(log.action);
          if (log.ip_address) userActivity[userId].ips.add(String(log.ip_address));
          userActivity[userId].timestamps.push(new Date(log.created_at));

          // Calculate risk score
          let actionRisk = 0;
          if (log.action?.includes('delete')) actionRisk += 30;
          if (log.action?.includes('admin')) actionRisk += 25;
          if (log.action?.includes('export')) actionRisk += 20;
          if (log.action?.includes('failed')) actionRisk += 40;
          if (log.action?.includes('login') && log.action?.includes('failed')) actionRisk += 50;

          userActivity[userId].riskScore = Math.max(
            userActivity[userId].riskScore,
            Math.min(actionRisk, 100)
          );

          // Detect anomalies
          if (log.action?.includes('failed_login')) {
            const recentFailures = (logs || []).filter(l => 
              l.user_id === userId && 
              l.action?.includes('failed_login') &&
              new Date(l.created_at) > new Date(Date.now() - 3600000) // Last hour
            );
            
            if (recentFailures.length >= 5) {
              anomalies.push({
                type: 'brute_force_attempt',
                severity: 'high',
                user_id: userId,
                description: `${recentFailures.length} failed login attempts in the last hour`,
                evidence: { failed_attempts: recentFailures.length, ip: log.ip_address },
              });
            }
          }

          // Impossible travel detection
          if (userActivity[userId].ips.size > 3) {
            anomalies.push({
              type: 'impossible_travel',
              severity: 'medium',
              user_id: userId,
              description: `Activity from ${userActivity[userId].ips.size} different IP addresses`,
              evidence: { ips: Array.from(userActivity[userId].ips) },
            });
          }

          // Privilege escalation detection
          if (log.action?.includes('role_change') || log.action?.includes('grant_permission')) {
            anomalies.push({
              type: 'privilege_escalation',
              severity: 'high',
              user_id: userId,
              description: `Privilege modification detected: ${log.action}`,
              evidence: { action: log.action, details: log.details },
            });
          }
        }

        // Store detected anomalies
        if (anomalies.length > 0) {
          // Deduplicate by type + user
          const uniqueAnomalies = anomalies.reduce((acc, curr) => {
            const key = `${curr.type}-${curr.user_id}`;
            if (!acc[key]) acc[key] = curr;
            return acc;
          }, {} as Record<string, typeof anomalies[0]>);

          await supabase.from('uba_anomalies').insert(
            Object.values(uniqueAnomalies).map(a => ({
              user_id: user.id,
              target_user_id: a.user_id,
              anomaly_type: a.type,
              severity: a.severity,
              description: a.description,
              evidence: a.evidence,
              is_acknowledged: false,
            }))
          );
        }

        // Calculate summary
        const highRiskUsers = Object.entries(userActivity)
          .filter(([_, data]) => data.riskScore >= 70)
          .map(([userId, data]) => ({ userId, riskScore: data.riskScore }));

        result = {
          analyzed_logs: logs?.length || 0,
          unique_users: Object.keys(userActivity).length,
          anomalies_detected: anomalies.length,
          high_risk_users: highRiskUsers.length,
          summary: {
            high_risk_users: highRiskUsers,
            anomaly_types: [...new Set(anomalies.map(a => a.type))],
          },
        };
        break;
      }

      case 'get_risk_scores': {
        // Get stored risk scores
        const { data: scores } = await supabase
          .from('uba_risk_scores')
          .select('*')
          .order('risk_score', { ascending: false })
          .limit(50);

        const { data: anomalies } = await supabase
          .from('uba_anomalies')
          .select('*')
          .eq('is_acknowledged', false)
          .order('created_at', { ascending: false })
          .limit(100);

        result = { scores: scores || [], anomalies: anomalies || [] };
        break;
      }

      case 'acknowledge_anomaly': {
        if (!anomaly_id) {
          return new Response(JSON.stringify({ error: 'Anomaly ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: updateError } = await supabase
          .from('uba_anomalies')
          .update({
            is_acknowledged: true,
            acknowledged_by: user.id,
            acknowledged_at: new Date().toISOString(),
          })
          .eq('id', anomaly_id);

        if (updateError) throw updateError;
        result = { message: 'Anomaly acknowledged' };
        break;
      }

      case 'create_baseline': {
        // Create behavioral baseline for user
        if (!user_email) {
          return new Response(JSON.stringify({ error: 'User email required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get user's typical activity patterns
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', user_email)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .limit(500);

        const hours = (logs || []).map(l => new Date(l.created_at).getHours());
        const ips = [...new Set((logs || []).map(l => l.ip_address).filter(Boolean))];
        const actions = [...new Set((logs || []).map(l => l.action).filter(Boolean))];

        const baseline = {
          typical_hours: hours.length > 0 ? {
            min: Math.min(...hours),
            max: Math.max(...hours),
          } : { min: 8, max: 18 },
          known_ips: ips,
          common_actions: actions,
          created_at: new Date().toISOString(),
        };

        await supabase.from('uba_baselines').upsert({
          user_id: user.id,
          target_user: user_email,
          baseline_data: baseline,
        });

        result = { baseline };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in uba-analysis:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
