/**
 * Watch Settings Page
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Globe,
  Bell,
  Clock,
  Shield,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function WatchSettings() {
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    monitoringFrequency: 'daily',
    sslMonitoring: true,
    uptimeMonitoring: true,
    domainExpiry: true,
    malwareScanning: true,
    notifications: {
      siteDown: true,
      sslExpiring: true,
      securityIssue: true,
      dailyReport: false
    }
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Watch settings saved');
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-violet-500" />
          <span className="text-violet-500">Watch</span> Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your website monitoring preferences
        </p>
      </div>

      {/* Monitoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Monitoring Configuration
          </CardTitle>
          <CardDescription>
            Set how often your websites are checked
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Check Frequency
              </Label>
              <p className="text-sm text-muted-foreground">
                How often to scan for dark web exposures
              </p>
            </div>
            <Select
              value={settings.monitoringFrequency}
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, monitoringFrequency: value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Uptime Monitoring</Label>
              <p className="text-sm text-muted-foreground">
                Check if sites are online and responding
              </p>
            </div>
            <Switch
              variant="watch"
              checked={settings.uptimeMonitoring}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, uptimeMonitoring: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Checks
          </CardTitle>
          <CardDescription>
            Configure security monitoring features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">SSL Certificate Monitoring</Label>
              <p className="text-sm text-muted-foreground">
                Alert before SSL certificates expire
              </p>
            </div>
            <Switch
              variant="watch"
              checked={settings.sslMonitoring}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, sslMonitoring: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Domain Expiry Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notify before domain registrations expire
              </p>
            </div>
            <Switch
              variant="watch"
              checked={settings.domainExpiry}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, domainExpiry: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Malware Scanning
              </Label>
              <p className="text-sm text-muted-foreground">
                Scan sites for malware and vulnerabilities
              </p>
            </div>
            <Switch
              variant="watch"
              checked={settings.malwareScanning}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, malwareScanning: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Notifications
          </CardTitle>
          <CardDescription>
            Choose when to be notified about your sites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Site Down Alerts</p>
              <p className="text-sm text-muted-foreground">
                Immediate alert when a site goes offline
              </p>
            </div>
            <Switch
              variant="watch"
              checked={settings.notifications.siteDown}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, siteDown: checked }
                }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">SSL Expiring</p>
              <p className="text-sm text-muted-foreground">
                Alert 14 days before SSL expires
              </p>
            </div>
            <Switch
              variant="watch"
              checked={settings.notifications.sslExpiring}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, sslExpiring: checked }
                }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Security Issues</p>
              <p className="text-sm text-muted-foreground">
                Alert when security problems are detected
              </p>
            </div>
            <Switch
              variant="watch"
              checked={settings.notifications.securityIssue}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, securityIssue: checked }
                }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Status Report</p>
              <p className="text-sm text-muted-foreground">
                Receive a daily summary email
              </p>
            </div>
            <Switch
              variant="watch"
              checked={settings.notifications.dailyReport}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, dailyReport: checked }
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={loading}
          className="bg-violet-500 hover:bg-violet-600 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
}
