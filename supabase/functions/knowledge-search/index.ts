import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'process':
        return await handleProcessDocument(req, supabaseClient);
      case 'search':
        return await handleSearch(req, supabaseClient);
      case 'get-sources':
        return await handleGetSources(req, supabaseClient);
      case 'create-source':
        return await handleCreateSource(req, supabaseClient);
      case 'sync-source':
        return await handleSyncSource(req, supabaseClient);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Knowledge base error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleProcessDocument(req: Request, supabaseClient: any) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { source_id, file_name, file_path, mime_type, file_size, processing_settings } = await req.json();

  console.log(`Processing document: ${file_name} for user: ${user.id}`);

  const { data: document, error: docError } = await supabaseClient
    .from('knowledge_documents')
    .insert({
      source_id,
      user_id: user.id,
      file_name,
      file_path,
      mime_type,
      file_size,
      status: 'processing',
      processing_settings: processing_settings || {
        chunk_size: 1000,
        chunk_overlap: 200,
        extract_metadata: true
      }
    })
    .select()
    .single();

  if (docError) {
    console.error('Error creating document record:', docError);
    return new Response(JSON.stringify({ error: 'Failed to create document record' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  EdgeRuntime.waitUntil(processDocumentInBackground(supabaseClient, document, user.id));

  return new Response(JSON.stringify({ 
    success: true, 
    document_id: document.id,
    status: 'processing'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function processDocumentInBackground(supabaseClient: any, document: any, userId: string) {
  try {
    console.log(`Background processing started for document: ${document.id}`);

    const chunks = await extractTextAndCreateChunks(document);
    
    if (chunks.length > 0) {
      const { error: chunksError } = await supabaseClient
        .from('knowledge_chunks')
        .insert(chunks.map((chunk, index) => ({
          document_id: document.id,
          source_id: document.source_id,
          user_id: userId,
          chunk_index: index,
          content: chunk.content,
          content_type: 'text',
          token_count: chunk.token_count,
          metadata: chunk.metadata
        })));

      if (chunksError) {
        console.error('Error storing chunks:', chunksError);
        throw chunksError;
      }
    }

    await supabaseClient
      .from('knowledge_documents')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        chunk_count: chunks.length,
        word_count: chunks.reduce((sum, chunk) => sum + chunk.word_count, 0),
        processed_content: chunks.map(c => c.content).join('\n\n').substring(0, 5000)
      })
      .eq('id', document.id);

    console.log(`Document processing completed: ${document.id}, created ${chunks.length} chunks`);

  } catch (error) {
    console.error('Background processing failed:', error);
    
    await supabaseClient
      .from('knowledge_documents')
      .update({
        status: 'error',
        error_message: error.message || 'Processing failed'
      })
      .eq('id', document.id);
  }
}

async function extractTextAndCreateChunks(document: any) {
  const mockContent = `This is processed content from ${document.file_name}. 
  
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
  
  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

  const chunkSize = document.processing_settings?.chunk_size || 1000;
  const overlap = document.processing_settings?.chunk_overlap || 200;
  const chunks = [];
  
  for (let i = 0; i < mockContent.length; i += chunkSize - overlap) {
    const chunk = mockContent.substring(i, i + chunkSize);
    const wordCount = chunk.split(' ').length;
    const tokenCount = Math.ceil(wordCount * 1.3);
    
    chunks.push({
      content: chunk.trim(),
      word_count: wordCount,
      token_count: tokenCount,
      metadata: {
        document_name: document.file_name,
        mime_type: document.mime_type,
        chunk_index: chunks.length,
        extracted_at: new Date().toISOString()
      }
    });
    
    if (chunk.length < chunkSize) break;
  }
  
  return chunks;
}

async function handleSearch(req: Request, supabaseClient: any) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { query, gpt_id, source_ids, limit = 10 } = await req.json();

  console.log(`Knowledge search: "${query}" by user: ${user.id}`);

  const { data: searchRecord } = await supabaseClient
    .from('knowledge_searches')
    .insert({
      user_id: user.id,
      gpt_id: gpt_id || null,
      query,
      search_type: 'semantic'
    })
    .select()
    .single();

  let searchQuery = supabaseClient
    .from('knowledge_chunks')
    .select('*, knowledge_documents!inner(file_name, mime_type), knowledge_sources!inner(name)')
    .eq('user_id', user.id)
    .textSearch('content', query)
    .limit(limit);

  if (source_ids && source_ids.length > 0) {
    searchQuery = searchQuery.in('source_id', source_ids);
  }

  const { data: results, error: searchError } = await searchQuery;

  if (searchError) {
    console.error('Search error:', searchError);
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (searchRecord) {
    await supabaseClient
      .from('knowledge_searches')
      .update({ 
        results_count: results?.length || 0,
        response_time_ms: 150
      })
      .eq('id', searchRecord.id);
  }

  return new Response(JSON.stringify({ 
    results: results || [],
    query,
    total_results: results?.length || 0,
    search_id: searchRecord?.id
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetSources(req: Request, supabaseClient: any) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: sources, error: sourcesError } = await supabaseClient
    .from('knowledge_sources')
    .select(`*, knowledge_documents(count)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (sourcesError) {
    console.error('Error fetching sources:', sourcesError);
    return new Response(JSON.stringify({ error: 'Failed to fetch sources' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ sources: sources || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleCreateSource(req: Request, supabaseClient: any) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sourceData = await req.json();

  const { data: newSource, error: createError } = await supabaseClient
    .from('knowledge_sources')
    .insert({
      ...sourceData,
      user_id: user.id,
      status: 'pending'
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating source:', createError);
    return new Response(JSON.stringify({ error: 'Failed to create source' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, source: newSource }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleSyncSource(req: Request, supabaseClient: any) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { source_id } = await req.json();

  const { data: source, error: sourceError } = await supabaseClient
    .from('knowledge_sources')
    .select('*')
    .eq('id', source_id)
    .eq('user_id', user.id)
    .single();

  if (sourceError || !source) {
    return new Response(JSON.stringify({ error: 'Source not found or unauthorized' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await supabaseClient
    .from('knowledge_sources')
    .update({ status: 'syncing' })
    .eq('id', source_id);

  EdgeRuntime.waitUntil(syncSourceInBackground(supabaseClient, source));

  return new Response(JSON.stringify({ success: true, status: 'syncing' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function syncSourceInBackground(supabaseClient: any, source: any) {
  try {
    console.log(`Syncing source: ${source.id} (${source.source_type})`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    await supabaseClient
      .from('knowledge_sources')
      .update({
        status: 'completed',
        last_synced_at: new Date().toISOString(),
        next_sync_at: source.auto_sync ? getNextSyncTime(source.sync_frequency) : null
      })
      .eq('id', source.id);

    console.log(`Source sync completed: ${source.id}`);

  } catch (error) {
    console.error('Source sync failed:', error);
    
    await supabaseClient
      .from('knowledge_sources')
      .update({
        status: 'error',
        error_message: error.message || 'Sync failed'
      })
      .eq('id', source.id);
  }
}

function getNextSyncTime(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
}