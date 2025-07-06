import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Shield, 
  Users, 
  Plus,
  Search,
  Filter,
  Settings,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

interface MSPOrganization {
  id: string;
  name: string;
  domain: string;
  contact_email: string;
  phone: string;
  subscription_tier: string;
  status: string;
  max_endpoints: number;
  created_at: string;
  endpoint_count?: number;
  threat_count?: number;
  monthly_revenue?: number;
}

interface ClientEndpoint {
  id: string;
  client_name: string;
  hostname: string;
  status: string;
  sla_tier: string;
  monitoring_level: string;
  last_seen: string;
  threat_count: number;
}

export const MSPClientManager = () => {
  const [organizations, setOrganizations] = useState<MSPOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<MSPOrganization | null>(null);
  const [clientEndpoints, setClientEndpoints] = useState<ClientEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newOrgDialog, setNewOrgDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadClientEndpoints(selectedOrg.id);
    }
  }, [selectedOrg]);

  const loadOrganizations = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: orgs, error } = await supabase
        .from('msp_organizations')
        .select(`
          *,
          msp_client_endpoints(
            id,
            endpoint_id,
            safe_shield_endpoints(status)
          )
        `)
        .eq('user_id', user.user.id)
        .order('name');

      if (error) throw error;

      // Enrich with calculated metrics
      const enrichedOrgs = orgs?.map(org => ({
        ...org,
        endpoint_count: org.msp_client_endpoints?.length || 0,
        threat_count: Math.floor(Math.random() * 20), // Demo data
        monthly_revenue: org.max_endpoints * 25 * (
          org.subscription_tier === 'enterprise' ? 1.5 :
          org.subscription_tier === 'premium' ? 1.2 : 1
        )
      })) || [];

      setOrganizations(enrichedOrgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load MSP organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClientEndpoints = async (orgId: string) => {
    try {
      const { data: endpoints, error } = await supabase
        .from('msp_client_endpoints')
        .select(`
          *,
          safe_shield_endpoints(
            hostname,
            status,
            last_seen,
            safe_shield_threats(id)
          )
        `)
        .eq('msp_org_id', orgId);

      if (error) throw error;

      const formattedEndpoints = endpoints?.map(ep => ({
        id: ep.id,
        client_name: ep.client_name,
        hostname: ep.safe_shield_endpoints?.hostname || 'Unknown',
        status: ep.safe_shield_endpoints?.status || 'offline',
        sla_tier: ep.sla_tier,
        monitoring_level: ep.monitoring_level,
        last_seen: ep.safe_shield_endpoints?.last_seen || '',
        threat_count: ep.safe_shield_endpoints?.safe_shield_threats?.length || 0
      })) || [];

      setClientEndpoints(formattedEndpoints);
    } catch (error) {
      console.error('Error loading client endpoints:', error);
    }
  };

  const createOrganization = async (orgData: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('msp_organizations')
        .insert({
          user_id: user.user.id,
          name: orgData.name,
          domain: orgData.domain,
          contact_email: orgData.contact_email,
          phone: orgData.phone,
          subscription_tier: orgData.subscription_tier,
          max_endpoints: orgData.max_endpoints
        });

      if (error) throw error;

      toast({
        title: "✅ Organization Created",
        description: `${orgData.name} has been added to your MSP portfolio`,
      });

      setNewOrgDialog(false);
      loadOrganizations();
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'suspended': return 'destructive';
      case 'expired': return 'outline';
      default: return 'outline';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'text-purple-600';
      case 'premium': return 'text-blue-600';
      case 'standard': return 'text-green-600';
      case 'basic': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            MSP Client Manager
          </h2>
          <p className="text-muted-foreground">
            Manage your MSP clients, endpoints, and service levels
          </p>
        </div>
        
        <Dialog open={newOrgDialog} onOpenChange={setNewOrgDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client Organization</DialogTitle>
            </DialogHeader>
            <NewOrganizationForm onSubmit={createOrganization} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrgs.map((org) => (
          <Card key={org.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedOrg(org)}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{org.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{org.domain}</p>
                </div>
                <Badge variant={getStatusColor(org.status)}>
                  {org.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{org.endpoint_count}</div>
                    <div className="text-xs text-muted-foreground">Endpoints</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{org.threat_count}</div>
                    <div className="text-xs text-muted-foreground">Threats</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">${org.monthly_revenue}</div>
                    <div className="text-xs text-muted-foreground">Monthly</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{org.contact_email}</span>
                  </div>
                  {org.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>{org.phone}</span>
                    </div>
                  )}
                </div>

                {/* Subscription Tier */}
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${getTierColor(org.subscription_tier)}`}>
                    {org.subscription_tier.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {org.max_endpoints} max endpoints
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Organization Details */}
      {selectedOrg && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">
                {selectedOrg.name} - Client Endpoints
              </CardTitle>
              <Button variant="outline" onClick={() => setSelectedOrg(null)}>
                Close Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ClientEndpointsTable endpoints={clientEndpoints} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Form component for creating new organizations
const NewOrganizationForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    contact_email: '',
    phone: '',
    subscription_tier: 'standard',
    max_endpoints: 50
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Organization Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Domain</label>
          <Input
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            placeholder="example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Contact Email</label>
          <Input
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Subscription Tier</label>
          <Select value={formData.subscription_tier} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, subscription_tier: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Max Endpoints</label>
          <Input
            type="number"
            value={formData.max_endpoints}
            onChange={(e) => setFormData(prev => ({ ...prev, max_endpoints: parseInt(e.target.value) }))}
            min="1"
            max="1000"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">Create Organization</Button>
      </div>
    </form>
  );
};

// Table component for client endpoints
const ClientEndpointsTable = ({ endpoints }: { endpoints: ClientEndpoint[] }) => {
  if (endpoints.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No endpoints registered for this organization
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Client</th>
            <th className="text-left p-2">Hostname</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">SLA Tier</th>
            <th className="text-left p-2">Monitoring</th>
            <th className="text-left p-2">Threats</th>
            <th className="text-left p-2">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {endpoints.map((endpoint) => (
            <tr key={endpoint.id} className="border-b hover:bg-muted/50">
              <td className="p-2 font-medium">{endpoint.client_name}</td>
              <td className="p-2">{endpoint.hostname}</td>
              <td className="p-2">
                <Badge variant={endpoint.status === 'online' ? 'default' : 'secondary'}>
                  {endpoint.status}
                </Badge>
              </td>
              <td className="p-2">
                <span className={
                  endpoint.sla_tier === 'critical' ? 'text-red-600' :
                  endpoint.sla_tier === 'premium' ? 'text-blue-600' :
                  endpoint.sla_tier === 'standard' ? 'text-green-600' : 'text-gray-600'
                }>
                  {endpoint.sla_tier.toUpperCase()}
                </span>
              </td>
              <td className="p-2">{endpoint.monitoring_level}</td>
              <td className="p-2">
                {endpoint.threat_count > 0 ? (
                  <Badge variant="destructive">{endpoint.threat_count}</Badge>
                ) : (
                  <span className="text-green-600">0</span>
                )}
              </td>
              <td className="p-2 text-sm text-muted-foreground">
                {endpoint.last_seen ? new Date(endpoint.last_seen).toLocaleString() : 'Never'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};