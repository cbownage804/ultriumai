import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Building2, Users, Shield, AlertTriangle, Search, Plus, Settings, BarChart3, ChevronRight, UserPlus, GitBranch, Palette, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { WhiteLabelSettings } from './settings/WhiteLabelSettings';
import { OrgHierarchyTree } from './settings/OrgHierarchyTree';
import { SSOSettings } from './settings/SSOSettings';

interface Tenant {
  id: string;
  name: string;
  industry: string;
  status: string;
  agentCount: number;
  threatCount: number;
  riskScore: number;
  lastActivity: string;
  parentId?: string;
  level?: number;
}

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export const MultiTenantManager = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isAddingOrg, setIsAddingOrg] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', parentId: '' });
  const [newMember, setNewMember] = useState({ email: '', role: 'viewer' });
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    if (user) {
      loadTenants();
      loadHierarchy();
    }
  }, [user]);

  const loadTenants = async () => {
    const { data } = await supabase
      .from('msp_clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const mapped = data.map(client => {
        // Use integration_settings for hierarchy metadata
        const integrationSettings = client.integration_settings as Record<string, any> | null;
        return {
          id: client.id,
          name: client.company_name,
          industry: client.business_size || 'Standard',
          status: client.is_active ? 'active' : 'inactive',
          agentCount: 0,
          threatCount: client.alerts || 0,
          riskScore: 85,
          lastActivity: client.updated_at || client.created_at,
          parentId: integrationSettings?.parent_org_id,
          level: integrationSettings?.hierarchy_level || 0
        };
      });
      setTenants(mapped);
    } else {
      setTenants([]);
    }
  };

  const loadHierarchy = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('org-management', {
        body: { action: 'get_hierarchy', user_id: user?.id }
      });

      if (!error && data?.hierarchy) {
        setHierarchy(data.hierarchy);
      }
    } catch (err) {
      console.error('Failed to load hierarchy:', err);
    }
  };

  const loadMembers = async (orgId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('org-management', {
        body: { action: 'get_members', org_id: orgId, user_id: user?.id }
      });

      if (!error && data?.members) {
        setMembers(data.members.map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: (m.metadata as any)?.org_role || m.role,
          permissions: (m.metadata as any)?.permissions || []
        })));
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const handleCreateSubOrg = async () => {
    if (!newOrg.name) {
      toast.error('Enter organization name');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('org-management', {
        body: {
          action: 'create_sub_org',
          parent_org_id: newOrg.parentId || null,
          name: newOrg.name,
          user_id: user?.id
        }
      });

      if (error) throw error;
      toast.success('Organization created');
      setIsAddingOrg(false);
      setNewOrg({ name: '', parentId: '' });
      loadTenants();
      loadHierarchy();
    } catch (err: any) {
      toast.error('Failed to create organization', { description: err.message });
    }
  };

  const handleAddMember = async () => {
    if (!selectedOrg || !newMember.email) {
      toast.error('Select organization and enter email');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('org-management', {
        body: {
          action: 'add_member',
          org_id: selectedOrg.id,
          email: newMember.email,
          role: newMember.role,
          user_id: user?.id
        }
      });

      if (error) throw error;
      toast.success('Member added');
      setIsAddingMember(false);
      setNewMember({ email: '', role: 'viewer' });
      loadMembers(selectedOrg.id);
    } catch (err: any) {
      toast.error('Failed to add member', { description: err.message });
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenant.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    totalAgents: tenants.reduce((sum, t) => sum + t.agentCount, 0),
    totalThreats: tenants.reduce((sum, t) => sum + t.threatCount, 0)
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Low Risk</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium Risk</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Risk</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-purple-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-white/80">
              <Building2 className="h-4 w-4 text-cyan-400" />
              Total Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-purple-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-white/80">
              <Shield className="h-4 w-4 text-green-400" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-purple-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-white/80">
              <Users className="h-4 w-4 text-cyan-400" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalAgents}</div>
          </CardContent>
        </Card>
        <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-purple-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-white/80">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              Active Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">{stats.totalThreats}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
        <CardHeader className="border-b border-cyan-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5 text-cyan-400" />
                Multi-Tenant Management
              </CardTitle>
              <CardDescription className="text-white/60">
                Manage organizations, hierarchies, and white-label configurations
              </CardDescription>
            </div>
            <Dialog open={isAddingOrg} onOpenChange={setIsAddingOrg}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black/95 border-cyan-500/30">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Organization</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Organization Name</Label>
                    <Input
                      placeholder="Acme Corp"
                      value={newOrg.name}
                      onChange={(e) => setNewOrg(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Parent Organization (optional)</Label>
                    <Select value={newOrg.parentId} onValueChange={(v) => setNewOrg(prev => ({ ...prev, parentId: v }))}>
                      <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                        <SelectValue placeholder="Select parent (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-cyan-500/30">
                        <SelectItem value="" className="text-white/80">No parent (root)</SelectItem>
                        {tenants.map(t => (
                          <SelectItem key={t.id} value={t.id} className="text-white/80">
                            {'  '.repeat(t.level || 0)}{t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateSubOrg} className="bg-cyan-600 hover:bg-cyan-700">
                      Create Organization
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingOrg(false)} className="border-cyan-500/30 text-white/80">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-black/40 border border-cyan-500/20">
              <TabsTrigger value="list" className="data-[state=active]:bg-cyan-500/20">
                <Building2 className="h-4 w-4 mr-2" />
                Organizations
              </TabsTrigger>
              <TabsTrigger value="hierarchy" className="data-[state=active]:bg-cyan-500/20">
                <GitBranch className="h-4 w-4 mr-2" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="whitelabel" className="data-[state=active]:bg-cyan-500/20">
                <Palette className="h-4 w-4 mr-2" />
                White Label
              </TabsTrigger>
              <TabsTrigger value="sso" className="data-[state=active]:bg-cyan-500/20">
                <Key className="h-4 w-4 mr-2" />
                SSO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-black/40 border-cyan-500/20 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-cyan-500/30">
                    <SelectItem value="all" className="text-white/80 focus:bg-cyan-500/10">All Status</SelectItem>
                    <SelectItem value="active" className="text-white/80 focus:bg-cyan-500/10">Active</SelectItem>
                    <SelectItem value="inactive" className="text-white/80 focus:bg-cyan-500/10">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border border-cyan-500/20 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-cyan-500/20 bg-black/40">
                      <TableHead className="text-white/60">Organization</TableHead>
                      <TableHead className="text-white/60">Level</TableHead>
                      <TableHead className="text-white/60">Agents</TableHead>
                      <TableHead className="text-white/60">Threats</TableHead>
                      <TableHead className="text-white/60">Risk Score</TableHead>
                      <TableHead className="text-white/60">Last Activity</TableHead>
                      <TableHead className="text-right text-white/60">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Building2 className="h-12 w-12 mx-auto text-cyan-400/50 mb-4" />
                          <p className="text-white/60">No organizations found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTenants.map((tenant) => (
                        <TableRow key={tenant.id} className="border-cyan-500/10 hover:bg-white/5">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-cyan-400/60" />
                              <div>
                                <p className="font-medium text-white">{tenant.name}</p>
                                <Badge 
                                  className={tenant.status === 'active' 
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30 text-xs' 
                                    : 'bg-white/10 text-white/50 border-white/20 text-xs'}
                                >
                                  {tenant.status}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                              Level {tenant.level || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-white/70">
                              <Users className="h-4 w-4 text-cyan-400/60" />
                              {tenant.agentCount}
                            </div>
                          </TableCell>
                          <TableCell>
                            {tenant.threatCount > 0 ? (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{tenant.threatCount}</Badge>
                            ) : (
                              <Badge className="bg-white/10 text-white/50 border-white/20">0</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getRiskBadge(tenant.riskScore)}</TableCell>
                          <TableCell className="text-sm text-white/50">
                            {new Date(tenant.lastActivity).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-white/60 hover:text-white hover:bg-cyan-500/10"
                                onClick={() => {
                                  setSelectedOrg(tenant);
                                  loadMembers(tenant.id);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-cyan-500/10">
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-cyan-500/10">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="hierarchy" className="pt-4">
              <OrgHierarchyTree hierarchy={hierarchy} onRefresh={loadHierarchy} />
            </TabsContent>

            <TabsContent value="whitelabel" className="pt-4">
              <WhiteLabelSettings organizations={tenants} />
            </TabsContent>

            <TabsContent value="sso" className="pt-4">
              <SSOSettings organizations={tenants} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Member Management Dialog */}
      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent className="bg-black/95 border-cyan-500/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              {selectedOrg?.name} - Team Members
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <p className="text-white/60">{members.length} member(s)</p>
              <Button 
                size="sm" 
                onClick={() => setIsAddingMember(true)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {isAddingMember && (
              <div className="p-4 border border-cyan-500/20 rounded-lg space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white/80">Email</Label>
                    <Input
                      placeholder="user@example.com"
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-black/40 border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Role</Label>
                    <Select value={newMember.role} onValueChange={(v) => setNewMember(prev => ({ ...prev, role: v }))}>
                      <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-cyan-500/30">
                        <SelectItem value="owner" className="text-white/80">Owner</SelectItem>
                        <SelectItem value="admin" className="text-white/80">Admin</SelectItem>
                        <SelectItem value="technician" className="text-white/80">Technician</SelectItem>
                        <SelectItem value="viewer" className="text-white/80">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddMember} className="bg-green-600 hover:bg-green-700">Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsAddingMember(false)} className="border-cyan-500/30">Cancel</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 border border-cyan-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <span className="text-cyan-400 font-medium">{member.name[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-white/50 text-sm">{member.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {member.role}
                  </Badge>
                </div>
              ))}
              {members.length === 0 && (
                <div className="text-center py-8 text-white/50">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No members yet
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
