import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Manufacturer warranty page patterns
const manufacturerPatterns: Record<string, { name: string; warrantyUrl: string; serialPatterns: RegExp[] }> = {
  dell: {
    name: 'Dell',
    warrantyUrl: 'https://www.dell.com/support/home/en-us/product-support/servicetag/',
    serialPatterns: [/^[A-Z0-9]{7}$/i, /^[A-Z0-9]{5}-[A-Z0-9]{7}$/i]
  },
  hp: {
    name: 'HP / Hewlett-Packard',
    warrantyUrl: 'https://support.hp.com/us-en/check-warranty',
    serialPatterns: [/^[A-Z]{3}[A-Z0-9]{7}$/i, /^[A-Z0-9]{10}$/i]
  },
  lenovo: {
    name: 'Lenovo',
    warrantyUrl: 'https://pcsupport.lenovo.com/us/en/warranty-lookup',
    serialPatterns: [/^[A-Z0-9]{8}$/i, /^[A-Z]{2}[A-Z0-9]{6}$/i]
  },
  apple: {
    name: 'Apple',
    warrantyUrl: 'https://checkcoverage.apple.com/',
    serialPatterns: [/^[A-Z0-9]{12}$/i, /^[A-Z0-9]{10,14}$/i]
  },
  microsoft: {
    name: 'Microsoft',
    warrantyUrl: 'https://support.microsoft.com/en-us/devices',
    serialPatterns: [/^\d{12}$/]
  },
  samsung: {
    name: 'Samsung',
    warrantyUrl: 'https://www.samsung.com/us/support/warranty/',
    serialPatterns: [/^[A-Z0-9]{15}$/i, /^[A-Z]\d{3}[A-Z0-9]{11}$/i]
  },
  asus: {
    name: 'ASUS',
    warrantyUrl: 'https://www.asus.com/support/warranty-status-inquiry/',
    serialPatterns: [/^[A-Z0-9]{14,15}$/i]
  },
  cisco: {
    name: 'Cisco',
    warrantyUrl: 'https://cway.cisco.com/sncheck/',
    serialPatterns: [/^[A-Z]{3}[A-Z0-9]{8}$/i]
  }
};

function identifyManufacturer(serialNumber: string): { manufacturer: string; warrantyUrl: string } | null {
  const cleanSerial = serialNumber.replace(/[\s-]/g, '').toUpperCase();
  
  for (const [key, info] of Object.entries(manufacturerPatterns)) {
    for (const pattern of info.serialPatterns) {
      if (pattern.test(cleanSerial)) {
        return { manufacturer: info.name, warrantyUrl: info.warrantyUrl };
      }
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serialNumber, deviceName, userId } = await req.json();

    if (!serialNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Serial number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY_1');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing warranty lookup for serial:', serialNumber);

    // Step 1: Identify manufacturer from serial number pattern
    const manufacturerInfo = identifyManufacturer(serialNumber);
    
    // Step 2: Search for warranty information using Firecrawl
    const searchQuery = manufacturerInfo 
      ? `${manufacturerInfo.manufacturer} warranty check serial number ${serialNumber}`
      : `warranty lookup serial number ${serialNumber} check coverage`;

    console.log('Searching with query:', searchQuery);

    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown']
        }
      }),
    });

    let scrapedContent = '';
    let sourceUrl = '';

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('Search results:', searchData?.data?.length || 0, 'results');
      
      if (searchData?.data && searchData.data.length > 0) {
        // Combine relevant results
        scrapedContent = searchData.data
          .slice(0, 3)
          .map((result: any) => `Source: ${result.url}\n${result.markdown || result.description || ''}`)
          .join('\n\n---\n\n');
        sourceUrl = searchData.data[0]?.url || '';
      }
    }

    // Step 3: If we identified a manufacturer, also try to scrape their warranty page
    if (manufacturerInfo && !scrapedContent) {
      console.log('Scraping manufacturer warranty page:', manufacturerInfo.warrantyUrl);
      
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: manufacturerInfo.warrantyUrl,
          formats: ['markdown'],
          onlyMainContent: true
        }),
      });

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        if (scrapeData?.data?.markdown) {
          scrapedContent = scrapeData.data.markdown;
          sourceUrl = manufacturerInfo.warrantyUrl;
        }
      }
    }

    // Step 4: Use AI to analyze the warranty information
    const systemPrompt = `You are a warranty analysis expert. Analyze the provided information about a device warranty and extract structured data.

Your task is to:
1. Identify the manufacturer and model if possible
2. Determine the warranty status (active, expired, or unknown)
3. Extract warranty end date if available
4. Identify coverage type (standard, extended, accidental protection, etc.)
5. List available repair options
6. Provide support contact information
7. Give a brief analysis summary

If information is not available from the scraped data, provide reasonable estimates based on industry standards for the identified manufacturer.

Respond in this JSON format:
{
  "manufacturer": "string or null",
  "model": "string or null",
  "warranty_status": "active" | "expired" | "unknown",
  "warranty_end_date": "YYYY-MM-DD or null",
  "coverage_type": "string describing coverage",
  "repair_options": ["array of repair options"],
  "support_contacts": {
    "phone": "phone number or null",
    "website": "support website or null",
    "chat": "chat url or null"
  },
  "ai_analysis": "Brief paragraph summarizing the warranty situation and recommendations"
}`;

    const userPrompt = `Analyze the warranty information for this device:

Serial Number: ${serialNumber}
${deviceName ? `Device Name: ${deviceName}` : ''}
${manufacturerInfo ? `Identified Manufacturer: ${manufacturerInfo.manufacturer}` : 'Manufacturer: Unknown - please identify from serial number format'}

${scrapedContent ? `Scraped Warranty Information:\n${scrapedContent.substring(0, 8000)}` : 'No warranty page data could be retrieved. Please provide estimates based on the serial number pattern and manufacturer.'}

Provide a comprehensive warranty analysis.`;

    console.log('Sending to AI for analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'warranty_analysis',
            description: 'Structured warranty analysis result',
            parameters: {
              type: 'object',
              properties: {
                manufacturer: { type: 'string', nullable: true },
                model: { type: 'string', nullable: true },
                warranty_status: { type: 'string', enum: ['active', 'expired', 'unknown'] },
                warranty_end_date: { type: 'string', nullable: true },
                coverage_type: { type: 'string' },
                repair_options: { type: 'array', items: { type: 'string' } },
                support_contacts: {
                  type: 'object',
                  properties: {
                    phone: { type: 'string', nullable: true },
                    website: { type: 'string', nullable: true },
                    chat: { type: 'string', nullable: true }
                  }
                },
                ai_analysis: { type: 'string' }
              },
              required: ['warranty_status', 'coverage_type', 'ai_analysis']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'warranty_analysis' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let warrantyData;
    
    // Extract from tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        warrantyData = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
      }
    }
    
    // Fallback: try to parse from content
    if (!warrantyData) {
      const content = aiData.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          warrantyData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to parse JSON from content:', e);
        }
      }
    }

    if (!warrantyData) {
      warrantyData = {
        manufacturer: manufacturerInfo?.manufacturer || null,
        model: null,
        warranty_status: 'unknown',
        warranty_end_date: null,
        coverage_type: 'Unknown',
        repair_options: [],
        support_contacts: {},
        ai_analysis: 'Unable to determine warranty status. Please check directly with the manufacturer.'
      };
    }

    // Step 5: Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const warrantyRecord = {
      user_id: userId,
      serial_number: serialNumber,
      device_name: deviceName || warrantyData.model || null,
      manufacturer: warrantyData.manufacturer,
      model: warrantyData.model,
      warranty_end_date: warrantyData.warranty_end_date,
      warranty_status: warrantyData.warranty_status,
      coverage_type: warrantyData.coverage_type,
      repair_options: warrantyData.repair_options || [],
      support_contacts: warrantyData.support_contacts || {},
      raw_warranty_data: { scrapedContent: scrapedContent?.substring(0, 5000), searchQuery },
      ai_analysis: warrantyData.ai_analysis,
      source_url: sourceUrl,
      last_checked_at: new Date().toISOString()
    };

    const { data: savedRecord, error: saveError } = await supabase
      .from('safetrack_warranties')
      .upsert(warrantyRecord, { 
        onConflict: 'user_id,serial_number',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save warranty record:', saveError);
    }

    console.log('Warranty lookup completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...warrantyData,
          serial_number: serialNumber,
          source_url: sourceUrl,
          id: savedRecord?.id || null
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Warranty lookup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to lookup warranty' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
