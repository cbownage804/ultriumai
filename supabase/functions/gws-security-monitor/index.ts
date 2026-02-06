import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const log = (step: string, details?: any) => {
  console.log(`[GWS-SECURITY-MONITOR] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

// Google Admin SDK Reports API categories
const EVENT_CATEGORIES = {
  LOGIN: 'login',
  ADMIN: 'admin',
  DRIVE: 'drive',
  GMAIL: 'gmail',
} as const;

// Severity mapping for Google Workspace events
function classifyEvent(eventName: string, category: string): { severity: string; description: string } {
  const classifications: Record<string, { severity: string; description: string }> = {
    // Login events
    'login_failure': { severity: 'medium', description: 'Failed login attempt detected' },
    'login_success': { severity: 'info', description: 'Successful login' },
    'suspicious_login': { severity: 'high', description: 'Suspicious login activity detected' },
    'suspicious_login_less_secure_app': { severity: 'high', description: 'Login from less secure app' },
    'account_disabled_generic': { severity: 'critical', description: 'Account was disabled' },
    'account_disabled_password_leak': { severity: 'critical', description: 'Account disabled due to password leak' },
    'gov_attack_warning': { severity: 'critical', description: 'Government-backed attack warning' },
    'login_verification': { severity: 'medium', description: 'Login verification challenge triggered' },
    'titanium_change': { severity: 'medium', description: 'Advanced Protection enrollment changed' },

    // Admin events
    'CREATE_USER': { severity: 'low', description: 'New user account created' },
    'DELETE_USER': { severity: 'medium', description: 'User account deleted' },
    'SUSPEND_USER': { severity: 'medium', description: 'User account suspended' },
    'GRANT_ADMIN_PRIVILEGE': { severity: 'high', description: 'Admin privileges granted' },
    'REVOKE_ADMIN_PRIVILEGE': { severity: 'medium', description: 'Admin privileges revoked' },
    'CHANGE_PASSWORD': { severity: 'low', description: 'Password changed' },
    'ENFORCE_STRONG_AUTHENTICATION': { severity: 'low', description: '2FA enforcement changed' },
    'UNENROLL_USER_FROM_TITANIUM': { severity: 'high', description: 'User removed from Advanced Protection' },
    'TOGGLE_SERVICE_ENABLED': { severity: 'medium', description: 'Service enabled/disabled' },
    'ADD_APPLICATION': { severity: 'medium', description: 'OAuth application added' },
    'AUTHORIZE_API_CLIENT_ACCESS': { severity: 'high', description: 'API client access authorized' },
    'CHANGE_APPLICATION_SETTING': { severity: 'medium', description: 'Application setting changed' },
    'CREATE_ROLE': { severity: 'medium', description: 'Admin role created' },
    'DELETE_ROLE': { severity: 'medium', description: 'Admin role deleted' },
    'RENAME_ROLE': { severity: 'low', description: 'Admin role renamed' },
    'ADD_PRIVILEGE': { severity: 'high', description: 'Privilege added to role' },
    'REMOVE_PRIVILEGE': { severity: 'medium', description: 'Privilege removed from role' },

    // Drive events
    'change_document_visibility': { severity: 'medium', description: 'Document visibility changed' },
    'change_document_access_scope': { severity: 'high', description: 'Document access scope changed externally' },
    'download': { severity: 'info', description: 'File downloaded' },
    'change_user_access': { severity: 'medium', description: 'File sharing permission changed' },
    'change_acl_editors': { severity: 'medium', description: 'File editor access changed' },
    'move': { severity: 'low', description: 'File moved' },
    'trash': { severity: 'low', description: 'File moved to trash' },
    'untrash': { severity: 'info', description: 'File restored from trash' },
    'upload': { severity: 'info', description: 'File uploaded' },
    'sheets_import_range': { severity: 'medium', description: 'Sheet import range added (data exfiltration risk)' },

    // Gmail events
    'email_forwarding_out_of_domain': { severity: 'high', description: 'Email forwarding to external domain configured' },
    'email_forwarding_change': { severity: 'medium', description: 'Email forwarding settings changed' },
    'email_delegate_access': { severity: 'high', description: 'Email delegate access granted' },
    'suspicious_email_reported': { severity: 'medium', description: 'Phishing email reported by user' },
    'email_autoforward_enabled': { severity: 'high', description: 'Auto-forwarding enabled' },
    'gmail_filter_created': { severity: 'medium', description: 'Gmail filter created' },
    'gmail_setting_changed': { severity: 'medium', description: 'Gmail setting changed' },
  };

  return classifications[eventName] || { severity: 'low', description: `${category} event: ${eventName}` };
}

function calculateGWSRiskScore(eventName: string, category: string, details: any): number {
  let score = 30;
  const { severity } = classifyEvent(eventName, category);

  if (severity === 'critical') score += 50;
  else if (severity === 'high') score += 35;
  else if (severity === 'medium') score += 20;
  else if (severity === 'low') score += 5;

  // External sharing escalation
  if (details?.target_domain && details.target_domain !== details?.org_domain) score += 15;
  // Bulk operations
  if (details?.is_bulk) score += 10;
  // Unusual hours (UTC check)
  const hour = new Date().getUTCHours();
  if (hour < 6 || hour > 22) score += 5;

  return Math.min(score, 100);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, ...params } = await req.json();
    log(`Action: ${action}`, { userId: user.id });

    switch (action) {
      // ===================== TENANT MANAGEMENT =====================
      case 'list_tenants': {
        const { data, error } = await supabase
          .from('vanguard_gws_tenants')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return jsonResponse({ tenants: data });
      }

      case 'add_tenant': {
        const { tenant_name, domain, customer_id, service_account_email, admin_email, credentials_encrypted, monitoring_config } = params;
        const { data, error } = await supabase
          .from('vanguard_gws_tenants')
          .insert({
            user_id: user.id,
            tenant_name, domain, customer_id,
            service_account_email, admin_email,
            credentials_encrypted,
            monitoring_config: monitoring_config || {
              login_monitoring: true,
              admin_changes: true,
              drive_monitoring: true,
              gmail_monitoring: true,
            },
          })
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ tenant: data });
      }

      case 'update_tenant': {
        const { tenant_id, updates } = params;
        const { data, error } = await supabase
          .from('vanguard_gws_tenants')
          .update(updates)
          .eq('id', tenant_id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ tenant: data });
      }

      case 'delete_tenant': {
        const { error } = await supabase
          .from('vanguard_gws_tenants')
          .delete()
          .eq('id', params.tenant_id)
          .eq('user_id', user.id);
        if (error) throw error;
        return jsonResponse({ success: true });
      }

      // ===================== SYNC / MONITORING =====================
      case 'sync_tenant': {
        const { data: tenant, error: tErr } = await supabase
          .from('vanguard_gws_tenants')
          .select('*')
          .eq('id', params.tenant_id)
          .eq('user_id', user.id)
          .single();
        if (tErr || !tenant) throw new Error('Tenant not found');

        // In production, this would use the Google Admin SDK with service account credentials
        // For now, we mark the sync and prepare the structure for real API integration
        log('Syncing GWS tenant', { domain: tenant.domain });

        await supabase
          .from('vanguard_gws_tenants')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', tenant.id);

        return jsonResponse({ success: true, message: 'Sync initiated. Configure Google Admin SDK service account for live data.' });
      }

      case 'sync_all': {
        const { data: tenants, error } = await supabase
          .from('vanguard_gws_tenants')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);
        if (error) throw error;

        const results = [];
        for (const tenant of tenants || []) {
          await supabase
            .from('vanguard_gws_tenants')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', tenant.id);
          results.push({ id: tenant.id, domain: tenant.domain, status: 'synced' });
        }

        return jsonResponse({ results });
      }

      // ===================== EVENTS =====================
      case 'list_events': {
        let query = supabase
          .from('vanguard_gws_security_events')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (params.tenant_id) query = query.eq('tenant_id', params.tenant_id);
        if (params.category) query = query.eq('event_category', params.category);
        if (params.severity) query = query.eq('severity', params.severity);
        if (params.status) query = query.eq('status', params.status);
        if (params.limit) query = query.limit(params.limit);

        const { data, error } = await query;
        if (error) throw error;
        return jsonResponse({ events: data });
      }

      case 'update_event': {
        const { event_id, updates } = params;
        const { data, error } = await supabase
          .from('vanguard_gws_security_events')
          .update(updates)
          .eq('id', event_id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ event: data });
      }

      case 'get_stats': {
        const [eventsRes, tenantsRes] = await Promise.all([
          supabase
            .from('vanguard_gws_security_events')
            .select('id, severity, status, event_category')
            .eq('user_id', user.id)
            .in('status', ['new', 'pending', 'needs_review']),
          supabase
            .from('vanguard_gws_tenants')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('is_active', true),
        ]);

        const events = eventsRes.data || [];
        return jsonResponse({
          active_alerts: events.length,
          critical_count: events.filter(e => e.severity === 'critical' || e.severity === 'high').length,
          by_category: {
            login: events.filter(e => e.event_category === 'login').length,
            admin: events.filter(e => e.event_category === 'admin').length,
            drive: events.filter(e => e.event_category === 'drive').length,
            gmail: events.filter(e => e.event_category === 'gmail').length,
          },
          tenants_monitored: tenantsRes.count || 0,
        });
      }

      // ===================== ALERT POLICIES =====================
      case 'list_policies': {
        const { data, error } = await supabase
          .from('vanguard_saas_alert_policies')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', 'google_workspace')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return jsonResponse({ policies: data });
      }

      case 'create_policy': {
        const { data, error } = await supabase
          .from('vanguard_saas_alert_policies')
          .insert({ user_id: user.id, platform: 'google_workspace', ...params.policy })
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ policy: data });
      }

      // ===================== INGEST (from external webhook/cron) =====================
      case 'ingest_events': {
        const { tenant_id, events } = params;
        if (!events?.length) return jsonResponse({ inserted: 0 });

        const records = events.map((e: any) => {
          const { severity, description } = classifyEvent(e.event_name, e.category);
          return {
            user_id: user.id,
            tenant_id,
            event_type: e.event_name,
            event_category: e.category || 'login',
            severity,
            description,
            affected_user_email: e.actor_email,
            affected_user_name: e.actor_name,
            ip_address: e.ip_address,
            location_info: e.location || {},
            event_details: e.details || {},
            raw_event_data: e,
            ai_confidence: calculateGWSRiskScore(e.event_name, e.category, e.details),
          };
        });

        const { error } = await supabase
          .from('vanguard_gws_security_events')
          .insert(records);
        if (error) throw error;

        return jsonResponse({ inserted: records.length });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    log('ERROR', { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
