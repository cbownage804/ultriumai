import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, TrendingUp, AlertTriangle, DollarSign, 
  Target, Users, Globe, FileText, BarChart3,
  CheckCircle, XCircle, Clock, Zap, Award
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ExecutiveDashboard() {
  const [securityMetrics, setSecurityMetrics] = useState({
    overallSecurityScore: 87,
    threatsPrevented: 2847,
    incidentsResolved: 142,
    complianceScore: 94,
    budgetUtilization: 73,
    roi: 340
  })

  const [riskData] = useState([
    { month: 'Jan', risk: 23, incidents: 12 },
    { month: 'Feb', risk: 18, incidents: 8 },
    { month: 'Mar', risk: 14, incidents: 5 },
    { month: 'Apr', risk: 19, incidents: 9 },
    { month: 'May', risk: 12, incidents: 4 },
    { month: 'Jun', risk: 8, incidents: 2 }
  ])

  const [costSavingsData] = useState([
    { category: 'Prevented Breaches', savings: 1200000 },
    { category: 'Compliance Automation', savings: 450000 },
    { category: 'Incident Response', savings: 280000 },
    { category: 'Staff Efficiency', savings: 320000 }
  ])

  const [complianceData] = useState([
    { name: 'SOC 2', value: 94, color: '#10b981' },
    { name: 'ISO 27001', value: 89, color: '#3b82f6' },
    { name: 'PCI DSS', value: 92, color: '#8b5cf6' },
    { name: 'HIPAA', value: 87, color: '#f59e0b' }
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Executive Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Executive Security Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Strategic security insights and business impact metrics for executive decision-making
          </p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Security Posture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-800 dark:text-green-200">{securityMetrics.overallSecurityScore}%</div>
                  <p className="text-sm text-green-600 dark:text-green-400">+5% from last quarter</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">ROI on Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{securityMetrics.roi}%</div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Return on investment</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Compliance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">{securityMetrics.complianceScore}%</div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Across all frameworks</p>
                </div>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Reduction Trend */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Risk Reduction Over Time
                  </CardTitle>
                  <CardDescription>Security risk score and incident trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={riskData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} name="Risk Score" />
                      <Line type="monotone" dataKey="incidents" stroke="#f59e0b" strokeWidth={3} name="Incidents" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Security Investments Impact */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Security Investment Impact
                  </CardTitle>
                  <CardDescription>Quantified business value of security measures</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { metric: 'Threats Prevented', value: securityMetrics.threatsPrevented, change: '+23%', impact: 'High' },
                    { metric: 'Incidents Resolved', value: securityMetrics.incidentsResolved, change: '+15%', impact: 'Medium' },
                    { metric: 'Downtime Avoided', value: '99.7%', change: '+2.1%', impact: 'Critical' },
                    { metric: 'Compliance Maintained', value: '94%', change: '+8%', impact: 'High' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <div className="font-medium">{item.metric}</div>
                        <div className="text-sm text-muted-foreground">Impact: {item.impact}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{item.value}</div>
                        <div className="text-sm text-green-600">{item.change}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <CardHeader className="text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                  <CardTitle className="text-emerald-800 dark:text-emerald-200">Security Excellence</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">Top 5%</div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Industry security ranking</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardHeader className="text-center">
                  <Zap className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <CardTitle className="text-blue-800 dark:text-blue-200">Response Time</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-2">4.2 min</div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Average incident response</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
                <CardHeader className="text-center">
                  <Globe className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                  <CardTitle className="text-purple-800 dark:text-purple-200">Global Coverage</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-2">24/7</div>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Threat monitoring</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Savings Analysis */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Security Cost Savings
                  </CardTitle>
                  <CardDescription>Quantified financial benefits</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costSavingsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${(value as number).toLocaleString()}`, 'Savings']} />
                      <Bar dataKey="savings" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Budget Utilization */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Security Budget Analysis</CardTitle>
                  <CardDescription>Current year budget allocation and ROI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Budget Utilized</span>
                      <span className="text-sm font-bold">{securityMetrics.budgetUtilization}%</span>
                    </div>
                    <Progress value={securityMetrics.budgetUtilization} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">$2.4M</div>
                      <div className="text-sm text-muted-foreground">Total Budget</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">$8.2M</div>
                      <div className="text-sm text-muted-foreground">Value Protected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Impact Summary */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Financial Impact Summary</CardTitle>
                <CardDescription>Comprehensive view of security's business value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950">
                    <div className="text-3xl font-bold text-green-600 mb-2">$2.25M</div>
                    <div className="text-sm text-green-700 dark:text-green-300">Total Cost Avoidance</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                    <div className="text-3xl font-bold text-blue-600 mb-2">340%</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Security ROI</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
                    <div className="text-3xl font-bold text-purple-600 mb-2">$450K</div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Insurance Savings</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950">
                    <div className="text-3xl font-bold text-orange-600 mb-2">$680K</div>
                    <div className="text-sm text-orange-700 dark:text-orange-300">Productivity Gains</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Heat Map */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Current Risk Landscape
                  </CardTitle>
                  <CardDescription>Top security risks and mitigation status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { risk: 'Advanced Persistent Threats', level: 'High', mitigation: 'Active', progress: 85 },
                    { risk: 'Insider Threats', level: 'Medium', mitigation: 'Monitoring', progress: 72 },
                    { risk: 'Supply Chain Attacks', level: 'High', mitigation: 'Enhanced', progress: 78 },
                    { risk: 'Ransomware', level: 'Critical', mitigation: 'Multi-layer', progress: 92 },
                    { risk: 'Data Exfiltration', level: 'Medium', mitigation: 'Controlled', progress: 68 }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.risk}</span>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={item.level === 'Critical' ? 'destructive' : 
                                   item.level === 'High' ? 'destructive' : 'secondary'}
                          >
                            {item.level}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Mitigation: {item.mitigation}</span>
                        <span>{item.progress}% complete</span>
                      </div>
                      <Progress value={item.progress} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Risk Trends */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Risk Trend Analysis</CardTitle>
                  <CardDescription>6-month security risk trajectory</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={riskData}>
                      <defs>
                        <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="risk" stroke="#ef4444" fillOpacity={1} fill="url(#riskGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance Status */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Compliance Framework Status
                  </CardTitle>
                  <CardDescription>Current compliance scores across standards</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={complianceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        nameKey="name"
                      >
                        {complianceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Compliance Score']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Compliance Actions */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>Compliance Action Items</CardTitle>
                  <CardDescription>Required actions to maintain compliance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { action: 'SOC 2 Annual Review', due: '30 days', priority: 'High', status: 'In Progress' },
                    { action: 'PCI DSS Quarterly Scan', due: '15 days', priority: 'Medium', status: 'Scheduled' },
                    { action: 'ISO 27001 Gap Analysis', due: '45 days', priority: 'Medium', status: 'Pending' },
                    { action: 'HIPAA Risk Assessment', due: '60 days', priority: 'Low', status: 'Planned' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <div className="font-medium">{item.action}</div>
                        <div className="text-sm text-muted-foreground">Due in {item.due}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={item.priority === 'High' ? 'destructive' : 
                                 item.priority === 'Medium' ? 'default' : 'secondary'}
                        >
                          {item.priority}
                        </Badge>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Strategic Security Roadmap</CardTitle>
                <CardDescription>Long-term security strategy and investment priorities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      initiative: 'Zero Trust Architecture',
                      timeline: 'Q2-Q4 2024',
                      budget: '$1.2M',
                      impact: 'High',
                      status: 'Planning'
                    },
                    {
                      initiative: 'AI-Powered Threat Detection',
                      timeline: 'Q3 2024',
                      budget: '$800K',
                      impact: 'Critical',
                      status: 'In Progress'
                    },
                    {
                      initiative: 'Security Awareness Program',
                      timeline: 'Q1 2024',
                      budget: '$150K',
                      impact: 'Medium',
                      status: 'Complete'
                    },
                    {
                      initiative: 'Cloud Security Posture',
                      timeline: 'Q4 2024',
                      budget: '$600K',
                      impact: 'High',
                      status: 'Approved'
                    },
                    {
                      initiative: 'Incident Response Automation',
                      timeline: 'Q3 2024',
                      budget: '$400K',
                      impact: 'High',
                      status: 'Development'
                    },
                    {
                      initiative: 'Third-Party Risk Management',
                      timeline: 'Q1 2025',
                      budget: '$300K',
                      impact: 'Medium',
                      status: 'Proposed'
                    }
                  ].map((initiative, index) => (
                    <Card key={index} className="border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{initiative.initiative}</CardTitle>
                        <CardDescription>{initiative.timeline}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Budget:</span>
                          <span className="font-medium">{initiative.budget}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Impact:</span>
                          <Badge variant={initiative.impact === 'Critical' ? 'destructive' : 
                                        initiative.impact === 'High' ? 'default' : 'secondary'}>
                            {initiative.impact}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Status:</span>
                          <Badge variant="outline">{initiative.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Items */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-center">Executive Action Items</CardTitle>
            <CardDescription className="text-center">Key decisions and approvals needed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Button size="lg" className="h-20 flex-col space-y-2">
                <DollarSign className="w-8 h-8" />
                <span>Approve Q4 Security Budget</span>
              </Button>
              <Button size="lg" variant="outline" className="h-20 flex-col space-y-2">
                <Users className="w-8 h-8" />
                <span>Review Incident Response Team</span>
              </Button>
              <Button size="lg" variant="outline" className="h-20 flex-col space-y-2">
                <FileText className="w-8 h-8" />
                <span>Sign Off Compliance Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}