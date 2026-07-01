import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAFESUITE-EXPORT] ${step}${detailsStr}`);
};

interface ExportData {
  exportDate: string;
  user: {
    id: string;
    email: string;
  };
  passwords: unknown[];
  breachHistory: unknown[];
  securitySettings: unknown;
  notificationPreferences: unknown;
  twoFactorBackupCodes?: string[];
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting data export");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid or expired token');
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Fetch all user data in parallel
    const [
      { data: passwords },
      { data: breachHistory },
      { data: securitySettings },
      { data: notificationPrefs },
      { data: twoFactorSettings }
    ] = await Promise.all([
      // Vault passwords (still encrypted)
      supabase
        .from('password_entries')
        .select('id, site_name, username, url, notes, category, is_favorite, password_strength, created_at, updated_at')
        .eq('user_id', user.id),
      
      // Breach monitoring history
      supabase
        .from('email_breach_checks')
        .select('id, email_checked, breach_count, breaches_found, checked_at')
        .eq('user_id', user.id)
        .order('checked_at', { ascending: false }),
      
      // Security settings
      supabase
        .from('user_security_settings')
        .select('two_factor_enabled, session_timeout_minutes, failed_login_attempts, updated_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      
      // Notification preferences
      supabase
        .from('notification_preferences')
        .select('email_notifications, push_notifications, security_alerts, system_notifications')
        .eq('user_id', user.id)
        .maybeSingle(),
      
      // 2FA backup codes (if enabled)
      supabase
        .from('user_security_settings')
        .select('backup_codes')
        .eq('user_id', user.id)
        .maybeSingle()
    ]);

    logStep("Data fetched", {
      passwords: passwords?.length || 0,
      breachHistory: breachHistory?.length || 0
    });

    // Compile export data
    const exportData: ExportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email || ''
      },
      passwords: passwords || [],
      breachHistory: breachHistory || [],
      securitySettings: securitySettings || null,
      notificationPreferences: notificationPrefs || null,
      twoFactorBackupCodes: twoFactorSettings?.backup_codes || undefined
    };

    // Log the export action for audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'data_export',
      resource_type: 'safesuite_data',
      details: {
        passwords_count: passwords?.length || 0,
        breach_history_count: breachHistory?.length || 0,
        export_date: exportData.exportDate
      }
    });

    logStep("Export complete");

    return new Response(JSON.stringify(exportData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="safesuite-export-${new Date().toISOString().split('T')[0]}.json"`
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
