import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Settings,
  BarChart3,
  Globe,
  Code,
  Shield,
  Crown,
  Zap,
  Target,
  Copy,
  Eye,
  ExternalLink
} from 'lucide-react';
import { useMSP, MSPClient } from '@/hooks/useMSP';
import { useToast } from '@/hooks/use-toast';

const MSPDashboard = () => {
  const { 
    msp, 
    clients, 
    isLoading, 
    createMSP, 
    createClient, 
    generateEmbedCode,
    calculateMetrics 
  } = useMSP();
  
  const { toast } = useToast();
  const [showCreateMSP, setShowCreateMSP] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showEmbedCode, setShowEmbedCode] = useState<MSPClient | null>(null);
  
  const [mspForm, setMspForm] = useState({
    company_name: '',
    domain: '',
    contact_email: '',
    phone: '',
    brand_name: 'SafePass',
    brand_color: '#3b82f6'
  });
  
  const [clientForm, setClientForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    domain: '',
    phone: '',
    max_users: 5,
    monthly_rate: 15
  });

  const handleCreateMSP = async () => {
    const result = await createMSP(mspForm);
    if (result) {
      setShowCreateMSP(false);
      setMspForm({
        company_name: '',
        domain: '',
        contact_email: '',
        phone: '',
        brand_name: 'SafePass',
        brand_color: '#3b82f6'
      });
    }
  };

  const handleCreateClient = async () => {
    const result = await createClient(clientForm);
    if (result) {
      setShowCreateClient(false);
      setClientForm({
        company_name: '',
        contact_name: '',
        contact_email: '',
        domain: '',
        phone: '',
        max_users: 5,
        monthly_rate: 15
      });
    }
  };

  const copyEmbedCode = (client: MSPClient) => {
    const code = generateEmbedCode(client);
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // MSP Setup Flow
  if (!msp) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <Crown className="h-16 w-16 mx-auto text-primary" />
            <h1 className="text-4xl font-bold">Welcome to MSP SafePass</h1>
            <p className="text-xl text-muted-foreground">
              Start generating recurring revenue with white-label password management
            </p>
          </div>

          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Set Up Your MSP Profile
              </CardTitle>
              <CardDescription>
                Create your MSP profile to start managing clients and generating revenue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={mspForm.company_name}
                    onChange={(e) => setMspForm(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Acme IT Solutions"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain Prefix</Label>
                  <Input
                    id="domain"
                    value={mspForm.domain}
                    onChange={(e) => setMspForm(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="acme"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your subdomain: {mspForm.domain || 'acme'}.safepass.com
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={mspForm.contact_email}
                    onChange={(e) => setMspForm(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="admin@acmeit.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={mspForm.phone}
                    onChange={(e) => setMspForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input
                    id="brand_name"
                    value={mspForm.brand_name}
                    onChange={(e) => setMspForm(prev => ({ ...prev, brand_name: e.target.value }))}
                    placeholder="SafePass"
                  />
                </div>
                <div>
                  <Label htmlFor="brand_color">Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brand_color"
                      type="color"
                      value={mspForm.brand_color}
                      onChange={(e) => setMspForm(prev => ({ ...prev, brand_color: e.target.value }))}
                      className="w-16"
                    />
                    <Input
                      value={mspForm.brand_color}
                      onChange={(e) => setMspForm(prev => ({ ...prev, brand_color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleCreateMSP} 
                className="w-full"
                disabled={!mspForm.company_name || !mspForm.domain || !mspForm.contact_email}
              >
                <Crown className="h-4 w-4 mr-2" />
                Create MSP Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-8 w-8 text-primary" />
            {msp.company_name} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your SafePass clients and track revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_company">Company Name</Label>
                    <Input
                      id="client_company"
                      value={clientForm.company_name}
                      onChange={(e) => setClientForm(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="ABC Corporation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_domain">Website Domain</Label>
                    <Input
                      id="client_domain"
                      value={clientForm.domain}
                      onChange={(e) => setClientForm(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="abccorp.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      value={clientForm.contact_name}
                      onChange={(e) => setClientForm(prev => ({ ...prev, contact_name: e.target.value }))}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_email">Contact Email</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={clientForm.contact_email}
                      onChange={(e) => setClientForm(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="john@abccorp.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="max_users">Max Users</Label>
                    <Input
                      id="max_users"
                      type="number"
                      value={clientForm.max_users}
                      onChange={(e) => setClientForm(prev => ({ ...prev, max_users: parseInt(e.target.value) }))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthly_rate">Rate per User</Label>
                    <Input
                      id="monthly_rate"
                      type="number"
                      step="0.01"
                      value={clientForm.monthly_rate}
                      onChange={(e) => setClientForm(prev => ({ ...prev, monthly_rate: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_phone">Phone</Label>
                    <Input
                      id="client_phone"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 987-6543"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCreateClient} 
                  className="w-full"
                  disabled={!clientForm.company_name || !clientForm.contact_name || !clientForm.contact_email}
                >
                  Add Client
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeClients} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Client payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${metrics.monthlyProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {((msp.commission_rate || 0.6667) * 100).toFixed(1)}% commission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4">
            {clients.map((client) => (
              <Card key={client.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {client.company_name}
                      </CardTitle>
                      <CardDescription>
                        {client.contact_name} • {client.contact_email}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={client.billing_status === 'active' ? 'default' : 'secondary'}>
                        {client.billing_status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyEmbedCode(client)}
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Embed Code
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Users</div>
                      <div className="font-medium">{client.current_users}/{client.max_users}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Monthly Rate</div>
                      <div className="font-medium">${client.monthly_rate}/user</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Monthly Revenue</div>
                      <div className="font-medium text-green-600">
                        ${(client.current_users * client.monthly_rate).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Domain</div>
                      <div className="font-medium">{client.domain || 'Not set'}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Portal
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {clients.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Clients Yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first client to start generating revenue</p>
                  <Button onClick={() => setShowCreateClient(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Client
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-2">
                  ${metrics.monthlyRevenue.toFixed(2)}/month
                </div>
                <p className="text-sm text-muted-foreground">
                  Average of ${metrics.averageRevenuePerClient.toFixed(2)} per client
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Client Retention</span>
                    <span className="text-sm font-medium">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Users/Client</span>
                    <span className="text-sm font-medium">
                      {metrics.activeClients > 0 ? (metrics.totalUsers / metrics.activeClients).toFixed(1) : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Growth</span>
                    <span className="text-sm font-medium text-green-600">+12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Embeddable Widget
                </CardTitle>
                <CardDescription>
                  Add SafePass to any website with one line of code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Code className="h-4 w-4 mr-2" />
                  Get Embed Code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Web Application
                </CardTitle>
                <CardDescription>
                  Full-featured web app for comprehensive password management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Launch Demo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  API Access
                </CardTitle>
                <CardDescription>
                  Custom integrations via REST API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  API Documentation
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Overview</CardTitle>
              <CardDescription>
                Your commission and payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">This Month</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${metrics.monthlyProfit.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    From {metrics.totalUsers} users
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Commission Rate</div>
                  <div className="text-2xl font-bold">
                    {((msp.commission_rate || 0.6667) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    You keep ${((msp.monthly_rate_per_user || 15) * (msp.commission_rate || 0.6667)).toFixed(2)} per user
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Next Payout</div>
                  <div className="text-2xl font-bold">Dec 1st</div>
                  <div className="text-xs text-muted-foreground">
                    Monthly automatic transfer
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MSPDashboard;