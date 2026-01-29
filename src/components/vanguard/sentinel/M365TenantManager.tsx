import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, Plus, RefreshCw, Check, AlertTriangle, 
  Clock, Shield, Mail, Key, Users, ExternalLink, Trash2,
  Settings
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

interface M365Tenant {
  id: string;
  tenantName: string;
  tenantDomain: string;
  clientName: string;
  syncStatus: 'synced' | 'syncing' | 'error' | 'pending';
  lastSync: string;
  monitorRiskySignins: boolean;
  monitorConditionalAccess: boolean;
  monitorMfaStatus: boolean;
  monitorMailboxRules: boolean;
  userCount: number;
  alertsToday: number;
}

// Mock data
const mockTenants: M365Tenant[] = [
  {
    id: '1',
    tenantName: 'Acme Corp',
    tenantDomain: 'acmecorp.onmicrosoft.com',
    clientName: 'Acme Corporation',
    syncStatus: 'synced',
    lastSync: '2 minutes ago',
    monitorRiskySignins: true,
    monitorConditionalAccess: true,
    monitorMfaStatus: true,
    monitorMailboxRules: true,
    userCount: 156,
    alertsToday: 3
  },
  {
    id: '2',
    tenantName: 'TechStart Inc',
    tenantDomain: 'techstart.onmicrosoft.com',
    clientName: 'TechStart Inc',
    syncStatus: 'syncing',
    lastSync: '15 minutes ago',
    monitorRiskySignins: true,
    monitorConditionalAccess: true,
    monitorMfaStatus: false,
    monitorMailboxRules: true,
    userCount: 42,
    alertsToday: 0
  },
  {
    id: '3',
    tenantName: 'Global Finance',
    tenantDomain: 'globalfinance.onmicrosoft.com',
    clientName: 'Global Finance LLC',
    syncStatus: 'error',
    lastSync: '1 hour ago',
    monitorRiskySignins: true,
    monitorConditionalAccess: true,
    monitorMfaStatus: true,
    monitorMailboxRules: true,
    userCount: 312,
    alertsToday: 7
  }
];

export function M365TenantManager() {
  const [tenants] = useState<M365Tenant[]>(mockTenants);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getSyncStatusBadge = (status: M365Tenant['syncStatus']) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><Check className="h-3 w-3 mr-1" />Synced</Badge>;
      case 'syncing':
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

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
                Authorize access to a client's M365 tenant for security monitoring
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <h4 className="text-cyan-400 font-medium mb-2">OAuth Flow</h4>
                <p className="text-slate-400 text-sm mb-3">
                  Clicking "Authorize" will redirect to Microsoft's consent screen where the 
                  tenant admin can grant permissions.
                </p>
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
              <Button className="w-full bg-[#0078d4] hover:bg-[#106ebe]">
                <ExternalLink className="h-4 w-4 mr-2" />
                Authorize with Microsoft
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
                <p className="text-slate-400 text-xs">Total Users Monitored</p>
                <p className="text-2xl font-bold text-white">
                  {tenants.reduce((acc, t) => acc + t.userCount, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Alerts Today</p>
                <p className="text-2xl font-bold text-orange-400">
                  {tenants.reduce((acc, t) => acc + t.alertsToday, 0)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Sync Errors</p>
                <p className="text-2xl font-bold text-red-400">
                  {tenants.filter(t => t.syncStatus === 'error').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-red-400/50" />
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
          <Table>
            <TableHeader>
              <TableRow className="border-cyan-500/20 hover:bg-transparent">
                <TableHead className="text-slate-400">Tenant</TableHead>
                <TableHead className="text-slate-400">Client</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Last Sync</TableHead>
                <TableHead className="text-slate-400">Monitoring</TableHead>
                <TableHead className="text-slate-400">Users</TableHead>
                <TableHead className="text-slate-400">Alerts</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} className="border-cyan-500/10 hover:bg-cyan-500/5">
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{tenant.tenantName}</p>
                      <p className="text-slate-500 text-xs">{tenant.tenantDomain}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{tenant.clientName}</TableCell>
                  <TableCell>{getSyncStatusBadge(tenant.syncStatus)}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{tenant.lastSync}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {tenant.monitorRiskySignins && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-cyan-500/30 text-cyan-400">Sign-ins</Badge>
                      )}
                      {tenant.monitorMfaStatus && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/30 text-purple-400">MFA</Badge>
                      )}
                      {tenant.monitorMailboxRules && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 border-green-500/30 text-green-400">Mail</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">{tenant.userCount}</TableCell>
                  <TableCell>
                    {tenant.alertsToday > 0 ? (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        {tenant.alertsToday}
                      </Badge>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-400">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
