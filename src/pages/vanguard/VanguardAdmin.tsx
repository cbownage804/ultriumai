import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Settings, Users, Shield, Bell, Database, Key, Globe,
  Mail, Lock, Activity, Plus, MoreVertical, CheckCircle2,
  Trash2, Edit, Copy, Eye, EyeOff, RefreshCw, Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Technician' | 'Viewer';
  status: 'active' | 'inactive';
  lastActive: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: string;
}

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  key?: string;
  created: string;
  lastUsed: string;
}

const initialTeamMembers: TeamMember[] = [
  { id: '1', name: 'John Smith', email: 'john@company.com', role: 'Admin', status: 'active', lastActive: '2 min ago' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Technician', status: 'active', lastActive: '15 min ago' },
  { id: '3', name: 'Mike Chen', email: 'mike@company.com', role: 'Technician', status: 'active', lastActive: '1 hour ago' },
  { id: '4', name: 'Emily Brown', email: 'emily@company.com', role: 'Viewer', status: 'inactive', lastActive: '2 days ago' },
];

const initialIntegrations: Integration[] = [
  { id: '1', name: 'Slack', description: 'Send alerts to Slack channels', enabled: true, icon: '💬' },
  { id: '2', name: 'Microsoft Teams', description: 'Teams integration for notifications', enabled: true, icon: '👥' },
  { id: '3', name: 'PagerDuty', description: 'On-call alerting and escalation', enabled: false, icon: '📟' },
  { id: '4', name: 'Jira', description: 'Create tickets automatically', enabled: true, icon: '🎫' },
  { id: '5', name: 'Zapier', description: 'Connect to 3000+ apps', enabled: false, icon: '⚡' },
];

const initialAPIKeys: APIKey[] = [
  { id: '1', name: 'Production API Key', prefix: 'vg_prod_', created: 'Jan 15, 2024', lastUsed: '2 min ago' },
  { id: '2', name: 'Development Key', prefix: 'vg_dev_', created: 'Feb 1, 2024', lastUsed: '1 day ago' },
  { id: '3', name: 'Integration Key', prefix: 'vg_int_', created: 'Feb 10, 2024', lastUsed: 'Never' },
];

const roleColors = {
  Admin: 'bg-purple-500/20 text-purple-400',
  Technician: 'bg-cyan-500/20 text-cyan-400',
  Viewer: 'bg-slate-500/20 text-slate-400',
};

interface SecuritySetting {
  title: string;
  description: string;
  enabled: boolean;
  key: string;
}

interface NotificationSetting {
  title: string;
  description: string;
  enabled: boolean;
  key: string;
}

export default function VanguardAdmin() {
  const [activeTab, setActiveTab] = useState('team');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [apiKeys, setApiKeys] = useState<APIKey[]>(initialAPIKeys);
  
  // Dialogs
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showRevealKeyDialog, setShowRevealKeyDialog] = useState(false);
  
  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Technician' | 'Viewer'>('Technician');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [selectedApiKey, setSelectedApiKey] = useState<APIKey | null>(null);
  const [revealedKey, setRevealedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([
    { title: 'Two-Factor Authentication', description: 'Require 2FA for all team members', enabled: true, key: '2fa' },
    { title: 'Session Timeout', description: 'Auto-logout after 30 minutes of inactivity', enabled: true, key: 'session' },
    { title: 'IP Whitelisting', description: 'Restrict access to specific IP addresses', enabled: false, key: 'ip' },
    { title: 'Password Expiry', description: 'Force password change every 90 days', enabled: false, key: 'password' },
    { title: 'Audit Logging', description: 'Log all user actions for compliance', enabled: true, key: 'audit' },
  ]);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    { title: 'Critical Alerts', description: 'Get notified for critical severity alerts', enabled: true, key: 'critical' },
    { title: 'Daily Summary', description: 'Receive daily summary of all alerts', enabled: true, key: 'daily' },
    { title: 'New Device Connected', description: 'Alert when new devices connect', enabled: false, key: 'device' },
    { title: 'Ticket Updates', description: 'Notify on ticket status changes', enabled: true, key: 'ticket' },
    { title: 'Weekly Reports', description: 'Automated weekly performance reports', enabled: true, key: 'weekly' },
  ]);

  useEffect(() => {
    document.title = 'Admin | Vanguard';
  }, []);

  // Team actions
  const handleInviteMember = () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'active',
        lastActive: 'Just now',
      };
      setTeamMembers([...teamMembers, newMember]);
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('Technician');
      setIsLoading(false);
    }, 1000);
  };

  const handleEditRole = () => {
    if (!selectedMember) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setTeamMembers(teamMembers.map(m => 
        m.id === selectedMember.id ? { ...m, role: inviteRole } : m
      ));
      toast.success(`Role updated for ${selectedMember.name}`);
      setShowEditRoleDialog(false);
      setSelectedMember(null);
      setIsLoading(false);
    }, 500);
  };

  const handleResetPassword = (member: TeamMember) => {
    toast.success(`Password reset email sent to ${member.email}`);
  };

  const handleRemoveMember = (member: TeamMember) => {
    setTeamMembers(teamMembers.filter(m => m.id !== member.id));
    toast.success(`${member.name} removed from team`);
  };

  // Security settings toggle
  const toggleSecuritySetting = (key: string) => {
    setSecuritySettings(securitySettings.map(s => 
      s.key === key ? { ...s, enabled: !s.enabled } : s
    ));
    const setting = securitySettings.find(s => s.key === key);
    if (setting) {
      toast.success(`${setting.title} ${setting.enabled ? 'disabled' : 'enabled'}`);
    }
  };

  // Notification settings toggle
  const toggleNotificationSetting = (key: string) => {
    setNotificationSettings(notificationSettings.map(s => 
      s.key === key ? { ...s, enabled: !s.enabled } : s
    ));
    const setting = notificationSettings.find(s => s.key === key);
    if (setting) {
      toast.success(`${setting.title} ${setting.enabled ? 'disabled' : 'enabled'}`);
    }
  };

  // Integration toggle
  const toggleIntegration = (id: string) => {
    setIntegrations(integrations.map(i => 
      i.id === id ? { ...i, enabled: !i.enabled } : i
    ));
    const integration = integrations.find(i => i.id === id);
    if (integration) {
      toast.success(`${integration.name} ${integration.enabled ? 'disconnected' : 'connected'}`);
    }
  };

  // API Key actions
  const handleGenerateApiKey = () => {
    if (!newApiKeyName) {
      toast.error('Please enter a key name');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const newKey: APIKey = {
        id: Date.now().toString(),
        name: newApiKeyName,
        prefix: 'vg_new_',
        key: `vg_new_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastUsed: 'Never',
      };
      setApiKeys([...apiKeys, newKey]);
      setRevealedKey(newKey.key || '');
      setSelectedApiKey(newKey);
      setShowApiKeyDialog(false);
      setShowRevealKeyDialog(true);
      setNewApiKeyName('');
      setIsLoading(false);
      toast.success('API key generated successfully');
    }, 1000);
  };

  const handleRevealKey = (key: APIKey) => {
    setIsLoading(true);
    setTimeout(() => {
      const fullKey = key.key || `${key.prefix}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setRevealedKey(fullKey);
      setSelectedApiKey(key);
      setShowRevealKeyDialog(true);
      setIsLoading(false);
    }, 500);
  };

  const handleRevokeKey = (key: APIKey) => {
    setApiKeys(apiKeys.filter(k => k.id !== key.id));
    toast.success(`API key "${key.name}" revoked`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

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
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
              onClick={() => setShowInviteDialog(true)}
            >
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
                    <AnimatePresence>
                      {teamMembers.map((member) => (
                        <motion.tr 
                          key={member.id} 
                          className="border-b border-cyan-500/10 hover:bg-cyan-500/5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
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
                            <Badge className={roleColors[member.role]}>
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
                                <DropdownMenuItem 
                                  className="text-white/80 hover:bg-cyan-500/10"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setInviteRole(member.role);
                                    setShowEditRoleDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Role
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white/80 hover:bg-cyan-500/10"
                                  onClick={() => handleResetPassword(member)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-400 hover:bg-red-500/10"
                                  onClick={() => handleRemoveMember(member)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
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
            <CardContent className="space-y-4">
              {securitySettings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{setting.title}</p>
                    <p className="text-white/60 text-sm">{setting.description}</p>
                  </div>
                  <Switch 
                    checked={setting.enabled} 
                    onCheckedChange={() => toggleSecuritySetting(setting.key)}
                  />
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
            <CardContent className="space-y-4">
              {notificationSettings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{setting.title}</p>
                    <p className="text-white/60 text-sm">{setting.description}</p>
                  </div>
                  <Switch 
                    checked={setting.enabled} 
                    onCheckedChange={() => toggleNotificationSetting(setting.key)}
                  />
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
                        <Switch 
                          checked={integration.enabled} 
                          onCheckedChange={() => toggleIntegration(integration.id)}
                        />
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
            <Button 
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
              onClick={() => setShowApiKeyDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Key
            </Button>
          </div>
          
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <AnimatePresence>
                {apiKeys.map((key) => (
                  <motion.div 
                    key={key.id} 
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div>
                      <p className="text-white font-medium">{key.name}</p>
                      <p className="text-white/60 text-sm font-mono">{key.prefix}••••••••••••</p>
                      <p className="text-white/40 text-xs mt-1">Created: {key.created} • Last used: {key.lastUsed}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                        onClick={() => handleRevealKey(key)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Reveal
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                        onClick={() => handleRevokeKey(key)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Invite Team Member</DialogTitle>
            <DialogDescription className="text-white/60">
              Send an invitation email to add a new team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Email Address</Label>
              <Input
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Technician">Technician</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteDialog(false)} className="text-white/60">
              Cancel
            </Button>
            <Button onClick={handleInviteMember} disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={showEditRoleDialog} onOpenChange={setShowEditRoleDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Role</DialogTitle>
            <DialogDescription className="text-white/60">
              Change the role for {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Technician">Technician</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditRoleDialog(false)} className="text-white/60">
              Cancel
            </Button>
            <Button onClick={handleEditRole} disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Generate API Key</DialogTitle>
            <DialogDescription className="text-white/60">
              Create a new API key for programmatic access.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Key Name</Label>
              <Input
                placeholder="My API Key"
                value={newApiKeyName}
                onChange={(e) => setNewApiKeyName(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowApiKeyDialog(false)} className="text-white/60">
              Cancel
            </Button>
            <Button onClick={handleGenerateApiKey} disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal API Key Dialog */}
      <Dialog open={showRevealKeyDialog} onOpenChange={setShowRevealKeyDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">API Key</DialogTitle>
            <DialogDescription className="text-white/60">
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
              <code className="text-cyan-400 font-mono text-sm flex-1 break-all">{revealedKey}</code>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => copyToClipboard(revealedKey)}
                className="text-white/60 hover:text-white"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRevealKeyDialog(false)} className="bg-cyan-500 hover:bg-cyan-600">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
