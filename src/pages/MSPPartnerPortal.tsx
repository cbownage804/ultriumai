import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Building2, Users, DollarSign, TrendingUp, Settings, 
  Shield, AlertTriangle, CheckCircle, Star, Crown,
  BarChart3, Calendar, FileText, Bell, Globe
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MSPClientBrandingManager } from '@/components/MSPClientBrandingManager'

export default function MSPPartnerPortal() {
  const [partnerStats, setPartnerStats] = useState({
    totalClients: 127,
    activeEndpoints: 2847,
    monthlyRevenue: 89450,
    revenueGrowth: 23,
    threatsStopped: 1429,
    complianceScore: 94,
    partnerTier: 'Platinum'
  })

  const [recentAlerts, setRecentAlerts] = useState([
    { id: 1, client: 'Acme Corp', type: 'Critical Breach', severity: 'critical', time: '2 min ago' },
    { id: 2, client: 'TechStart Inc', type: 'Policy Violation', severity: 'medium', time: '15 min ago' },
    { id: 3, client: 'Global Systems', type: 'Compliance Alert', severity: 'high', time: '1 hour ago' }
  ])

  const { toast } = useToast()

  const handleWhiteLabelSetup = () => {
    toast({
      title: "White Label Setup",
      description: "Redirecting to branding configuration...",
    })
  }

  const handleClientOnboarding = () => {
    toast({
      title: "Auto-Onboarding",
      description: "New client onboarding workflow initiated",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              MSP Partner Portal
            </h1>
            <p className="text-muted-foreground mt-2">Manage your security services business</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
              <Crown className="w-4 h-4 mr-2 text-yellow-600" />
              {partnerStats.partnerTier} Partner
            </Badge>
            <Button onClick={handleWhiteLabelSetup} className="bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all">
              <Settings className="w-4 h-4 mr-2" />
              White Label Setup
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerStats.totalClients}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerStats.activeEndpoints.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all clients</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${partnerStats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-green-600">+{partnerStats.revenueGrowth}% growth</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80 hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threats Stopped</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerStats.threatsStopped}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real-Time Alerts */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Real-Time Alerts
                  </CardTitle>
                  <CardDescription>Critical security events across your clients</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <div className="font-medium">{alert.client}</div>
                        <div className="text-sm text-muted-foreground">{alert.type}</div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 
                                 alert.severity === 'high' ? 'destructive' : 'default'}
                        >
                          {alert.severity}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">{alert.time}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Revenue Tracking */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Revenue Analytics
                  </CardTitle>
                  <CardDescription>Track your security services profitability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Monthly Recurring Revenue</span>
                      <span className="font-bold">${partnerStats.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Annual Growth Rate</span>
                      <span className="font-bold text-green-600">+{partnerStats.revenueGrowth}%</span>
                    </div>
                    <Progress value={partnerStats.revenueGrowth * 4} className="h-2" />
                  </div>
                  <div className="pt-4 border-t">
                    <Button className="w-full" variant="outline">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Detailed Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Client Health Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Client Security Health</CardTitle>
                <CardDescription>Overall security posture across your managed clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">87%</div>
                    <div className="text-sm text-muted-foreground">Excellent Security</div>
                    <div className="text-xs text-muted-foreground">110 clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">11%</div>
                    <div className="text-sm text-muted-foreground">Needs Attention</div>
                    <div className="text-xs text-muted-foreground">14 clients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">2%</div>
                    <div className="text-sm text-muted-foreground">Critical Issues</div>
                    <div className="text-xs text-muted-foreground">3 clients</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <MSPClientBrandingManager />
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Client Management</h3>
              <Button onClick={handleClientOnboarding} className="bg-gradient-to-r from-primary to-accent">
                <Users className="w-4 h-4 mr-2" />
                Auto-Onboard New Client
              </Button>
            </div>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Client Portfolio</CardTitle>
                <CardDescription>Manage and monitor all your security clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Acme Corporation', endpoints: 245, health: 95, revenue: 12500, status: 'excellent' },
                    { name: 'TechStart Inc', endpoints: 89, health: 87, revenue: 4200, status: 'good' },
                    { name: 'Global Systems Ltd', endpoints: 167, health: 72, revenue: 8900, status: 'attention' },
                    { name: 'Innovation Hub', endpoints: 134, health: 91, revenue: 6800, status: 'excellent' }
                  ].map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-white font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.endpoints} endpoints</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-sm font-medium">{client.health}%</div>
                          <div className="text-xs text-muted-foreground">Health</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">${client.revenue}/mo</div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                        <Badge 
                          variant={client.status === 'excellent' ? 'default' : 
                                 client.status === 'good' ? 'secondary' : 'destructive'}
                        >
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <h3 className="text-2xl font-bold">Revenue Management</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Pricing Tiers</CardTitle>
                  <CardDescription>Manage your service pricing structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { tier: 'Basic Security', price: 15, endpoints: '1-50', features: 'Core protection' },
                    { tier: 'Advanced Security', price: 25, endpoints: '51-200', features: 'Full threat detection' },
                    { tier: 'Enterprise Security', price: 45, endpoints: '200+', features: 'Complete security suite' }
                  ].map((tier, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{tier.tier}</div>
                          <div className="text-sm text-muted-foreground">{tier.endpoints} endpoints</div>
                          <div className="text-xs text-muted-foreground">{tier.features}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">${tier.price}</div>
                          <div className="text-xs text-muted-foreground">per endpoint</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Revenue Streams</CardTitle>
                  <CardDescription>Diversify your security services income</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Managed Security Services</span>
                      <span className="font-bold">$67,200</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Compliance Consulting</span>
                      <span className="font-bold">$15,800</span>
                    </div>
                    <Progress value={18} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Incident Response</span>
                      <span className="font-bold">$6,450</span>
                    </div>
                    <Progress value={7} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <h3 className="text-2xl font-bold">Security Automation</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Auto-Remediation Workflows</CardTitle>
                  <CardDescription>Automated security incident response</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Malware Detection', status: 'active', actions: 247, success: 98 },
                    { name: 'Unauthorized Access', status: 'active', actions: 89, success: 94 },
                    { name: 'Policy Violations', status: 'active', actions: 156, success: 91 },
                    { name: 'Compliance Drift', status: 'paused', actions: 34, success: 97 }
                  ].map((workflow, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{workflow.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {workflow.actions} actions taken • {workflow.success}% success rate
                          </div>
                        </div>
                        <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                          {workflow.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Scheduled Assessments</CardTitle>
                  <CardDescription>Automated security evaluations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assessment Frequency</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm">Weekly</Button>
                      <Button variant="default" size="sm">Monthly</Button>
                      <Button variant="outline" size="sm">Quarterly</Button>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium mb-2">Next Scheduled Assessments</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Vulnerability Scan</span>
                        <span className="text-muted-foreground">Tomorrow 2:00 AM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Compliance Check</span>
                        <span className="text-muted-foreground">Friday 3:00 AM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Security Report</span>
                        <span className="text-muted-foreground">Next Monday</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <h3 className="text-2xl font-bold">Compliance Management</h3>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Automated Compliance Monitoring</CardTitle>
                <CardDescription>Real-time compliance status across frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { framework: 'SOC 2 Type II', score: 94, status: 'compliant', nextAudit: 'Q3 2024' },
                    { framework: 'PCI DSS', score: 87, status: 'compliant', nextAudit: 'Q4 2024' },
                    { framework: 'HIPAA', score: 91, status: 'compliant', nextAudit: 'Q1 2025' }
                  ].map((comp, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card/50">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-2">{comp.score}%</div>
                        <div className="font-medium">{comp.framework}</div>
                        <Badge variant="outline" className="mt-2">{comp.status}</Badge>
                        <div className="text-xs text-muted-foreground mt-2">Next audit: {comp.nextAudit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <h3 className="text-2xl font-bold">Security Apps Marketplace</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Advanced Threat Detection', price: 5, rating: 4.8, installs: '2.3k' },
                { name: 'Automated Incident Response', price: 8, rating: 4.9, installs: '1.8k' },
                { name: 'Compliance Reporter Pro', price: 12, rating: 4.7, installs: '950' },
                { name: 'Real-time Security Dashboard', price: 3, rating: 4.6, installs: '3.1k' },
                { name: 'Multi-tenant Manager', price: 15, rating: 4.9, installs: '720' },
                { name: 'Custom Branding Suite', price: 25, rating: 4.8, installs: '540' }
              ].map((app, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardHeader>
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm ml-1">{app.rating}</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{app.installs} installs</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold">${app.price}<span className="text-sm font-normal">/mo</span></div>
                      <Button size="sm">Install</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}