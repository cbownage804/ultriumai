import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Users, Shield, AlertTriangle, Search, Plus, Settings, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Tenant {
  id: string;
  name: string;
  industry: string;
  status: string;
  agentCount: number;
  threatCount: number;
  riskScore: number;
  lastActivity: string;
}

export const MultiTenantManager = () => {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user) loadTenants();
  }, [user]);

  const loadTenants = async () => {
    // Load real tenant data from msp_clients if available
    const { data } = await supabase
      .from('msp_clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const mapped = data.map(client => ({
        id: client.id,
        name: client.company_name,
        industry: client.business_size || 'Standard',
        status: client.is_active ? 'active' : 'inactive',
        agentCount: 0,
        threatCount: client.alerts || 0,
        riskScore: 85,
        lastActivity: client.updated_at || client.created_at
      }));
      setTenants(mapped);
    } else {
      setTenants([]);
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
              Total Tenants
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
                Tenant Management
              </CardTitle>
              <CardDescription className="text-white/60">
                Manage and monitor all client environments
              </CardDescription>
            </div>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search tenants..."
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
                  <TableHead className="text-white/60">Tenant</TableHead>
                  <TableHead className="text-white/60">Industry</TableHead>
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
                      <p className="text-white/60">No tenants found</p>
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
                      <TableCell className="text-white/70">{tenant.industry}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
};