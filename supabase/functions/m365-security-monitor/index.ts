import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[M365-SECURITY-MONITOR] ${step}${detailsStr}`);
};

interface GraphSecurityEvent {
  id: string;
  riskEventType?: string;
  riskLevel?: string;
  riskState?: string;
  userDisplayName?: string;
  userPrincipalName?: string;
  ipAddress?: string;
  location?: { city?: string; state?: string; countryOrRegion?: string };
  detectedDateTime?: string;
  additionalInfo?: string;
}

async function getAccessToken(tenantId: string, clientId: string, clientSecret: string): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token fetch failed: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchRiskySignIns(accessToken: string): Promise<GraphSecurityEvent[]> {
  const response = await fetch('https://graph.microsoft.com/v1.0/identityProtection/riskyUsers', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    logStep('Failed to fetch risky sign-ins', { status: response.status });
    return [];
  }

  const data = await response.json();
  return data.value || [];
}

async function fetchRiskDetections(accessToken: string): Promise<GraphSecurityEvent[]> {
  const response = await fetch('https://graph.microsoft.com/v1.0/identityProtection/riskDetections?$top=50&$orderby=detectedDateTime desc', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    logStep('Failed to fetch risk detections', { status: response.status });
    return [];
  }

  const data = await response.json();
  return data.value || [];
}

async function fetchSignInLogs(accessToken: string): Promise<any[]> {
  const response = await fetch('https://graph.microsoft.com/v1.0/auditLogs/signIns?$top=50&$orderby=createdDateTime desc&$filter=riskState ne \'none\'', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    logStep('Failed to fetch sign-in logs', { status: response.status });
    return [];
  }

  const data = await response.json();
  return data.value || [];
}

async function fetchMailboxRules(accessToken: string, userPrincipalName: string): Promise<any[]> {
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${userPrincipalName}/mailFolders/inbox/messageRules`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.value || [];
}

function calculateRiskScore(event: GraphSecurityEvent): number {
  let score = 50;
  
  if (event.riskLevel === 'high') score += 35;
  else if (event.riskLevel === 'medium') score += 20;
  else if (event.riskLevel === 'low') score += 5;

  // Known suspicious patterns
  const suspiciousCountries = ['russia', 'china', 'north korea', 'iran', 'nigeria'];
  if (event.location?.countryOrRegion) {
    if (suspiciousCountries.includes(event.location.countryOrRegion.toLowerCase())) {
      score += 15;
    }
  }

  // Risk event types that increase score
  const highRiskTypes = ['impossibleTravel', 'anonymizedIPAddress', 'maliciousIPAddress', 'unfamiliarLocation'];
  if (event.riskEventType && highRiskTypes.includes(event.riskEventType)) {
    score += 20;
  }

  return Math.min(score, 100);
}

function categorizeThreat(event: GraphSecurityEvent): string {
  const typeMap: Record<string, string> = {
    'impossibleTravel': 'Credential Theft',
    'anonymizedIPAddress': 'Anonymization Attack',
    'maliciousIPAddress': 'Known Threat Actor',
    'unfamiliarLocation': 'Unauthorized Access',
    'suspiciousInboxForwardingRules': 'Data Exfiltration',
    'leakedCredentials': 'Credential Breach',
    'adminConfirmedUserCompromised': 'Confirmed Compromise'
  };
  return typeMap[event.riskEventType || ''] || 'Unknown Threat';
}

function generateRecommendation(score: number, eventType: string): string {
  if (score >= 80) {
    return 'CRITICAL: Block user immediately and require password reset with MFA re-enrollment';
  } else if (score >= 60) {
    return 'HIGH: Investigate immediately and consider temporary account lockout';
  } else if (score >= 40) {
    return 'MEDIUM: Review user activity and verify sign-in legitimacy with user';
  } else {
    return 'LOW: Monitor for additional suspicious activity';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    logStep('Starting M365 security monitoring');

    const { tenantId, action } = await req.json();

    if (action === 'sync_all') {
      // Fetch all active tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('vanguard_m365_tenants')
        .select('*')
        .eq('is_active', true);

      if (tenantsError) throw tenantsError;
      logStep('Found active tenants', { count: tenants?.length });

      const results = [];
      for (const tenant of tenants || []) {
        try {
          const accessToken = await getAccessToken(
            tenant.tenant_id,
            tenant.client_id,
            tenant.client_secret
          );

          // Fetch various security data based on tenant settings
          const events: any[] = [];

          if (tenant.monitor_risky_signins) {
            const riskDetections = await fetchRiskDetections(accessToken);
            for (const detection of riskDetections) {
              const riskScore = calculateRiskScore(detection);
              events.push({
                tenant_id: tenant.id,
                user_id: tenant.user_id,
                event_type: 'risky_signin',
                event_id: detection.id,
                severity: detection.riskLevel || 'medium',
                affected_user: detection.userPrincipalName,
                affected_user_display: detection.userDisplayName,
                ip_address: detection.ipAddress,
                location: detection.location ? 
                  `${detection.location.city || ''}, ${detection.location.countryOrRegion || ''}` : null,
                device_info: detection.additionalInfo,
                raw_event_data: detection,
                ai_risk_score: riskScore,
                ai_threat_category: categorizeThreat(detection),
                ai_recommendation: generateRecommendation(riskScore, detection.riskEventType || ''),
                detected_at: detection.detectedDateTime
              });
            }
          }

          if (tenant.monitor_conditional_access) {
            const signInLogs = await fetchSignInLogs(accessToken);
            for (const log of signInLogs) {
              if (log.conditionalAccessStatus === 'failure') {
                events.push({
                  tenant_id: tenant.id,
                  user_id: tenant.user_id,
                  event_type: 'conditional_access',
                  event_id: log.id,
                  severity: 'medium',
                  affected_user: log.userPrincipalName,
                  affected_user_display: log.userDisplayName,
                  ip_address: log.ipAddress,
                  location: log.location ? 
                    `${log.location.city || ''}, ${log.location.countryOrRegion || ''}` : null,
                  device_info: log.deviceDetail?.displayName || log.clientAppUsed,
                  raw_event_data: log,
                  ai_risk_score: 30,
                  ai_threat_category: 'Policy Enforcement',
                  ai_recommendation: 'Policy blocked access - verify if legitimate user attempt',
                  detected_at: log.createdDateTime
                });
              }
            }
          }

          // Insert events into database
          if (events.length > 0) {
            const { error: insertError } = await supabase
              .from('vanguard_m365_security_events')
              .upsert(events, { 
                onConflict: 'event_id',
                ignoreDuplicates: true 
              });

            if (insertError) {
              logStep('Error inserting events', { error: insertError });
            }
          }

          // Update tenant sync status
          await supabase
            .from('vanguard_m365_tenants')
            .update({ 
              last_sync_at: new Date().toISOString(),
              sync_status: 'synced'
            })
            .eq('id', tenant.id);

          results.push({ 
            tenantId: tenant.id, 
            tenantName: tenant.tenant_name,
            eventsFound: events.length,
            status: 'success' 
          });

        } catch (tenantError) {
          logStep('Error processing tenant', { tenantId: tenant.id, error: tenantError });
          
          await supabase
            .from('vanguard_m365_tenants')
            .update({ 
              sync_status: 'error',
              sync_error: tenantError instanceof Error ? tenantError.message : 'Unknown error'
            })
            .eq('id', tenant.id);

          results.push({ 
            tenantId: tenant.id, 
            tenantName: tenant.tenant_name,
            status: 'error',
            error: tenantError instanceof Error ? tenantError.message : 'Unknown error'
          });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        results,
        processedAt: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (action === 'sync_tenant' && tenantId) {
      // Sync specific tenant
      const { data: tenant, error } = await supabase
        .from('vanguard_m365_tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        throw new Error('Tenant not found');
      }

      // Mark as syncing
      await supabase
        .from('vanguard_m365_tenants')
        .update({ sync_status: 'syncing' })
        .eq('id', tenantId);

      const accessToken = await getAccessToken(
        tenant.tenant_id,
        tenant.client_id,
        tenant.client_secret
      );

      const riskDetections = await fetchRiskDetections(accessToken);
      logStep('Fetched risk detections', { count: riskDetections.length });

      // Process and store events
      const events = riskDetections.map(detection => {
        const riskScore = calculateRiskScore(detection);
        return {
          tenant_id: tenant.id,
          user_id: tenant.user_id,
          event_type: 'risky_signin',
          event_id: detection.id,
          severity: detection.riskLevel || 'medium',
          affected_user: detection.userPrincipalName,
          affected_user_display: detection.userDisplayName,
          ip_address: detection.ipAddress,
          location: detection.location ? 
            `${detection.location.city || ''}, ${detection.location.countryOrRegion || ''}` : null,
          raw_event_data: detection,
          ai_risk_score: riskScore,
          ai_threat_category: categorizeThreat(detection),
          ai_recommendation: generateRecommendation(riskScore, detection.riskEventType || ''),
          detected_at: detection.detectedDateTime
        };
      });

      if (events.length > 0) {
        await supabase
          .from('vanguard_m365_security_events')
          .upsert(events, { onConflict: 'event_id', ignoreDuplicates: true });
      }

      await supabase
        .from('vanguard_m365_tenants')
        .update({ 
          last_sync_at: new Date().toISOString(),
          sync_status: 'synced'
        })
        .eq('id', tenantId);

      return new Response(JSON.stringify({ 
        success: true, 
        eventsProcessed: events.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
