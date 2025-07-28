import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { Bell, Mail, MessageSquare, Clock, Globe } from 'lucide-react';

export const NotificationPreferences = () => {
  const { preferences, updatePreferences, isLoading } = useNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading notification preferences...
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    if (localPrefs) {
      await updatePreferences(localPrefs);
    }
  };

  const notificationTypes = [
    { id: 'security', label: 'Security Alerts', description: 'Critical security events and threats' },
    { id: 'ticket', label: 'Ticket Updates', description: 'Support ticket status changes' },
    { id: 'billing', label: 'Billing Notifications', description: 'Payment and subscription updates' },
    { id: 'system', label: 'System Updates', description: 'Maintenance and system announcements' },
    { id: 'client', label: 'Client Activities', description: 'Client-related notifications' },
  ];

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Delivery
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={localPrefs?.email_notifications}
              onCheckedChange={(checked) => 
                setLocalPrefs(prev => prev ? { ...prev, email_notifications: checked } : null)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive browser push notifications
              </p>
            </div>
            <Switch
              checked={localPrefs?.push_notifications}
              onCheckedChange={(checked) => 
                setLocalPrefs(prev => prev ? { ...prev, push_notifications: checked } : null)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via SMS (premium feature)
              </p>
            </div>
            <Switch
              checked={localPrefs?.sms_notifications}
              onCheckedChange={(checked) => 
                setLocalPrefs(prev => prev ? { ...prev, sms_notifications: checked } : null)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Select which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.id} className="flex items-start space-x-3">
              <Checkbox
                id={type.id}
                checked={localPrefs?.notification_types.includes(type.id) || localPrefs?.notification_types.includes('all')}
                onCheckedChange={(checked) => {
                  if (!localPrefs) return;
                  
                  let newTypes = [...localPrefs.notification_types];
                  
                  if (checked) {
                    if (!newTypes.includes(type.id)) {
                      newTypes.push(type.id);
                    }
                  } else {
                    newTypes = newTypes.filter(t => t !== type.id && t !== 'all');
                  }
                  
                  setLocalPrefs(prev => prev ? { ...prev, notification_types: newTypes } : null);
                }}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor={type.id} className="text-sm font-medium">
                  {type.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {type.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Set times when you don't want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiet-start">Start Time</Label>
              <Input
                id="quiet-start"
                type="time"
                value={localPrefs?.quiet_hours_start || ''}
                onChange={(e) => 
                  setLocalPrefs(prev => prev ? { ...prev, quiet_hours_start: e.target.value } : null)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiet-end">End Time</Label>
              <Input
                id="quiet-end"
                type="time"
                value={localPrefs?.quiet_hours_end || ''}
                onChange={(e) => 
                  setLocalPrefs(prev => prev ? { ...prev, quiet_hours_end: e.target.value } : null)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Timezone
          </CardTitle>
          <CardDescription>
            Set your timezone for accurate notification timing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={localPrefs?.timezone}
            onValueChange={(value) => 
              setLocalPrefs(prev => prev ? { ...prev, timezone: value } : null)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
};