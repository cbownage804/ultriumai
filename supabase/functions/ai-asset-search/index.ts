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
    const { query, assets } = await req.json();

    if (!query || !assets) {
      return new Response(
        JSON.stringify({ error: 'Query and assets are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a detailed prompt for AI asset search
    const systemPrompt = `You are an AI assistant that helps search through IT assets based on natural language queries. 
    Given a search query and a list of assets, return only the asset IDs that match the query criteria.
    
    Consider these factors when matching:
    - Asset names, models, manufacturers
    - Categories (Desktop Computers, Laptops, Servers, etc.)
    - Status (active, maintenance, retired, lost, disposed)
    - Location information
    - Assignment information
    - Specifications and notes
    - Warranty and maintenance status
    
    Examples of queries you might receive:
    - "Find all Dell laptops"
    - "Show assets needing maintenance"
    - "Find expired warranties"
    - "Laptops in Building A"
    - "All servers by HP"
    
    Respond with a JSON object containing a "matches" array with objects having "id" and "relevance" (0-1 score).`;

    const userPrompt = `Search query: "${query}"

Assets to search through:
${JSON.stringify(assets, null, 2)}

Return matching asset IDs with relevance scores.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    try {
      const parsedResponse = JSON.parse(aiResponse);
      
      // Validate the response format
      if (!parsedResponse.matches || !Array.isArray(parsedResponse.matches)) {
        throw new Error('Invalid AI response format');
      }

      // Filter matches with relevance > 0.3 to ensure quality
      const filteredMatches = parsedResponse.matches.filter((match: any) => 
        match.relevance && match.relevance > 0.3
      );

      return new Response(
        JSON.stringify({ 
          matches: filteredMatches,
          query,
          totalAssets: assets.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('AI asset search error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});