/**
 * Global Settings Hub - Comprehensive settings management
 * Covers branding, defaults, integrations, and notifications
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Settings, 
  Bell, 
  Link, 
  Shield, 
  Globe, 
  Upload, 
  Save, 
  RefreshCw,
  Building2,
  Mail,
  Zap,
  Database,
  Key,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Eye,
  Moon,
  Sun
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const settingsSections: SettingsSection[] = [
  { id: 'branding', label: 'Branding', icon: Palette, description: 'Logo, colors, and company identity' },
  { id: 'defaults', label: 'Defaults', icon: Settings, description: 'Default views, priorities, and behaviors' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email, SMS, and alert preferences' },
  { id: 'integrations', label: 'Integrations', icon: Link, description: 'Third-party connections and APIs' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Authentication and access control' },
  { id: 'localization', label: 'Localization', icon: Globe, description: 'Language, timezone, and formats' },
];

export function GlobalSettingsHub() {
  const [activeSection, setActiveSection] = useState('branding');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Branding state
  const [branding, setBranding] = useState({
    companyName: 'UltriumAI',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#0891b2',
    secondaryColor: '#7c3aed',
    accentColor: '#10b981',
    darkMode: 'system' as 'light' | 'dark' | 'system',
  });

  // Defaults state
  const [defaults, setDefaults] = useState({
    defaultPriority: 'medium',
    defaultView: 'dashboard',
    autoRefreshInterval: '30',
    itemsPerPage: '25',
    enableAnimations: true,
    compactMode: false,
  });

  // Notification state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: false,
    alertThreshold: 'warning',
    digestFrequency: 'daily',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  // Security state
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    passwordPolicy: 'strong',
    ipWhitelist: '',
    auditLogging: true,
  });

  // Localization state
  const [localization, setLocalization] = useState({
    language: 'en',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    currency: 'USD',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to defaults
    toast.info('Settings reset to defaults');
    setHasChanges(false);
  };

  const updateBranding = (key: string, value: any) => {
    setBranding(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateDefaults = (key: string, value: any) => {
    setDefaults(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateNotifications = (key: string, value: any) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateSecurity = (key: string, value: any) => {
    setSecurity(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateLocalization = (key: string, value: any) => {
    setLocalization(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your platform preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                      isActive 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{section.label}</p>
                      <p className={`text-xs truncate ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {section.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Branding Section */}
              {activeSection === 'branding' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-primary" />
                      Branding & Appearance
                    </CardTitle>
                    <CardDescription>
                      Customize your platform's look and feel
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input
                          value={branding.companyName}
                          onChange={(e) => updateBranding('companyName', e.target.value)}
                          placeholder="Your Company Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Theme Mode</Label>
                        <Select 
                          value={branding.darkMode} 
                          onValueChange={(v) => updateBranding('darkMode', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">
                              <div className="flex items-center gap-2">
                                <Sun className="h-4 w-4" /> Light
                              </div>
                            </SelectItem>
                            <SelectItem value="dark">
                              <div className="flex items-center gap-2">
                                <Moon className="h-4 w-4" /> Dark
                              </div>
                            </SelectItem>
                            <SelectItem value="system">System Default</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Brand Colors</Label>
                      <div className="grid gap-4 md:grid-cols-3">
                        {[
                          { key: 'primaryColor', label: 'Primary' },
                          { key: 'secondaryColor', label: 'Secondary' },
                          { key: 'accentColor', label: 'Accent' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-2">
                            <Label className="text-sm">{label}</Label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={branding[key as keyof typeof branding] as string}
                                onChange={(e) => updateBranding(key, e.target.value)}
                                className="h-10 w-12 rounded cursor-pointer border"
                              />
                              <Input
                                value={branding[key as keyof typeof branding] as string}
                                onChange={(e) => updateBranding(key, e.target.value)}
                                className="flex-1 font-mono text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Logo & Favicon</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Logo</Label>
                          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG, SVG up to 2MB
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Favicon</Label>
                          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload favicon
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ICO, PNG 32x32 or 64x64
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Defaults Section */}
              {activeSection === 'defaults' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Default Settings
                    </CardTitle>
                    <CardDescription>
                      Configure default behaviors and views
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Default Priority</Label>
                        <Select 
                          value={defaults.defaultPriority} 
                          onValueChange={(v) => updateDefaults('defaultPriority', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Default Landing Page</Label>
                        <Select 
                          value={defaults.defaultView} 
                          onValueChange={(v) => updateDefaults('defaultView', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dashboard">Dashboard</SelectItem>
                            <SelectItem value="tickets">Tickets</SelectItem>
                            <SelectItem value="devices">Devices</SelectItem>
                            <SelectItem value="alerts">Alerts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Auto-Refresh Interval</Label>
                        <Select 
                          value={defaults.autoRefreshInterval} 
                          onValueChange={(v) => updateDefaults('autoRefreshInterval', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 seconds</SelectItem>
                            <SelectItem value="30">30 seconds</SelectItem>
                            <SelectItem value="60">1 minute</SelectItem>
                            <SelectItem value="300">5 minutes</SelectItem>
                            <SelectItem value="0">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Items Per Page</Label>
                        <Select 
                          value={defaults.itemsPerPage} 
                          onValueChange={(v) => updateDefaults('itemsPerPage', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Display Options</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Enable Animations</p>
                            <p className="text-sm text-muted-foreground">
                              Show transitions and motion effects
                            </p>
                          </div>
                          <Switch
                            checked={defaults.enableAnimations}
                            onCheckedChange={(v) => updateDefaults('enableAnimations', v)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Compact Mode</p>
                            <p className="text-sm text-muted-foreground">
                              Reduce spacing for more content
                            </p>
                          </div>
                          <Switch
                            checked={defaults.compactMode}
                            onCheckedChange={(v) => updateDefaults('compactMode', v)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Control how and when you receive alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Channels</Label>
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive alerts via email' },
                        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser and mobile push alerts' },
                        { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Critical alerts via text message' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-muted-foreground">{desc}</p>
                          </div>
                          <Switch
                            checked={notifications[key as keyof typeof notifications] as boolean}
                            onCheckedChange={(v) => updateNotifications(key, v)}
                          />
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Alert Threshold</Label>
                        <Select 
                          value={notifications.alertThreshold} 
                          onValueChange={(v) => updateNotifications('alertThreshold', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="info">All (Info+)</SelectItem>
                            <SelectItem value="warning">Warning+</SelectItem>
                            <SelectItem value="critical">Critical Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Digest Frequency</Label>
                        <Select 
                          value={notifications.digestFrequency} 
                          onValueChange={(v) => updateNotifications('digestFrequency', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Quiet Hours</Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Start Time</Label>
                          <Input
                            type="time"
                            value={notifications.quietHoursStart}
                            onChange={(e) => updateNotifications('quietHoursStart', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">End Time</Label>
                          <Input
                            type="time"
                            value={notifications.quietHoursEnd}
                            onChange={(e) => updateNotifications('quietHoursEnd', e.target.value)}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Non-critical notifications will be muted during quiet hours
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Integrations Section */}
              {activeSection === 'integrations' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link className="h-5 w-5 text-primary" />
                      Integrations
                    </CardTitle>
                    <CardDescription>
                      Connect third-party services and APIs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'Slack', status: 'connected', icon: '💬' },
                      { name: 'Microsoft Teams', status: 'available', icon: '👥' },
                      { name: 'Jira', status: 'available', icon: '📋' },
                      { name: 'PagerDuty', status: 'available', icon: '🚨' },
                      { name: 'Zapier', status: 'connected', icon: '⚡' },
                    ].map((integration) => (
                      <div 
                        key={integration.name}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.icon}</span>
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {integration.status === 'connected' ? 'Connected and active' : 'Click to connect'}
                            </p>
                          </div>
                        </div>
                        {integration.status === 'connected' ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Button variant="outline" size="sm">
                            Connect
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Authentication and access control
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {[
                        { key: 'twoFactorEnabled', label: 'Two-Factor Authentication', desc: 'Require 2FA for all users' },
                        { key: 'auditLogging', label: 'Audit Logging', desc: 'Log all user actions for compliance' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{label}</p>
                            <p className="text-sm text-muted-foreground">{desc}</p>
                          </div>
                          <Switch
                            checked={security[key as keyof typeof security] as boolean}
                            onCheckedChange={(v) => updateSecurity(key, v)}
                          />
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Session Timeout (minutes)</Label>
                        <Select 
                          value={security.sessionTimeout} 
                          onValueChange={(v) => updateSecurity('sessionTimeout', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="480">8 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Password Policy</Label>
                        <Select 
                          value={security.passwordPolicy} 
                          onValueChange={(v) => updateSecurity('passwordPolicy', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic (8+ chars)</SelectItem>
                            <SelectItem value="strong">Strong (12+ with symbols)</SelectItem>
                            <SelectItem value="enterprise">Enterprise (16+ with complexity)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>IP Whitelist</Label>
                      <Textarea
                        value={security.ipWhitelist}
                        onChange={(e) => updateSecurity('ipWhitelist', e.target.value)}
                        placeholder="Enter IP addresses, one per line (leave empty to allow all)"
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground">
                        Restrict access to specific IP addresses
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Localization Section */}
              {activeSection === 'localization' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Localization
                    </CardTitle>
                    <CardDescription>
                      Language, timezone, and regional settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select 
                          value={localization.language} 
                          onValueChange={(v) => updateLocalization('language', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="pt">Português</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select 
                          value={localization.timezone} 
                          onValueChange={(v) => updateLocalization('timezone', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                            <SelectItem value="Europe/London">GMT/UTC</SelectItem>
                            <SelectItem value="Europe/Paris">Central European (CET)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Date Format</Label>
                        <Select 
                          value={localization.dateFormat} 
                          onValueChange={(v) => updateLocalization('dateFormat', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Time Format</Label>
                        <Select 
                          value={localization.timeFormat} 
                          onValueChange={(v) => updateLocalization('timeFormat', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                            <SelectItem value="24h">24-hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select 
                          value={localization.currency} 
                          onValueChange={(v) => updateLocalization('currency', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                            <SelectItem value="AUD">AUD (A$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default GlobalSettingsHub;
