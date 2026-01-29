import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, Plus, RefreshCw, Check, AlertTriangle, 
  Clock, Shield, Mail, Key, Users, ExternalLink, Trash2,
  Settings, Loader2, Eye, EyeOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface M365Tenant {
  id: string;
  tenant_name: string;
  tenant_domain: string;
  tenant_id: string;
  sync_status: string;
  last_sync_at: string | null;
  sync_error: string | null;
  monitor_risky_signins: boolean;
  monitor_conditional_access: boolean;
  monitor_mfa_status: boolean;
  monitor_mailbox_rules: boolean;
  is_active: boolean;
  created_at: string;
}

export function M365TenantManager() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<M365Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    tenantName: '',
    azureTenantId: '',
    clientId: '',
    clientSecret: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, [user]);

  const fetchTenants = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vanguard_m365_tenants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async () => {
    if (!formData.tenantName || !formData.azureTenantId || !formData.clientId || !formData.clientSecret) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('m365-oauth-callback', {
        body: {
          action: 'register_tenant',
          tenantName: formData.tenantName,
          tenantId: formData.azureTenantId,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Tenant connected successfully!');
      setShowAddDialog(false);
      setFormData({ tenantName: '', azureTenantId: '', clientId: '', clientSecret: '' });
      fetchTenants();
    } catch (error) {
      console.error('Error adding tenant:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to connect tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async (tenantId: string) => {
    setSyncing(tenantId);
    try {
      const { data, error } = await supabase.functions.invoke('m365-security-monitor', {
        body: { action: 'sync_tenant', tenantId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Synced ${data.eventsProcessed || 0} events`);
      fetchTenants();
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (!confirm('Are you sure you want to disconnect this tenant?')) return;

    try {
      const { error } = await supabase
        .from('vanguard_m365_tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;
      toast.success('Tenant disconnected');
      fetchTenants();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to disconnect tenant');
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="h-3 w-3 mr-1" />Synced</Badge>;
      case 'syncing':
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Unknown</Badge>;
    }
  };

  const formatLastSync = (date: string | null) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Connected M365 Tenants</h2>
          <p className="text-slate-400 text-sm">Manage client Microsoft 365 integrations</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Connect Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-cyan-500/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-cyan-400" />
                Connect Microsoft 365 Tenant
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter Azure AD app registration credentials
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <h4 className="text-cyan-400 font-medium mb-2">Required Azure Permissions</h4>
                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-cyan-400" />
                    <span>IdentityRiskEvent.Read.All - Read risky sign-ins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-cyan-400" />
                    <span>AuditLog.Read.All - Read conditional access logs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Reports.Read.All - Read MFA status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-cyan-400" />
                    <span>MailboxSettings.Read - Read mailbox rules</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300">Display Name</Label>
                  <Input 
                    placeholder="e.g., Acme Corporation"
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    className="mt-1 bg-black/40 border-cyan-500/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Azure Tenant ID</Label>
                  <Input 
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={formData.azureTenantId}
                    onChange={(e) => setFormData({ ...formData, azureTenantId: e.target.value })}
                    className="mt-1 bg-black/40 border-cyan-500/30 text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Application (Client) ID</Label>
                  <Input 
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="mt-1 bg-black/40 border-cyan-500/30 text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Client Secret</Label>
                  <div className="relative mt-1">
                    <Input 
                      type={showSecret ? 'text' : 'password'}
                      placeholder="Enter client secret"
                      value={formData.clientSecret}
                      onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                      className="bg-black/40 border-cyan-500/30 text-white font-mono text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-[#0078d4] hover:bg-[#106ebe]"
                onClick={handleAddTenant}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
                ) : (
                  <><ExternalLink className="h-4 w-4 mr-2" />Connect Tenant</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Connected Tenants</p>
                <p className="text-2xl font-bold text-white">{tenants.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-cyan-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Active Monitoring</p>
                <p className="text-2xl font-bold text-white">
                  {tenants.filter(t => t.is_active).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Synced</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {tenants.filter(t => t.sync_status === 'synced').length}
                </p>
              </div>
              <Check className="h-8 w-8 text-cyan-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Sync Errors</p>
                <p className="text-2xl font-bold text-red-400">
                  {tenants.filter(t => t.sync_status === 'error').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Table */}
      <Card className="bg-black/60 border-cyan-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Tenant Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-cyan-400/30 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No Tenants Connected</h3>
              <p className="text-slate-400 text-sm mb-4">Connect a Microsoft 365 tenant to start monitoring</p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect First Tenant
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-cyan-500/20 hover:bg-transparent">
                  <TableHead className="text-slate-400">Tenant</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Last Sync</TableHead>
                  <TableHead className="text-slate-400">Monitoring</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id} className="border-cyan-500/10 hover:bg-cyan-500/5">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{tenant.tenant_name}</p>
                        <p className="text-slate-500 text-xs">{tenant.tenant_domain}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getSyncStatusBadge(tenant.sync_status)}</TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {formatLastSync(tenant.last_sync_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {tenant.monitor_risky_signins && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-cyan-500/30 text-cyan-400">Sign-ins</Badge>
                        )}
                        {tenant.monitor_mfa_status && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/30 text-purple-400">MFA</Badge>
                        )}
                        {tenant.monitor_mailbox_rules && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-green-500/30 text-green-400">Mail</Badge>
                        )}
                        {tenant.monitor_conditional_access && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-orange-500/30 text-orange-400">CA</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-400"
                          onClick={() => handleSync(tenant.id)}
                          disabled={syncing === tenant.id}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncing === tenant.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                          onClick={() => handleDelete(tenant.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
