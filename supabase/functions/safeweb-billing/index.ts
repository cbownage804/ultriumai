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
    const action = url.searchParams.get('action');

    if (method === 'GET' && action === 'revenue_summary') {
      // Get MSP revenue summary
      const { data: billingRecords, error } = await supabaseClient
        .from('safeweb_msp_billing')
        .select(`
          *,
          client:safeweb_msp_clients(company_name, subscription_plan)
        `)
        .eq('msp_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching billing records:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch billing data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate summary statistics
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const currentMonthRecords = billingRecords.filter(record => 
        record.billing_period_start.startsWith(currentMonth)
      );

      const summary = {
        total_monthly_revenue: currentMonthRecords.reduce((sum, record) => sum + Number(record.msp_profit), 0),
        total_annual_revenue: billingRecords.reduce((sum, record) => sum + Number(record.msp_profit), 0),
        total_clients: new Set(billingRecords.map(record => record.client_id)).size,
        average_revenue_per_client: 0,
        revenue_by_plan: {
          basic: 0,
          professional: 0,
          enterprise: 0
        },
        recent_invoices: billingRecords.slice(0, 10)
      };

      if (summary.total_clients > 0) {
        summary.average_revenue_per_client = summary.total_monthly_revenue / summary.total_clients;
      }

      // Calculate revenue by plan
      currentMonthRecords.forEach(record => {
        const plan = record.client?.subscription_plan || 'basic';
        summary.revenue_by_plan[plan as keyof typeof summary.revenue_by_plan] += Number(record.msp_profit);
      });

      return new Response(
        JSON.stringify({ summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST' && action === 'generate_billing') {
      // Generate billing records for all active clients
      const { billing_period } = await req.json();
      
      if (!billing_period) {
        return new Response(
          JSON.stringify({ error: 'Billing period is required (YYYY-MM format)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get all active MSP clients
      const { data: clients, error: clientsError } = await supabaseClient
        .from('safeweb_msp_clients')
        .select('*')
        .eq('msp_user_id', user.id)
        .eq('subscription_status', 'active');

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch clients' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const billingRecords = [];
      const [year, month] = billing_period.split('-');
      const periodStart = `${year}-${month}-01`;
      const periodEnd = new Date(parseInt(year), parseInt(month), 0).toISOString().slice(0, 10);

      for (const client of clients) {
        // Get asset count for the client
        const { data: assets } = await supabaseClient
          .from('safeweb_assets')
          .select('id')
          .eq('msp_client_id', client.id)
          .eq('status', 'active');

        // Get threat count for the billing period
        const { data: threats } = await supabaseClient
          .from('safeweb_threats')
          .select('id')
          .eq('msp_client_id', client.id)
          .gte('created_at', `${periodStart}T00:00:00Z`)
          .lte('created_at', `${periodEnd}T23:59:59Z`);

        const assetCount = assets?.length || 0;
        const threatCount = threats?.length || 0;
        
        // Calculate fees based on plan
        const clientCharge = Number(client.monthly_price);
        const ultriumFeeRate = 0.35; // 35% to Ultrium
        const ultriumFee = clientCharge * ultriumFeeRate;
        const mspProfit = clientCharge - ultriumFee;

        const billingRecord = {
          msp_user_id: user.id,
          client_id: client.id,
          billing_period_start: periodStart,
          billing_period_end: periodEnd,
          client_charge: clientCharge,
          ultrium_fee: ultriumFee,
          msp_profit: mspProfit,
          asset_count: assetCount,
          threat_count: threatCount,
          status: 'pending',
          metadata: {
            plan: client.subscription_plan,
            generated_at: new Date().toISOString()
          }
        };

        const { data: record, error: recordError } = await supabaseClient
          .from('safeweb_msp_billing')
          .insert(billingRecord)
          .select()
          .single();

        if (!recordError && record) {
          billingRecords.push(record);
        }
      }

      return new Response(
        JSON.stringify({ 
          message: `Generated ${billingRecords.length} billing records`,
          records: billingRecords 
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'PUT' && action === 'update_status') {
      // Update billing record status
      const { record_id, status, invoice_id, paid_at } = await req.json();
      
      if (!record_id || !status) {
        return new Response(
          JSON.stringify({ error: 'Record ID and status are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const updates: any = { status };
      if (invoice_id) updates.invoice_id = invoice_id;
      if (paid_at) updates.paid_at = paid_at;
      if (status === 'paid' && !paid_at) updates.paid_at = new Date().toISOString();

      const { data: record, error } = await supabaseClient
        .from('safeweb_msp_billing')
        .update(updates)
        .eq('id', record_id)
        .eq('msp_user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating billing record:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to update billing record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ record }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'GET') {
      // List billing records
      const clientId = url.searchParams.get('client_id');
      const period = url.searchParams.get('period');
      
      let query = supabaseClient
        .from('safeweb_msp_billing')
        .select(`
          *,
          client:safeweb_msp_clients(company_name, subscription_plan)
        `)
        .eq('msp_user_id', user.id);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (period) {
        query = query.eq('billing_period_start', `${period}-01`);
      }

      const { data: records, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching billing records:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch billing records' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ records }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Billing API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});