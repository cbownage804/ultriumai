import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IPReputationResult {
  ip: string;
  is_malicious: boolean;
  risk_score: number;
  risk_level: string;
  categories: string[];
  abuse_reports: number;
  country: string | null;
  isp: string | null;
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  is_datacenter: boolean;
  last_reported: string | null;
  blocklists: string[];
  recommendations: string[];
}

// Check against AbuseIPDB
async function checkAbuseIPDB(ip: string, apiKey: string | undefined): Promise<any> {
  if (!apiKey) {
    console.log('AbuseIPDB API key not configured');
    return null;
  }

  try {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90&verbose=true`, {
      headers: {
        'Key': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('AbuseIPDB error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('AbuseIPDB check failed:', error);
    return null;
  }
}

// Check against ip-api.com for geolocation and ISP info (free, no key needed)
async function checkIPAPI(ip: string): Promise<any> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,isp,org,as,proxy,hosting`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.status !== 'success') {
      return null;
    }
    return data;
  } catch (error) {
    console.error('IP-API check failed:', error);
    return null;
  }
}

// Simple heuristic check based on known bad patterns
function checkKnownBadPatterns(ip: string): string[] {
  const categories: string[] = [];
  
  // Check for private/reserved ranges being scanned (shouldn't happen externally)
  const octets = ip.split('.').map(Number);
  
  // Check if it's in commonly abused ranges or known bad ASNs would go here
  // For now, we rely on external APIs
  
  return categories;
}

function calculateRiskScore(abuseData: any, ipApiData: any): number {
  let score = 0;
  
  if (abuseData) {
    score += abuseData.abuseConfidenceScore || 0;
    if (abuseData.totalReports > 10) score += 10;
    if (abuseData.totalReports > 50) score += 20;
    if (abuseData.isTor) score += 15;
  }
  
  if (ipApiData) {
    if (ipApiData.proxy) score += 20;
    if (ipApiData.hosting) score += 10; // Datacenter IPs are sometimes abused
  }
  
  return Math.min(100, score);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ip } = await req.json();

    if (!ip) {
      return new Response(
        JSON.stringify({ success: false, error: 'IP address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate IP format
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid IP address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking IP reputation: ${ip}`);

    const abuseIPDBKey = Deno.env.get('ABUSEIPDB_API_KEY');
    
    // Run checks in parallel
    const [abuseData, ipApiData] = await Promise.all([
      checkAbuseIPDB(ip, abuseIPDBKey),
      checkIPAPI(ip),
    ]);

    const riskScore = calculateRiskScore(abuseData, ipApiData);
    
    // Determine risk level
    let riskLevel: string;
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else if (riskScore >= 20) riskLevel = 'low';
    else riskLevel = 'clean';

    // Gather categories
    const categories: string[] = [];
    if (abuseData?.usageType) categories.push(abuseData.usageType);
    if (abuseData?.isTor) categories.push('Tor Exit Node');
    if (ipApiData?.proxy) categories.push('Proxy/VPN');
    if (ipApiData?.hosting) categories.push('Datacenter/Hosting');

    // Gather blocklist info
    const blocklists: string[] = [];
    if (abuseData && abuseData.abuseConfidenceScore >= 50) {
      blocklists.push('AbuseIPDB (High Confidence)');
    }
    if (abuseData?.totalReports > 0) {
      blocklists.push(`AbuseIPDB (${abuseData.totalReports} reports)`);
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskScore >= 60) {
      recommendations.push('Block this IP at the firewall level');
    }
    if (abuseData?.isTor) {
      recommendations.push('Consider blocking Tor exit nodes if not required');
    }
    if (ipApiData?.proxy) {
      recommendations.push('Monitor traffic from VPN/proxy sources');
    }
    if (riskScore >= 40 && riskScore < 60) {
      recommendations.push('Add to watchlist for suspicious activity');
    }
    if (riskScore < 20) {
      recommendations.push('No action required - IP appears clean');
    }

    const result: IPReputationResult = {
      ip,
      is_malicious: riskScore >= 50,
      risk_score: riskScore,
      risk_level: riskLevel,
      categories,
      abuse_reports: abuseData?.totalReports || 0,
      country: abuseData?.countryCode || ipApiData?.countryCode || null,
      isp: abuseData?.isp || ipApiData?.isp || null,
      is_vpn: ipApiData?.proxy || false,
      is_proxy: ipApiData?.proxy || false,
      is_tor: abuseData?.isTor || false,
      is_datacenter: ipApiData?.hosting || false,
      last_reported: abuseData?.lastReportedAt || null,
      blocklists,
      recommendations,
    };

    console.log(`IP check complete: ${ip} - risk=${riskLevel}, score=${riskScore}`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('IP reputation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Check failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
