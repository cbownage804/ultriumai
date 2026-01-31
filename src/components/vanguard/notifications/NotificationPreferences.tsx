import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Mail, Phone, MessageSquare, Moon, Clock, Globe, Save, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PremiumCard } from '../ui';
import { useToast } from '@/hooks/use-toast';

export const NotificationPreferences = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    slackNotifications: true,
    soundEnabled: true,
    soundVolume: [70],
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: 'America/New_York',
    digestEnabled: true,
    digestFrequency: 'daily',
    criticalOverride: true,
  });

  const handleSave = () => {
    toast({ title: 'Preferences saved successfully' });
  };

  const notificationTypes = [
    { id: 'ticket_created', label: 'New Tickets', enabled: true },
    { id: 'ticket_assigned', label: 'Ticket Assignments', enabled: true },
    { id: 'ticket_updated', label: 'Ticket Updates', enabled: false },
    { id: 'sla_warning', label: 'SLA Warnings', enabled: true },
    { id: 'sla_breach', label: 'SLA Breaches', enabled: true },
    { id: 'security_alert', label: 'Security Alerts', enabled: true },
    { id: 'incident_created', label: 'New Incidents', enabled: true },
    { id: 'escalation', label: 'Escalations', enabled: true },
    { id: 'report_ready', label: 'Reports Ready', enabled: false },
    { id: 'system_update', label: 'System Updates', enabled: false },
  ];

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
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
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
                checked={preferences.pushNotifications}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, pushNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">Critical alerts via SMS</p>
                </div>
              </div>
              <Switch
                checked={preferences.smsNotifications}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, smsNotifications: checked }))}
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
                checked={preferences.slackNotifications}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, slackNotifications: checked }))}
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
                checked={preferences.soundEnabled}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, soundEnabled: checked }))}
              />
            </div>

            {preferences.soundEnabled && (
              <div className="space-y-2 px-3">
                <div className="flex items-center justify-between">
                  <Label>Volume</Label>
                  <span className="text-sm text-muted-foreground">{preferences.soundVolume[0]}%</span>
                </div>
                <Slider
                  value={preferences.soundVolume}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, soundVolume: value }))}
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
                checked={preferences.quietHoursEnabled}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, quietHoursEnabled: checked }))}
              />
            </div>

            {preferences.quietHoursEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4 px-3">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
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
                    checked={preferences.criticalOverride}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, criticalOverride: checked }))}
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
                value={preferences.timezone} 
                onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}
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
                checked={preferences.digestEnabled}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, digestEnabled: checked }))}
              />
            </div>

            {preferences.digestEnabled && (
              <div className="space-y-2 px-3">
                <Label>Digest Frequency</Label>
                <Select 
                  value={preferences.digestFrequency} 
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, digestFrequency: value }))}
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
          {notificationTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-sm">{type.label}</span>
              <Switch defaultChecked={type.enabled} />
            </div>
          ))}
        </div>
      </PremiumCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-500">
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
};
