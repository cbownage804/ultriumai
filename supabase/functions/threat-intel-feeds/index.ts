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
    const { action, indicator, indicator_type } = await req.json();
    console.log(`Threat Intel action: ${action}, indicator: ${indicator}, type: ${indicator_type}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const virusTotalKey = Deno.env.get('VIRUSTOTAL_API_KEY');
    const abuseIpDbKey = Deno.env.get('ABUSEIPDB_API_KEY');

    let results: any = { sources: [] };

    if (action === 'lookup') {
      // VirusTotal lookup
      if (virusTotalKey && indicator) {
        try {
          let vtEndpoint = '';
          if (indicator_type === 'ip') {
            vtEndpoint = `https://www.virustotal.com/api/v3/ip_addresses/${indicator}`;
          } else if (indicator_type === 'domain') {
            vtEndpoint = `https://www.virustotal.com/api/v3/domains/${indicator}`;
          } else if (indicator_type === 'hash') {
            vtEndpoint = `https://www.virustotal.com/api/v3/files/${indicator}`;
          } else if (indicator_type === 'url') {
            const urlId = btoa(indicator).replace(/=/g, '');
            vtEndpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;
          }

          if (vtEndpoint) {
            const vtResponse = await fetch(vtEndpoint, {
              headers: { 'x-apikey': virusTotalKey }
            });
            
            if (vtResponse.ok) {
              const vtData = await vtResponse.json();
              const stats = vtData.data?.attributes?.last_analysis_stats || {};
              results.sources.push({
                source: 'VirusTotal',
                data: {
                  malicious: stats.malicious || 0,
                  suspicious: stats.suspicious || 0,
                  harmless: stats.harmless || 0,
                  undetected: stats.undetected || 0,
                  reputation: vtData.data?.attributes?.reputation,
                  country: vtData.data?.attributes?.country,
                  as_owner: vtData.data?.attributes?.as_owner,
                  last_analysis_date: vtData.data?.attributes?.last_analysis_date
                },
                risk_score: stats.malicious > 5 ? 'critical' : stats.malicious > 0 ? 'high' : stats.suspicious > 0 ? 'medium' : 'low'
              });
            }
          }
        } catch (e) {
          console.error('VirusTotal error:', e);
        }
      }

      // AbuseIPDB lookup (IP only)
      if (abuseIpDbKey && indicator_type === 'ip') {
        try {
          const abuseResponse = await fetch(
            `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(indicator)}&maxAgeInDays=90`,
            {
              headers: {
                'Key': abuseIpDbKey,
                'Accept': 'application/json'
              }
            }
          );
          
          if (abuseResponse.ok) {
            const abuseData = await abuseResponse.json();
            const data = abuseData.data || {};
            results.sources.push({
              source: 'AbuseIPDB',
              data: {
                abuse_confidence_score: data.abuseConfidenceScore,
                country_code: data.countryCode,
                isp: data.isp,
                domain: data.domain,
                total_reports: data.totalReports,
                is_public: data.isPublic,
                is_whitelisted: data.isWhitelisted,
                last_reported_at: data.lastReportedAt
              },
              risk_score: data.abuseConfidenceScore > 80 ? 'critical' : 
                         data.abuseConfidenceScore > 50 ? 'high' : 
                         data.abuseConfidenceScore > 20 ? 'medium' : 'low'
            });
          }
        } catch (e) {
          console.error('AbuseIPDB error:', e);
        }
      }

      // Calculate overall risk
      const riskScores = results.sources.map((s: any) => s.risk_score);
      results.overall_risk = riskScores.includes('critical') ? 'critical' :
                             riskScores.includes('high') ? 'high' :
                             riskScores.includes('medium') ? 'medium' : 'low';
      results.indicator = indicator;
      results.indicator_type = indicator_type;
      results.checked_at = new Date().toISOString();

      // Store in threat intelligence table
      await supabase.from('threat_intelligence').upsert({
        indicator,
        indicator_type,
        risk_level: results.overall_risk,
        source_data: results.sources,
        last_checked: new Date().toISOString()
      }, { onConflict: 'indicator' });
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Threat Intel error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
