import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_types: string[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface NotificationPreferencesContextType {
  preferences: NotificationPreferences | null;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  isLoading: boolean;
}

const NotificationPreferencesContext = createContext<NotificationPreferencesContextType | undefined>(undefined);

export const useNotificationPreferences = () => {
  const context = useContext(NotificationPreferencesContext);
  if (!context) {
    throw new Error('useNotificationPreferences must be used within NotificationPreferencesProvider');
  }
  return context;
};

export const NotificationPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      if (data) {
        setPreferences(data as unknown as NotificationPreferences);
      } else {
        // Create default preferences
        const defaultPrefs = {
          user_id: user.id,
          email_notifications: true,
          push_notifications: true,
          sms_notifications: false,
          notification_types: ['all'],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs as unknown as NotificationPreferences);
      }
    } catch (error: any) {
      console.error('Error loading notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      if (!preferences) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', preferences.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data as unknown as NotificationPreferences);
      toast({
        title: 'Success',
        description: 'Notification preferences updated',
      });
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences',
        variant: 'destructive',
      });
    }
  };

  return (
    <NotificationPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        isLoading
      }}
    >
      {children}
    </NotificationPreferencesContext.Provider>
  );
};