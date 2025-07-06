import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Code, Globe, Users, DollarSign, Zap, Shield, AlertTriangle, CheckCircle, Upload, Eye, Download } from 'lucide-react';

const SafeDocEmbedDemo = () => {
  const [selectedClient, setSelectedClient] = useState('lawfirm');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  
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

  const startScan = () => {
    setScanProgress(0);
    setScanComplete(false);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-gradient">
              SafeDoc Embeddable Widget
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            White-label document security scanning for your MSP clients
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <DollarSign className="h-4 w-4 mr-2" />
            Recurring Revenue Opportunity
          </Badge>
        </div>

        {/* Business Model Overview */}
        <Card className="border-2 border-success/20 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success-foreground">
              <Zap className="h-5 w-5" />
              Your MSP Revenue Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-success">$12/user</div>
                <div className="text-sm text-muted-foreground">You charge clients</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">$4/user</div>
                <div className="text-sm text-muted-foreground">You pay Ultrium</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-info">$8/user</div>
                <div className="text-sm text-muted-foreground">Your profit</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-card border rounded-lg">
              <p className="text-center text-sm text-muted-foreground">
                <strong>Example:</strong> 50 users across 5 clients = <strong>$400/month recurring revenue</strong>
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
                  See how SafeDoc looks with different client branding
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
                    Your client's website with embedded SafeDoc scanner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-6 bg-card space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded"></div>
                        <span className="font-semibold" style={{ color: currentClient.branding.primaryColor }}>
                          {currentClient.branding.companyName}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">{currentClient.domain}</div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Document Upload Portal</h3>
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Drag & drop files or click to browse
                          </p>
                          <Button 
                            variant="outline" 
                            className="mt-2"
                            onClick={startScan}
                          >
                            Upload Document
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* SafeDoc Widget Preview */}
                    <div className="mt-6 p-4 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {currentClient.branding.companyName} Document Scanner
                        </span>
                      </div>
                      
                      {scanProgress > 0 && (
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span>Scanning document...</span>
                            <span>{scanProgress}%</span>
                          </div>
                          <Progress value={scanProgress} className="h-2" />
                        </div>
                      )}
                      
                      {scanComplete ? (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            ✓ Document scanned successfully - No threats detected
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>✓ Real-time malware scanning</div>
                          <div>✓ VirusTotal integration</div>
                          <div>✓ Secure document storage</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Widget Features</CardTitle>
                  <CardDescription>
                    What your clients get with embedded SafeDoc
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-success mt-0.5" />
                      <div>
                        <div className="font-medium">Real-time Scanning</div>
                        <div className="text-sm text-muted-foreground">
                          Instant malware detection using VirusTotal API
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">Team Collaboration</div>
                        <div className="text-sm text-muted-foreground">
                          Share secure documents across teams
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Code className="h-5 w-5 text-info mt-0.5" />
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
                    <div className="bg-muted p-3 rounded text-xs font-mono">
                      {`<script src="https://safedoc.ultriumai.com/embed.js" 
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
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-sm font-mono bg-card p-3 rounded border">
                        {`<script 
  src="https://safedoc.ultriumai.com/embed.js"
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
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span>Works with any CMS (WordPress, Squarespace, etc.)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        <span>No technical knowledge required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
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
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          <Code className="h-4 w-4 text-primary" />
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
                  Manage all client SafeDoc deployments from one place
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-success/20 bg-success/5">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-success">8</div>
                      <div className="text-sm text-muted-foreground">Active Clients</div>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-primary">234</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </CardContent>
                  </Card>
                  <Card className="border-info/20 bg-info/5">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-info">$1,872</div>
                      <div className="text-sm text-muted-foreground">Monthly Revenue</div>
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
                            <div className="text-sm font-medium">32 users</div>
                            <div className="text-xs text-muted-foreground">$384/month</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-success">1,247 scans</div>
                            <div className="text-xs text-muted-foreground">This month</div>
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
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Ready to Launch Your Document Security Service?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join MSPs already generating recurring revenue with SafeDoc's white-label document scanning solution
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="hero">
                <Shield className="mr-2 h-5 w-5" />
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg">
                <Users className="mr-2 h-5 w-5" />
                Schedule Demo Call
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SafeDocEmbedDemo;