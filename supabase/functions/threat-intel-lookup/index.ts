import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { indicator, indicator_type } = await req.json();
    
    if (!indicator || !indicator_type) {
      return new Response(JSON.stringify({ error: "Missing indicator or indicator_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Looking up ${indicator_type}: ${indicator}`);

    // Check cache first
    const { data: cached } = await supabase
      .from('threat_intel_cache')
      .select('*')
      .eq('indicator_type', indicator_type)
      .eq('indicator_value', indicator)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('Returning cached result');
      return new Response(JSON.stringify({ 
        ...cached,
        from_cache: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Perform lookups
    const results: any = {
      indicator,
      indicator_type,
      sources: [],
      is_malicious: false,
      reputation_score: 0,
      categories: [],
    };

    // AbuseIPDB lookup for IPs
    const abuseIpDbKey = Deno.env.get("ABUSEIPDB_API_KEY");
    if (indicator_type === 'ip' && abuseIpDbKey) {
      try {
        const response = await fetch(
          `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(indicator)}&maxAgeInDays=90`,
          {
            headers: {
              'Key': abuseIpDbKey,
              'Accept': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const abuseData = data.data;
          
          results.sources.push({
            source: 'abuseipdb',
            abuse_confidence_score: abuseData.abuseConfidenceScore,
            total_reports: abuseData.totalReports,
            country_code: abuseData.countryCode,
            isp: abuseData.isp,
            domain: abuseData.domain,
            is_tor: abuseData.isTor,
            is_whitelisted: abuseData.isWhitelisted,
            last_reported_at: abuseData.lastReportedAt,
          });
          
          if (abuseData.abuseConfidenceScore > 50) {
            results.is_malicious = true;
          }
          results.reputation_score = Math.max(results.reputation_score, abuseData.abuseConfidenceScore);
        }
      } catch (e) {
        console.error('AbuseIPDB lookup failed:', e);
      }
    }

    // VirusTotal lookup
    const vtKey = Deno.env.get("VIRUSTOTAL_API_KEY");
    if (vtKey) {
      try {
        let vtEndpoint = '';
        if (indicator_type === 'ip') {
          vtEndpoint = `https://www.virustotal.com/api/v3/ip_addresses/${indicator}`;
        } else if (indicator_type === 'domain') {
          vtEndpoint = `https://www.virustotal.com/api/v3/domains/${indicator}`;
        } else if (indicator_type === 'hash') {
          vtEndpoint = `https://www.virustotal.com/api/v3/files/${indicator}`;
        }

        if (vtEndpoint) {
          const response = await fetch(vtEndpoint, {
            headers: { 'x-apikey': vtKey },
          });

          if (response.ok) {
            const data = await response.json();
            const attrs = data.data?.attributes;
            const stats = attrs?.last_analysis_stats;
            
            if (stats) {
              const malicious = stats.malicious || 0;
              const suspicious = stats.suspicious || 0;
              const total = malicious + suspicious + (stats.harmless || 0) + (stats.undetected || 0);
              
              results.sources.push({
                source: 'virustotal',
                malicious_count: malicious,
                suspicious_count: suspicious,
                harmless_count: stats.harmless || 0,
                total_engines: total,
                reputation: attrs.reputation,
                categories: Object.values(attrs.categories || {}),
              });
              
              if (malicious > 3 || suspicious > 5) {
                results.is_malicious = true;
              }
              
              const vtScore = ((malicious + suspicious) / Math.max(total, 1)) * 100;
              results.reputation_score = Math.max(results.reputation_score, vtScore);
              results.categories = [...results.categories, ...Object.values(attrs.categories || {})];
            }
          }
        }
      } catch (e) {
        console.error('VirusTotal lookup failed:', e);
      }
    }

    // If no API keys configured, use AI analysis as fallback
    if (results.sources.length === 0) {
      const lovableKey = Deno.env.get("LOVABLE_API_KEY");
      if (lovableKey) {
        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { 
                  role: "system", 
                  content: "You are a threat intelligence analyst. Analyze indicators and provide security assessments. Respond in JSON format with: is_known_malicious (boolean), risk_assessment (low/medium/high/critical), categories (array), notes (string)."
                },
                { 
                  role: "user", 
                  content: `Analyze this ${indicator_type}: ${indicator}. What is known about it from a security perspective?`
                },
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content;
            const jsonMatch = content?.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              results.sources.push({
                source: 'ai_analysis',
                ...parsed,
              });
              if (parsed.is_known_malicious) {
                results.is_malicious = true;
              }
            }
          }
        } catch (e) {
          console.error('AI analysis failed:', e);
        }
      }
    }

    // Cache the result
    if (results.sources.length > 0) {
      await supabase.from('threat_intel_cache').upsert({
        user_id: user.id,
        indicator_type,
        indicator_value: indicator,
        source: results.sources[0]?.source || 'unknown',
        reputation_score: Math.round(results.reputation_score),
        is_malicious: results.is_malicious,
        categories: results.categories,
        raw_response: results,
        last_checked_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'indicator_type,indicator_value,source' });
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Threat intel lookup error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
