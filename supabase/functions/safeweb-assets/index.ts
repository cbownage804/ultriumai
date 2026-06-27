import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    if (method === 'GET') {
      // List user's assets
      const clientId = url.searchParams.get('client_id');
      
      let query = supabaseClient
        .from('safeweb_assets')
        .select(`
          *,
          safeweb_threats(
            id,
            severity,
            status,
            created_at
          )
        `);

      // If client_id is provided, filter by MSP client
      if (clientId) {
        query = query.eq('msp_client_id', clientId);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data: assets, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch assets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ assets }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST') {
      // Read request body once
      const requestBody = await req.json();
      
      // Check if this is a delete action
      if (requestBody.action === 'delete') {
        // Handle delete via POST
        const assetId = requestBody.id;
        console.log('DELETE via POST request received for asset:', assetId);
        console.log('User ID:', user.id);
        
        if (!assetId) {
          console.log('No asset ID provided');
          return new Response(
            JSON.stringify({ error: 'Asset ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Attempting to delete asset:', assetId, 'for user:', user.id);
        const { error } = await supabaseClient
          .from('safeweb_assets')
          .delete()
          .eq('id', assetId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting asset:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to delete asset', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Asset deleted successfully via POST');
        return new Response(
          JSON.stringify({ message: 'Asset deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle update via POST (so id can travel in body reliably)
      if (requestBody.action === 'update') {
        const assetId = requestBody.id;
        const updates = requestBody.updates ?? {};

        if (!assetId) {
          return new Response(
            JSON.stringify({ error: 'Asset ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const allowedUpdates = ['status', 'scan_frequency', 'metadata'];
        const filteredUpdates: Record<string, unknown> = {};
        for (const key of Object.keys(updates)) {
          if (allowedUpdates.includes(key)) filteredUpdates[key] = updates[key];
        }
        filteredUpdates.updated_at = new Date().toISOString();

        const { data: asset, error } = await supabaseClient
          .from('safeweb_assets')
          .update(filteredUpdates)
          .eq('id', assetId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating asset via POST:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to update asset', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ asset }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Regular asset creation - only if not a delete action
      const { asset_type, asset_value, scan_frequency = 'daily', msp_client_id } = requestBody;

      if (!asset_type || !asset_value) {
        return new Response(
          JSON.stringify({ error: 'Asset type and value are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate asset type
      const validTypes = ['email', 'domain', 'brand', 'executive', 'ip_range'];
      if (!validTypes.includes(asset_type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid asset type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if asset already exists for this user
      const { data: existingAsset } = await supabaseClient
        .from('safeweb_assets')
        .select('id')
        .eq('user_id', user.id)
        .eq('asset_value', asset_value)
        .eq('asset_type', asset_type)
        .maybeSingle();

      if (existingAsset) {
        return new Response(
          JSON.stringify({ error: 'Asset already exists' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create the asset
      const { data: asset, error } = await supabaseClient
        .from('safeweb_assets')
        .insert({
          user_id: user.id,
          msp_client_id: msp_client_id || null,
          asset_type,
          asset_value,
          scan_frequency,
          status: 'active',
          metadata: {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating asset:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create asset' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Trigger initial scan
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/safeweb-scanner`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            asset_id: asset.id,
            scan_type: 'manual'
          })
        });
      } catch (scanError) {
        console.error('Failed to trigger initial scan:', scanError);
        // Don't fail the asset creation if scan fails
      }

      return new Response(
        JSON.stringify({ asset, message: 'Asset created and initial scan started' }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'PUT') {
      // Update asset
      const assetId = url.searchParams.get('id');
      if (!assetId) {
        return new Response(
          JSON.stringify({ error: 'Asset ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates = await req.json();
      const allowedUpdates = ['status', 'scan_frequency', 'metadata'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      filteredUpdates.updated_at = new Date().toISOString();

      const { data: asset, error } = await supabaseClient
        .from('safeweb_assets')
        .update(filteredUpdates)
        .eq('id', assetId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating asset:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update asset' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ asset }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'DELETE') {
      // Delete asset - handle both query param and body approaches
      console.log('DELETE request received');
      let assetId;
      
      try {
        // Try to get from query params first
        assetId = url.searchParams.get('id');
        
        // If not in query params, try request body
        if (!assetId) {
          const body = await req.json();
          assetId = body?.id;
        }
      } catch (error) {
        console.error('Error parsing DELETE request:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid request format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Asset ID from request:', assetId);
      console.log('User ID:', user.id);
      
      if (!assetId) {
        console.log('No asset ID provided');
        return new Response(
          JSON.stringify({ error: 'Asset ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Attempting to delete asset:', assetId, 'for user:', user.id);
      const { error } = await supabaseClient
        .from('safeweb_assets')
        .delete()
        .eq('id', assetId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting asset:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete asset', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Asset deleted successfully');
      return new Response(
        JSON.stringify({ message: 'Asset deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Assets API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});