/**
 * SafeTrack Settings Page
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  Bell,
  Tag,
  MapPin,
  Calendar,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function SafeTrackSettings() {
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    autoTagging: true,
    locationTracking: false,
    warrantyAlerts: true,
    warrantyAlertDays: '30',
    maintenanceReminders: true,
    depreciationTracking: true,
    notifications: {
      warrantyExpiring: true,
      maintenanceDue: true,
      assetChanges: false
    }
  });

  const handleSaveSettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('SafeTrack settings saved');
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-emerald-500" />
          <span className="text-emerald-500">SafeTrack</span> Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your asset tracking preferences
        </p>
      </div>

      {/* Asset Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Asset Management
          </CardTitle>
          <CardDescription>
            Configure how assets are organized
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-Tagging</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate asset tags
              </p>
            </div>
            <Switch
              variant="safetrack"
              checked={settings.autoTagging}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoTagging: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Tracking
              </Label>
              <p className="text-sm text-muted-foreground">
                Track physical location of assets
              </p>
            </div>
            <Switch
              variant="safetrack"
              checked={settings.locationTracking}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, locationTracking: checked }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Depreciation Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Calculate asset value over time
              </p>
            </div>
            <Switch
              variant="safetrack"
              checked={settings.depreciationTracking}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, depreciationTracking: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Alerts & Reminders
          </CardTitle>
          <CardDescription>
            Set up automatic alerts for your assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Warranty Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified before warranties expire
              </p>
            </div>
            <Switch
              variant="safetrack"
              checked={settings.warrantyAlerts}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, warrantyAlerts: checked }))
              }
            />
          </div>
          {settings.warrantyAlerts && (
            <div className="flex items-center justify-between pl-6">
              <div className="space-y-0.5">
                <Label className="text-sm">Alert Days Before</Label>
                <p className="text-xs text-muted-foreground">
                  How early to alert
                </p>
              </div>
              <Select
                value={settings.warrantyAlertDays}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, warrantyAlertDays: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Maintenance Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Remind when maintenance is due
              </p>
            </div>
            <Switch
              variant="safetrack"
              checked={settings.maintenanceReminders}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, maintenanceReminders: checked }))
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
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what asset updates to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Warranty Expiring</p>
              <p className="text-sm text-muted-foreground">
                Alert when warranties are expiring
              </p>
            </div>
            <Switch
              variant="safetrack"
              checked={settings.notifications.warrantyExpiring}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, warrantyExpiring: checked }
                }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance Due</p>
              <p className="text-sm text-muted-foreground">
                Notify when maintenance is scheduled
              </p>
            </div>
            <Switch
              variant="safetrack"
              checked={settings.notifications.maintenanceDue}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, maintenanceDue: checked }
                }))
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Asset Changes</p>
              <p className="text-sm text-muted-foreground">
                Notify on asset updates or transfers
              </p>
            </div>
            <Switch
              variant="safetrack"
              checked={settings.notifications.assetChanges}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, assetChanges: checked }
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
          className="bg-emerald-500 hover:bg-emerald-600 text-black"
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
