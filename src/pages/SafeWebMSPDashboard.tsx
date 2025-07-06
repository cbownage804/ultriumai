import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Users, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Settings, 
  Plus,
  Search,
  Filter,
  Download,
  Bell,
  Activity,
  Globe,
  User,
  Network,
  BarChart3
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface MSPClient {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'trial' | 'suspended';
  threats: number;
  assets: number;
  plan: 'basic' | 'professional' | 'enterprise';
  monthlyRevenue: number;
  lastScan: string;
}

interface ThreatSummary {
  clientId: string;
  clientName: string;
  criticalThreats: number;
  highThreats: number;
  totalThreats: number;
  lastUpdated: string;
}

const SafeWebMSPDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [threatSummary, setThreatSummary] = useState<ThreatSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock MSP client data
    const mockClients: MSPClient[] = [
      {
        id: '1',
        name: 'Acme Corporation',
        domain: 'acme-corp.com',
        status: 'active',
        threats: 12,
        assets: 45,
        plan: 'professional',
        monthlyRevenue: 899,
        lastScan: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'TechStart Inc',
        domain: 'techstart.io',
        status: 'trial',
        threats: 3,
        assets: 18,
        plan: 'basic',
        monthlyRevenue: 299,
        lastScan: '2024-01-15T09:15:00Z'
      },
      {
        id: '3',
        name: 'Global Finance Ltd',
        domain: 'globalfinance.com',
        status: 'active',
        threats: 28,
        assets: 124,
        plan: 'enterprise',
        monthlyRevenue: 1899,
        lastScan: '2024-01-15T11:45:00Z'
      },
      {
        id: '4',
        name: 'Local Law Firm',
        domain: 'locallegal.com',
        status: 'active',
        threats: 7,
        assets: 32,
        plan: 'professional',
        monthlyRevenue: 599,
        lastScan: '2024-01-15T08:20:00Z'
      }
    ];

    const mockThreatSummary: ThreatSummary[] = [
      { clientId: '1', clientName: 'Acme Corporation', criticalThreats: 3, highThreats: 5, totalThreats: 12, lastUpdated: '2024-01-15T10:30:00Z' },
      { clientId: '2', clientName: 'TechStart Inc', criticalThreats: 0, highThreats: 1, totalThreats: 3, lastUpdated: '2024-01-15T09:15:00Z' },
      { clientId: '3', clientName: 'Global Finance Ltd', criticalThreats: 8, highThreats: 12, totalThreats: 28, lastUpdated: '2024-01-15T11:45:00Z' },
      { clientId: '4', clientName: 'Local Law Firm', criticalThreats: 1, highThreats: 3, totalThreats: 7, lastUpdated: '2024-01-15T08:20:00Z' }
    ];

    setClients(mockClients);
    setThreatSummary(mockThreatSummary);
  }, []);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = clients.reduce((sum, client) => sum + client.monthlyRevenue, 0);
  const totalThreats = threatSummary.reduce((sum, summary) => sum + summary.totalThreats, 0);
  const criticalThreats = threatSummary.reduce((sum, summary) => sum + summary.criticalThreats, 0);
  const activeClients = clients.filter(c => c.status === 'active').length;

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Eye className="h-8 w-8 text-primary" />
              SafeWeb™ MSP Control Center
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage dark web monitoring for all your clients
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export All Reports
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients ({clients.length})</TabsTrigger>
            <TabsTrigger value="threats">Threats ({criticalThreats})</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Clients</p>
                      <p className="text-2xl font-bold text-blue-600">{activeClients}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Critical Threats</p>
                      <p className="text-2xl font-bold text-red-600">{criticalThreats}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Threats</p>
                      <p className="text-2xl font-bold text-orange-600">{totalThreats}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Client Threat Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Client Threat Summary</CardTitle>
                <CardDescription>Critical and high-priority threats requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threatSummary.filter(s => s.criticalThreats > 0 || s.highThreats > 0).map((summary) => (
                    <div key={summary.clientId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{summary.clientName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {new Date(summary.lastUpdated).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {summary.criticalThreats > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {summary.criticalThreats} Critical
                          </Badge>
                        )}
                        {summary.highThreats > 0 && (
                          <Badge className="bg-orange-100 text-orange-800">
                            {summary.highThreats} High
                          </Badge>
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredClients.map((client) => (
                <Card key={client.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{client.name}</h3>
                          <p className="text-muted-foreground">{client.domain}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPlanColor(client.plan.toLowerCase())}>
                          {client.plan}
                        </Badge>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{client.threats}</p>
                        <p className="text-sm text-muted-foreground">Threats</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{client.assets}</p>
                        <p className="text-sm text-muted-foreground">Assets</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">${client.monthlyRevenue}</p>
                        <p className="text-sm text-muted-foreground">Monthly</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Last Scan</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(client.lastScan).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {client.threats > 10 && (
                          <Badge variant="destructive">High Risk</Badge>
                        )}
                        {client.status === 'trial' && (
                          <Badge variant="secondary">Trial Period</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Reports
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Dashboard
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Threats Tab */}
          <TabsContent value="threats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Client Threats</CardTitle>
                <CardDescription>Consolidated view of all threats across your client base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threatSummary.map((summary) => (
                    <div key={summary.clientId} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold">{summary.clientName}</h4>
                        <Badge className="bg-gray-100 text-gray-800">
                          {summary.totalThreats} total
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{summary.criticalThreats}</p>
                          <p className="text-sm text-muted-foreground">Critical</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">{summary.highThreats}</p>
                          <p className="text-sm text-muted-foreground">High</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {summary.totalThreats - summary.criticalThreats - summary.highThreats}
                          </p>
                          <p className="text-sm text-muted-foreground">Medium/Low</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          Last updated: {new Date(summary.lastUpdated).toLocaleString()}
                        </p>
                        <Button variant="outline" size="sm">
                          View Client Threats
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                    <p className="text-muted-foreground">Monthly Recurring Revenue</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">${(totalRevenue * 12).toLocaleString()}</p>
                    <p className="text-muted-foreground">Annual Revenue Run Rate</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">${Math.round(totalRevenue / clients.length)}</p>
                    <p className="text-muted-foreground">Average Revenue Per Client</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Client</CardTitle>
                <CardDescription>Monthly revenue breakdown by client and plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).map((client) => (
                    <div key={client.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{client.name}</h4>
                          <Badge className={getPlanColor(client.plan.toLowerCase())}>
                            {client.plan}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">${client.monthlyRevenue}</p>
                        <p className="text-sm text-muted-foreground">per month</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default SafeWebMSPDashboard;