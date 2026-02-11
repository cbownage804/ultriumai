/**
 * Vanguard-specific Settings Page
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  Users, 
  Database,
  Zap,
  Save,
  Loader2,
  Building2,
  Globe,
  Mail,
  Clock,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { WhiteLabelSettings } from '@/components/vanguard/settings/WhiteLabelSettings';
import { MeshCentralSettings } from '@/components/vanguard/settings/MeshCentralSettings';
export default function VanguardSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General settings
  const [general, setGeneral] = useState({
    companyName: 'My MSP',
    defaultPriority: 'medium',
    defaultSLA: '24',
    autoAssign: true,
    enableAI: true,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    slackIntegration: false,
    teamsIntegration: false,
    criticalSMS: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Settings saved');
    setIsSaving(false);
  };

  // Organizations will be loaded from database in production
  const organizations: { id: string; name: string }[] = [];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/60">Configure your Vanguard platform</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-700">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-cyan-500/20">
          <TabsTrigger value="general" className="data-[state=active]:bg-cyan-500/20 text-white/80 data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-500/20 text-white/80 data-[state=active]:text-white">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="whitelabel" className="data-[state=active]:bg-cyan-500/20 text-white/80 data-[state=active]:text-white">
            <Palette className="h-4 w-4 mr-2" />
            White Label
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-cyan-500/20 text-white/80 data-[state=active]:text-white">
            <Zap className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="remote-access" className="data-[state=active]:bg-cyan-500/20 text-white/80 data-[state=active]:text-white">
            <Monitor className="h-4 w-4 mr-2" />
            Remote Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">General Settings</CardTitle>
                <CardDescription className="text-white/60">
                  Configure default behaviors and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white/80">MSP Company Name</Label>
                    <Input
                      value={general.companyName}
                      onChange={(e) => setGeneral(p => ({ ...p, companyName: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Default Ticket Priority</Label>
                    <Select 
                      value={general.defaultPriority} 
                      onValueChange={(v) => setGeneral(p => ({ ...p, defaultPriority: v }))}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-cyan-500/30">
                        <SelectItem value="low" className="text-white/80">Low</SelectItem>
                        <SelectItem value="medium" className="text-white/80">Medium</SelectItem>
                        <SelectItem value="high" className="text-white/80">High</SelectItem>
                        <SelectItem value="critical" className="text-white/80">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Default SLA (hours)</Label>
                    <Select 
                      value={general.defaultSLA} 
                      onValueChange={(v) => setGeneral(p => ({ ...p, defaultSLA: v }))}
                    >
                      <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-cyan-500/30">
                        <SelectItem value="4" className="text-white/80">4 hours</SelectItem>
                        <SelectItem value="8" className="text-white/80">8 hours</SelectItem>
                        <SelectItem value="24" className="text-white/80">24 hours</SelectItem>
                        <SelectItem value="48" className="text-white/80">48 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="bg-cyan-500/20" />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Automation</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-cyan-500/20 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Auto-Assign Tickets</p>
                        <p className="text-white/50 text-sm">Automatically assign tickets to available technicians</p>
                      </div>
                      <Switch
                        checked={general.autoAssign}
                        onCheckedChange={(v) => setGeneral(p => ({ ...p, autoAssign: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-cyan-500/20 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Enable Cortex AI</p>
                        <p className="text-white/50 text-sm">AI-powered ticket summarization and routing</p>
                      </div>
                      <Switch
                        checked={general.enableAI}
                        onCheckedChange={(v) => setGeneral(p => ({ ...p, enableAI: v }))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Notification Settings</CardTitle>
                <CardDescription className="text-white/60">
                  Configure how you receive alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive notifications via email' },
                  { key: 'slackIntegration', label: 'Slack Integration', desc: 'Send alerts to Slack channels' },
                  { key: 'teamsIntegration', label: 'Microsoft Teams', desc: 'Send alerts to Teams channels' },
                  { key: 'criticalSMS', label: 'Critical SMS Alerts', desc: 'Text message for critical issues only' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-cyan-500/20 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{label}</p>
                      <p className="text-white/50 text-sm">{desc}</p>
                    </div>
                    <Switch
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={(v) => setNotifications(p => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="whitelabel" className="mt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <WhiteLabelSettings organizations={organizations} />
          </motion.div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Integrations</CardTitle>
                <CardDescription className="text-white/60">
                  Connect third-party services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'Slack', status: 'available', icon: '💬' },
                  { name: 'Microsoft Teams', status: 'available', icon: '👥' },
                  { name: 'ConnectWise', status: 'available', icon: '🔗' },
                  { name: 'Autotask', status: 'available', icon: '⚙️' },
                  { name: 'Zapier', status: 'connected', icon: '⚡' },
                ].map((integration) => (
                  <div 
                    key={integration.name}
                    className="flex items-center justify-between p-4 border border-cyan-500/20 rounded-lg hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="font-medium text-white">{integration.name}</p>
                        <p className="text-sm text-white/50">
                          {integration.status === 'connected' ? 'Connected' : 'Click to connect'}
                        </p>
                      </div>
                    </div>
                    {integration.status === 'connected' ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Connected
                      </Badge>
                    ) : (
                      <Button variant="outline" size="sm" className="border-cyan-500/30 text-white/80">
                        Connect
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        <TabsContent value="remote-access" className="mt-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MeshCentralSettings />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
