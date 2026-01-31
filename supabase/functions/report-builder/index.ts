import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WidgetConfig {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'table' | 'metric' | 'gauge' | 'heatmap';
  title: string;
  dataSource: string;
  query?: string;
  filters?: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
  options?: Record<string, any>;
}

interface ReportData {
  widgets: WidgetConfig[];
  data: Record<string, any[]>;
  generated_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();
    console.log(`[report-builder] Action: ${action}`);

    switch (action) {
      case 'fetch_widget_data': {
        const { widget, user_id, date_range } = params;
        
        const data = await fetchDataForWidget(supabase, widget, user_id, date_range);
        
        return new Response(JSON.stringify({ 
          success: true, 
          widget_id: widget.id,
          data 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'generate_report': {
        const { report_id, user_id, date_range } = params;
        
        // Get report configuration
        const { data: report, error } = await supabase
          .from('bi_reports')
          .select('*')
          .eq('id', report_id)
          .eq('user_id', user_id)
          .single();

        if (error || !report) {
          throw new Error('Report not found');
        }

        const widgets = (report.report_config as any[]) || [];
        const reportData: Record<string, any[]> = {};

        // Fetch data for each widget
        for (const widget of widgets) {
          try {
            reportData[widget.id] = await fetchDataForWidget(supabase, widget, user_id, date_range);
          } catch (e) {
            console.error(`Failed to fetch data for widget ${widget.id}:`, e);
            reportData[widget.id] = [];
          }
        }

        // Update last generated timestamp
        await supabase
          .from('bi_reports')
          .update({ last_generated_at: new Date().toISOString() })
          .eq('id', report_id);

        const result: ReportData = {
          widgets: widgets as WidgetConfig[],
          data: reportData,
          generated_at: new Date().toISOString()
        };

        return new Response(JSON.stringify({ 
          success: true, 
          report: result 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'save_layout': {
        const { report_id, widgets, user_id } = params;
        
        const { error } = await supabase
          .from('bi_reports')
          .update({ 
            report_config: widgets,
            updated_at: new Date().toISOString()
          })
          .eq('id', report_id)
          .eq('user_id', user_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'schedule_report': {
        const { report_id, schedule, recipients, user_id } = params;
        
        const { error } = await supabase
          .from('bi_reports')
          .update({
            is_automated: true,
            schedule_config: {
              frequency: schedule.frequency,
              day_of_week: schedule.day_of_week,
              time: schedule.time,
              timezone: schedule.timezone || 'UTC',
              recipients
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', report_id)
          .eq('user_id', user_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_available_sources': {
        const sources = [
          { 
            id: 'security_events', 
            name: 'Security Events', 
            fields: ['event_type', 'severity', 'source', 'created_at', 'status'],
            aggregations: ['count', 'group_by_severity', 'group_by_type', 'timeline']
          },
          { 
            id: 'tickets', 
            name: 'Helpdesk Tickets', 
            fields: ['status', 'priority', 'client_id', 'created_at', 'resolved_at'],
            aggregations: ['count', 'avg_resolution_time', 'group_by_status', 'group_by_priority']
          },
          { 
            id: 'devices', 
            name: 'Managed Devices', 
            fields: ['status', 'os_type', 'last_seen', 'org_id'],
            aggregations: ['count', 'group_by_status', 'group_by_os', 'online_offline']
          },
          { 
            id: 'patches', 
            name: 'Patch Compliance', 
            fields: ['status', 'severity', 'installed_at', 'device_id'],
            aggregations: ['count', 'compliance_rate', 'group_by_severity', 'pending_critical']
          },
          { 
            id: 'vulnerabilities', 
            name: 'Vulnerabilities', 
            fields: ['severity', 'cve_id', 'status', 'discovered_at'],
            aggregations: ['count', 'group_by_severity', 'open_vs_closed', 'timeline']
          },
          { 
            id: 'billing', 
            name: 'Billing & Revenue', 
            fields: ['amount', 'status', 'client_id', 'created_at'],
            aggregations: ['sum', 'mrr', 'group_by_client', 'timeline']
          }
        ];

        return new Response(JSON.stringify({ 
          success: true, 
          sources 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'export_pdf': {
        const { report_id, user_id } = params;
        
        // In production, this would generate actual PDF
        // For now, return success with placeholder
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'PDF export queued',
          download_url: null // Would be actual URL in production
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[report-builder] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function fetchDataForWidget(
  supabase: any, 
  widget: WidgetConfig, 
  userId: string,
  dateRange?: { start: string; end: string }
): Promise<any[]> {
  const { dataSource, filters } = widget;
  
  let query;
  let startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let endDate = dateRange?.end || new Date().toISOString();

  switch (dataSource) {
    case 'security_events':
      query = supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(1000);
      break;

    case 'tickets':
      query = supabase
        .from('vanguard_tickets')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(500);
      break;

    case 'devices':
      query = supabase
        .from('vanguard_agents')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen', { ascending: false });
      break;

    case 'patches':
      query = supabase
        .from('rmm_patches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(500);
      break;

    case 'vulnerabilities':
      query = supabase
        .from('vulnerability_findings')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(500);
      break;

    case 'billing':
      query = supabase
        .from('msp_invoices')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });
      break;

    default:
      return [];
  }

  // Apply custom filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query = query.eq(key, value);
      }
    });
  }

  const { data, error } = await query;
  
  if (error) {
    console.error(`Error fetching ${dataSource}:`, error);
    return [];
  }

  return data || [];
}
