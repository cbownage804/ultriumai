import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Building2, Plus, RefreshCw, Check, AlertTriangle,
  Clock, Shield, Mail, Key, ExternalLink, Trash2,
  Settings, Loader2, Eye, EyeOff, HardDrive, Users, Globe
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface GWSTenant {
  id: string;
  tenant_name: string;
  domain: string;
  customer_id: string | null;
  service_account_email: string | null;
  admin_email: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  monitoring_config: {
    login_monitoring: boolean;
    admin_changes: boolean;
    drive_monitoring: boolean;
    gmail_monitoring: boolean;
  };
  created_at: string;
}

export function GWSTenantManager() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<GWSTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    tenant_name: '',
    domain: '',
    customer_id: '',
    service_account_email: '',
    admin_email: '',
    credentials: '',
  });

  const fetchTenants = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke('gws-security-monitor', {
        body: { action: 'list_tenants' },
      });
      if (error) throw error;
      setTenants(data.tenants || []);
    } catch (err) {
      console.error('Failed to fetch GWS tenants:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleAdd = async () => {
    if (!form.tenant_name || !form.domain) {
      toast.error('Tenant name and domain are required');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('gws-security-monitor', {
        body: {
          action: 'add_tenant',
          tenant_name: form.tenant_name,
          domain: form.domain,
          customer_id: form.customer_id || null,
          service_account_email: form.service_account_email || null,
          admin_email: form.admin_email || null,
          credentials_encrypted: form.credentials || null,
        },
      });
      if (error) throw error;
      toast.success('Google Workspace tenant connected!');
      setShowAdd(false);
      setForm({ tenant_name: '', domain: '', customer_id: '', service_account_email: '', admin_email: '', credentials: '' });
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || 'Failed to connect tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSync = async (tenantId: string) => {
    setSyncing(tenantId);
    try {
      const { data, error } = await supabase.functions.invoke('gws-security-monitor', {
        body: { action: 'sync_tenant', tenant_id: tenantId },
      });
      if (error) throw error;
      toast.success(data.message || 'Sync complete');
      fetchTenants();
    } catch (err) {
      toast.error('Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async (tenantId: string) => {
    if (!confirm('Disconnect this Google Workspace tenant?')) return;
    try {
      await supabase.functions.invoke('gws-security-monitor', {
        body: { action: 'delete_tenant', tenant_id: tenantId },
      });
      toast.success('Tenant disconnected');
      fetchTenants();
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const formatLastSync = (date: string | null) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-green-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Connected Google Workspace Tenants</h2>
          <p className="text-slate-400 text-sm">Manage client Google Workspace integrations</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Connect Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-green-500/30 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-400" />
                Connect Google Workspace
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Enter Google Admin SDK service account credentials
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <h4 className="text-green-400 font-medium mb-2">Required Setup</h4>
                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-green-400" />
                    <span>Service Account with Domain-Wide Delegation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-green-400" />
                    <span>Admin SDK API & Reports API enabled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-green-400" />
                    <span>Scopes: admin.reports.audit.readonly, admin.directory.user.readonly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-green-400" />
                    <span>Gmail API scope for email security monitoring</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300">Display Name</Label>
                  <Input placeholder="e.g., Acme Corp Workspace"
                    value={form.tenant_name} onChange={e => setForm({ ...form, tenant_name: e.target.value })}
                    className="mt-1 bg-black/40 border-green-500/30 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Primary Domain</Label>
                  <Input placeholder="acme.com"
                    value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}
                    className="mt-1 bg-black/40 border-green-500/30 text-white font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-slate-300">Customer ID (optional)</Label>
                  <Input placeholder="C0xxxxxxx"
                    value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}
                    className="mt-1 bg-black/40 border-green-500/30 text-white font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-slate-300">Service Account Email</Label>
                  <Input placeholder="sa@project.iam.gserviceaccount.com"
                    value={form.service_account_email} onChange={e => setForm({ ...form, service_account_email: e.target.value })}
                    className="mt-1 bg-black/40 border-green-500/30 text-white font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-slate-300">Admin Email (for delegation)</Label>
                  <Input placeholder="admin@acme.com"
                    value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })}
                    className="mt-1 bg-black/40 border-green-500/30 text-white font-mono text-sm" />
                </div>
                <div>
                  <Label className="text-slate-300">Service Account JSON Key</Label>
                  <div className="relative mt-1">
                    <Input type={showSecret ? 'text' : 'password'}
                      placeholder="Paste JSON key contents"
                      value={form.credentials} onChange={e => setForm({ ...form, credentials: e.target.value })}
                      className="bg-black/40 border-green-500/30 text-white font-mono text-sm pr-10" />
                    <Button type="button" variant="ghost" size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-[#4285f4] hover:bg-[#3367d6]" onClick={handleAdd} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Connecting...</>
                  : <><ExternalLink className="h-4 w-4 mr-2" />Connect Workspace</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Connected</p>
                <p className="text-2xl font-bold text-white">{tenants.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Active</p>
                <p className="text-2xl font-bold text-green-400">{tenants.filter(t => t.is_active).length}</p>
              </div>
              <Shield className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Login Monitors</p>
                <p className="text-2xl font-bold text-blue-400">
                  {tenants.filter(t => t.monitoring_config?.login_monitoring).length}
                </p>
              </div>
              <Key className="h-8 w-8 text-blue-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Drive Monitors</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {tenants.filter(t => t.monitoring_config?.drive_monitoring).length}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-yellow-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Table */}
      <Card className="bg-black/60 border-green-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Workspace Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-green-400/30 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">No Workspaces Connected</h3>
              <p className="text-slate-400 text-sm mb-4">Connect a Google Workspace to start security monitoring</p>
              <Button onClick={() => setShowAdd(true)} className="bg-gradient-to-r from-green-500 to-blue-600">
                <Plus className="h-4 w-4 mr-2" /> Connect First Workspace
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-green-500/20 hover:bg-transparent">
                  <TableHead className="text-slate-400">Workspace</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Last Sync</TableHead>
                  <TableHead className="text-slate-400">Monitoring</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map(tenant => (
                  <TableRow key={tenant.id} className="border-green-500/10 hover:bg-green-500/5">
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{tenant.tenant_name}</p>
                        <p className="text-slate-500 text-xs">{tenant.domain}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={tenant.is_active
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}>
                        {tenant.is_active ? <><Check className="h-3 w-3 mr-1" />Active</> : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {formatLastSync(tenant.last_sync_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {tenant.monitoring_config?.login_monitoring && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-500/30 text-blue-400">Login</Badge>
                        )}
                        {tenant.monitoring_config?.admin_changes && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/30 text-purple-400">Admin</Badge>
                        )}
                        {tenant.monitoring_config?.drive_monitoring && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-500/30 text-yellow-400">Drive</Badge>
                        )}
                        {tenant.monitoring_config?.gmail_monitoring && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-red-500/30 text-red-400">Gmail</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-green-400"
                          onClick={() => handleSync(tenant.id)} disabled={syncing === tenant.id}>
                          <RefreshCw className={`h-3.5 w-3.5 ${syncing === tenant.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
                          onClick={() => handleDelete(tenant.id)}>
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
