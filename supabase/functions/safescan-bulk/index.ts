import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkScanRequest {
  user_id: string;
  scan_type: 'url' | 'email' | 'document';
  items: string[];
}

interface ScanResult {
  item: string;
  safe: boolean;
  risk_level: string;
  threats_detected: string[];
  reputation_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, scan_type, items } = await req.json() as BulkScanRequest;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items array is required');
    }

    if (items.length > 50) {
      throw new Error('Maximum 50 items per bulk scan');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results: ScanResult[] = [];
    const startTime = Date.now();

    // Process items in parallel batches of 10
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          try {
            let functionName = '';
            let body: any = { user_id };

            switch (scan_type) {
              case 'url':
                functionName = 'ultrium-safelink-scanner';
                body.url = item;
                break;
              case 'email':
                functionName = 'safemail-scanner';
                body.action = 'scan_email';
                body.email = {
                  subject: 'Bulk Scan',
                  sender: item,
                  content: '',
                  timestamp: new Date().toISOString()
                };
                break;
              case 'document':
                // For documents, item should be filename (heuristic scan)
                functionName = 'safedoc-scanner';
                body.file_name = item;
                body.file_size = 0;
                break;
            }

            const response = await supabase.functions.invoke(functionName, { body });
            
            if (response.error) {
              return {
                item,
                safe: false,
                risk_level: 'unknown',
                threats_detected: ['Scan failed'],
                reputation_score: 0,
                error: response.error.message
              };
            }

            return {
              item,
              safe: response.data?.safe ?? false,
              risk_level: response.data?.risk_level || 'unknown',
              threats_detected: response.data?.threats_detected || [],
              reputation_score: response.data?.reputation_score || 0
            };
          } catch (error: any) {
            return {
              item,
              safe: false,
              risk_level: 'unknown',
              threats_detected: ['Scan error: ' + error.message],
              reputation_score: 0
            };
          }
        })
      );

      results.push(...batchResults);
    }

    const scanDuration = Date.now() - startTime;

    // Calculate summary statistics
    const summary = {
      total: results.length,
      safe: results.filter(r => r.safe).length,
      threats: results.filter(r => !r.safe).length,
      critical: results.filter(r => r.risk_level === 'critical').length,
      high: results.filter(r => r.risk_level === 'high').length,
      medium: results.filter(r => r.risk_level === 'medium').length,
      low: results.filter(r => r.risk_level === 'low').length,
      scan_duration_ms: scanDuration
    };

    // Log bulk scan
    if (user_id) {
      await supabase.from('gpt_analytics').insert({
        user_id,
        interaction_type: 'bulk_security_scan',
        metadata: {
          scan_type,
          items_count: items.length,
          threats_found: summary.threats,
          duration_ms: scanDuration
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        scan_type,
        summary,
        results,
        scanned_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Bulk scan error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
