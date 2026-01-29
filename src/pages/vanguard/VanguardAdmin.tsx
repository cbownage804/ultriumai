import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, Users, Shield, Bell, Database, Key, Globe,
  Mail, Lock, Activity, Plus, MoreVertical, CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const teamMembers = [
  { id: '1', name: 'John Smith', email: 'john@company.com', role: 'Admin', status: 'active', lastActive: '2 min ago' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Technician', status: 'active', lastActive: '15 min ago' },
  { id: '3', name: 'Mike Chen', email: 'mike@company.com', role: 'Technician', status: 'active', lastActive: '1 hour ago' },
  { id: '4', name: 'Emily Brown', email: 'emily@company.com', role: 'Viewer', status: 'inactive', lastActive: '2 days ago' },
];

const integrations = [
  { id: '1', name: 'Slack', description: 'Send alerts to Slack channels', enabled: true, icon: '💬' },
  { id: '2', name: 'Microsoft Teams', description: 'Teams integration for notifications', enabled: true, icon: '👥' },
  { id: '3', name: 'PagerDuty', description: 'On-call alerting and escalation', enabled: false, icon: '📟' },
  { id: '4', name: 'Jira', description: 'Create tickets automatically', enabled: true, icon: '🎫' },
  { id: '5', name: 'Zapier', description: 'Connect to 3000+ apps', enabled: false, icon: '⚡' },
];

const roleColors = {
  Admin: 'bg-purple-500/20 text-purple-400',
  Technician: 'bg-cyan-500/20 text-cyan-400',
  Viewer: 'bg-slate-500/20 text-slate-400',
};

export default function VanguardAdmin() {
  const [activeTab, setActiveTab] = useState('team');

  useEffect(() => {
    document.title = 'Admin | Ultrium Vanguard';
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Settings className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
            <p className="text-white/60 text-sm">Manage your organization settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-cyan-500/20 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="team" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Globe className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Team Members</h2>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
          
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-500/20">
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Member</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Role</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Status</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Last Active</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-b border-cyan-500/10 hover:bg-cyan-500/5">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <span className="text-cyan-400 font-medium">{member.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{member.name}</p>
                              <p className="text-white/60 text-sm">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={roleColors[member.role as keyof typeof roleColors]}>
                            {member.role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={member.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}>
                            {member.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-white/60">{member.lastActive}</td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                              <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Edit Role</DropdownMenuItem>
                              <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Reset Password</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">Remove</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-cyan-400" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: 'Two-Factor Authentication', description: 'Require 2FA for all team members', enabled: true },
                { title: 'Session Timeout', description: 'Auto-logout after 30 minutes of inactivity', enabled: true },
                { title: 'IP Whitelisting', description: 'Restrict access to specific IP addresses', enabled: false },
                { title: 'Password Expiry', description: 'Force password change every 90 days', enabled: false },
                { title: 'Audit Logging', description: 'Log all user actions for compliance', enabled: true },
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{setting.title}</p>
                    <p className="text-white/60 text-sm">{setting.description}</p>
                  </div>
                  <Switch checked={setting.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-cyan-400" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { title: 'Critical Alerts', description: 'Get notified for critical severity alerts', enabled: true },
                { title: 'Daily Summary', description: 'Receive daily summary of all alerts', enabled: true },
                { title: 'New Device Connected', description: 'Alert when new devices connect', enabled: false },
                { title: 'Ticket Updates', description: 'Notify on ticket status changes', enabled: true },
                { title: 'Weekly Reports', description: 'Automated weekly performance reports', enabled: true },
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{setting.title}</p>
                    <p className="text-white/60 text-sm">{setting.description}</p>
                  </div>
                  <Switch checked={setting.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {integrations.map((integration, i) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{integration.icon}</div>
                        <div>
                          <p className="text-white font-medium">{integration.name}</p>
                          <p className="text-white/60 text-sm">{integration.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {integration.enabled && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        )}
                        <Switch checked={integration.enabled} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">API Keys</h2>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
              <Plus className="h-4 w-4 mr-2" />
              Generate Key
            </Button>
          </div>
          
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              {[
                { name: 'Production API Key', prefix: 'vg_prod_', created: 'Jan 15, 2024', lastUsed: '2 min ago' },
                { name: 'Development Key', prefix: 'vg_dev_', created: 'Feb 1, 2024', lastUsed: '1 day ago' },
                { name: 'Integration Key', prefix: 'vg_int_', created: 'Feb 10, 2024', lastUsed: 'Never' },
              ].map((key, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{key.name}</p>
                    <p className="text-white/60 text-sm font-mono">{key.prefix}••••••••••••</p>
                    <p className="text-white/40 text-xs mt-1">Created: {key.created} • Last used: {key.lastUsed}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
                      Reveal
                    </Button>
                    <Button variant="outline" size="sm" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
