/**
 * Scan Settings Page
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ScanSearch,
  Shield,
  Bell,
  Zap,
  FileWarning,
  Mail,
  Link,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function ScanSettings() {
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    autoScanEmails: true,
    autoScanLinks: true,
    autoScanDownloads: true,
    scanDepth: 'standard',
    realTimeProtection: true,
    notifications: {
      threatDetected: true,
      scanComplete: true,
      weeklyReport: false
    }
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Scan settings saved');
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanSearch className="h-6 w-6 text-red-500" />
          <span className="text-red-500">Scan</span> Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your security scanning preferences
        </p>
      </div>

      {/* Auto-Scan Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automatic Scanning
          </CardTitle>
          <CardDescription>
            Configure what gets scanned automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Scan Email Attachments
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically scan incoming email attachments
              </p>
            </div>
            <Switch
              variant="scan"
              checked={settings.autoScanEmails}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoScanEmails: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <Link className="h-4 w-4" />
                Scan Links & URLs
              </Label>
              <p className="text-sm text-muted-foreground">
                Check URLs for phishing and malware
              </p>
            </div>
            <Switch
              variant="scan"
              checked={settings.autoScanLinks}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoScanLinks: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <FileWarning className="h-4 w-4" />
                Scan Downloads
              </Label>
              <p className="text-sm text-muted-foreground">
                Scan files before they're downloaded
              </p>
            </div>
            <Switch
              variant="scan"
              checked={settings.autoScanDownloads}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoScanDownloads: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Scan Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Scan Configuration
          </CardTitle>
          <CardDescription>
            Adjust scanning depth and protection level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Scan Depth</Label>
              <p className="text-sm text-muted-foreground">
                How thorough scans should be
              </p>
            </div>
            <Select
              value={settings.scanDepth}
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, scanDepth: value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quick">Quick</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="deep">Deep</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Real-Time Protection</Label>
              <p className="text-sm text-muted-foreground">
                Continuously monitor for threats
              </p>
            </div>
            <Switch
              variant="scan"
              checked={settings.realTimeProtection}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, realTimeProtection: checked }))
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
            Scan Notifications
          </CardTitle>
          <CardDescription>
            Choose when to be notified about scans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Threat Detected</p>
              <p className="text-sm text-muted-foreground">
                Alert when a threat is found
              </p>
            </div>
            <Switch
              variant="scan"
              checked={settings.notifications.threatDetected}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, threatDetected: checked }
                }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Scan Complete</p>
              <p className="text-sm text-muted-foreground">
                Notify when scans finish
              </p>
            </div>
            <Switch
              variant="scan"
              checked={settings.notifications.scanComplete}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, scanComplete: checked }
                }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Summary</p>
              <p className="text-sm text-muted-foreground">
                Receive a weekly scan report
              </p>
            </div>
            <Switch
              variant="scan"
              checked={settings.notifications.weeklyReport}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, weeklyReport: checked }
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white"
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
