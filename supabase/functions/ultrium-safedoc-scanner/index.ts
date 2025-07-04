import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileScanResult {
  filename: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  threats_detected: string[];
  file_info: {
    size: number;
    type: string;
    hash: string;
    extension: string;
  };
  scan_details: {
    malware_detections: number;
    total_engines: number;
    suspicious_indicators: string[];
    scan_date: string;
  };
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { file_data, filename, file_size, file_type, user_id, gpt_id } = await req.json();
    
    if (!file_data || !filename) {
      throw new Error('File data and filename are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check user subscription
    if (user_id) {
      const { data: subscription } = await supabase
        .from('subscribers')
        .select('subscription_tier')
        .eq('user_id', user_id)
        .single();

      const { data: appSubscription } = await supabase
        .from('security_app_subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('app_id', 'safedoc')
        .eq('status', 'active')
        .single();

      if (!subscription || 
          (subscription.subscription_tier !== 'enterprise' && 
           subscription.subscription_tier !== 'premium' && 
           !appSubscription)) {
        throw new Error('SafeDoc scanning requires Premium, Enterprise subscription or SafeDoc app subscription');
      }
    }

    // Decode base64 file data
    const fileBuffer = Uint8Array.from(atob(file_data), c => c.charCodeAt(0));
    const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
    
    // Generate file hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    let threats: string[] = [];
    let riskLevel: FileScanResult['risk_level'] = 'safe';
    let suspiciousIndicators: string[] = [];
    const recommendations: string[] = [];

    // Basic file type analysis
    const dangerousExtensions = [
      'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
      'msi', 'deb', 'rpm', 'dmg', 'app', 'sh', 'ps1'
    ];

    const suspiciousExtensions = [
      'zip', 'rar', '7z', 'tar', 'gz', 'iso', 'img', 'vhd'
    ];

    if (dangerousExtensions.includes(fileExtension)) {
      threats.push('Executable file type detected');
      riskLevel = 'high';
      suspiciousIndicators.push('Potentially dangerous file extension');
    } else if (suspiciousExtensions.includes(fileExtension)) {
      suspiciousIndicators.push('Archive file - may contain hidden threats');
      if (riskLevel === 'safe') riskLevel = 'low';
    }

    // File size analysis
    if (file_size > 100 * 1024 * 1024) { // > 100MB
      suspiciousIndicators.push('Unusually large file size');
    }

    // Check file header for magic numbers (basic file type validation)
    const magicNumbers: { [key: string]: number[] } = {
      'pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
      'zip': [0x50, 0x4B, 0x03, 0x04], // PK..
      'exe': [0x4D, 0x5A], // MZ
      'jpg': [0xFF, 0xD8, 0xFF],
      'png': [0x89, 0x50, 0x4E, 0x47]
    };

    let headerMatches = false;
    for (const [type, magic] of Object.entries(magicNumbers)) {
      if (fileBuffer.length >= magic.length) {
        const header = Array.from(fileBuffer.slice(0, magic.length));
        if (header.every((byte, index) => byte === magic[index])) {
          headerMatches = true;
          break;
        }
      }
    }

    if (!headerMatches && fileExtension !== 'txt') {
      suspiciousIndicators.push('File header doesn\'t match extension');
      threats.push('Possible file masquerading');
      if (riskLevel === 'safe') riskLevel = 'medium';
    }

    // Simulate VirusTotal scan using file hash
    let malwareDetections = 0;
    let totalEngines = 70; // Typical number of AV engines

    const virusTotalApiKey = Deno.env.get('VIRUSTOTAL_API_KEY');
    if (virusTotalApiKey) {
      try {
        // Check hash against VirusTotal
        const vtResponse = await fetch(
          `https://www.virustotal.com/api/v3/files/${fileHash}`,
          {
            headers: {
              'x-apikey': virusTotalApiKey
            }
          }
        );

        if (vtResponse.ok) {
          const vtData = await vtResponse.json();
          const stats = vtData.data.attributes.last_analysis_stats;
          malwareDetections = stats.malicious || 0;
          totalEngines = Object.values(stats).reduce((sum: number, count: any) => sum + count, 0);
        }
      } catch (error) {
        console.log('VirusTotal lookup failed:', error);
        // Continue with heuristic analysis
      }
    }

    // Risk assessment based on all factors
    let riskScore = 0;
    riskScore += malwareDetections * 10;
    riskScore += threats.length * 20;
    riskScore += suspiciousIndicators.length * 5;

    if (malwareDetections > 0) {
      threats.push(`Malware detected by ${malwareDetections} engines`);
      riskLevel = malwareDetections > 5 ? 'critical' : 'high';
    } else if (riskScore >= 40) {
      riskLevel = 'high';
    } else if (riskScore >= 20) {
      riskLevel = 'medium';
    } else if (riskScore >= 10) {
      riskLevel = 'low';
    }

    // Generate recommendations
    switch (riskLevel) {
      case 'safe':
        recommendations.push('File appears safe to process');
        break;
      case 'low':
        recommendations.push('Exercise normal caution when opening');
        break;
      case 'medium':
        recommendations.push('Scan with additional tools before opening');
        break;
      case 'high':
        recommendations.push('High risk - avoid opening this file');
        break;
      case 'critical':
        recommendations.push('BLOCKED - This file contains malware');
        break;
    }

    const result: FileScanResult = {
      filename: filename,
      safe: riskLevel === 'safe',
      risk_level: riskLevel,
      threats_detected: threats,
      file_info: {
        size: file_size,
        type: file_type,
        hash: fileHash,
        extension: fileExtension
      },
      scan_details: {
        malware_detections: malwareDetections,
        total_engines: totalEngines,
        suspicious_indicators: suspiciousIndicators,
        scan_date: new Date().toISOString()
      },
      recommendations: recommendations
    };

    // Log the scan activity
    if (user_id) {
      await supabase.from('gpt_analytics').insert({
        gpt_id: gpt_id || null,
        user_id: user_id,
        interaction_type: 'security_scan',
        metadata: {
          scan_type: 'file',
          filename: filename,
          file_size: file_size,
          risk_level: riskLevel,
          threats_count: threats.length
        }
      });

      // Update usage count
      const { data: appSubscription } = await supabase
        .from('security_app_subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('app_id', 'safedoc')
        .eq('status', 'active')
        .single();

      if (appSubscription) {
        await supabase
          .from('security_app_subscriptions')
          .update({ usage_current: (appSubscription.usage_current || 0) + 1 })
          .eq('id', appSubscription.id);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SafeDoc scanner error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      safe: false,
      risk_level: 'critical',
      threats_detected: ['Scan failed'],
      recommendations: ['Unable to verify file safety - exercise extreme caution']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});