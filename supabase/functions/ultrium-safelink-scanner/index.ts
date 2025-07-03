import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const virusTotalApiKey = Deno.env.get('VIRUSTOTAL_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanResult {
  isClean: boolean;
  threatLevel: 'clean' | 'suspicious' | 'malicious';
  detectionCount: number;
  totalScans: number;
  detectedThreats: string[];
  scanId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url: targetUrl, scanType = 'url' } = await req.json();

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encode URL for VirusTotal
    const urlId = btoa(targetUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    // Check existing scan results first
    const analysisResponse = await fetch(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      {
        method: 'GET',
        headers: {
          'x-apikey': virusTotalApiKey!,
        },
      }
    );

    let scanResult: ScanResult;

    if (analysisResponse.status === 200) {
      // URL has been scanned before
      const data = await analysisResponse.json();
      const stats = data.data.attributes.last_analysis_stats;
      
      scanResult = {
        isClean: stats.malicious === 0 && stats.suspicious === 0,
        threatLevel: stats.malicious > 0 ? 'malicious' : 
                    stats.suspicious > 0 ? 'suspicious' : 'clean',
        detectionCount: stats.malicious + stats.suspicious,
        totalScans: Object.values(stats).reduce((sum: number, count: any) => sum + count, 0),
        detectedThreats: Object.entries(data.data.attributes.last_analysis_results)
          .filter(([_, result]: [string, any]) => 
            result.category === 'malicious' || result.category === 'suspicious'
          )
          .map(([engine, _]: [string, any]) => engine),
        scanId: data.data.id
      };
    } else {
      // Submit URL for scanning
      const submitResponse = await fetch(
        'https://www.virustotal.com/api/v3/urls',
        {
          method: 'POST',
          headers: {
            'x-apikey': virusTotalApiKey!,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `url=${encodeURIComponent(targetUrl)}`,
        }
      );

      if (!submitResponse.ok) {
        throw new Error('Failed to submit URL for scanning');
      }

      const submitData = await submitResponse.json();
      const analysisId = submitData.data.id;

      // Wait a moment and check results
      await new Promise(resolve => setTimeout(resolve, 2000));

      const resultResponse = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        {
          method: 'GET',
          headers: {
            'x-apikey': virusTotalApiKey!,
          },
        }
      );

      const resultData = await resultResponse.json();
      
      if (resultData.data.attributes.status === 'completed') {
        const stats = resultData.data.attributes.stats;
        
        scanResult = {
          isClean: stats.malicious === 0 && stats.suspicious === 0,
          threatLevel: stats.malicious > 0 ? 'malicious' : 
                      stats.suspicious > 0 ? 'suspicious' : 'clean',
          detectionCount: stats.malicious + stats.suspicious,
          totalScans: Object.values(stats).reduce((sum: number, count: any) => sum + count, 0),
          detectedThreats: [],
          scanId: analysisId
        };
      } else {
        // Scan still in progress
        scanResult = {
          isClean: true,
          threatLevel: 'clean',
          detectionCount: 0,
          totalScans: 0,
          detectedThreats: [],
          scanId: analysisId
        };
      }
    }

    return new Response(
      JSON.stringify({
        url: targetUrl,
        scanResult,
        scannedAt: new Date().toISOString(),
        scannerName: 'Ultrium SafeLink™ Scanner'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in Ultrium SafeLink Scanner:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scan URL',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});