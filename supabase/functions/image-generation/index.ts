import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { prompt, quality = "high" } = await req.json()

    const RUNWARE_API_KEY = Deno.env.get('RUNWARE_API_KEY')
    if (!RUNWARE_API_KEY) {
      throw new Error('RUNWARE_API_KEY is not set')
    }

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log("Generating image with prompt:", prompt)

    // First authenticate, then generate image
    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          "taskType": "authentication",
          "apiKey": RUNWARE_API_KEY
        },
        {
          "taskType": "imageInference",
          "taskUUID": crypto.randomUUID(),
          "positivePrompt": prompt,
          "width": 1024,
          "height": 1024,
          "model": "runware:100@1",
          "numberResults": 1,
          "outputFormat": "WEBP",
          "CFGScale": 1,
          "scheduler": "FlowMatchEulerDiscreteScheduler",
          "strength": 0.8
        }
      ])
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Runware response:", data)

    // Find the image inference result
    const imageResult = data.data?.find((item: any) => item.taskType === "imageInference")
    
    if (!imageResult || !imageResult.imageURL) {
      throw new Error('No image URL returned from Runware')
    }

    return new Response(JSON.stringify({ 
      image: imageResult.imageURL,
      prompt: prompt 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in image-generation function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})