import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, Users, Settings, Plus, Edit2, Trash2, 
  Key, Shield, Eye, Search, Lock, Unlock, Globe, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHorizonTenants } from '@/hooks/useHorizon';

interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  lastActive?: string;
  status: 'active' | 'invited' | 'disabled';
}

export const MultiTenantManager: React.FC = () => {
  const { toast } = useToast();
  const { tenants, roles, isLoading, createTenant, createRole, refetch } = useHorizonTenants();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Mock tenant users until we have a dedicated table
  const [tenantUsers] = useState<TenantUser[]>([
    { id: '1', tenantId: '1', email: 'admin@acme.com', name: 'John Smith', role: 'Tenant Admin', lastActive: new Date().toISOString(), status: 'active' },
    { id: '2', tenantId: '1', email: 'tech@acme.com', name: 'Jane Doe', role: 'Technician', lastActive: new Date(Date.now() - 3600000).toISOString(), status: 'active' },
  ]);

  // Map from DB tenants to UI format
  const displayTenants = tenants.map(t => ({
    id: t.id,
    name: t.tenant_name,
    domain: `${t.tenant_slug}.vanguard.local`,
    status: t.is_active ? 'active' as const : 'suspended' as const,
    userCount: 0, // Would come from a join
    deviceCount: 0,
    createdAt: new Date(t.created_at).toLocaleDateString(),
    plan: 'professional' as const,
    features: Object.keys(t.settings || {}),
  }));


  type DisplayTenant = typeof displayTenants[number];

  const getStatusBadge = (status: DisplayTenant['status']) => {
    const config: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      suspended: 'bg-red-500/10 text-red-500',
      trial: 'bg-yellow-500/10 text-yellow-500'
    };
    return <Badge className={config[status]}>{status}</Badge>;
  };

  const getPlanBadge = (plan: DisplayTenant['plan']) => {
    const config: Record<string, string> = {
      starter: 'bg-blue-500/10 text-blue-500',
      professional: 'bg-purple-500/10 text-purple-500',
      enterprise: 'bg-primary/10 text-primary'
    };
    return <Badge className={config[plan]}>{plan}</Badge>;
  };

  const handleCreateTenantSubmit = async () => {
    try {
      await createTenant({ tenant_name: newTenantName, tenant_slug: newTenantSlug });
      setShowCreateDialog(false);
      setNewTenantName('');
      setNewTenantSlug('');
    } catch (err) {
      toast({ title: "Error", description: "Failed to create tenant", variant: "destructive" });
    }
  };

  const handleSuspendTenant = (tenant: DisplayTenant) => {
    toast({
      title: "Tenant Suspended",
      description: `${tenant.name} has been suspended.`,
      variant: "destructive"
    });
  };

  const filteredTenants = displayTenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Multi-Tenant Management
          </h2>
          <p className="text-muted-foreground">Isolate client data with tenant-based access</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>Provision a new isolated tenant organization</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input placeholder="Acme Corporation" />
              </div>
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <div className="flex items-center gap-2">
                  <Input placeholder="acme" />
                  <span className="text-muted-foreground">.vanguard.local</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Email</Label>
                <Input type="email" placeholder="admin@company.com" />
              </div>
              <Button onClick={handleCreateTenantSubmit} className="w-full">Create Tenant</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tenants</p>
                <p className="text-2xl font-bold">{displayTenants.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-500">
                  {displayTenants.filter(t => t.status === 'active').length}
                </p>
              </div>
              <Unlock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">
                  {displayTenants.reduce((acc, t) => acc + t.userCount, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold">
                  {displayTenants.reduce((acc, t) => acc + t.deviceCount, 0)}
                </p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="users">Tenant Users</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tenant Organizations</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search tenants..." 
                    className="pl-8 w-48"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {filteredTenants.map((tenant) => (
                    <div 
                      key={tenant.id} 
                      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {tenant.name}
                              {getStatusBadge(tenant.status)}
                              {getPlanBadge(tenant.plan)}
                            </h4>
                            <p className="text-sm text-muted-foreground">{tenant.domain}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {tenant.status === 'active' ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleSuspendTenant(tenant); }}
                            >
                              <Lock className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm">
                              <Unlock className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Users</p>
                          <p className="font-medium">{tenant.userCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Devices</p>
                          <p className="font-medium">{tenant.deviceCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-medium">{tenant.createdAt}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Features</p>
                          <p className="font-medium">{tenant.features.length} enabled</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3 flex-wrap">
                        {tenant.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Users</CardTitle>
              <CardDescription>Manage users within each tenant organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select defaultValue="1">
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {displayTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {tenantUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{user.role}</Badge>
                        <Badge className={user.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                          {user.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Global Multi-Tenant Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Data Isolation Mode</Label>
                  <p className="text-sm text-muted-foreground">Strict isolation between tenant data</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Cross-Tenant Admin Access</Label>
                  <p className="text-sm text-muted-foreground">Allow super admins to access all tenants</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tenant Self-Provisioning</Label>
                  <p className="text-sm text-muted-foreground">Allow new tenants to sign up automatically</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Audit Cross-Tenant Access</Label>
                  <p className="text-sm text-muted-foreground">Log all admin access to tenant data</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
