import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt, size = "1024x1024", quality = "high" } = await req.json()

    const huggingFaceToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')
    if (!huggingFaceToken) {
      throw new Error('Hugging Face access token not configured')
    }

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log('Generating image with prompt:', prompt, 'size:', size)

    // Determine aspect ratio description for the prompt
    let aspectRatioPrompt = ""
    if (size === "1536x1024") {
      aspectRatioPrompt = " --ar 3:2 landscape orientation"
    } else if (size === "1024x1536") {
      aspectRatioPrompt = " --ar 2:3 portrait orientation"
    } else {
      aspectRatioPrompt = " --ar 1:1 square format"
    }

    const hf = new HfInference(huggingFaceToken)

    const image = await hf.textToImage({
      inputs: prompt + aspectRatioPrompt,
      model: 'black-forest-labs/FLUX.1-schnell',
    })

    // Convert the blob to a base64 string
    const arrayBuffer = await image.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    console.log('Image generated successfully')

    return new Response(
      JSON.stringify({ image: `data:image/png;base64,${base64}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in image-generation function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})