import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SecuritySettings, AuditLog, SecurityEvent } from "@/types/security";
import { securitySettingsSchema, validateForm } from "@/utils/validation";

export const useSecurity = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSecuritySettings();
      loadAuditLogs();
    }
  }, [user]);

  const loadSecuritySettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSecuritySettings(data as any);
      } else {
        // Create default security settings
        const { data: newSettings, error: insertError } = await supabase
          .from('security_settings' as any)
          .insert({
            user_id: user.id,
            two_factor_enabled: false,
            session_timeout_minutes: 60,
            login_notifications: true,
            failed_login_attempts: 0
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setSecuritySettings(newSettings as any);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      toast({
        title: "Error",
        description: "Failed to load security settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('audit_logs' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs((data as any) || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const logSecurityEvent = async (event: SecurityEvent) => {
    if (!user || !session) return;

    try {
      await supabase.functions.invoke('audit-logger', {
        body: {
          action: event.type,
          resource_type: 'security',
          details: event.details || {}
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      // Refresh audit logs
      await loadAuditLogs();
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  };

  const setupTwoFactor = async () => {
    if (!user || !session) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('setup-two-factor', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to setup two-factor authentication.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const enableTwoFactor = async (token: string) => {
    if (!user || !session) return false;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('enable-two-factor', {
        body: { token },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Two-Factor Authentication Enabled",
        description: "Your account is now secured with 2FA.",
      });

      await logSecurityEvent({ type: 'two_factor_enabled' });
      await loadSecuritySettings();
      return true;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to enable two-factor authentication.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async (token: string) => {
    if (!user || !session) return false;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('disable-two-factor', {
        body: { token },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Two-Factor Authentication Disabled",
        description: "2FA has been disabled for your account.",
      });

      await logSecurityEvent({ type: 'two_factor_disabled' });
      await loadSecuritySettings();
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSecuritySettings = async (settings: Partial<SecuritySettings>) => {
    if (!user) return;

    // Validate settings before updating
    const validation = validateForm(securitySettingsSchema.partial(), settings);
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.errors?.join(', ') || "Invalid settings provided.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('security_settings' as any)
        .update(validation.data)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Security Settings Updated",
        description: "Your security preferences have been saved.",
      });

      await loadSecuritySettings();
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        title: "Error",
        description: "Failed to update security settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    securitySettings,
    auditLogs,
    loading,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    updateSecuritySettings,
    logSecurityEvent,
    refreshAuditLogs: loadAuditLogs,
    refreshSecuritySettings: loadSecuritySettings
  };
};