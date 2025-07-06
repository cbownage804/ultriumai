import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentScanRequest {
  file_path: string;
  file_hash: string;
  file_size: number;
  mime_type: string;
  device_id: string;
  user_context?: string;
}

interface DocumentQueryRequest {
  query: string;
  device_id: string;
  context?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'scan_document':
        return await scanDocument(supabase, payload as DocumentScanRequest);
      
      case 'query_documents':
        return await queryDocuments(supabase, payload as DocumentQueryRequest);
      
      case 'get_scan_results':
        return await getScanResults(supabase, payload.scan_id);
      
      case 'quarantine_file':
        return await quarantineFile(supabase, payload.device_id, payload.file_path);
      
      case 'get_related_documents':
        return await getRelatedDocuments(supabase, payload.context, payload.device_id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('SafeDoc Agent Integration Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function scanDocument(supabase: any, request: DocumentScanRequest) {
  // Create SafeDoc scan record
  const scanId = crypto.randomUUID();
  
  const { error: insertError } = await supabase
    .from('safedoc_scans')
    .insert({
      id: scanId,
      file_name: request.file_path.split('/').pop(),
      file_size: request.file_size,
      file_hash: request.file_hash,
      mime_type: request.mime_type,
      scan_status: 'scanning',
      scan_engine: 'ultrium_agent',
      metadata: {
        device_id: request.device_id,
        agent_scan: true,
        file_path: request.file_path,
        user_context: request.user_context
      }
    });

  if (insertError) throw insertError;

  // Simulate scanning process (in production, this would call actual scanning engines)
  setTimeout(async () => {
    // Simulate scan completion
    const isThreat = Math.random() < 0.1; // 10% chance of threat
    const threatLevel = isThreat ? ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] : 'clean';
    
    await supabase
      .from('safedoc_scans')
      .update({
        scan_status: 'completed',
        threat_level: threatLevel,
        threats_found: isThreat ? 1 : 0,
        completed_at: new Date().toISOString(),
        scan_results: {
          engines_used: ['ultrium_av', 'virustotal', 'clamav'],
          scan_duration: Math.floor(Math.random() * 5000) + 1000,
          threat_details: isThreat ? {
            threat_name: 'Suspicious.Generic.12345',
            threat_type: 'Potentially Unwanted Program',
            confidence: 85
          } : null
        }
      })
      .eq('id', scanId);

    // If threat found, create alert
    if (isThreat) {
      await supabase
        .from('rmm_alerts')
        .insert({
          device_id: request.device_id,
          alert_type: 'security',
          severity: threatLevel === 'high' ? 'critical' : 'medium',
          title: 'Malicious File Detected',
          message: `SafeDoc detected a threat in ${request.file_path}`,
          source: 'safedoc_agent',
          status: 'open',
          metadata: {
            scan_id: scanId,
            file_path: request.file_path,
            threat_level: threatLevel
          }
        });
    }
  }, 2000);

  return new Response(
    JSON.stringify({ 
      success: true, 
      scan_id: scanId,
      status: 'scanning',
      message: 'Document scan initiated'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function queryDocuments(supabase: any, request: DocumentQueryRequest) {
  // Search for relevant documents using AI
  const { data, error } = await supabase.functions.invoke('knowledge-search', {
    body: {
      query: request.query,
      context: {
        device_id: request.device_id,
        search_type: 'agent_query',
        ...request.context
      }
    }
  });

  if (error) throw error;

  // Filter results for agent context
  const agentResults = data.results.map((result: any) => ({
    document_id: result.document_id,
    title: result.title,
    content_snippet: result.content.substring(0, 500),
    relevance_score: result.score,
    file_type: result.metadata?.mime_type,
    last_modified: result.metadata?.last_modified,
    safe_to_access: result.metadata?.threat_level === 'clean'
  }));

  return new Response(
    JSON.stringify({ 
      success: true, 
      results: agentResults,
      query: request.query,
      total_results: agentResults.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getScanResults(supabase: any, scanId: string) {
  const { data: scan, error } = await supabase
    .from('safedoc_scans')
    .select(`
      *,
      safedoc_scan_results (*)
    `)
    .eq('id', scanId)
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ 
      success: true, 
      scan: scan,
      is_safe: scan.threat_level === 'clean',
      recommendation: scan.threat_level === 'clean' 
        ? 'File is safe to access' 
        : 'File contains threats - access with caution'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function quarantineFile(supabase: any, deviceId: string, filePath: string) {
  // Create quarantine record
  const quarantineId = crypto.randomUUID();
  
  const { error } = await supabase
    .from('safedoc_quarantine')
    .insert({
      id: quarantineId,
      device_id: deviceId,
      file_path: filePath,
      quarantine_reason: 'Agent-initiated quarantine',
      quarantined_at: new Date().toISOString(),
      status: 'quarantined'
    });

  if (error) throw error;

  // Create alert for quarantine action
  await supabase
    .from('rmm_alerts')
    .insert({
      device_id: deviceId,
      alert_type: 'security',
      severity: 'medium',
      title: 'File Quarantined',
      message: `File ${filePath} has been quarantined by SafeDoc`,
      source: 'safedoc_agent',
      status: 'open',
      metadata: {
        quarantine_id: quarantineId,
        file_path: filePath,
        action: 'quarantine'
      }
    });

  return new Response(
    JSON.stringify({ 
      success: true, 
      quarantine_id: quarantineId,
      message: 'File successfully quarantined'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getRelatedDocuments(supabase: any, context: any, deviceId: string) {
  // Find documents related to current context (screen content, applications, etc.)
  const keywords = extractKeywords(context);
  
  if (keywords.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        documents: [],
        message: 'No relevant context found'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Search for documents using extracted keywords
  const searchPromises = keywords.map(keyword => 
    supabase.functions.invoke('knowledge-search', {
      body: {
        query: keyword,
        context: { device_id: deviceId, search_type: 'context_aware' }
      }
    })
  );

  const searchResults = await Promise.all(searchPromises);
  
  // Combine and deduplicate results
  const allResults = searchResults
    .filter(result => !result.error)
    .flatMap(result => result.data?.results || []);

  const uniqueResults = Array.from(
    new Map(allResults.map(item => [item.document_id, item])).values()
  ).slice(0, 10); // Limit to top 10

  return new Response(
    JSON.stringify({ 
      success: true, 
      documents: uniqueResults,
      context_keywords: keywords,
      message: `Found ${uniqueResults.length} related documents`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function extractKeywords(context: any): string[] {
  const keywords: string[] = [];
  
  // Extract from screen text
  if (context.screen_text) {
    const words = context.screen_text
      .split(/\s+/)
      .filter((word: string) => word.length > 3)
      .slice(0, 10);
    keywords.push(...words);
  }
  
  // Extract from application name
  if (context.active_application) {
    keywords.push(context.active_application);
  }
  
  // Extract from window title
  if (context.window_title) {
    keywords.push(context.window_title);
  }
  
  return [...new Set(keywords)]; // Remove duplicates
}