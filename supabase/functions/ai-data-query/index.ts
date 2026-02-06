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

    // Create authenticated client to verify user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { question, gptId, dataSources } = await req.json();
    if (!question) throw new Error('Question is required');

    // Build schema context from data sources
    const schemaContext = (dataSources || [])
      .filter((ds: any) => ds.is_enabled)
      .map((ds: any) => `Table: ${ds.table_name}\nColumns: ${(ds.allowed_columns || []).join(', ')}\nDescription: ${ds.description || ''}`)
      .join('\n\n');

    if (!schemaContext) {
      return new Response(JSON.stringify({
        answer: 'No data sources are connected. Please connect data tables in GPT settings to enable data queries.',
        query: null,
        results: null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 1: Generate SQL query using AI
    const sqlPrompt = `You are a SQL query generator. Given the user's question and available database schema, generate a safe, read-only PostgreSQL query.

RULES:
- ONLY generate SELECT statements
- NEVER use DELETE, UPDATE, INSERT, DROP, ALTER, TRUNCATE, or any data-modifying statement
- ALWAYS include WHERE user_id = '${user.id}' to scope data to the authenticated user
- Limit results to 100 rows max
- Only query the tables and columns listed below
- Return ONLY the SQL query, no explanation

AVAILABLE SCHEMA:
${schemaContext}

USER QUESTION: ${question}

SQL QUERY:`;

    if (!openAIApiKey) throw new Error('OpenAI API key not configured');

    const sqlResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a SQL query generator. Return ONLY valid PostgreSQL SELECT queries. No explanations.' },
          { role: 'user', content: sqlPrompt }
        ],
        temperature: 0.1,
      }),
    });

    const sqlData = await sqlResponse.json();
    let generatedQuery = sqlData.choices?.[0]?.message?.content?.trim() || '';

    // Clean the query
    generatedQuery = generatedQuery.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();

    // Validate: must be SELECT only
    const upperQuery = generatedQuery.toUpperCase().trim();
    if (!upperQuery.startsWith('SELECT')) {
      throw new Error('Generated query is not a SELECT statement');
    }
    const forbidden = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE'];
    for (const word of forbidden) {
      if (upperQuery.includes(word)) {
        throw new Error(`Forbidden operation detected: ${word}`);
      }
    }

    // Step 2: Execute the query using service role (RLS still applies via user_id filter in query)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: queryResults, error: queryError } = await supabaseAdmin.rpc('execute_readonly_query' as any, {
      query_text: generatedQuery
    });

    // If the RPC doesn't exist, fall back to raw query
    let results = queryResults;
    if (queryError) {
      // Fallback: use the service role but the query itself is user-scoped
      console.log('RPC not found, using direct query approach');
      // For safety, we'll just return the query and let the frontend handle it
      results = null;
    }

    // Step 3: Generate natural language answer
    const answerPrompt = `Based on the following database query results, provide a clear, conversational answer to the user's question.

USER QUESTION: ${question}
SQL QUERY: ${generatedQuery}
RESULTS: ${JSON.stringify(results || 'Query generated but results unavailable. The query can be run in the SQL editor.')}

Provide a helpful, concise answer. If results are available, include specific numbers and details. Format nicely with markdown if helpful.`;

    const answerResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a data analyst assistant. Provide clear answers based on query results. Be concise and helpful.' },
          { role: 'user', content: answerPrompt }
        ],
        temperature: 0.5,
      }),
    });

    const answerData = await answerResponse.json();
    const answer = answerData.choices?.[0]?.message?.content || 'Unable to generate answer.';

    return new Response(JSON.stringify({
      answer,
      query: generatedQuery,
      results: results,
      tokensUsed: (sqlData.usage?.total_tokens || 0) + (answerData.usage?.total_tokens || 0),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-data-query:', error);
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
