import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Settings, Save } from "lucide-react";

interface NotificationSettings {
  id?: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  ticket_created: boolean;
  ticket_updated: boolean;
  ticket_assigned: boolean;
  sla_breach: boolean;
  escalation: boolean;
}

export const NotificationSettingsManager = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    user_id: '',
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    ticket_created: true,
    ticket_updated: true,
    ticket_assigned: true,
    sla_breach: true,
    escalation: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        setSettings(prev => ({ ...prev, user_id: user.user.id }));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to load notification settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const settingsData = {
        user_id: user.user.id,
        email_enabled: settings.email_enabled,
        sms_enabled: settings.sms_enabled,
        push_enabled: settings.push_enabled,
        ticket_created: settings.ticket_created,
        ticket_updated: settings.ticket_updated,
        ticket_assigned: settings.ticket_assigned,
        sla_breach: settings.sla_breach,
        escalation: settings.escalation,
      };

      const { error } = settings.id
        ? await supabase
            .from('notification_settings')
            .update(settingsData)
            .eq('id', settings.id)
        : await supabase
            .from('notification_settings')
            .insert(settingsData);

      if (error) throw error;

      toast({
        title: "✅ Settings Saved",
        description: "Your notification preferences have been updated",
      });

      // Reload settings to get the ID if it was an insert
      if (!settings.id) {
        loadSettings();
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notification Settings
          </h2>
          <p className="text-muted-foreground">
            Configure how you want to receive notifications about ticket updates
          </p>
        </div>
        
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_enabled" className="text-sm font-medium">
                Email Notifications
              </Label>
              <Switch
                id="email_enabled"
                checked={settings.email_enabled}
                onCheckedChange={(checked) => updateSetting('email_enabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sms_enabled" className="text-sm font-medium">
                SMS Notifications
              </Label>
              <Switch
                id="sms_enabled"
                checked={settings.sms_enabled}
                onCheckedChange={(checked) => updateSetting('sms_enabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="push_enabled" className="text-sm font-medium">
                Push Notifications
              </Label>
              <Switch
                id="push_enabled"
                checked={settings.push_enabled}
                onCheckedChange={(checked) => updateSetting('push_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Event Types */}
        <Card>
          <CardHeader>
            <CardTitle>Event Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ticket_created" className="text-sm font-medium">
                New Ticket Created
              </Label>
              <Switch
                id="ticket_created"
                checked={settings.ticket_created}
                onCheckedChange={(checked) => updateSetting('ticket_created', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="ticket_updated" className="text-sm font-medium">
                Ticket Updated
              </Label>
              <Switch
                id="ticket_updated"
                checked={settings.ticket_updated}
                onCheckedChange={(checked) => updateSetting('ticket_updated', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="ticket_assigned" className="text-sm font-medium">
                Ticket Assigned
              </Label>
              <Switch
                id="ticket_assigned"
                checked={settings.ticket_assigned}
                onCheckedChange={(checked) => updateSetting('ticket_assigned', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sla_breach" className="text-sm font-medium">
                SLA Breach Warning
              </Label>
              <Switch
                id="sla_breach"
                checked={settings.sla_breach}
                onCheckedChange={(checked) => updateSetting('sla_breach', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="escalation" className="text-sm font-medium">
                Ticket Escalation
              </Label>
              <Switch
                id="escalation"
                checked={settings.escalation}
                onCheckedChange={(checked) => updateSetting('escalation', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};