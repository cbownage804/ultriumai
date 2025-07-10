import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, Users, DollarSign, TrendingUp, AlertTriangle, Plus,
  Search, Filter, Edit, Eye, Settings, FileText, Clock,
  Shield, Phone, Mail, Calendar, Target, BarChart3
} from 'lucide-react';

interface MSPData {
  id: string;
  company_name: string;
  brand_name: string;
  contact_email: string;
  phone: string;
  subscription_tier: string;
  is_active: boolean;
  max_clients: number;
  monthly_rate_per_user: number;
  commission_rate: number;
  trial_ends_at: string;
  created_at: string;
  client_count?: number;
  monthly_revenue?: number;
  support_tickets?: number;
  client_satisfaction?: number;
}

interface ClientOnboarding {
  id: string;
  msp_id: string;
  client_name: string;
  client_email: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  onboarding_stage: string;
  assigned_to: string;
  due_date: string;
  created_at: string;
}

export const EnhancedMSPManager = () => {
  const [msps, setMsps] = useState<MSPData[]>([]);
  const [onboardings, setOnboardings] = useState<ClientOnboarding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedMSP, setSelectedMSP] = useState<MSPData | null>(null);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMSPData();
    loadOnboardingData();
  }, []);

  const loadMSPData = async () => {
    try {
      const { data, error } = await supabase
        .from('msps')
        .select(`
          *,
          msp_clients(id, is_active, monthly_rate),
          helpdesk_tickets(id, status, priority)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedMSPs = data?.map(msp => ({
        ...msp,
        client_count: msp.msp_clients?.length || 0,
        monthly_revenue: msp.msp_clients?.reduce((sum: number, client: any) => 
          sum + (client.is_active ? client.monthly_rate : 0), 0) || 0,
        support_tickets: msp.helpdesk_tickets?.length || 0,
        client_satisfaction: Math.floor(Math.random() * 40) + 60 // Demo data
      })) || [];

      setMsps(enrichedMSPs);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load MSP data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingData = async () => {
    try {
      const { data, error } = await supabase
        .from('client_onboarding_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOnboardings(data || []);
    } catch (error: any) {
      console.error('Error loading onboarding data:', error);
    }
  };

  const createOnboardingWorkflow = async (data: any) => {
    try {
      const { error } = await supabase
        .from('client_onboarding_workflows')
        .insert({
          msp_id: data.msp_id,
          client_name: data.client_name,
          client_email: data.client_email,
          status: 'pending',
          onboarding_stage: 'initial_contact',
          assigned_to: data.assigned_to,
          due_date: data.due_date,
          workflow_steps: data.workflow_steps
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client onboarding workflow created successfully",
      });
      
      setShowOnboardingForm(false);
      loadOnboardingData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create onboarding workflow",
        variant: "destructive",
      });
    }
  };

  const updateMSPTier = async (mspId: string, newTier: string) => {
    try {
      const { error } = await supabase
        .from('msps')
        .update({ subscription_tier: newTier })
        .eq('id', mspId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "MSP tier updated successfully",
      });
      
      loadMSPData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update MSP tier",
        variant: "destructive",
      });
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      starter: 'bg-gray-100 text-gray-800',
      professional: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800',
      premium: 'bg-green-100 text-green-800'
    };
    return (
      <Badge className={colors[tier as keyof typeof colors] || colors.starter}>
        {tier?.toUpperCase() || 'STARTER'}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredMSPs = msps.filter(msp => {
    const matchesSearch = msp.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msp.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || msp.subscription_tier === tierFilter;
    return matchesSearch && matchesTier;
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Enhanced MSP Management</h2>
          <p className="text-muted-foreground">
            Advanced MSP partner management with onboarding, analytics, and automation
          </p>
        </div>
        <Dialog open={showOnboardingForm} onOpenChange={setShowOnboardingForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Client Onboarding
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Client Onboarding Workflow</DialogTitle>
              <DialogDescription>
                Set up a structured onboarding process for a new client
              </DialogDescription>
            </DialogHeader>
            <OnboardingForm msps={msps} onSubmit={createOnboardingWorkflow} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Client Onboarding</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="billing">Billing & Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search MSPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* MSP Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMSPs.map((msp) => (
              <Card key={msp.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{msp.company_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{msp.brand_name}</p>
                    </div>
                    {getTierBadge(msp.subscription_tier)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{msp.client_count}</div>
                        <div className="text-xs text-muted-foreground">Clients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">${msp.monthly_revenue}</div>
                        <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{msp.contact_email}</span>
                      </div>
                      {msp.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{msp.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedMSP(msp)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                      <Select
                        value={msp.subscription_tier}
                        onValueChange={(value) => updateMSPTier(msp.id, value)}
                      >
                        <SelectTrigger className="h-8 w-20">
                          <Settings className="h-3 w-3" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <OnboardingDashboard onboardings={onboardings} msps={msps} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <MSPAnalytics msps={msps} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingDashboard msps={msps} />
        </TabsContent>
      </Tabs>

      {/* MSP Details Modal */}
      {selectedMSP && (
        <MSPDetailsModal 
          msp={selectedMSP} 
          onClose={() => setSelectedMSP(null)}
          onUpdate={loadMSPData}
        />
      )}
    </div>
  );
};

// Onboarding Form Component
const OnboardingForm = ({ msps, onSubmit }: { msps: MSPData[], onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    msp_id: '',
    client_name: '',
    client_email: '',
    assigned_to: '',
    due_date: '',
    workflow_steps: [
      'Initial contact and requirements gathering',
      'Service agreement and contract signing',
      'Technical setup and configuration',
      'User training and documentation',
      'Go-live and support handoff'
    ]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>MSP Partner</Label>
          <Select value={formData.msp_id} onValueChange={(value) => 
            setFormData(prev => ({ ...prev, msp_id: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select MSP" />
            </SelectTrigger>
            <SelectContent>
              {msps.map(msp => (
                <SelectItem key={msp.id} value={msp.id}>
                  {msp.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Client Name</Label>
          <Input
            value={formData.client_name}
            onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Client Email</Label>
          <Input
            type="email"
            value={formData.client_email}
            onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Assigned To</Label>
          <Input
            value={formData.assigned_to}
            onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
            placeholder="Account manager email"
            required
          />
        </div>
      </div>

      <div>
        <Label>Target Completion Date</Label>
        <Input
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Create Workflow</Button>
      </div>
    </form>
  );
};

// Additional components would go here...
const OnboardingDashboard = ({ onboardings, msps }: { onboardings: ClientOnboarding[], msps: MSPData[] }) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Client Onboarding Workflows</h3>
    {onboardings.length === 0 ? (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No active onboarding workflows</p>
        </CardContent>
      </Card>
    ) : (
      <div className="grid gap-4">
        {onboardings.map(onboarding => {
          const msp = msps.find(m => m.id === onboarding.msp_id);
          return (
            <Card key={onboarding.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{onboarding.client_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      MSP: {msp?.company_name} • Stage: {onboarding.onboarding_stage}
                    </p>
                  </div>
                  {getStatusBadge(onboarding.status)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    )}
  </div>
);

const MSPAnalytics = ({ msps }: { msps: MSPData[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Total MSPs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{msps.length}</div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {msps.reduce((sum, msp) => sum + (msp.client_count || 0), 0)}
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ${msps.reduce((sum, msp) => sum + (msp.monthly_revenue || 0), 0).toLocaleString()}
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {Math.round(msps.reduce((sum, msp) => sum + (msp.client_satisfaction || 0), 0) / msps.length)}%
        </div>
      </CardContent>
    </Card>
  </div>
);

const BillingDashboard = ({ msps }: { msps: MSPData[] }) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold">Revenue & Billing</h3>
    <div className="grid gap-4">
      {msps.map(msp => (
        <Card key={msp.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{msp.company_name}</h4>
                <p className="text-sm text-muted-foreground">
                  {msp.client_count} clients • ${msp.monthly_rate_per_user}/user/month
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">${msp.monthly_revenue}</div>
                <div className="text-sm text-muted-foreground">
                  Commission: {(msp.commission_rate * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const MSPDetailsModal = ({ msp, onClose, onUpdate }: { 
  msp: MSPData, 
  onClose: () => void,
  onUpdate: () => void 
}) => (
  <Dialog open={true} onOpenChange={onClose}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>{msp.company_name} - MSP Details</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Company Information</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Brand Name:</strong> {msp.brand_name}</div>
              <div><strong>Email:</strong> {msp.contact_email}</div>
              <div><strong>Phone:</strong> {msp.phone}</div>
              <div><strong>Tier:</strong> {msp.subscription_tier}</div>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Performance Metrics</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Clients:</strong> {msp.client_count} / {msp.max_clients}</div>
              <div><strong>Monthly Revenue:</strong> ${msp.monthly_revenue}</div>
              <div><strong>Support Tickets:</strong> {msp.support_tickets}</div>
              <div><strong>Satisfaction:</strong> {msp.client_satisfaction}%</div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

function getStatusBadge(status: string): React.ReactNode {
  throw new Error('Function not implemented.');
}