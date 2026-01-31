import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, userId, clientId, analysisType } = await req.json();

    if (!images || images.length === 0 || !userId) {
      throw new Error('Images and user ID are required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build image content for vision analysis
    const imageContents = images.slice(0, 10).map((img: string) => ({
      type: "image_url",
      image_url: {
        url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
      }
    }));

    const analysisPrompts: Record<string, string> = {
      network_diagram: `Analyze this network diagram and extract:
- Network topology structure
- All devices (routers, switches, firewalls, servers, endpoints)
- IP addresses and subnets if visible
- VLANs and network segments
- Security zones
- Connection types (wired, wireless, VPN)`,

      screenshot: `Analyze this system screenshot and extract:
- Operating system and version
- Installed software visible
- System specifications shown
- Network configuration visible
- Any security software or settings
- Hostname and domain information`,

      hardware: `Analyze this hardware image and extract:
- Device type (server, workstation, network device, etc.)
- Manufacturer and model if visible
- Physical specifications
- Port configurations
- Status indicators
- Serial numbers or asset tags if visible`,

      rack_diagram: `Analyze this server rack/data center image and extract:
- Equipment in each rack unit
- Cable management observations
- Power distribution visible
- Cooling infrastructure
- Physical security measures
- Space utilization`
    };

    const prompt = analysisPrompts[analysisType] || analysisPrompts.screenshot;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert IT asset analyst. Analyze images of IT infrastructure, network diagrams, screenshots, and hardware to extract detailed asset inventory information.

${prompt}

Return a JSON object with this structure:
{
  "assets": [
    {
      "name": "Asset name/hostname",
      "type": "server" | "workstation" | "network_device" | "security_appliance" | "storage" | "peripheral" | "other",
      "manufacturer": "Manufacturer if identifiable",
      "model": "Model if identifiable",
      "specifications": {
        "os": "Operating system",
        "cpu": "CPU info",
        "memory": "RAM",
        "storage": "Storage info",
        "network": "Network adapters/IPs"
      },
      "location": "Physical or logical location",
      "connections": ["Connected to asset 1", "Connected to asset 2"],
      "notes": "Additional observations",
      "confidence": 0.0-1.0
    }
  ],
  "networkTopology": {
    "segments": ["Segment names"],
    "subnets": ["10.0.0.0/24"],
    "securityZones": ["DMZ", "Internal", "Guest"]
  },
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "warnings": ["Potential issue 1"],
  "summary": "Brief overview of what was discovered"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: "text",
                text: `Analyze these ${images.length} image(s) and extract all IT assets and infrastructure information you can identify. Be thorough and note confidence levels for each finding.`
              },
              ...imageContents
            ]
          }
        ],
        max_tokens: 6000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    if (!analysis) {
      analysis = {
        assets: [],
        networkTopology: {},
        recommendations: [],
        warnings: ['AI analysis could not extract structured data'],
        summary: 'Analysis incomplete'
      };
    }

    // Optionally save discovered assets to the database
    if (clientId && analysis.assets && analysis.assets.length > 0) {
      const assetsToInsert = analysis.assets
        .filter((a: any) => a.confidence >= 0.7)
        .map((asset: any) => ({
          name: asset.name || 'Discovered Asset',
          description: asset.notes || '',
          category_id: null,
          manufacturer: asset.manufacturer,
          model: asset.model,
          specifications: asset.specifications,
          location: asset.location,
          status: 'active',
          user_id: userId,
          client_id: clientId,
          notes: `Auto-discovered via AI vision analysis. Confidence: ${(asset.confidence * 100).toFixed(0)}%`
        }));

      if (assetsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('assets')
          .insert(assetsToInsert);

        if (insertError) {
          console.error('Error inserting assets:', insertError);
          analysis.warnings = analysis.warnings || [];
          analysis.warnings.push('Some assets could not be saved to inventory');
        } else {
          analysis.savedAssetsCount = assetsToInsert.length;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        imagesAnalyzed: images.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Asset analyzer error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
