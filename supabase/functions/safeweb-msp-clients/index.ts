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
      // List MSP clients with stats
      const { data: clients, error } = await supabaseClient
        .from('safeweb_msp_clients')
        .select(`
          *,
          assets:safeweb_assets(count),
          threats:safeweb_threats(count)
        `)
        .eq('msp_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching MSP clients:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch clients' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get threat counts by severity for each client
      const clientsWithStats = await Promise.all(
        clients.map(async (client) => {
          const { data: threatStats } = await supabaseClient
            .from('safeweb_threats')
            .select('severity')
            .eq('msp_client_id', client.id);

          const stats = {
            total_threats: threatStats?.length || 0,
            critical_threats: threatStats?.filter(t => t.severity === 'critical').length || 0,
            high_threats: threatStats?.filter(t => t.severity === 'high').length || 0,
            medium_threats: threatStats?.filter(t => t.severity === 'medium').length || 0,
            low_threats: threatStats?.filter(t => t.severity === 'low').length || 0,
          };

          return {
            ...client,
            threat_stats: stats
          };
        })
      );

      return new Response(
        JSON.stringify({ clients: clientsWithStats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST') {
      // Create new MSP client
      const {
        company_name,
        domain,
        contact_name,
        contact_email,
        contact_phone,
        billing_email,
        subscription_plan = 'basic',
        monthly_price,
        max_assets
      } = await req.json();

      if (!company_name || !contact_name || !contact_email) {
        return new Response(
          JSON.stringify({ error: 'Company name, contact name and email are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Set defaults based on subscription plan
      const planDefaults = {
        basic: { monthly_price: 299.00, max_assets: 10 },
        professional: { monthly_price: 599.00, max_assets: 50 },
        enterprise: { monthly_price: 1299.00, max_assets: 200 }
      };

      const defaults = planDefaults[subscription_plan as keyof typeof planDefaults] || planDefaults.basic;

      const { data: client, error } = await supabaseClient
        .from('safeweb_msp_clients')
        .insert({
          msp_user_id: user.id,
          company_name,
          domain,
          contact_name,
          contact_email,
          contact_phone,
          billing_email: billing_email || contact_email,
          subscription_plan,
          subscription_status: 'trial',
          monthly_price: monthly_price || defaults.monthly_price,
          max_assets: max_assets || defaults.max_assets,
          settings: {
            notifications: true,
            auto_scan: true,
            alert_threshold: 'medium'
          },
          branding: {
            company_name: company_name,
            primary_color: '#3b82f6',
            logo_url: null
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating MSP client:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to create client' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ client, message: 'Client created successfully' }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'PUT') {
      // Update MSP client
      const clientId = url.searchParams.get('id');
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'Client ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates = await req.json();
      const allowedUpdates = [
        'company_name', 'domain', 'contact_name', 'contact_email', 'contact_phone',
        'billing_email', 'subscription_plan', 'subscription_status', 'monthly_price',
        'max_assets', 'settings', 'branding'
      ];

      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      filteredUpdates.updated_at = new Date().toISOString();

      const { data: client, error } = await supabaseClient
        .from('safeweb_msp_clients')
        .update(filteredUpdates)
        .eq('id', clientId)
        .eq('msp_user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating MSP client:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update client' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ client }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'DELETE') {
      // Delete MSP client
      const clientId = url.searchParams.get('id');
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'Client ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // First check if client has any active assets or threats
      const { data: assets } = await supabaseClient
        .from('safeweb_assets')
        .select('id')
        .eq('msp_client_id', clientId);

      if (assets && assets.length > 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Cannot delete client with active assets. Please remove all assets first.' 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseClient
        .from('safeweb_msp_clients')
        .delete()
        .eq('id', clientId)
        .eq('msp_user_id', user.id);

      if (error) {
        console.error('Error deleting MSP client:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete client' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Client deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('MSP Clients API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});