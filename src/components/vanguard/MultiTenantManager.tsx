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
    // Use mock data for multi-tenant view
    setTenants([
      { id: '1', name: 'Acme Corporation', industry: 'Manufacturing', status: 'active', agentCount: 45, threatCount: 2, riskScore: 75, lastActivity: '2024-12-25T10:30:00Z' },
      { id: '2', name: 'TechStart Inc', industry: 'Technology', status: 'active', agentCount: 23, threatCount: 0, riskScore: 85, lastActivity: '2024-12-25T09:15:00Z' },
      { id: '3', name: 'HealthCare Plus', industry: 'Healthcare', status: 'active', agentCount: 67, threatCount: 5, riskScore: 68, lastActivity: '2024-12-25T11:45:00Z' },
      { id: '4', name: 'Finance Group', industry: 'Finance', status: 'active', agentCount: 34, threatCount: 1, riskScore: 82, lastActivity: '2024-12-24T16:20:00Z' },
      { id: '5', name: 'Retail Solutions', industry: 'Retail', status: 'inactive', agentCount: 12, threatCount: 0, riskScore: 90, lastActivity: '2024-12-20T08:00:00Z' },
    ]);
  };
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
    if (score >= 80) return <Badge className="bg-green-500">Low Risk</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Medium Risk</Badge>;
    return <Badge className="bg-red-500">High Risk</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Active Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.totalThreats}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Tenant Management
              </CardTitle>
              <CardDescription>
                Manage and monitor all client environments
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Threats</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {tenant.status}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{tenant.industry}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {tenant.agentCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.threatCount > 0 ? (
                        <Badge variant="destructive">{tenant.threatCount}</Badge>
                      ) : (
                        <Badge variant="secondary">0</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getRiskBadge(tenant.riskScore)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tenant.lastActivity).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm">
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
