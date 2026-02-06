import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) throw new Error('OpenAI API key not configured');

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { agentId } = await req.json();
    if (!agentId) throw new Error('Agent ID is required');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Load agent config
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) throw new Error('Agent not found');
    if (!agent.is_enabled) throw new Error('Agent is disabled');
    if (agent.credits_used >= agent.credit_budget) throw new Error('Credit budget exhausted');

    const startTime = Date.now();

    // Create run record
    const { data: run, error: runError } = await supabaseAdmin
      .from('ai_agent_runs')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        status: 'running',
        input_data: { target_table: agent.target_table, conditions: agent.conditions },
      })
      .select()
      .single();

    if (runError) throw runError;

    try {
      // Fetch target data
      let query = supabaseAdmin
        .from(agent.target_table)
        .select('*')
        .eq('user_id', user.id)
        .limit(50);

      // Apply conditions if any
      const conditions = agent.conditions || {};
      for (const [key, value] of Object.entries(conditions)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }

      const { data: records, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      if (!records || records.length === 0) {
        await supabaseAdmin
          .from('ai_agent_runs')
          .update({
            status: 'completed',
            output_data: { message: 'No matching records found' },
            execution_time_ms: Date.now() - startTime,
            credits_used: 0,
          })
          .eq('id', run.id);

        return new Response(JSON.stringify({
          message: 'No matching records found',
          records_processed: 0,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Send data to AI for processing
      const aiPrompt = `Process the following ${records.length} records from the "${agent.target_table}" table.

${agent.system_prompt}

RECORDS:
${JSON.stringify(records.slice(0, 20), null, 2)}

Return a JSON array where each element has the original record "id" and the AI-generated fields.`;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent.model.includes('gemini') ? 'gpt-4o-mini' : agent.model.split('/').pop(),
          messages: [
            { role: 'system', content: 'You are a data processing AI. Always return valid JSON arrays.' },
            { role: 'user', content: aiPrompt }
          ],
          temperature: 0.3,
        }),
      });

      const aiData = await aiResponse.json();
      const aiContent = aiData.choices?.[0]?.message?.content || '[]';
      
      let processedResults;
      try {
        const cleaned = aiContent.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
        processedResults = JSON.parse(cleaned);
      } catch {
        processedResults = { raw: aiContent };
      }

      const tokensUsed = aiData.usage?.total_tokens || 0;
      const creditsUsed = Math.ceil(tokensUsed / 1000 * 1.5); // 1.5x multiplier for agents

      // Update agent stats
      await supabaseAdmin
        .from('ai_agents')
        .update({
          credits_used: (agent.credits_used || 0) + creditsUsed,
          run_count: (agent.run_count || 0) + 1,
          last_run_at: new Date().toISOString(),
        })
        .eq('id', agentId);

      // Update run record
      await supabaseAdmin
        .from('ai_agent_runs')
        .update({
          status: 'completed',
          output_data: processedResults,
          execution_time_ms: Date.now() - startTime,
          credits_used: creditsUsed,
        })
        .eq('id', run.id);

      return new Response(JSON.stringify({
        message: `Processed ${records.length} records successfully`,
        records_processed: records.length,
        credits_used: creditsUsed,
        results: processedResults,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (execError) {
      // Update run as failed
      await supabaseAdmin
        .from('ai_agent_runs')
        .update({
          status: 'failed',
          error_message: execError.message,
          execution_time_ms: Date.now() - startTime,
        })
        .eq('id', run.id);

      throw execError;
    }

  } catch (error) {
    console.error('Error in ai-agent-execute:', error);
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
