
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Settings, 
  Mail, 
  Phone,
  Globe,
  Crown,
  Shield,
  Zap
} from "lucide-react";
import { useMSP } from "@/hooks/useMSP";

export const MSPDashboard = () => {
  const { 
    msp, 
    clients, 
    setClients,
    licensePools, 
    clientLicenseAssignments, 
    userLicenseAssignments,
    isLoading, 
    createMSP, 
    createClient, 
    updateClient, 
    calculateMetrics,
    assignClientTier,
    assignUserTier,
    loadClients 
  } = useMSP();
  
  const { toast } = useToast();
  const [showCreateMSP, setShowCreateMSP] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newMSP, setNewMSP] = useState({
    company_name: '',
    domain: '',
    contact_email: '',
    phone: '',
    brand_name: '',
    brand_color: '#3b82f6'
  });
  
  const [newClient, setNewClient] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    domain: '',
    max_users: 5,
    tier: 'basic' as 'basic' | 'premium' | 'enterprise'
  });

  const metrics = calculateMetrics();

  const handleCreateMSP = async () => {
    const result = await createMSP(newMSP);
    if (result) {
      setShowCreateMSP(false);
      setNewMSP({
        company_name: '',
        domain: '',
        contact_email: '',
        phone: '',
        brand_name: '',
        brand_color: '#3b82f6'
      });
    }
  };

  const handleAddClient = async () => {
    // Get the selected tier's pricing
    const tierPools = licensePools.find(pool => pool.tier === newClient.tier);
    if (!tierPools) {
      toast({
        title: "Error",
        description: "License pool not found for selected tier",
        variant: "destructive",
      });
      return;
    }

    // Check if there are enough licenses available
    if (tierPools.available_licenses < newClient.max_users) {
      toast({
        title: "Insufficient Licenses",
        description: `You only have ${tierPools.available_licenses} ${newClient.tier} licenses available. You need ${newClient.max_users}.`,
        variant: "destructive",
      });
      return;
    }

    const result = await createClient({
      ...newClient,
      monthly_rate: tierPools.price_per_license * newClient.max_users
    });
    
    if (result) {
      // Assign the tier to the client
      await assignClientTier(result.id, newClient.tier, newClient.max_users, tierPools.price_per_license);
      
      setShowAddClient(false);
      setNewClient({
        company_name: '',
        contact_name: '',
        contact_email: '',
        domain: '',
        max_users: 5,
        tier: 'basic'
      });
      
      // Refresh client list
      await loadClients();
    }
  };

  // Get tier pricing for display
  const getTierPricing = (tier: 'basic' | 'premium' | 'enterprise') => {
    const pool = licensePools.find(p => p.tier === tier);
    return pool ? pool.price_per_license : 0;
  };

  // Get available licenses for a tier
  const getAvailableLicenses = (tier: 'basic' | 'premium' | 'enterprise') => {
    const pool = licensePools.find(p => p.tier === tier);
    return pool ? pool.available_licenses : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!msp) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Welcome to Ultrium MSP Portal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Create your MSP profile to get started with managing clients and white-label solutions.
            </p>
            <Dialog open={showCreateMSP} onOpenChange={setShowCreateMSP}>
              <DialogTrigger asChild>
                <Button className="w-full">Create MSP Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Your MSP Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={newMSP.company_name}
                      onChange={(e) => setNewMSP({ ...newMSP, company_name: e.target.value })}
                      placeholder="Your MSP Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={newMSP.domain}
                      onChange={(e) => setNewMSP({ ...newMSP, domain: e.target.value })}
                      placeholder="yourmsp.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={newMSP.contact_email}
                      onChange={(e) => setNewMSP({ ...newMSP, contact_email: e.target.value })}
                      placeholder="contact@yourmsp.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={newMSP.phone}
                      onChange={(e) => setNewMSP({ ...newMSP, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand_name">Brand Name (Optional)</Label>
                    <Input
                      id="brand_name"
                      value={newMSP.brand_name}
                      onChange={(e) => setNewMSP({ ...newMSP, brand_name: e.target.value })}
                      placeholder="Your Brand Name"
                    />
                  </div>
                  <Button onClick={handleCreateMSP} className="w-full">
                    Create MSP Profile
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{msp.company_name}</h1>
          <p className="text-muted-foreground">MSP Dashboard</p>
        </div>
        <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="client_company_name">Company Name</Label>
                <Input
                  id="client_company_name"
                  value={newClient.company_name}
                  onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={newClient.contact_name}
                  onChange={(e) => setNewClient({ ...newClient, contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="client_contact_email">Contact Email</Label>
                <Input
                  id="client_contact_email"
                  type="email"
                  value={newClient.contact_email}
                  onChange={(e) => setNewClient({ ...newClient, contact_email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="client_domain">Domain (Optional)</Label>
                <Input
                  id="client_domain"
                  value={newClient.domain}
                  onChange={(e) => setNewClient({ ...newClient, domain: e.target.value })}
                  placeholder="client.com"
                />
              </div>
              <div>
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  min="1"
                  value={newClient.max_users}
                  onChange={(e) => setNewClient({ ...newClient, max_users: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="tier">License Tier</Label>
                <Select value={newClient.tier} onValueChange={(value: 'basic' | 'premium' | 'enterprise') => setNewClient({ ...newClient, tier: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">
                      <div className="flex items-center justify-between w-full">
                        <span>Basic - ${getTierPricing('basic')}/user/month</span>
                        <Badge variant="secondary">{getAvailableLicenses('basic')} available</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="premium">
                      <div className="flex items-center justify-between w-full">
                        <span>Premium - ${getTierPricing('premium')}/user/month</span>
                        <Badge variant="secondary">{getAvailableLicenses('premium')} available</Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="enterprise">
                      <div className="flex items-center justify-between w-full">
                        <span>Enterprise - ${getTierPricing('enterprise')}/user/month</span>
                        <Badge variant="secondary">{getAvailableLicenses('enterprise')} available</Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {getAvailableLicenses(newClient.tier) < newClient.max_users && (
                  <p className="text-sm text-red-600 mt-1">
                    Insufficient licenses! You need {newClient.max_users} but only have {getAvailableLicenses(newClient.tier)} available.
                  </p>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Monthly Cost: ${(getTierPricing(newClient.tier) * newClient.max_users).toFixed(2)}
              </div>
              <Button 
                onClick={handleAddClient} 
                className="w-full"
                disabled={getAvailableLicenses(newClient.tier) < newClient.max_users}
              >
                Add Client
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
            <Building2 className="h-4 w-4 text-muted-foreground" />
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
              Before Ultrium fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.monthlyProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              After Ultrium fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* License Pools Overview */}
      <Card>
        <CardHeader>
          <CardTitle>License Pool Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {licensePools.map((pool) => (
              <div key={pool.tier} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold capitalize flex items-center gap-2">
                    {pool.tier === 'basic' && <Shield className="h-4 w-4" />}
                    {pool.tier === 'premium' && <Crown className="h-4 w-4" />}
                    {pool.tier === 'enterprise' && <Zap className="h-4 w-4" />}
                    {pool.tier}
                  </h3>
                  <Badge variant="outline">${pool.price_per_license}/user</Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Licenses:</span>
                    <span>{pool.total_licenses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned:</span>
                    <span>{pool.assigned_licenses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-semibold">{pool.available_licenses}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No clients yet. Add your first client to get started.
              </p>
            ) : (
              clients.map((client) => (
                <div key={client.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{client.company_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.contact_email}
                        </span>
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                        {client.domain && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {client.domain}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={client.billing_status === 'active' ? 'default' : 'secondary'}>
                        {client.billing_status}
                      </Badge>
                      {client.tier && (
                        <Badge variant="outline" className="capitalize">
                          {client.tier}
                        </Badge>
                      )}
                      <span className="text-sm font-medium">
                        ${client.monthly_rate}/month
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
