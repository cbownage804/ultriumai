import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Code, Globe, Users, DollarSign, Zap, Key } from 'lucide-react';

const EmbedDemo = () => {
  const [selectedClient, setSelectedClient] = useState('lawfirm');
  
  const clients = {
    lawfirm: {
      name: 'Johnson & Associates Law',
      domain: 'johnsonlaw.com',
      branding: {
        primaryColor: '#1e40af',
        logoUrl: '/api/placeholder/120/40',
        companyName: 'Johnson & Associates'
      }
    },
    medical: {
      name: 'Riverside Medical Group',
      domain: 'riversidemedical.com',
      branding: {
        primaryColor: '#059669',
        logoUrl: '/api/placeholder/120/40',
        companyName: 'Riverside Medical'
      }
    },
    accounting: {
      name: 'Smith CPA Firm',
      domain: 'smithcpa.com',
      branding: {
        primaryColor: '#dc2626',
        logoUrl: '/api/placeholder/120/40',
        companyName: 'Smith CPA'
      }
    }
  };

  const currentClient = clients[selectedClient as keyof typeof clients];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Key className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SafePass for MSP Widget
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            White-label password management for your MSP clients
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <DollarSign className="h-4 w-4 mr-2" />
            Recurring Revenue Opportunity
          </Badge>
        </div>

        {/* Business Model Overview */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Zap className="h-5 w-5" />
              Your MSP Revenue Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">$15/user</div>
                <div className="text-sm text-green-700">You charge clients</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">$5/user</div>
                <div className="text-sm text-blue-700">You pay Ultrium</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">$10/user</div>
                <div className="text-sm text-purple-700">Your profit</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-center text-sm text-gray-600">
                <strong>Example:</strong> 50 users across 5 clients = <strong>$500/month recurring revenue</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="demo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demo">Live Demo</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="dashboard">MSP Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            {/* Client Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Client to Demo</CardTitle>
                <CardDescription>
                  See how SafePass looks with different client branding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {Object.entries(clients).map(([key, client]) => (
                    <Button
                      key={key}
                      variant={selectedClient === key ? "default" : "outline"}
                      onClick={() => setSelectedClient(key)}
                      className="flex-1"
                    >
                      {client.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Mock Client Website */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {currentClient.name} Website
                  </CardTitle>
                  <CardDescription>
                    Your client's actual website with embedded SafePass
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-6 bg-white space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        <span className="font-semibold" style={{ color: currentClient.branding.primaryColor }}>
                          {currentClient.branding.companyName}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">{currentClient.domain}</div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Employee Portal Login</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Input 
                              id="email" 
                              type="email" 
                              placeholder="john@company.com"
                              className="pr-10"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <Key 
                                className="h-4 w-4 cursor-pointer" 
                                style={{ color: currentClient.branding.primaryColor }}
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Input 
                              id="password" 
                              type="password" 
                              placeholder="••••••••"
                              className="pr-10"
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                              <Key 
                                className="h-4 w-4 cursor-pointer" 
                                style={{ color: currentClient.branding.primaryColor }}
                              />
                            </div>
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          style={{ backgroundColor: currentClient.branding.primaryColor }}
                        >
                          Sign In
                        </Button>
                      </div>
                    </div>

                    {/* SafePass Widget Preview */}
                    <div className="mt-6 p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Key className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {currentClient.branding.companyName} Password Manager
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 space-y-1">
                        <div>✓ Auto-fill detected for this login form</div>
                        <div>✓ 3 saved credentials available</div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" className="text-xs">
                            Fill Credentials
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs">
                            Save New
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Widget Features</CardTitle>
                  <CardDescription>
                    What your clients get with embedded SafePass
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Key className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Auto-Detection</div>
                        <div className="text-sm text-muted-foreground">
                          Automatically detects login forms on any website
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Team Sharing</div>
                        <div className="text-sm text-muted-foreground">
                          Share credentials securely across teams
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Code className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <div className="font-medium">White-Label</div>
                        <div className="text-sm text-muted-foreground">
                          Fully branded with client's colors and logo
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Integration Code:</div>
                    <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                      {`<script src="https://safepass.ultriumai.com/embed.js" 
        data-tenant="${selectedClient}"
        data-brand="${currentClient.branding.companyName}">
</script>`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integration">
            <Card>
              <CardHeader>
                <CardTitle>Easy Integration for Your Clients</CardTitle>
                <CardDescription>
                  Simple one-line integration that works on any website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Step 1: Generate Embed Code</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-mono bg-white p-3 rounded border">
                        {`<script 
  src="https://safepass.ultriumai.com/embed.js"
  data-tenant="client-unique-id"
  data-brand="Client Company Name"
  data-color="#1e40af">
</script>`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Step 2: Add to Website</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Works with any CMS (WordPress, Squarespace, etc.)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>No technical knowledge required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Automatic updates and security patches</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Supported Platforms</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['WordPress', 'Squarespace', 'Wix', 'Shopify', 'Custom HTML', 'React', 'Vue', 'Angular'].map((platform) => (
                      <div key={platform} className="flex items-center gap-2 p-3 border rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <Code className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">{platform}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Your MSP Dashboard</CardTitle>
                <CardDescription>
                  Manage all client deployments from one place
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">12</div>
                      <div className="text-sm text-green-700">Active Clients</div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">347</div>
                      <div className="text-sm text-blue-700">Total Users</div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">$3,470</div>
                      <div className="text-sm text-purple-700">Monthly Revenue</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Client Management</h3>
                  <div className="space-y-3">
                    {Object.entries(clients).map(([key, client]) => (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.domain}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">24 users</div>
                            <div className="text-xs text-muted-foreground">$360/month</div>
                          </div>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-2xl font-bold text-blue-900">
              Ready to Launch Your Password Management Service?
            </h2>
            <p className="text-blue-700">
              Start offering SafePass to your clients today and create a new recurring revenue stream.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Set Up First Client
              </Button>
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmbedDemo;