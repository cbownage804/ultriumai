import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// New API Key Authentication
const authenticateApiKey = async (supabase: any, apiKey: string) => {
  // Hash the provided API key to compare with stored hash
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data: apiKeyData, error } = await supabase
    .from('api_keys')
    .select(`
      *,
      custom_gpts (
        id,
        name,
        system_prompt,
        is_active,
        user_id,
        preferred_model
      )
    `)
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single();

  if (error || !apiKeyData) {
    throw new Error('Invalid API key');
  }

  // Check if key is expired
  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    throw new Error('API key expired');
  }

  return apiKeyData;
};

const checkRateLimit = async (supabase: any, apiKeyId: string, rateLimitRpm: number) => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('api_usage_logs')
    .select('id')
    .eq('api_key_id', apiKeyId)
    .gte('created_at', oneMinuteAgo);

  if (error) throw error;

  if (data && data.length >= rateLimitRpm) {
    throw new Error('Rate limit exceeded');
  }
};

const logApiUsage = async (
  supabase: any, 
  apiKeyId: string, 
  gptId: string, 
  endpoint: string, 
  method: string, 
  statusCode: number, 
  responseTime: number,
  tokensUsed?: number,
  errorMessage?: string,
  userAgent?: string,
  ipAddress?: string
) => {
  await supabase
    .from('api_usage_logs')
    .insert({
      api_key_id: apiKeyId,
      gpt_id: gptId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTime,
      tokens_used: tokensUsed,
      error_message: errorMessage,
      user_agent: userAgent,
      ip_address: ipAddress
    });

  // Update usage count on API key
  await supabase.rpc('increment_api_key_usage', { key_id: apiKeyId });
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

    const body = await req.json();
    const { gptId, messages, systemPrompt, sessionId, prompt, customGPT, gpt_id } = body;
    
    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // NEW: Check for API key authentication (new format)
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ') && (gpt_id || body.gpt_id)) {
      const apiKey = authHeader.substring(7);
      
      try {
        // Authenticate API key and get GPT info
        const apiKeyData = await authenticateApiKey(supabase, apiKey);
        
        // Check rate limits
        await checkRateLimit(supabase, apiKeyData.id, apiKeyData.rate_limit_rpm);

        const targetGptId = gpt_id || body.gpt_id;
        
        // Verify GPT access
        const gpt = apiKeyData.custom_gpts;
        if (!gpt || (apiKeyData.gpt_id && gpt.id !== targetGptId) || !gpt.is_active) {
          throw new Error('GPT not found or access denied');
        }

        // Check permissions
        if (!apiKeyData.permissions.chat) {
          throw new Error('Chat permission not granted for this API key');
        }

        // Prepare messages with system prompt
        const fullMessages: ChatMessage[] = [
          { role: 'system', content: gpt.system_prompt },
          ...messages
        ];

        // Determine which API to use based on model
        const model = gpt.preferred_model || 'gpt-4o-mini';
        const isClaudeModel = model.startsWith('claude-');
        
        let apiResponse;
        
        if (isClaudeModel) {
          // Use Anthropic API for Claude models
          const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
          if (!anthropicApiKey) {
            throw new Error('Anthropic API key not configured for Claude models');
          }
          
          apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': anthropicApiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: model,
              max_tokens: body.max_tokens || 1000,
              temperature: body.temperature || 0.7,
              messages: fullMessages.filter(m => m.role !== 'system'),
              system: fullMessages.find(m => m.role === 'system')?.content || ''
            }),
          });
        } else {
          // Use OpenAI API for GPT models
          apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: model,
              messages: fullMessages,
              stream: body.stream || false,
              max_tokens: body.max_tokens || 1000,
              temperature: body.temperature || 0.7,
            }),
          });
        }

        if (!apiResponse.ok) {
          throw new Error(`AI API error: ${apiResponse.statusText}`);
        }

        const responseTime = Date.now() - startTime;
        
        if (body.stream) {
          // Log API usage for streaming
          logApiUsage(
            supabase,
            apiKeyData.id,
            targetGptId,
            '/chat-completion',
            'POST',
            200,
            responseTime,
            undefined,
            undefined,
            req.headers.get('User-Agent'),
            req.headers.get('X-Forwarded-For')
          );

          // Return streaming response
          return new Response(apiResponse.body, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        } else {
          // Handle non-streaming response
          const data = await apiResponse.json();
          
          // Parse response based on API type
          let responseData;
          if (isClaudeModel) {
            responseData = {
              choices: [{
                message: {
                  content: data.content[0]?.text || ''
                }
              }],
              usage: {
                total_tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0,
                prompt_tokens: data.usage?.input_tokens || 0,
                completion_tokens: data.usage?.output_tokens || 0
              }
            };
          } else {
            responseData = data;
          }
          
          // Log API usage
          await logApiUsage(
            supabase,
            apiKeyData.id,
            targetGptId,
            '/chat-completion',
            'POST',
            200,
            responseTime,
            responseData.usage?.total_tokens,
            undefined,
            req.headers.get('User-Agent'),
            req.headers.get('X-Forwarded-For')
          );

          return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (apiError: any) {
        const responseTime = Date.now() - startTime;
        console.error('API key authentication error:', apiError);
        
        const statusCode = apiError.message.includes('Rate limit') ? 429 :
                          apiError.message.includes('Invalid API key') ? 401 :
                          apiError.message.includes('not found') ? 404 : 500;

        return new Response(JSON.stringify({ 
          error: {
            type: 'api_error',
            message: apiError.message,
            code: apiError.message.toLowerCase().replace(/\s+/g, '_')
          }
        }), {
          status: statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // EXISTING: Handle legacy prompt-based requests (backward compatibility)
    if (prompt && !gptId) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates content based on user prompts.' },
            { role: 'user', content: prompt }
          ],
        }),
      });

      const data = await response.json();
      const generatedText = data.choices[0].message.content;

      return new Response(JSON.stringify({ generatedText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // EXISTING: Handle legacy ChatInterface format (existing chat functionality)
    if (messages) {
      const startTime = Date.now();

      // Extract model parameters with defaults
      const {
        model = 'gpt-4.1-2025-04-14',
        temperature = 0.7,
        max_tokens = 1000,
        top_p = 1.0,
        frequency_penalty = 0,
        presence_penalty = 0
      } = body.modelParams || {};

      // Handle web search if enabled
      let webSearchContext = '';
      if (body.webSearchEnabled) {
        try {
          const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
          
          if (perplexityApiKey) {
            const lastUserMessage = messages[messages.length - 1];
            console.log('Performing web search for:', lastUserMessage?.content);
            
            const searchResponse = await fetch('https://api.perplexity.ai/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${perplexityApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a helpful assistant that provides current, factual information from the web. Be concise and focus on the most relevant information.'
                  },
                  {
                    role: 'user',
                    content: `Search for current information about: ${lastUserMessage?.content}`
                  }
                ],
                temperature: 0.2,
                max_tokens: 500,
                return_images: false,
                return_related_questions: false
              }),
            });

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const searchResult = searchData.choices[0]?.message?.content;
              
              if (searchResult) {
                webSearchContext = '\n\nCurrent web information:\n' + searchResult;
                console.log('Web search context added');
              }
            } else {
              console.error('Web search failed:', searchResponse.statusText);
            }
          } else {
            console.log('Perplexity API key not configured');
          }
        } catch (error) {
          console.error('Web search error:', error);
          // Continue without web search
        }
      }

      // Model configuration for cost calculation
      const MODEL_CONFIGS: Record<string, any> = {
        'gpt-4o': {
          name: 'GPT-4o',
          maxTokens: 4096,
          inputCostPer1kTokens: 0.005,
          outputCostPer1kTokens: 0.015,
          contextWindow: 128000
        },
        'gpt-4o-mini': {
          name: 'GPT-4o Mini',
          maxTokens: 16384,
          inputCostPer1kTokens: 0.00015,
          outputCostPer1kTokens: 0.0006,
          contextWindow: 128000
        },
        'gpt-4.1-2025-04-14': {
          name: 'GPT-4.1 (Latest)',
          maxTokens: 4096,
          inputCostPer1kTokens: 0.01,
          outputCostPer1kTokens: 0.03,
          contextWindow: 128000
        },
        'o3-2025-04-16': {
          name: 'O3 (Reasoning)',
          maxTokens: 4096,
          inputCostPer1kTokens: 0.06,
          outputCostPer1kTokens: 0.24,
          contextWindow: 128000
        },
        'o4-mini-2025-04-16': {
          name: 'O4 Mini (Fast Reasoning)',
          maxTokens: 4096,
          inputCostPer1kTokens: 0.003,
          outputCostPer1kTokens: 0.012,
          contextWindow: 128000
        }
      };

      const modelConfig = MODEL_CONFIGS[model] || MODEL_CONFIGS['gpt-4.1-2025-04-14'];
      const actualMaxTokens = Math.min(max_tokens, modelConfig.maxTokens);

      // Build system prompt based on custom GPT or default
      let finalSystemPrompt = 'You are UltriumGPT, a helpful AI assistant created by UltriumAI. You help users with various tasks including answering questions, providing information, and assisting with problem-solving. When users upload files, carefully analyze their content and provide insights, summaries, or answer questions about the files. You can work with various file types including text files, code files, JSON, CSV, and more. Be concise but thorough in your responses.';
      
      if (customGPT && customGPT.system_prompt) {
        finalSystemPrompt = customGPT.system_prompt;
      }
      
      // Always append image generation instruction regardless of custom GPT
      finalSystemPrompt += ' CRITICAL: When users request image generation (asking to create, generate, or make images), respond ONLY with "Generating your image..." and absolutely nothing else. Do not analyze, describe, or discuss generated images.';

      // Add web search context to system prompt if available
      if (webSearchContext) {
        finalSystemPrompt += webSearchContext;
      }

      console.log(`Using model: ${model} with temperature: ${temperature}, max_tokens: ${actualMaxTokens}`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { 
              role: 'system', 
              content: finalSystemPrompt
            },
            ...messages
          ],
          max_tokens: actualMaxTokens,
          temperature: Number(temperature),
          top_p: Number(top_p),
          frequency_penalty: Number(frequency_penalty),
          presence_penalty: Number(presence_penalty),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content;
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Calculate usage costs
      const usage = data.usage || {};
      const inputTokens = usage.prompt_tokens || 0;
      const outputTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || 0;

      const inputCost = (inputTokens / 1000) * modelConfig.inputCostPer1kTokens;
      const outputCost = (outputTokens / 1000) * modelConfig.outputCostPer1kTokens;
      const totalCost = inputCost + outputCost;

      // Track analytics if custom GPT is being used
      if (customGPT?.id && sessionId) {
        try {
          // Get user ID from authorization header
          const authHeader = req.headers.get('authorization');
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            
            // Create a temporary supabase client to get user info
            const supabase = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_ANON_KEY') ?? '',
              {
                global: {
                  headers: {
                    Authorization: authHeader,
                  },
                },
              }
            );
            
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              // Track the message exchange
              await supabase.from('gpt_analytics').insert({
                gpt_id: customGPT.id,
                user_id: user.id,
                session_id: sessionId,
                interaction_type: 'message',
                response_time_ms: responseTime,
                tokens_used: totalTokens,
                metadata: {
                  model: model,
                  model_name: modelConfig.name,
                  prompt_tokens: inputTokens,
                  completion_tokens: outputTokens,
                  input_cost: inputCost,
                  output_cost: outputCost,
                  total_cost: totalCost,
                  temperature: temperature,
                  max_tokens: actualMaxTokens
                }
              });
              
              // Update chat count for the GPT
              await supabase
                .from('custom_gpts')
                .update({ 
                  chat_count: customGPT.chat_count ? customGPT.chat_count + 1 : 1 
                })
                .eq('id', customGPT.id);
            }
          }
        } catch (analyticsError) {
          console.error('Analytics tracking error:', analyticsError);
          // Continue without failing the main request
        }
      }

      console.log('Response generated:', {
        model: modelConfig.name,
        inputTokens,
        outputTokens,
        totalTokens,
        totalCost: totalCost.toFixed(6)
      });

      return new Response(JSON.stringify({ 
        message: generatedText,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          inputCost,
          outputCost,
          totalCost,
          model: modelConfig.name
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // EXISTING: Handle new GPT Chat Interface format with ACTION SUPPORT
    if (gptId && messages && systemPrompt) {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get the user from the authorization header
      const authHeader = req.headers.get('authorization');
      let userId = null;
      
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          userId = user?.id;
        } catch (error) {
          console.error('Error getting user:', error);
        }
      }

      // Get GPT details, knowledge base, AND enabled actions
      const { data: gpt, error: gptError } = await supabase
        .from('custom_gpts')
        .select('*, gpt_documents(*)')
        .eq('id', gptId)
        .single();

      if (gptError || !gpt) {
        console.error('GPT not found:', gptError);
        return new Response(JSON.stringify({ 
          error: 'GPT not found' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch enabled actions for this GPT
      const { data: actions } = await supabase
        .from('gpt_actions')
        .select('*')
        .eq('gpt_id', gptId)
        .eq('is_enabled', true);

      console.log(`Found ${actions?.length || 0} enabled actions for GPT ${gptId}`);

      // Convert actions to OpenAI tool format
      const tools = actions?.map((action: any) => {
        let parameters: any = {
          type: 'object',
          properties: {},
          required: []
        };

        // Define parameters based on action type
        if (action.action_type === 'security') {
          const scannerType = action.config?.security?.scannerType || 'url';
          if (scannerType === 'url') {
            parameters.properties.url = {
              type: 'string',
              description: 'The URL to scan for security threats'
            };
            parameters.required = ['url'];
          } else if (scannerType === 'breach') {
            parameters.properties.email = {
              type: 'string',
              description: 'The email address to check for breaches'
            };
            parameters.required = ['email'];
          }
        } else if (action.action_type === 'api') {
          parameters.properties.data = {
            type: 'object',
            description: 'The data to send to the API'
          };
        } else if (action.action_type === 'webhook') {
          parameters.properties.message = {
            type: 'string',
            description: 'The message to send via webhook'
          };
        }

        return {
          type: 'function',
          function: {
            name: `action_${action.id.replace(/-/g, '_')}`,
            description: `${action.name}: ${action.description || 'Execute this action'}`,
            parameters
          }
        };
      }) || [];

      // Web search integration
      let webSearchContext = '';
      const lastUserMessage = messages[messages.length - 1];
      
      if (gpt.enable_web_search && lastUserMessage?.role === 'user') {
        try {
          const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
          
          if (perplexityApiKey) {
            console.log('Performing web search for:', lastUserMessage.content);
            
            const searchResponse = await fetch('https://api.perplexity.ai/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${perplexityApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                  {
                    role: 'system',
                    content: 'You are a helpful assistant that provides current, factual information from the web. Be concise and focus on the most relevant information.'
                  },
                  {
                    role: 'user',
                    content: `Search for current information about: ${lastUserMessage.content}`
                  }
                ],
                temperature: 0.2,
                max_tokens: 500,
                return_images: false,
                return_related_questions: false
              }),
            });

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const searchResult = searchData.choices[0]?.message?.content;
              
              if (searchResult) {
                webSearchContext = '\n\nCurrent web information:\n' + searchResult;
                console.log('Web search successful, added context');
              }
            } else {
              console.error('Web search failed:', await searchResponse.text());
            }
          }
        } catch (searchError) {
          console.error('Web search error:', searchError);
        }
      }

      // Build context from knowledge base
      let knowledgeContext = '';
      if (gpt.gpt_documents && gpt.gpt_documents.length > 0) {
        const relevantDocs = gpt.gpt_documents
          .filter((doc: any) => doc.processed_content)
          .slice(0, 5);
        
        if (relevantDocs.length > 0) {
          knowledgeContext = '\n\nKnowledge Base:\n' + 
            relevantDocs
              .map((doc: any) => `${doc.file_name}: ${doc.processed_content.substring(0, 1000)}`)
              .join('\n\n');
        }
      }

      // Add actions context to system prompt
      let actionsContext = '';
      if (actions && actions.length > 0) {
        actionsContext = '\n\nYou have the following actions available:\n' + 
          actions.map((a: any) => `- ${a.name}: ${a.description}`).join('\n') +
          '\n\nUse these actions when appropriate to help the user. For security scans, always use the action to check URLs or emails rather than making assumptions.';
      }

      // Prepare messages for OpenAI
      const openAIMessages: ChatMessage[] = [
        {
          role: 'system',
          content: systemPrompt + knowledgeContext + webSearchContext + actionsContext
        },
        ...messages
      ];

      console.log('Sending request to OpenAI with', openAIMessages.length, 'messages and', tools.length, 'tools');

      // Call OpenAI API with tools if available
      const requestBody: any = {
        model: gpt.preferred_model || 'gpt-4o-mini',
        messages: openAIMessages,
        temperature: 0.7,
        max_tokens: 1000,
      };

      if (tools.length > 0) {
        requestBody.tools = tools;
        requestBody.tool_choice = 'auto';
      }

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${openAIResponse.status}`);
      }

      let openAIResult = await openAIResponse.json();
      let assistantMessage = openAIResult.choices[0]?.message;
      let tokensUsed = openAIResult.usage?.total_tokens || 0;

      // Handle tool calls if present
      if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
        console.log('Processing', assistantMessage.tool_calls.length, 'tool calls');
        
        const toolResults: any[] = [];
        
        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const actionId = functionName.replace('action_', '').replace(/_/g, '-');
          
          try {
            const args = JSON.parse(toolCall.function.arguments);
            console.log(`Executing action ${actionId} with args:`, args);
            
            // Execute the action
            const actionResponse = await fetch(`${supabaseUrl}/functions/v1/execute-action`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                actionId,
                inputData: args,
                testMode: false
              })
            });
            
            const actionResult = await actionResponse.json();
            console.log(`Action ${actionId} result:`, actionResult);
            
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify(actionResult)
            });
          } catch (error: any) {
            console.error(`Error executing action ${actionId}:`, error);
            toolResults.push({
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify({ error: error.message })
            });
          }
        }

        // Send tool results back to OpenAI for final response
        const followUpMessages = [
          ...openAIMessages,
          assistantMessage,
          ...toolResults
        ];

        const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: gpt.preferred_model || 'gpt-4o-mini',
            messages: followUpMessages,
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (followUpResponse.ok) {
          const followUpResult = await followUpResponse.json();
          assistantMessage = followUpResult.choices[0]?.message;
          tokensUsed += followUpResult.usage?.total_tokens || 0;
        }
      }

      const finalMessage = assistantMessage?.content || 'I was unable to generate a response.';

      if (!finalMessage) {
        throw new Error('No response from OpenAI');
      }

      console.log('OpenAI response received, tokens used:', tokensUsed);

      // Store the conversation if user is authenticated
      if (userId && gptId) {
        try {
          // Update GPT chat count
          await supabase
            .from('custom_gpts')
            .update({ 
              chat_count: gpt.chat_count + 1 
            })
            .eq('id', gptId);

          // Store analytics
          await supabase
            .from('gpt_analytics')
            .insert({
              gpt_id: gptId,
              user_id: userId,
              session_id: sessionId,
              interaction_type: 'message',
              tokens_used: tokensUsed,
              metadata: {
                model: gpt.preferred_model || 'gpt-4o-mini',
                message_length: finalMessage.length,
                actions_used: assistantMessage?.tool_calls?.length || 0
              }
            });

        } catch (error) {
          console.error('Error storing conversation data:', error);
        }
      }

      return new Response(JSON.stringify({ 
        message: finalMessage,
        tokensUsed: tokensUsed,
        actionsUsed: assistantMessage?.tool_calls?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If we get here, invalid request format
    return new Response(JSON.stringify({ 
      error: 'Invalid request format' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-completion function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});