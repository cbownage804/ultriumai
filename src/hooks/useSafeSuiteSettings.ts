/**
 * Wrayth Settings Hook
 * Manages user settings persistence to Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { devLog } from '@/lib/logger';

export interface WraythUserSettings {
  notifications: {
    breachAlerts: boolean;
    weeklyReport: boolean;
    productUpdates: boolean;
    securityDigest: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
  privacy: {
    shareAnalytics: boolean;
    marketingEmails: boolean;
  };
}

const DEFAULT_SETTINGS: WraythUserSettings = {
  notifications: {
    breachAlerts: true,
    weeklyReport: true,
    productUpdates: false,
    securityDigest: true
  },
  preferences: {
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  },
  privacy: {
    shareAnalytics: true,
    marketingEmails: false
  }
};

export const useWraythSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WraythUserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Load settings from notification_preferences table
      const { data: notifPrefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (notifPrefs) {
        setSettings(prev => ({
          ...prev,
          notifications: {
            breachAlerts: notifPrefs.security_alerts ?? true,
            weeklyReport: notifPrefs.email_notifications ?? true,
            productUpdates: notifPrefs.push_notifications ?? false,
            securityDigest: notifPrefs.system_notifications ?? true
          }
        }));
      }
    } catch (err) {
      // Settings table may not exist, use defaults
      devLog.log('Using default settings');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback(async (newSettings: WraythUserSettings) => {
    if (!user?.id) return false;

    setSaving(true);
    try {
      // Upsert notification preferences using existing columns
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ 
          user_id: user.id,
          security_alerts: newSettings.notifications.breachAlerts,
          email_notifications: newSettings.notifications.weeklyReport,
          push_notifications: newSettings.notifications.productUpdates,
          system_notifications: newSettings.notifications.securityDigest,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setSettings(newSettings);
      toast.success('Settings saved successfully');
      return true;
    } catch (err) {
      devLog.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  const updateNotifications = useCallback((key: keyof WraythUserSettings['notifications'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  }, []);

  const updatePreferences = useCallback((key: keyof WraythUserSettings['preferences'], value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value }
    }));
  }, []);

  const updatePrivacy = useCallback((key: keyof WraythUserSettings['privacy'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }));
  }, []);

  return {
    settings,
    loading,
    saving,
    saveSettings,
    updateNotifications,
    updatePreferences,
    updatePrivacy,
    reload: loadSettings
  };
};
