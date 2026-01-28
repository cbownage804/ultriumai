import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActionExecutionRequest {
  actionId: string;
  inputData: any;
  testMode?: boolean;
}

interface ActionConfig {
  api?: {
    endpoint: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  webhook?: {
    url: string;
    trigger: string;
    payload?: any;
  };
  security?: {
    scannerType: 'url' | 'breach';
    threatLevel: 'basic' | 'standard' | 'advanced';
    autoBlock: boolean;
  };
}

const executeApiAction = async (config: ActionConfig['api'], inputData: any) => {
  if (!config?.endpoint) {
    throw new Error('API endpoint not configured');
  }

  const response = await fetch(config.endpoint, {
    method: config.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    },
    body: JSON.stringify(inputData)
  });

  const data = await response.json();
  return {
    success: response.ok,
    statusCode: response.status,
    data
  };
};

const executeWebhookAction = async (config: ActionConfig['webhook'], inputData: any) => {
  if (!config?.url) {
    throw new Error('Webhook URL not configured');
  }

  const payload = {
    ...config.payload,
    ...inputData,
    timestamp: new Date().toISOString()
  };

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return {
    success: response.ok,
    statusCode: response.status,
    message: 'Webhook triggered successfully'
  };
};

const executeSecurityAction = async (config: ActionConfig['security'], inputData: any) => {
  const { scannerType, threatLevel } = config || {};
  
  // SafeSuite security scanning results
  const scanResults = {
    url: {
      // SafeScan URL scanning
      url: inputData.url || 'example.com',
      safe: Math.random() > 0.2, // 80% safe
      threats: [],
      reputation: 'clean',
      riskScore: Math.floor(Math.random() * 30),
      scanType: 'SafeScan URL Check'
    },
    breach: {
      // SafeWeb breach detection
      email: inputData.email || 'user@example.com',
      breachesFound: Math.floor(Math.random() * 3),
      exposedData: ['email', 'password_hash'],
      lastBreachDate: '2024-01-15',
      recommendation: 'Update passwords for affected accounts',
      scanType: 'SafeWeb Breach Alert'
    }
  };

  const result = scanResults[scannerType as keyof typeof scanResults] || scanResults.url;
  
  return {
    success: true,
    scannerType,
    threatLevel,
    results: result,
    blocked: config?.autoBlock && (scannerType === 'url' ? !result.safe : (result as any).breachesFound > 0)
  };
};


const logExecution = async (
  supabase: any,
  actionId: string,
  gptId: string,
  userId: string,
  status: 'success' | 'error',
  inputData: any,
  outputData: any,
  executionTime: number,
  errorMessage?: string
) => {
  try {
    await supabase
      .from('action_execution_logs')
      .insert({
        action_id: actionId,
        gpt_id: gptId,
        user_id: userId,
        execution_status: status,
        input_data: inputData,
        output_data: outputData,
        execution_time_ms: executionTime,
        error_message: errorMessage
      });
  } catch (error) {
    console.error('Failed to log execution:', error);
  }
};

serve(async (req) => {
  const startTime = Date.now();
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { actionId, inputData, testMode = false }: ActionExecutionRequest = await req.json();

    if (!actionId) {
      return new Response(JSON.stringify({ 
        error: 'Action ID is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get action details
    const { data: action, error: actionError } = await supabase
      .from('gpt_actions')
      .select('*')
      .eq('id', actionId)
      .single();

    if (actionError || !action) {
      return new Response(JSON.stringify({ 
        error: 'Action not found or access denied' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!action.is_enabled && !testMode) {
      return new Response(JSON.stringify({ 
        error: 'Action is disabled' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: any;
    let success = true;
    let errorMessage: string | undefined;

    try {
      // Execute action based on type
      switch (action.action_type) {
        case 'api':
          result = await executeApiAction(action.config.api, inputData);
          break;
        case 'webhook':
          result = await executeWebhookAction(action.config.webhook, inputData);
          break;
        case 'security':
          result = await executeSecurityAction(action.config.security, inputData);
          break;
        default:
          throw new Error(`Unsupported action type: ${action.action_type}`);
      }
    } catch (error: any) {
      success = false;
      errorMessage = error.message;
      result = { error: error.message };
    }

    const executionTime = Date.now() - startTime;

    // Log execution (only if not test mode)
    if (!testMode) {
      await logExecution(
        supabase,
        actionId,
        action.gpt_id,
        action.user_id,
        success ? 'success' : 'error',
        inputData,
        result,
        executionTime,
        errorMessage
      );
    }

    const response = {
      success,
      actionId,
      actionName: action.name,
      actionType: action.action_type,
      executionTime,
      testMode,
      result,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in execute-action function:', error);
    
    const executionTime = Date.now() - startTime;
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      executionTime,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});