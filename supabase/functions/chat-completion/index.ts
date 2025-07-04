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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { gptId, messages, systemPrompt, sessionId, prompt, customGPT } = body;
    
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

    // Handle legacy prompt-based requests (backward compatibility)
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

    // Handle legacy ChatInterface format (existing chat functionality)
    if (messages && customGPT) {
      const startTime = Date.now();

      // Build system prompt based on custom GPT or default
      let finalSystemPrompt = 'You are UltriumGPT, a helpful AI assistant created by UltriumAI. You help users with various tasks including answering questions, providing information, and assisting with problem-solving. When users upload files, carefully analyze their content and provide insights, summaries, or answer questions about the files. You can work with various file types including text files, code files, JSON, CSV, and more. Be concise but thorough in your responses.';
      
      if (customGPT && customGPT.system_prompt) {
        finalSystemPrompt = customGPT.system_prompt;
      }
      
      // Always append image generation instruction regardless of custom GPT
      finalSystemPrompt += ' CRITICAL: When users request image generation (asking to create, generate, or make images), respond ONLY with "Generating your image..." and absolutely nothing else. Do not analyze, describe, or discuss generated images.';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { 
              role: 'system', 
              content: finalSystemPrompt
            },
            ...messages
          ],
          max_tokens: 4000,
          temperature: 0.7,
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
                tokens_used: data.usage?.total_tokens || 0,
                metadata: {
                  model: 'gpt-4.1-2025-04-14',
                  prompt_tokens: data.usage?.prompt_tokens || 0,
                  completion_tokens: data.usage?.completion_tokens || 0
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

      return new Response(JSON.stringify({ 
        message: generatedText,
        usage: data.usage
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle new GPT Chat Interface format
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

      // Get GPT details and knowledge base
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

      // Build context from knowledge base
      let knowledgeContext = '';
      if (gpt.gpt_documents && gpt.gpt_documents.length > 0) {
        const relevantDocs = gpt.gpt_documents
          .filter((doc: any) => doc.processed_content)
          .slice(0, 5); // Limit to 5 documents to stay within token limits
        
        if (relevantDocs.length > 0) {
          knowledgeContext = '\n\nKnowledge Base:\n' + 
            relevantDocs
              .map((doc: any) => `${doc.file_name}: ${doc.processed_content.substring(0, 1000)}`)
              .join('\n\n');
        }
      }

      // Prepare messages for OpenAI
      const openAIMessages: ChatMessage[] = [
        {
          role: 'system',
          content: systemPrompt + knowledgeContext
        },
        ...messages
      ];

      console.log('Sending request to OpenAI with', openAIMessages.length, 'messages');

      // Call OpenAI API
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: gpt.preferred_model || 'gpt-4o-mini',
          messages: openAIMessages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${openAIResponse.status}`);
      }

      const openAIResult = await openAIResponse.json();
      const assistantMessage = openAIResult.choices[0]?.message?.content;
      const tokensUsed = openAIResult.usage?.total_tokens;

      if (!assistantMessage) {
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
                message_length: assistantMessage.length
              }
            });

        } catch (error) {
          console.error('Error storing conversation data:', error);
          // Don't fail the request if analytics storage fails
        }
      }

      return new Response(JSON.stringify({ 
        message: assistantMessage,
        tokensUsed: tokensUsed 
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