import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductBilling {
  product: string;
  monthly_revenue: number;
  annual_revenue: number;
  client_count: number;
  records: any[];
}

interface PackageBilling {
  package: string;
  monthly_revenue: number;
  annual_revenue: number;
  client_count: number;
  apps: {
    [key: string]: {
      revenue: number;
      clients: number;
    };
  };
}

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

    // Check if user is UltriumAI admin
    const isUltriumAdmin = user.email?.endsWith('@ultriumai.com') || false;
    console.log(`User ${user.email} - UltriumAI Admin: ${isUltriumAdmin}`);

    if (method === 'GET' && action === 'unified_summary') {
      // Get unified revenue summary by packages and products
      const packages = {
        starter: ['safescan'],
        professional: ['safepass', 'safekb', 'safenet', 'safescore'],
        enterprise: ['safeweb', 'safeshield']
      };
      
      const summary = {
        total_monthly_revenue: 0,
        total_annual_revenue: 0,
        total_clients: 0,
        total_msps: 0,
        packages: [] as PackageBilling[],
        products: [] as ProductBilling[],
        top_performing_msps: [] as any[],
        revenue_trends: [] as any[]
      };

      // Process by packages first
      for (const [packageName, apps] of Object.entries(packages)) {
        const packageData: PackageBilling = {
          package: packageName.charAt(0).toUpperCase() + packageName.slice(1),
          monthly_revenue: 0,
          annual_revenue: 0,
          client_count: 0,
          apps: {}
        };

        for (const product of apps) {
          try {
            const tableName = `${product}_msp_billing`;
            
            let query = supabaseClient
              .from(tableName)
              .select(`
                *,
                client:${product}_msp_clients(company_name, subscription_plan)
              `);

            // If not UltriumAI admin, filter by user
            if (!isUltriumAdmin) {
              query = query.eq('msp_user_id', user.id);
            }

            const { data: billingRecords, error } = await query.order('created_at', { ascending: false });

            if (!error && billingRecords) {
              const currentMonth = new Date().toISOString().slice(0, 7);
              const currentMonthRecords = billingRecords.filter(record => 
                record.billing_period_start?.startsWith(currentMonth)
              );

              const monthlyRevenue = currentMonthRecords.reduce((sum, record) => 
                sum + Number(record.msp_profit || 0), 0);
              const annualRevenue = billingRecords.reduce((sum, record) => 
                sum + Number(record.msp_profit || 0), 0);
              const clientCount = new Set(billingRecords.map(record => record.client_id)).size;

              // Add to package totals
              packageData.monthly_revenue += monthlyRevenue;
              packageData.annual_revenue += annualRevenue;
              packageData.client_count += clientCount;
              
              // Add to overall totals
              summary.total_monthly_revenue += monthlyRevenue;
              summary.total_annual_revenue += annualRevenue;
              summary.total_clients += clientCount;

              // Store app-specific data
              packageData.apps[product.toUpperCase()] = {
                revenue: annualRevenue,
                clients: clientCount
              };

              // Also maintain product-level data for backward compatibility
              summary.products.push({
                product: product.toUpperCase(),
                monthly_revenue: monthlyRevenue,
                annual_revenue: annualRevenue,
                client_count: clientCount,
                records: billingRecords.slice(0, 5)
              });
            }
          } catch (error) {
            console.log(`No billing table found for ${product}:`, error.message);
            // Continue to next product if table doesn't exist
          }
        }

        if (packageData.monthly_revenue > 0 || packageData.annual_revenue > 0) {
          summary.packages.push(packageData);
        }
      }

      // Get MSP count (only for admins)
      if (isUltriumAdmin) {
        const { data: msps } = await supabaseClient
          .from('msps')
          .select('id, company_name, user_id')
          .eq('is_active', true);
        
        summary.total_msps = msps?.length || 0;

        // Get top performing MSPs across all products
        const mspPerformance = new Map();
        
        for (const product of summary.products) {
          for (const record of product.records) {
            const mspId = record.msp_user_id;
            if (!mspPerformance.has(mspId)) {
              mspPerformance.set(mspId, {
                msp_user_id: mspId,
                total_revenue: 0,
                products: new Set()
              });
            }
            mspPerformance.get(mspId).total_revenue += Number(record.msp_profit || 0);
            mspPerformance.get(mspId).products.add(product.product);
          }
        }

        summary.top_performing_msps = Array.from(mspPerformance.values())
          .map(msp => ({
            ...msp,
            products: Array.from(msp.products)
          }))
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 10);
      }

      return new Response(
        JSON.stringify({ summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'GET' && action === 'all_billing_records') {
      // Get all billing records across products (admin only)
      if (!isUltriumAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const products = ['safeweb', 'safenet', 'safeshield'];
      const allRecords = [];

      for (const product of products) {
        try {
          const tableName = `${product}_msp_billing`;
          const { data: records, error } = await supabaseClient
            .from(tableName)
            .select(`
              *,
              client:${product}_msp_clients(company_name, subscription_plan),
              msp:msps!inner(company_name, user_id)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

          if (!error && records) {
            records.forEach(record => {
              allRecords.push({
                ...record,
                product: product.toUpperCase()
              });
            });
          }
        } catch (error) {
          console.log(`No billing table found for ${product}:`, error.message);
        }
      }

      // Sort all records by date
      allRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return new Response(
        JSON.stringify({ records: allRecords }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'GET' && action === 'msp_analytics') {
      // Get detailed MSP analytics (admin only)
      if (!isUltriumAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get all MSPs with their performance data
      const { data: msps, error: mspError } = await supabaseClient
        .from('msps')
        .select('*')
        .eq('is_active', true);

      if (mspError) {
        throw mspError;
      }

      const analytics = [];
      const products = ['safeweb', 'safenet', 'safeshield'];

      for (const msp of msps || []) {
        const mspData = {
          msp_id: msp.id,
          msp_name: msp.company_name,
          user_id: msp.user_id,
          created_at: msp.created_at,
          total_revenue: 0,
          monthly_revenue: 0,
          client_count: 0,
          products: {} as any
        };

        for (const product of products) {
          try {
            const tableName = `${product}_msp_billing`;
            const { data: billingRecords } = await supabaseClient
              .from(tableName)
              .select('*')
              .eq('msp_user_id', msp.user_id);

            if (billingRecords) {
              const currentMonth = new Date().toISOString().slice(0, 7);
              const monthlyRecords = billingRecords.filter(record => 
                record.billing_period_start?.startsWith(currentMonth)
              );

              const productRevenue = billingRecords.reduce((sum, record) => 
                sum + Number(record.msp_profit || 0), 0);
              const productMonthlyRevenue = monthlyRecords.reduce((sum, record) => 
                sum + Number(record.msp_profit || 0), 0);
              const productClients = new Set(billingRecords.map(record => record.client_id)).size;

              mspData.total_revenue += productRevenue;
              mspData.monthly_revenue += productMonthlyRevenue;
              mspData.client_count += productClients;
              
              mspData.products[product] = {
                revenue: productRevenue,
                monthly_revenue: productMonthlyRevenue,
                clients: productClients,
                active: productClients > 0
              };
            }
          } catch (error) {
            console.log(`No billing table found for ${product}:`, error.message);
          }
        }

        analytics.push(mspData);
      }

      // Sort by total revenue
      analytics.sort((a, b) => b.total_revenue - a.total_revenue);

      return new Response(
        JSON.stringify({ analytics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST' && action === 'generate_unified_billing') {
      // Generate billing across all products for a specific MSP or all MSPs (admin)
      const { billing_period, msp_user_id } = await req.json();
      
      if (!billing_period) {
        return new Response(
          JSON.stringify({ error: 'Billing period is required (YYYY-MM format)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determine target MSPs
      let targetMsps = [];
      if (isUltriumAdmin && !msp_user_id) {
        // Admin generating for all MSPs
        const { data: allMsps } = await supabaseClient
          .from('msps')
          .select('user_id, company_name')
          .eq('is_active', true);
        targetMsps = allMsps || [];
      } else {
        // Generate for specific MSP (self or admin-specified)
        const userId = msp_user_id || user.id;
        if (isUltriumAdmin || userId === user.id) {
          targetMsps = [{ user_id: userId }];
        } else {
          return new Response(
            JSON.stringify({ error: 'Unauthorized to generate billing for other MSPs' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const results = [];
      const products = ['safeweb', 'safenet', 'safeshield'];

      for (const msp of targetMsps) {
        for (const product of products) {
          try {
            // Call individual product billing generation
            const { data, error } = await supabaseClient.functions.invoke(
              `${product}-billing`,
              {
                body: JSON.stringify({
                  action: 'generate_billing',
                  billing_period,
                  msp_user_id: msp.user_id
                })
              }
            );

            if (!error && data) {
              results.push({
                product: product.toUpperCase(),
                msp_user_id: msp.user_id,
                records_generated: data.records?.length || 0
              });
            }
          } catch (error) {
            console.log(`Error generating billing for ${product}:`, error.message);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          message: `Generated billing across ${products.length} products for ${targetMsps.length} MSP(s)`,
          results 
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'GET') {
      // List billing records for current user or all (admin)
      const product = url.searchParams.get('product');
      const clientId = url.searchParams.get('client_id');
      const period = url.searchParams.get('period');
      const status = url.searchParams.get('status');
      
      if (product && ['safeweb', 'safenet', 'safeshield'].includes(product)) {
        // Get records for specific product
        const tableName = `${product}_msp_billing`;
        
        let query = supabaseClient
          .from(tableName)
          .select(`
            *,
            client:${product}_msp_clients(company_name, subscription_plan)
          `);

        // Apply user filter for non-admins
        if (!isUltriumAdmin) {
          query = query.eq('msp_user_id', user.id);
        }

        // Apply additional filters
        if (clientId) query = query.eq('client_id', clientId);
        if (period) query = query.eq('billing_period_start', `${period}-01`);
        if (status) query = query.eq('status', status);

        const { data: records, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching billing records:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch billing records' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            records: records?.map(record => ({ ...record, product: product.toUpperCase() })) || [] 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Get aggregated records across all products
        const products = ['safeweb', 'safenet', 'safeshield'];
        const allRecords = [];

        for (const prod of products) {
          try {
            const tableName = `${prod}_msp_billing`;
            
            let query = supabaseClient
              .from(tableName)
              .select(`
                *,
                client:${prod}_msp_clients(company_name, subscription_plan)
              `);

            if (!isUltriumAdmin) {
              query = query.eq('msp_user_id', user.id);
            }

            if (period) query = query.eq('billing_period_start', `${period}-01`);
            if (status) query = query.eq('status', status);

            const { data: records } = await query.order('created_at', { ascending: false }).limit(50);

            if (records) {
              records.forEach(record => {
                allRecords.push({
                  ...record,
                  product: prod.toUpperCase()
                });
              });
            }
          } catch (error) {
            console.log(`No billing table found for ${prod}:`, error.message);
          }
        }

        // Sort by creation date
        allRecords.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return new Response(
          JSON.stringify({ records: allRecords }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unified billing API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});