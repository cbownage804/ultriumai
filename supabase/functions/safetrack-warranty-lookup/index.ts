import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Manufacturer warranty page patterns - improved for better detection
const manufacturerPatterns: Record<string, { 
  name: string; 
  warrantyUrl: (serial: string) => string;
  searchQueries: (serial: string, device?: string) => string[];
  serialPatterns: RegExp[];
  aliases?: string[];
}> = {
  dell: {
    name: 'Dell',
    aliases: ['Alienware', 'XPS', 'Latitude', 'Precision', 'Inspiron', 'OptiPlex', 'PowerEdge', 'Vostro'],
    warrantyUrl: (serial) => `https://www.dell.com/support/home/en-us/product-support/servicetag/${serial}/overview`,
    searchQueries: (serial, device) => [
      `site:dell.com/support service tag ${serial} warranty`,
      `Dell ${device || ''} service tag ${serial} warranty status`,
      `${serial} Dell warranty expiration coverage`
    ],
    // Dell service tags: 7 alphanumeric chars (most common), also 5-char express service codes
    serialPatterns: [/^[A-Z0-9]{5,7}$/i, /^[A-Z0-9]{5}-[A-Z0-9]{7}$/i]
  },
  hp: {
    name: 'HP / Hewlett-Packard',
    aliases: ['Pavilion', 'EliteBook', 'ProBook', 'Spectre', 'Envy', 'Omen', 'ZBook'],
    warrantyUrl: (serial) => `https://support.hp.com/us-en/check-warranty`,
    searchQueries: (serial, device) => [
      `site:support.hp.com ${serial} warranty check`,
      `HP ${device || ''} serial ${serial} warranty status`,
      `${serial} HP warranty expiration`
    ],
    serialPatterns: [/^[A-Z]{3}[A-Z0-9]{7}$/i, /^[A-Z0-9]{10}$/i, /^[A-Z0-9]{12}$/i]
  },
  lenovo: {
    name: 'Lenovo',
    aliases: ['ThinkPad', 'ThinkCentre', 'ThinkStation', 'IdeaPad', 'Legion', 'Yoga'],
    warrantyUrl: (serial) => `https://pcsupport.lenovo.com/us/en/products/${serial}`,
    searchQueries: (serial, device) => [
      `site:pcsupport.lenovo.com ${serial} warranty`,
      `Lenovo ${device || ''} serial ${serial} warranty status`,
      `${serial} Lenovo warranty check`
    ],
    serialPatterns: [/^[A-Z0-9]{8}$/i, /^[A-Z]{2}[A-Z0-9]{6}$/i, /^PF[A-Z0-9]{6}$/i]
  },
  apple: {
    name: 'Apple',
    aliases: ['MacBook', 'iMac', 'Mac Pro', 'Mac Mini', 'iPhone', 'iPad'],
    warrantyUrl: (serial) => `https://checkcoverage.apple.com/`,
    searchQueries: (serial, device) => [
      `site:support.apple.com ${serial} coverage`,
      `Apple ${device || ''} serial ${serial} AppleCare status`,
      `${serial} Apple warranty check`
    ],
    serialPatterns: [/^[A-Z0-9]{10,14}$/i]
  },
  microsoft: {
    name: 'Microsoft',
    aliases: ['Surface', 'Xbox'],
    warrantyUrl: (serial) => `https://account.microsoft.com/devices`,
    searchQueries: (serial, device) => [
      `site:support.microsoft.com ${serial} warranty`,
      `Microsoft ${device || ''} serial ${serial} coverage`,
      `Surface ${serial} warranty status`
    ],
    serialPatterns: [/^\d{12}$/]
  },
  asus: {
    name: 'ASUS',
    aliases: ['ROG', 'TUF', 'ZenBook', 'VivoBook', 'Strix'],
    warrantyUrl: (serial) => `https://www.asus.com/support/warranty-status-inquiry/`,
    searchQueries: (serial, device) => [
      `site:asus.com ${serial} warranty`,
      `ASUS ${device || ''} serial ${serial} warranty`,
      `ROG ${serial} warranty status`
    ],
    serialPatterns: [/^[A-Z0-9]{14,15}$/i, /^[A-Z]{1,2}[A-Z0-9]{12,14}$/i]
  },
  acer: {
    name: 'Acer',
    aliases: ['Predator', 'Aspire', 'Nitro', 'Swift'],
    warrantyUrl: (serial) => `https://www.acer.com/ac/en/US/content/support`,
    searchQueries: (serial, device) => [
      `site:acer.com ${serial} warranty`,
      `Acer ${device || ''} serial ${serial} warranty`
    ],
    serialPatterns: [/^[A-Z0-9]{22}$/i]
  },
  msi: {
    name: 'MSI',
    aliases: ['Stealth', 'Raider', 'Creator'],
    warrantyUrl: (serial) => `https://www.msi.com/support`,
    searchQueries: (serial, device) => [
      `site:msi.com ${serial} warranty`,
      `MSI ${device || ''} serial ${serial} warranty`
    ],
    serialPatterns: [/^[A-Z0-9]{16,20}$/i]
  }
};

function identifyManufacturer(serialNumber: string, deviceName?: string): { 
  manufacturer: string; 
  warrantyUrl: string;
  searchQueries: string[];
} | null {
  const cleanSerial = serialNumber.replace(/[\s-]/g, '').toUpperCase();
  const deviceLower = (deviceName || '').toLowerCase();
  
  // First check device name for manufacturer hints
  for (const [key, info] of Object.entries(manufacturerPatterns)) {
    // Check main name
    if (deviceLower.includes(key)) {
      return { 
        manufacturer: info.name, 
        warrantyUrl: info.warrantyUrl(cleanSerial),
        searchQueries: info.searchQueries(cleanSerial, deviceName)
      };
    }
    // Check aliases (e.g., "Alienware" -> Dell)
    if (info.aliases?.some(alias => deviceLower.includes(alias.toLowerCase()))) {
      return { 
        manufacturer: info.name, 
        warrantyUrl: info.warrantyUrl(cleanSerial),
        searchQueries: info.searchQueries(cleanSerial, deviceName)
      };
    }
  }
  
  // Fall back to serial number pattern matching
  for (const [key, info] of Object.entries(manufacturerPatterns)) {
    for (const pattern of info.serialPatterns) {
      if (pattern.test(cleanSerial)) {
        return { 
          manufacturer: info.name, 
          warrantyUrl: info.warrantyUrl(cleanSerial),
          searchQueries: info.searchQueries(cleanSerial, deviceName)
        };
      }
    }
  }
  
  return null;
}

async function scrapeWithFirecrawl(apiKey: string, url: string): Promise<{ success: boolean; markdown?: string; error?: string }> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Scrape failed: ${response.status}` };
    }

    const data = await response.json();
    return { 
      success: true, 
      markdown: data?.data?.markdown || data?.markdown || '' 
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Scrape failed' };
  }
}

async function searchWithFirecrawl(apiKey: string, query: string): Promise<{ success: boolean; results?: any[]; error?: string }> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: { formats: ['markdown'] }
      }),
    });

    if (!response.ok) {
      return { success: false, error: `Search failed: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, results: data?.data || [] };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Search failed' };
  }
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

    const cleanSerial = serialNumber.replace(/[\s-]/g, '').toUpperCase();
    console.log('Processing warranty lookup for serial:', cleanSerial, 'device:', deviceName);

    // Step 1: Identify manufacturer from serial number pattern AND device name
    const manufacturerInfo = identifyManufacturer(cleanSerial, deviceName);
    
    let scrapedContent = '';
    let sourceUrl = '';
    const allSources: string[] = [];

    // Step 2: Try direct manufacturer warranty page first (best source)
    if (manufacturerInfo) {
      console.log('Identified manufacturer:', manufacturerInfo.manufacturer);
      console.log('Scraping manufacturer warranty URL:', manufacturerInfo.warrantyUrl);
      
      const directScrape = await scrapeWithFirecrawl(firecrawlApiKey, manufacturerInfo.warrantyUrl);
      if (directScrape.success && directScrape.markdown) {
        scrapedContent = directScrape.markdown;
        sourceUrl = manufacturerInfo.warrantyUrl;
        allSources.push(manufacturerInfo.warrantyUrl);
        console.log('Direct scrape successful, got', scrapedContent.length, 'chars');
      }
    }

    // Step 3: Search with manufacturer-specific queries
    if (manufacturerInfo?.searchQueries) {
      for (const query of manufacturerInfo.searchQueries.slice(0, 2)) {
        console.log('Searching:', query);
        const searchResult = await searchWithFirecrawl(firecrawlApiKey, query);
        
        if (searchResult.success && searchResult.results?.length) {
          const relevantResults = searchResult.results
            .filter((r: any) => r.markdown && r.markdown.length > 200)
            .slice(0, 2);
          
          for (const result of relevantResults) {
            scrapedContent += `\n\n---\nSource: ${result.url}\n${result.markdown}`;
            allSources.push(result.url);
          }
          
          if (!sourceUrl && relevantResults.length > 0) {
            sourceUrl = relevantResults[0].url;
          }
        }
      }
    }

    // Step 4: Fallback generic search if no manufacturer identified
    if (!scrapedContent) {
      const genericQuery = `warranty lookup serial number ${cleanSerial} ${deviceName || ''} check coverage expiration`;
      console.log('Fallback search:', genericQuery);
      
      const searchResult = await searchWithFirecrawl(firecrawlApiKey, genericQuery);
      if (searchResult.success && searchResult.results?.length) {
        scrapedContent = searchResult.results
          .slice(0, 3)
          .map((r: any) => `Source: ${r.url}\n${r.markdown || r.description || ''}`)
          .join('\n\n---\n\n');
        sourceUrl = searchResult.results[0]?.url || '';
      }
    }

    console.log('Total scraped content:', scrapedContent.length, 'chars from', allSources.length, 'sources');

    // Step 5: Use AI to analyze the warranty information
    const systemPrompt = `You are a warranty analysis expert specializing in IT hardware. Analyze the provided information about a device warranty and extract structured data.

IMPORTANT CONTEXT:
- Alienware is a Dell subsidiary - all Alienware products use Dell's warranty system and service tags
- Dell service tags are 7 alphanumeric characters
- For gaming laptops (Alienware, ROG, Predator, etc.), standard warranties are typically 1 year with optional extended warranties

Your task:
1. Identify the manufacturer and exact model/product line
2. Determine the warranty status based on any dates found or industry standards
3. Extract specific warranty end date if found in the scraped data
4. Identify coverage type (Basic, Premium Support, ProSupport, Accidental Damage, etc.)
5. List available repair options for this manufacturer
6. Provide accurate support contact information
7. Give actionable recommendations

If the scraped data doesn't contain specific warranty dates for this serial number, provide:
- Industry-standard warranty periods for this type of product
- Direct links to check warranty online
- Clear guidance on how the user can verify their specific coverage

Response MUST be valid JSON with this structure:
{
  "manufacturer": "string",
  "model": "string describing product line",
  "warranty_status": "active" | "expired" | "unknown",
  "warranty_end_date": "YYYY-MM-DD or null",
  "coverage_type": "specific coverage description",
  "repair_options": ["array of specific repair options"],
  "support_contacts": {
    "phone": "phone number",
    "website": "direct support URL",
    "chat": "live chat URL or null"
  },
  "ai_analysis": "Detailed paragraph with warranty analysis, findings, and recommendations"
}`;

    const userPrompt = `Analyze the warranty for this device:

Serial Number / Service Tag: ${cleanSerial}
Device Name: ${deviceName || 'Not specified'}
Identified Manufacturer: ${manufacturerInfo?.manufacturer || 'Unknown'}
Manufacturer Warranty Portal: ${manufacturerInfo?.warrantyUrl || 'Unknown'}

${scrapedContent ? `\n=== SCRAPED WARRANTY INFORMATION ===\n${scrapedContent.substring(0, 12000)}` : '\nNo warranty page data could be retrieved.'}

Provide a comprehensive warranty analysis. If specific warranty dates weren't found for this serial number, clearly state that and provide guidance on how to verify the warranty status directly.`;

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
                manufacturer: { type: 'string' },
                model: { type: 'string' },
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
              required: ['manufacturer', 'warranty_status', 'coverage_type', 'ai_analysis']
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

    // Provide sensible defaults with manufacturer-specific info
    if (!warrantyData) {
      const mfr = manufacturerInfo?.manufacturer || 'Unknown';
      warrantyData = {
        manufacturer: mfr,
        model: deviceName || null,
        warranty_status: 'unknown',
        warranty_end_date: null,
        coverage_type: 'Standard Limited Hardware Warranty',
        repair_options: ['Contact manufacturer support', 'Authorized service center'],
        support_contacts: {
          phone: mfr === 'Dell' ? '1-800-624-9896' : null,
          website: manufacturerInfo?.warrantyUrl || null,
          chat: null
        },
        ai_analysis: `Unable to retrieve specific warranty data for this ${mfr} device. Please visit the manufacturer's warranty portal directly to check your coverage.`
      };
    }

    // Step 6: Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const warrantyRecord = {
      user_id: userId,
      serial_number: cleanSerial,
      device_name: deviceName || warrantyData.model || null,
      manufacturer: warrantyData.manufacturer,
      model: warrantyData.model,
      warranty_end_date: warrantyData.warranty_end_date,
      warranty_status: warrantyData.warranty_status,
      coverage_type: warrantyData.coverage_type,
      repair_options: warrantyData.repair_options || [],
      support_contacts: warrantyData.support_contacts || {},
      raw_warranty_data: { 
        scrapedContent: scrapedContent?.substring(0, 5000), 
        sources: allSources,
        searchQueries: manufacturerInfo?.searchQueries || []
      },
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
          serial_number: cleanSerial,
          source_url: sourceUrl,
          sources: allSources,
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
