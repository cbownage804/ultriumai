import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assetId, userId } = await req.json();

    if (!assetId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Asset ID and User ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch asset details and maintenance history
    const { data: asset } = await supabase
      .from('assets')
      .select(`
        *,
        category:asset_categories(name, icon),
        maintenance:asset_maintenance(*),
        history:asset_history(*)
      `)
      .eq('id', assetId)
      .eq('user_id', userId)
      .single();

    if (!asset) {
      return new Response(
        JSON.stringify({ error: 'Asset not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate asset age and usage patterns
    const purchaseDate = asset.purchase_date ? new Date(asset.purchase_date) : null;
    const assetAge = purchaseDate ? 
      Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0;

    const maintenanceHistory = asset.maintenance || [];
    const lastMaintenance = maintenanceHistory
      .filter((m: any) => m.completed_date)
      .sort((a: any, b: any) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime())[0];

    const systemPrompt = `You are an AI asset maintenance predictor. Analyze asset data and predict maintenance needs.
    
    Consider these factors:
    - Asset age and depreciation
    - Maintenance history frequency and types
    - Industry standards for the asset category
    - Historical failure patterns
    - Warranty status and coverage
    
    Provide predictions for:
    1. Next maintenance date (estimate)
    2. Predicted maintenance type needed
    3. Risk level (low/medium/high)
    4. Estimated cost range
    5. Specific recommendations
    6. Early warning signs to watch for`;

    const userPrompt = `Analyze this asset for predictive maintenance:

Asset Details:
- Name: ${asset.name}
- Category: ${asset.category?.name || 'Unknown'}
- Manufacturer: ${asset.manufacturer || 'Unknown'}
- Model: ${asset.model || 'Unknown'}
- Age: ${assetAge} years
- Status: ${asset.status}
- Location: ${asset.location || 'Unknown'}
- Current Value: $${asset.current_value || asset.purchase_price || 0}

Maintenance History (${maintenanceHistory.length} records):
${maintenanceHistory.slice(0, 10).map((m: any) => 
  `- ${m.maintenance_type}: ${m.description} (${m.completed_date || 'Scheduled'})`
).join('\n')}

Last Maintenance: ${lastMaintenance ? 
  `${lastMaintenance.maintenance_type} on ${lastMaintenance.completed_date}` : 
  'No maintenance records'}

Warranty: ${asset.warranty_expiry ? 
  `Expires ${asset.warranty_expiry}` : 
  'No warranty info'}

Provide a comprehensive maintenance prediction analysis.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content;

    // Calculate simple metrics
    const daysSinceLastMaintenance = lastMaintenance ? 
      Math.floor((Date.now() - new Date(lastMaintenance.completed_date).getTime()) / (1000 * 60 * 60 * 24)) : 
      assetAge * 365;

    const maintenanceFrequency = maintenanceHistory.length > 0 ? 
      (assetAge * 365) / maintenanceHistory.length : 
      365; // Default to yearly if no history

    const riskScore = Math.min(100, Math.max(0, 
      (daysSinceLastMaintenance / maintenanceFrequency) * 50 + 
      (assetAge * 5) + 
      (asset.status === 'maintenance' ? 25 : 0)
    ));

    const prediction = {
      assetId,
      riskScore: Math.round(riskScore),
      riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
      daysSinceLastMaintenance,
      maintenanceFrequency: Math.round(maintenanceFrequency),
      estimatedNextMaintenance: Math.round(maintenanceFrequency - daysSinceLastMaintenance),
      analysis,
      recommendations: [
        ...(riskScore > 70 ? ['Schedule maintenance inspection immediately'] : []),
        ...(assetAge > 5 ? ['Consider replacement planning'] : []),
        ...(daysSinceLastMaintenance > 365 ? ['Overdue for routine maintenance'] : []),
        'Monitor performance metrics closely',
        'Update asset documentation'
      ],
      metrics: {
        assetAge,
        maintenanceCount: maintenanceHistory.length,
        daysSinceLastMaintenance,
        warrantyStatus: asset.warranty_expiry ? 
          (new Date(asset.warranty_expiry) > new Date() ? 'Active' : 'Expired') : 
          'Unknown'
      }
    };

    return new Response(
      JSON.stringify({ prediction }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Predictive maintenance error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});