import { useState, useEffect } from 'react';
import { Settings, Bell, Mail, Phone, MessageSquare, Moon, Clock, Globe, Save, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PremiumCard } from '../ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const NotificationPreferences = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [prefsId, setPrefsId] = useState<string | null>(null);
  
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    push_notifications: true,
    security_alerts: true,
    ticket_updates: true,
    system_notifications: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    notification_frequency: 'realtime',
  });

  const [localSettings, setLocalSettings] = useState({
    soundEnabled: true,
    soundVolume: [70],
    quietHoursEnabled: false,
    criticalOverride: true,
    digestEnabled: false,
    digestFrequency: 'daily',
    slackNotifications: true,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    if (user) loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPrefsId(data.id);
        setPreferences({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          security_alerts: data.security_alerts ?? true,
          ticket_updates: data.ticket_updates ?? true,
          system_notifications: data.system_notifications ?? true,
          quiet_hours_start: data.quiet_hours_start ?? '22:00',
          quiet_hours_end: data.quiet_hours_end ?? '08:00',
          notification_frequency: data.notification_frequency ?? 'realtime',
        });
        setLocalSettings(prev => ({
          ...prev,
          quietHoursEnabled: !!(data.quiet_hours_start && data.quiet_hours_end),
        }));
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const prefsToSave = {
        user_id: user.id,
        email_notifications: preferences.email_notifications,
        push_notifications: preferences.push_notifications,
        security_alerts: preferences.security_alerts,
        ticket_updates: preferences.ticket_updates,
        system_notifications: preferences.system_notifications,
        quiet_hours_start: localSettings.quietHoursEnabled ? preferences.quiet_hours_start : null,
        quiet_hours_end: localSettings.quietHoursEnabled ? preferences.quiet_hours_end : null,
        notification_frequency: preferences.notification_frequency,
      };

      if (prefsId) {
        const { error } = await supabase
          .from('notification_preferences')
          .update(prefsToSave)
          .eq('id', prefsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert([prefsToSave])
          .select()
          .single();

        if (error) throw error;
        setPrefsId(data.id);
      }

      toast({ title: 'Preferences saved successfully' });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast({ title: 'Error saving preferences', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Channels */}
        <PremiumCard variant="glass" className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-cyan-400" />
            Notification Channels
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-cyan-400" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive alerts via email</p>
                </div>
              </div>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, email_notifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">Browser and mobile push</p>
                </div>
              </div>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, push_notifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium">Security Alerts</p>
                  <p className="text-xs text-muted-foreground">Critical security notifications</p>
                </div>
              </div>
              <Switch
                checked={preferences.security_alerts}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, security_alerts: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="font-medium">Slack Notifications</p>
                  <p className="text-xs text-muted-foreground">Direct messages in Slack</p>
                </div>
              </div>
              <Switch
                checked={localSettings.slackNotifications}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, slackNotifications: checked }))}
              />
            </div>
          </div>
        </PremiumCard>

        {/* Sound & Volume */}
        <PremiumCard variant="glass" className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-cyan-400" />
            Sound Settings
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-orange-400" />
                <div>
                  <p className="font-medium">Alert Sounds</p>
                  <p className="text-xs text-muted-foreground">Play sounds for notifications</p>
                </div>
              </div>
              <Switch
                checked={localSettings.soundEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, soundEnabled: checked }))}
              />
            </div>

            {localSettings.soundEnabled && (
              <div className="space-y-2 px-3">
                <div className="flex items-center justify-between">
                  <Label>Volume</Label>
                  <span className="text-sm text-muted-foreground">{localSettings.soundVolume[0]}%</span>
                </div>
                <Slider
                  value={localSettings.soundVolume}
                  onValueChange={(value) => setLocalSettings(prev => ({ ...prev, soundVolume: value }))}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </PremiumCard>

        {/* Quiet Hours */}
        <PremiumCard variant="glass" className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Moon className="h-5 w-5 text-cyan-400" />
            Quiet Hours
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="font-medium">Enable Quiet Hours</p>
                  <p className="text-xs text-muted-foreground">Pause non-critical notifications</p>
                </div>
              </div>
              <Switch
                checked={localSettings.quietHoursEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, quietHoursEnabled: checked }))}
              />
            </div>

            {localSettings.quietHoursEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4 px-3">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="font-medium text-sm">Critical Override</p>
                    <p className="text-xs text-muted-foreground">Allow critical alerts during quiet hours</p>
                  </div>
                  <Switch
                    checked={localSettings.criticalOverride}
                    onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, criticalOverride: checked }))}
                  />
                </div>
              </>
            )}
          </div>
        </PremiumCard>

        {/* Timezone & Digest */}
        <PremiumCard variant="glass" className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-cyan-400" />
            Regional & Digest
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select 
                value={localSettings.timezone} 
                onValueChange={(value) => setLocalSettings(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">GMT/BST</SelectItem>
                  <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="font-medium">Daily Digest</p>
                  <p className="text-xs text-muted-foreground">Receive summary email</p>
                </div>
              </div>
              <Switch
                checked={localSettings.digestEnabled}
                onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, digestEnabled: checked }))}
              />
            </div>

            {localSettings.digestEnabled && (
              <div className="space-y-2 px-3">
                <Label>Digest Frequency</Label>
                <Select 
                  value={localSettings.digestFrequency} 
                  onValueChange={(value) => setLocalSettings(prev => ({ ...prev, digestFrequency: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </PremiumCard>
      </div>

      {/* Notification Types */}
      <PremiumCard variant="glass" className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-cyan-400" />
          Notification Types
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { id: 'ticket_updates', label: 'Ticket Updates', key: 'ticket_updates' as const },
            { id: 'system_notifications', label: 'System Notifications', key: 'system_notifications' as const },
            { id: 'security_alerts', label: 'Security Alerts', key: 'security_alerts' as const },
          ].map((type) => (
            <div key={type.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-sm">{type.label}</span>
              <Switch 
                checked={preferences[type.key]}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, [type.key]: checked }))}
              />
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          className="bg-gradient-to-r from-cyan-500 to-blue-500"
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
};
