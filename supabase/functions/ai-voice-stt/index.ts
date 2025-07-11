import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mimeType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Received audio data, length:', audio.length);
    console.log('MIME type:', mimeType || 'not provided');

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    console.log('Processed binary audio, size:', binaryAudio.length);
    
    // Determine file extension and MIME type
    let fileExtension = 'webm';
    let contentType = 'audio/webm';
    
    if (mimeType) {
      if (mimeType.includes('webm')) {
        fileExtension = 'webm';
        contentType = 'audio/webm';
      } else if (mimeType.includes('mp4')) {
        fileExtension = 'mp4';
        contentType = 'audio/mp4';
      } else if (mimeType.includes('ogg')) {
        fileExtension = 'ogg';
        contentType = 'audio/ogg';
      } else if (mimeType.includes('wav')) {
        fileExtension = 'wav';
        contentType = 'audio/wav';
      }
    }
    
    console.log('Using file extension:', fileExtension, 'and content type:', contentType);
    
    // Prepare form data
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: contentType });
    formData.append('file', blob, `audio.${fileExtension}`);
    formData.append('model', 'whisper-1');

    console.log('Sending to OpenAI Whisper API...');

    // Send to OpenAI Whisper
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log('OpenAI response:', result);

    return new Response(
      JSON.stringify({ text: result.text || '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-voice-stt function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});