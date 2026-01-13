import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all assets and software for the user
    const { data: assets } = await supabase
      .from('assets')
      .select(`
        *,
        category:asset_categories(name, icon),
        maintenance:asset_maintenance(*)
      `)
      .eq('user_id', userId);

    const { data: software } = await supabase
      .from('software_assets')
      .select('*')
      .eq('user_id', userId);

    const alerts = [];
    const currentDate = new Date();

    // Check warranty expirations
    assets?.forEach(asset => {
      if (asset.warranty_expiry) {
        const warrantyDate = new Date(asset.warranty_expiry);
        const daysUntilExpiry = Math.ceil((warrantyDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          alerts.push({
            type: 'warranty_expiring',
            severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
            title: `Warranty Expiring Soon`,
            message: `${asset.name} warranty expires in ${daysUntilExpiry} days`,
            assetId: asset.id,
            assetName: asset.name,
            daysRemaining: daysUntilExpiry,
            category: 'warranty'
          });
        } else if (daysUntilExpiry <= 0) {
          alerts.push({
            type: 'warranty_expired',
            severity: 'high',
            title: `Warranty Expired`,
            message: `${asset.name} warranty expired ${Math.abs(daysUntilExpiry)} days ago`,
            assetId: asset.id,
            assetName: asset.name,
            daysOverdue: Math.abs(daysUntilExpiry),
            category: 'warranty'
          });
        }
      }
    });

    // Check software license expirations
    software?.forEach(sw => {
      if (sw.expiry_date) {
        const expiryDate = new Date(sw.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          alerts.push({
            type: 'license_expiring',
            severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
            title: `Software License Expiring`,
            message: `${sw.name} license expires in ${daysUntilExpiry} days`,
            softwareId: sw.id,
            softwareName: sw.name,
            daysRemaining: daysUntilExpiry,
            category: 'software'
          });
        }
      }

      // Check license compliance
      if (sw.seats_used > sw.seats_total) {
        alerts.push({
          type: 'license_over_limit',
          severity: 'high',
          title: `License Over-Usage`,
          message: `${sw.name} is using ${sw.seats_used}/${sw.seats_total} licenses`,
          softwareId: sw.id,
          softwareName: sw.name,
          overageCount: sw.seats_used - sw.seats_total,
          category: 'compliance'
        });
      }
    });

    // Check for assets needing maintenance
    assets?.forEach(asset => {
      const maintenance = asset.maintenance || [];
      const lastMaintenance = maintenance
        .filter((m: any) => m.completed_date)
        .sort((a: any, b: any) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime())[0];

      if (lastMaintenance) {
        const daysSinceLastMaintenance = Math.floor((currentDate.getTime() - new Date(lastMaintenance.completed_date).getTime()) / (1000 * 60 * 60 * 24));
        
        // Alert if no maintenance in over a year
        if (daysSinceLastMaintenance > 365) {
          alerts.push({
            type: 'maintenance_overdue',
            severity: daysSinceLastMaintenance > 730 ? 'high' : 'medium',
            title: `Maintenance Overdue`,
            message: `${asset.name} hasn't been maintained in ${daysSinceLastMaintenance} days`,
            assetId: asset.id,
            assetName: asset.name,
            daysOverdue: daysSinceLastMaintenance - 365,
            category: 'maintenance'
          });
        }
      } else {
        // No maintenance history - check asset age
        if (asset.purchase_date) {
          const assetAge = Math.floor((currentDate.getTime() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24));
          if (assetAge > 365) {
            alerts.push({
              type: 'maintenance_needed',
              severity: 'medium',
              title: `Maintenance Required`,
              message: `${asset.name} has no maintenance history and is ${Math.floor(assetAge / 365)} years old`,
              assetId: asset.id,
              assetName: asset.name,
              assetAge: Math.floor(assetAge / 365),
              category: 'maintenance'
            });
          }
        }
      }

      // Check for assets in maintenance status
      if (asset.status === 'maintenance') {
        alerts.push({
          type: 'asset_in_maintenance',
          severity: 'medium',
          title: `Asset Under Maintenance`,
          message: `${asset.name} is currently under maintenance`,
          assetId: asset.id,
          assetName: asset.name,
          category: 'status'
        });
      }

      // Check for lost or disposed assets
      if (asset.status === 'lost') {
        alerts.push({
          type: 'asset_lost',
          severity: 'high',
          title: `Asset Reported Lost`,
          message: `${asset.name} is marked as lost`,
          assetId: asset.id,
          assetName: asset.name,
          category: 'security'
        });
      }
    });

    // Sort alerts by severity and date
    const sortedAlerts = alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    // Generate summary
    const summary = {
      total: alerts.length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      categories: {
        warranty: alerts.filter(a => a.category === 'warranty').length,
        software: alerts.filter(a => a.category === 'software').length,
        maintenance: alerts.filter(a => a.category === 'maintenance').length,
        compliance: alerts.filter(a => a.category === 'compliance').length,
        security: alerts.filter(a => a.category === 'security').length,
        status: alerts.filter(a => a.category === 'status').length
      }
    };

    return new Response(
      JSON.stringify({ 
        alerts: sortedAlerts,
        summary,
        generatedAt: currentDate.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart alerts error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});