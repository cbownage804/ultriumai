import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = "9BWtsMINqrJLrRacOk9x", apiKey, userId } = await req.json();
    
    if (!text) {
      throw new Error('Text is required');
    }

    let ELEVENLABS_API_KEY = apiKey;
    
    // If no customer API key provided, use the default
    if (!ELEVENLABS_API_KEY) {
      ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
      if (!ELEVENLABS_API_KEY) {
        throw new Error('ElevenLabs API key not available');
      }
    }

    console.log(`Generating speech for ${userId ? 'user ' + userId : 'system'}`);
    console.log('Text preview:', text.substring(0, 100) + '...');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      
      // If customer API key failed, try with default
      if (apiKey && !apiKey.startsWith('sk-')) {
        console.log('Customer API key failed, falling back to default');
        throw new Error('Invalid customer API key provided');
      }
      
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Convert audio to base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log('Successfully generated audio, size:', audioBuffer.byteLength);

    return new Response(JSON.stringify({ 
      audioContent: base64Audio,
      mimeType: 'audio/mpeg',
      voiceUsed: voice,
      apiKeyType: apiKey ? 'customer' : 'default'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gpt-voice-tts function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallbackAvailable: true 
    }), {
      status: error.message.includes('Invalid customer API key') ? 400 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});