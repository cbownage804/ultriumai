import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DOCUMENT-PROCESSOR] ${step}${detailsStr}`);
};

// Text extraction utilities
const extractTextFromHtml = (html: string): string => {
  // Simple HTML tag removal and text extraction
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const splitIntoChunks = (text: string, chunkSize: number = 1000, overlap: number = 200): string[] => {
  const chunks: string[] = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
};

// Generate embeddings using OpenAI
const generateEmbedding = async (text: string, openaiApiKey: string): Promise<number[]> => {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
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
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

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

    const { documentId, forceReprocess = false } = await req.json();

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      throw new Error('Document not found or access denied');
    }

    // Check if already processed and not forcing reprocess
    if (document.status === 'completed' && !forceReprocess) {
      logStep("Document already processed", { documentId });
      return new Response(JSON.stringify({
        success: true,
        message: 'Document already processed',
        documentId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Processing document", { 
      documentId, 
      fileName: document.file_name, 
      mimeType: document.mime_type 
    });

    // Update document status to processing
    await supabase
      .from('knowledge_documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    let extractedText = '';
    let wordCount = 0;

    try {
      // Extract text based on file type
      if (document.mime_type === 'text/html' || document.mime_type.includes('html')) {
        extractedText = extractTextFromHtml(document.raw_content || '');
      } else if (document.mime_type === 'text/plain' || document.mime_type.includes('text/')) {
        extractedText = document.raw_content || '';
      } else if (document.processed_content) {
        // Use existing processed content
        extractedText = document.processed_content;
      } else {
        // For other file types, we'd need specialized processors
        // For now, use raw content as fallback
        extractedText = document.raw_content || document.file_name;
      }

      if (!extractedText.trim()) {
        throw new Error('No text content could be extracted from the document');
      }

      wordCount = extractedText.split(/\s+/).filter(word => word.length > 0).length;
      
      logStep("Text extracted", { 
        documentId, 
        textLength: extractedText.length, 
        wordCount 
      });

      // Split text into chunks
      const chunks = splitIntoChunks(extractedText, 800, 100); // Smaller chunks for better embeddings
      logStep("Text chunked", { documentId, chunkCount: chunks.length });

      // Delete existing chunks if reprocessing
      if (forceReprocess) {
        await supabase
          .from('knowledge_chunks')
          .delete()
          .eq('document_id', documentId);
      }

      // Process chunks and generate embeddings
      const chunkInserts = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const tokenCount = Math.ceil(chunk.split(/\s+/).length * 1.3); // Rough token estimate

        try {
          // Generate embedding for this chunk
          const embedding = await generateEmbedding(chunk, openaiApiKey);
          
          chunkInserts.push({
            document_id: documentId,
            source_id: document.source_id,
            user_id: user.id,
            chunk_index: i,
            content: chunk,
            content_type: 'text',
            token_count: tokenCount,
            embedding: JSON.stringify(embedding), // Store as JSON string
            metadata: {
              start_char: extractedText.indexOf(chunk),
              end_char: extractedText.indexOf(chunk) + chunk.length,
              word_count: chunk.split(/\s+/).length
            }
          });

          logStep("Chunk processed", { documentId, chunkIndex: i, tokenCount });

        } catch (embeddingError) {
          logStep("Error generating embedding for chunk", { 
            documentId, 
            chunkIndex: i, 
            error: embeddingError.message 
          });
          
          // Continue with other chunks, but log the error
          chunkInserts.push({
            document_id: documentId,
            source_id: document.source_id,
            user_id: user.id,
            chunk_index: i,
            content: chunk,
            content_type: 'text',
            token_count: tokenCount,
            embedding: null,
            metadata: {
              start_char: extractedText.indexOf(chunk),
              end_char: extractedText.indexOf(chunk) + chunk.length,
              word_count: chunk.split(/\s+/).length,
              embedding_error: embeddingError.message
            }
          });
        }
      }

      // Bulk insert chunks
      if (chunkInserts.length > 0) {
        const { error: chunksError } = await supabase
          .from('knowledge_chunks')
          .insert(chunkInserts);

        if (chunksError) {
          throw new Error(`Failed to insert chunks: ${chunksError.message}`);
        }
      }

      // Update document with processed information
      await supabase
        .from('knowledge_documents')
        .update({
          status: 'completed',
          processed_content: extractedText,
          word_count: wordCount,
          chunk_count: chunks.length,
          processed_at: new Date().toISOString(),
          error_message: null
        })
        .eq('id', documentId);

      // Update source statistics
      const { data: sourceStats } = await supabase
        .from('knowledge_documents')
        .select('chunk_count, file_size')
        .eq('source_id', document.source_id)
        .eq('status', 'completed');

      if (sourceStats) {
        const totalChunks = sourceStats.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0);
        const totalSize = sourceStats.reduce((sum, doc) => sum + (doc.file_size || 0), 0);

        await supabase
          .from('knowledge_sources')
          .update({
            file_count: sourceStats.length,
            total_size_bytes: totalSize,
            metadata: { total_chunks: totalChunks }
          })
          .eq('id', document.source_id);
      }

      logStep("Document processing completed", { 
        documentId, 
        wordCount, 
        chunkCount: chunks.length 
      });

      return new Response(JSON.stringify({
        success: true,
        documentId,
        wordCount,
        chunkCount: chunks.length,
        textLength: extractedText.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (processingError) {
      logStep("Document processing error", { 
        documentId, 
        error: processingError.message 
      });

      // Update document status to error
      await supabase
        .from('knowledge_documents')
        .update({
          status: 'error',
          error_message: processingError.message
        })
        .eq('id', documentId);

      throw processingError;
    }

  } catch (error: any) {
    logStep("ERROR in document-processor", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);