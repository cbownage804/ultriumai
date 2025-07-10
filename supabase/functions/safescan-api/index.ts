import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface ScanAPIRequest {
  type: 'email' | 'document' | 'url';
  content: string;
  metadata?: {
    client_id?: string;
    msp_id?: string;
    user_email?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract API key from headers
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Missing API key", 
          message: "Include x-api-key header with your API key" 
        }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Validate API key and get user info
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*, user_id')
      .eq('key_hash', apiKey)
      .eq('is_active', true)
      .single();

    if (keyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid API key", 
          message: "API key not found or inactive" 
        }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Check if API key has expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          error: "API key expired", 
          message: "Please generate a new API key" 
        }),
        { 
          status: 401, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Check rate limits
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const { data: usageData } = await supabase
      .from('api_usage_logs')
      .select('id')
      .eq('api_key_id', apiKeyData.id)
      .gte('created_at', dayStart.toISOString());

    const dailyUsage = usageData?.length || 0;
    
    if (dailyUsage >= (apiKeyData.rate_limit_rpd || 1000)) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded", 
          message: "Daily API request limit reached",
          limit: apiKeyData.rate_limit_rpd,
          usage: dailyUsage
        }),
        { 
          status: 429, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Parse request body
    const { type, content, metadata = {} }: ScanAPIRequest = await req.json();

    if (!type || !content) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields", 
          message: "type and content are required" 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Perform the scan based on type
    let scanResult;
    const startTime = Date.now();

    try {
      switch (type) {
        case 'email':
          const emailResponse = await supabase.functions.invoke('ultrium-safemail-scanner', {
            body: {
              email: {
                subject: metadata.subject || 'API Scan',
                sender: metadata.sender || 'api@scan.com',
                content: content,
                timestamp: new Date().toISOString()
              }
            }
          });
          scanResult = emailResponse.data;
          break;

        case 'url':
          const urlResponse = await supabase.functions.invoke('ultrium-safelink-scanner', {
            body: { url: content }
          });
          scanResult = urlResponse.data;
          break;

        case 'document':
          // For document scanning via API, content should be base64 encoded
          const docResponse = await supabase.functions.invoke('ultrium-safedoc-scanner', {
            body: {
              file_data: content, // Base64 encoded file
              filename: metadata.filename || 'api-upload.txt',
              file_size: metadata.file_size || content.length,
              file_type: metadata.file_type || 'text/plain',
              user_id: apiKeyData.user_id,
              msp_id: metadata.msp_id || 'api',
              client_id: metadata.client_id || 'api',
              user_email: metadata.user_email || 'api@scan.com'
            }
          });
          scanResult = docResponse.data;
          break;

        default:
          return new Response(
            JSON.stringify({ 
              error: "Invalid scan type", 
              message: "type must be 'email', 'document', or 'url'" 
            }),
            { 
              status: 400, 
              headers: { "Content-Type": "application/json", ...corsHeaders } 
            }
          );
      }

      const responseTime = Date.now() - startTime;

      // Log the API usage
      await supabase.from('api_usage_logs').insert({
        api_key_id: apiKeyData.id,
        endpoint: `/scan/${type}`,
        method: 'POST',
        status_code: 200,
        response_time_ms: responseTime,
        tokens_used: content.length, // Approximate
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

      // Update API key usage count
      await supabase
        .from('api_keys')
        .update({ 
          usage_count: (apiKeyData.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', apiKeyData.id);

      // Log billing usage for MSPs
      if (metadata.msp_id) {
        await supabase.from('msp_billing_usage').insert({
          msp_id: metadata.msp_id,
          client_id: metadata.client_id || 'api',
          service_type: 'safescan_api',
          usage_type: 'scan',
          quantity: 1,
          unit_cost: 0.10, // $0.10 per API scan
          total_cost: 0.10,
          metadata: {
            scan_type: type,
            api_key_id: apiKeyData.id,
            file_size: metadata.file_size,
            threats_detected: scanResult?.threats_detected?.length || 0
          }
        });
      }

      // Return successful scan result
      return new Response(
        JSON.stringify({
          success: true,
          scan_id: scanResult?.scan_id || crypto.randomUUID(),
          type,
          safe: scanResult?.safe || false,
          risk_level: scanResult?.risk_level || 'unknown',
          threats_detected: scanResult?.threats_detected || [],
          reputation_score: scanResult?.reputation_score || 0,
          scan_details: scanResult?.scan_details || {},
          recommendations: scanResult?.recommendations || [],
          response_time_ms: responseTime,
          api_usage: {
            daily_usage: dailyUsage + 1,
            daily_limit: apiKeyData.rate_limit_rpd
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );

    } catch (scanError: any) {
      console.error('Scan error:', scanError);
      
      const responseTime = Date.now() - startTime;

      // Log the failed API usage
      await supabase.from('api_usage_logs').insert({
        api_key_id: apiKeyData.id,
        endpoint: `/scan/${type}`,
        method: 'POST',
        status_code: 500,
        response_time_ms: responseTime,
        error_message: scanError.message,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

      return new Response(
        JSON.stringify({ 
          error: "Scan failed", 
          message: scanError.message,
          type
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

  } catch (error: any) {
    console.error("Error in safescan-api function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);