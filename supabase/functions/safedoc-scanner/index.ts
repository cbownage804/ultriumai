import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  fileHash: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  mspId: string;
  clientId: string;
  userEmail: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { fileHash, fileName, fileSize, mimeType, mspId, clientId, userEmail }: ScanRequest = await req.json();

    // Create scan record
    const { data: scan, error: scanError } = await supabaseClient
      .from('safedoc_scans')
      .insert({
        msp_id: mspId,
        client_id: clientId,
        user_email: userEmail,
        file_name: fileName,
        file_size: fileSize,
        file_hash: fileHash,
        mime_type: mimeType,
        scan_status: 'scanning'
      })
      .select()
      .single();

    if (scanError) {
      throw scanError;
    }

    // Background scan task
    const scanDocument = async () => {
      try {
        const virusTotalApiKey = Deno.env.get('VIRUSTOTAL_API_KEY');
        
        if (!virusTotalApiKey) {
          throw new Error('VirusTotal API key not configured');
        }

        // Use VirusTotal v3 API to check file hash
        const lookupResponse = await fetch(`https://www.virustotal.com/api/v3/files/${fileHash}`, {
          headers: {
            'x-apikey': virusTotalApiKey
          }
        });

        let scanResults = {};
        let threatLevel = 'clean';
        let threatsFound = 0;

        if (lookupResponse.status === 200) {
          // File found in VirusTotal database
          const lookupResult = await lookupResponse.json();
          const stats = lookupResult.data.attributes.last_analysis_stats;
          
          scanResults = lookupResult.data.attributes;
          threatsFound = stats.malicious + stats.suspicious;
          
          if (threatsFound === 0) {
            threatLevel = 'clean';
          } else if (threatsFound <= 2) {
            threatLevel = 'low';
          } else if (threatsFound <= 5) {
            threatLevel = 'medium';
          } else if (threatsFound <= 10) {
            threatLevel = 'high';
          } else {
            threatLevel = 'critical';
          }

          // Store detailed results
          const engines = lookupResult.data.attributes.last_analysis_results;
          if (engines) {
            for (const [engineName, result] of Object.entries(engines)) {
              if (result.category === 'malicious' || result.category === 'suspicious') {
                await supabaseClient.from('safedoc_scan_results').insert({
                  scan_id: scan.id,
                  engine_name: engineName,
                  threat_name: result.result || 'Unknown threat',
                  threat_type: result.category,
                  severity: result.category === 'malicious' ? 'high' : 'medium',
                  description: `Detected by ${engineName}: ${result.result || 'Suspicious file'}`,
                  recommendation: result.category === 'malicious' ? 
                    'Quarantine or delete this file immediately' : 
                    'Review this file carefully before use'
                });
              }
            }
          }
        } else if (lookupResponse.status === 404) {
          // File not found in VirusTotal - mark as unknown for hash-only analysis
          scanResults = {
            sha256: fileHash,
            scan_date: new Date().toISOString(),
            message: 'File not found in VirusTotal database - hash-based lookup only'
          };
          threatLevel = 'unknown';
          threatsFound = 0;
          
          // Log that file wasn't found in VT database
          await supabaseClient.from('safedoc_scan_results').insert({
            scan_id: scan.id,
            engine_name: 'VirusTotal',
            threat_name: null,
            threat_type: 'info',
            severity: 'info',
            description: 'File not found in VirusTotal database. This could indicate a new or rare file.',
            recommendation: 'Consider additional security measures for unknown files'
          });
        } else {
          // API error or rate limit
          throw new Error(`VirusTotal API error: ${lookupResponse.status} ${lookupResponse.statusText}`);
        }

        // Update scan record
        await supabaseClient
          .from('safedoc_scans')
          .update({
            scan_status: 'completed',
            threat_level: threatLevel,
            threats_found: threatsFound,
            scan_results: scanResults,
            completed_at: new Date().toISOString()
          })
          .eq('id', scan.id);

        // Log usage for MSP tracking
        await supabaseClient.from('msp_usage_logs').insert({
          msp_id: mspId,
          client_id: clientId,
          user_email: userEmail,
          action: 'safedoc_scan',
          widget_type: 'api',
          metadata: {
            file_name: fileName,
            file_size: fileSize,
            threat_level: threatLevel,
            threats_found: threatsFound
          }
        });

      } catch (error) {
        console.error('Scan failed:', error);
        
        // Update scan record with error
        await supabaseClient
          .from('safedoc_scans')
          .update({
            scan_status: 'failed',
            scan_results: { error: error.message },
            completed_at: new Date().toISOString()
          })
          .eq('id', scan.id);
      }
    };

    // Start background scan
    EdgeRuntime.waitUntil(scanDocument());

    return new Response(
      JSON.stringify({
        success: true,
        scanId: scan.id,
        message: 'Document scan initiated'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('SafeDoc scanner error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});