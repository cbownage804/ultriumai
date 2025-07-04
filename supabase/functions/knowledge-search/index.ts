import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[KNOWLEDGE-SEARCH] ${step}${detailsStr}`);
};

// Generate query embedding
const generateQueryEmbedding = async (query: string, openaiApiKey: string): Promise<number[]> => {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid or expired token');
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { 
      query, 
      searchType = 'semantic', 
      sourceIds = [], 
      gptId = null, 
      limit = 10,
      threshold = 0.7
    } = await req.json();

    if (!query?.trim()) {
      throw new Error('Search query is required');
    }

    const startTime = Date.now();
    logStep("Starting knowledge search", { 
      query, 
      searchType, 
      sourceIds, 
      gptId, 
      limit 
    });

    let results = [];

    if (searchType === 'semantic' && openaiApiKey) {
      // Semantic search using vector embeddings
      try {
        const queryEmbedding = await generateQueryEmbedding(query, openaiApiKey);
        logStep("Generated query embedding");

        // Build the search query
        let searchQuery = supabase
          .from('knowledge_chunks')
          .select(`
            id,
            content,
            chunk_index,
            token_count,
            metadata,
            embedding,
            knowledge_documents!inner(
              id,
              file_name,
              source_id,
              knowledge_sources!inner(
                id,
                name,
                source_type
              )
            )
          `)
          .eq('user_id', user.id)
          .not('embedding', 'is', null);

        // Filter by source IDs if provided
        if (sourceIds.length > 0) {
          searchQuery = searchQuery.in('source_id', sourceIds);
        }

        // Filter by GPT ID if provided
        if (gptId) {
          searchQuery = searchQuery.eq('knowledge_documents.knowledge_sources.gpt_id', gptId);
        }

        const { data: chunks, error: searchError } = await searchQuery.limit(limit * 3); // Get more for filtering

        if (searchError) {
          throw searchError;
        }

        logStep("Retrieved chunks for similarity calculation", { count: chunks?.length || 0 });

        // Calculate cosine similarity for each chunk
        if (chunks && chunks.length > 0) {
          const chunksWithSimilarity = chunks
            .map(chunk => {
              try {
                // Handle embedding stored as string (JSON) rather than vector type
                let embedding;
                if (typeof chunk.embedding === 'string') {
                  embedding = JSON.parse(chunk.embedding);
                } else if (Array.isArray(chunk.embedding)) {
                  embedding = chunk.embedding;
                } else {
                  return null;
                }

                if (!Array.isArray(embedding) || embedding.length === 0) {
                  return null;
                }

                // Calculate cosine similarity
                const dotProduct = queryEmbedding.reduce((sum, a, i) => sum + a * embedding[i], 0);
                const queryMagnitude = Math.sqrt(queryEmbedding.reduce((sum, a) => sum + a * a, 0));
                const embeddingMagnitude = Math.sqrt(embedding.reduce((sum, a) => sum + a * a, 0));
                
                const similarity = dotProduct / (queryMagnitude * embeddingMagnitude);

                return {
                  ...chunk,
                  similarity
                };
              } catch (error) {
                logStep("Error calculating similarity for chunk", { chunkId: chunk.id, error: error.message });
                return null;
              }
            })
            .filter(chunk => chunk !== null && chunk.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

          results = chunksWithSimilarity.map(chunk => ({
            id: chunk.id,
            content: chunk.content,
            similarity: chunk.similarity,
            source: {
              id: chunk.knowledge_documents.knowledge_sources.id,
              name: chunk.knowledge_documents.knowledge_sources.name,
              type: chunk.knowledge_documents.knowledge_sources.source_type
            },
            document: {
              id: chunk.knowledge_documents.id,
              name: chunk.knowledge_documents.file_name
            },
            metadata: {
              chunk_index: chunk.chunk_index,
              token_count: chunk.token_count,
              ...chunk.metadata
            }
          }));
        }

      } catch (embeddingError) {
        logStep("Semantic search failed, falling back to keyword search", { error: embeddingError.message });
        // Fall back to keyword search
        searchType = 'keyword';
      }
    }

    if ((searchType === 'keyword' || results.length === 0) && searchType !== 'semantic') {
      // Keyword search using text similarity
      logStep("Performing keyword search");

      let searchQuery = supabase
        .from('knowledge_chunks')
        .select(`
          id,
          content,
          chunk_index,
          token_count,
          metadata,
          knowledge_documents!inner(
            id,
            file_name,
            source_id,
            knowledge_sources!inner(
              id,
              name,
              source_type
            )
          )
        `)
        .eq('user_id', user.id)
        .textSearch('content', query.replace(/\s+/g, ' & '));

      // Filter by source IDs if provided
      if (sourceIds.length > 0) {
        searchQuery = searchQuery.in('source_id', sourceIds);
      }

      // Filter by GPT ID if provided
      if (gptId) {
        searchQuery = searchQuery.eq('knowledge_documents.knowledge_sources.gpt_id', gptId);
      }

      const { data: chunks, error: searchError } = await searchQuery.limit(limit);

      if (searchError) {
        throw searchError;
      }

      if (chunks) {
        results = chunks.map(chunk => ({
          id: chunk.id,
          content: chunk.content,
          similarity: 0.5, // Default similarity for keyword search
          source: {
            id: chunk.knowledge_documents.knowledge_sources.id,
            name: chunk.knowledge_documents.knowledge_sources.name,
            type: chunk.knowledge_documents.knowledge_sources.source_type
          },
          document: {
            id: chunk.knowledge_documents.id,
            name: chunk.knowledge_documents.file_name
          },
          metadata: {
            chunk_index: chunk.chunk_index,
            token_count: chunk.token_count,
            ...chunk.metadata
          }
        }));
      }
    }

    const responseTime = Date.now() - startTime;
    
    logStep("Search completed", { 
      resultsCount: results.length, 
      responseTime,
      searchType: searchType === 'semantic' && !openaiApiKey ? 'keyword' : searchType
    });

    // Log search for analytics
    await supabase
      .from('knowledge_searches')
      .insert({
        user_id: user.id,
        gpt_id: gptId,
        query,
        search_type: searchType === 'semantic' && !openaiApiKey ? 'keyword' : searchType,
        results_count: results.length,
        response_time_ms: responseTime,
        metadata: {
          source_ids: sourceIds,
          threshold: searchType === 'semantic' ? threshold : null,
          limit
        }
      });

    return new Response(JSON.stringify({
      success: true,
      results,
      searchType: searchType === 'semantic' && !openaiApiKey ? 'keyword' : searchType,
      responseTime,
      totalResults: results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in knowledge-search", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);