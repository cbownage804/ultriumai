import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json();

    if (action === 'speech-to-text') {
      return await handleSpeechToText(data);
    } else if (action === 'text-to-speech') {
      return await handleTextToSpeech(data);
    } else if (action === 'chat') {
      return await handleChat(data);
    } else {
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in voice chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleSpeechToText(data: any) {
  const { audio } = data;
  
  if (!audio) {
    throw new Error('No audio data provided');
  }

  // Process base64 audio in chunks to prevent memory issues
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

  const binaryAudio = processBase64Chunks(audio);
  
  const formData = new FormData();
  const blob = new Blob([binaryAudio], { type: 'audio/webm' });
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-1');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${await response.text()}`);
  }

  const result = await response.json();

  return new Response(
    JSON.stringify({ text: result.text }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleTextToSpeech(data: any) {
  const { text, voice = 'Sarah' } = data;
  
  if (!text) {
    throw new Error('Text is required');
  }

  // ElevenLabs voice IDs
  const voiceIds = {
    'Sarah': 'EXAVITQu4vr4xnSDxMaL',
    'Aria': '9BWtsMINqrJLrRacOk9x',
    'Roger': 'CwhRBWXzGAHq8TQ4Fs17',
    'Laura': 'FGY2WhTYpPnrIDTdsKH5',
    'Charlie': 'IKne3meq5aSn9XLyUdCD'
  };

  const voiceId = voiceIds[voice as keyof typeof voiceIds] || voiceIds.Sarah;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY'),
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.5,
        use_speaker_boost: true
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64Audio = btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer))
  );

  return new Response(
    JSON.stringify({ audioContent: base64Audio }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleChat(data: any) {
  const { message, context, metrics } = data;
  
  if (!message) {
    throw new Error('Message is required');
  }

  const systemPrompt = `You are SafeShield AI, an advanced cybersecurity assistant integrated into the SafeShield platform. Your role is to help security analysts understand threats, respond to incidents, and manage their security posture.

Current Security Context:
- Security Score: ${metrics?.security_score || 'N/A'}/100
- Active Incidents: ${metrics?.active_incidents || 'N/A'}
- Protected Endpoints: ${metrics?.protected_endpoints || 'N/A'}
- Threats Blocked (24h): ${metrics?.threats_blocked_24h || 'N/A'}
- Current Tab: ${context?.activeTab || 'Overview'}

Guidelines:
- Provide concise, actionable security advice
- Reference the current security metrics when relevant
- Suggest specific remediation steps for threats
- Explain complex security concepts in simple terms
- Be proactive about potential security risks
- Keep responses focused and under 150 words for voice clarity

Remember: You're an expert security analyst helping to protect critical infrastructure.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate response');
  }

  const result = await response.json();
  const aiResponse = result.choices[0].message.content;

  return new Response(
    JSON.stringify({ response: aiResponse }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}