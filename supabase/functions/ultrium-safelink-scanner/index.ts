import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface URLScanRequest {
  url: string;
  user_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, user_id }: URLScanRequest = await req.json();
    console.log('Scanning URL:', url);

    if (!url) {
      throw new Error('URL is required');
    }

    const virusTotalApiKey = Deno.env.get('VIRUSTOTAL_API_KEY');
    if (!virusTotalApiKey) {
      throw new Error('VirusTotal API key not configured');
    }

    // Submit URL to VirusTotal
    const submitResponse = await fetch('https://www.virustotal.com/vtapi/v2/url/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        apikey: virusTotalApiKey,
        url: url,
      }),
    });

    const submitData = await submitResponse.json();
    console.log('VirusTotal submit response:', submitData);

    // Wait a moment then get the report
    await new Promise(resolve => setTimeout(resolve, 2000));

    const reportResponse = await fetch(`https://www.virustotal.com/vtapi/v2/url/report?apikey=${virusTotalApiKey}&resource=${encodeURIComponent(url)}`);
    const reportData = await reportResponse.json();
    console.log('VirusTotal report:', reportData);

    // Analyze the results
    const positives = reportData.positives || 0;
    const total = reportData.total || 0;
    const scanDate = reportData.scan_date || new Date().toISOString();
    const permalink = reportData.permalink;

    // Determine risk level
    let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
    let threats: string[] = [];
    
    if (positives > 0) {
      const riskPercentage = (positives / total) * 100;
      
      if (riskPercentage >= 50) {
        riskLevel = 'critical';
      } else if (riskPercentage >= 25) {
        riskLevel = 'high';
      } else if (riskPercentage >= 10) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      // Extract threat details
      if (reportData.scans) {
        threats = Object.entries(reportData.scans)
          .filter(([_, scan]: [string, any]) => scan.detected)
          .map(([engine, scan]: [string, any]) => `${engine}: ${scan.result}`)
          .slice(0, 5); // Limit to top 5 threats
      }
    }

    const reputationScore = Math.max(0, 100 - (positives * 10));

    // Generate recommendations
    const recommendations = [];
    if (riskLevel === 'safe') {
      recommendations.push('URL appears safe to visit');
      recommendations.push('No known security threats detected');
    } else {
      recommendations.push('Exercise caution when accessing this URL');
      recommendations.push('Consider using alternative trusted sources');
      if (positives > 5) {
        recommendations.push('This URL has been flagged by multiple security vendors');
        recommendations.push('Avoid entering sensitive information');
      }
    }

    const scanResult = {
      url: url,
      safe: riskLevel === 'safe',
      risk_level: riskLevel,
      reputation_score: reputationScore,
      threats_detected: threats,
      scan_details: {
        positives,
        total,
        scan_date: scanDate,
        permalink,
        engines: reportData.scans ? Object.keys(reportData.scans).length : 0,
        scan_id: reportData.scan_id
      },
      recommendations,
      scan_timestamp: new Date().toISOString()
    };

    // Store scan result in analytics if user_id provided
    if (user_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase.from('gpt_analytics').insert({
        user_id,
        gpt_id: 'safescan-url',
        interaction_type: 'security_scan',
        tokens_used: 1,
        metadata: {
          scan_type: 'url',
          content: url.substring(0, 100),
          risk_level: riskLevel,
          threats_detected: threats,
          reputation_score: reputationScore,
          scan_details: scanResult.scan_details,
          recommendations
        }
      });
    }

    return new Response(JSON.stringify(scanResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('URL scan error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      safe: false,
      risk_level: 'unknown',
      threats_detected: ['Scan failed'],
      reputation_score: 0,
      scan_details: {},
      recommendations: ['Unable to complete scan', 'Please try again later']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});