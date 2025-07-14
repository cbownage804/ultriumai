import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye,
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Target,
  TrendingUp,
  Clock,
  Users,
  Search,
  Zap,
  UserCheck,
  Globe,
  BarChart3
} from 'lucide-react';

export const SafeSOCDemo = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock SOC data
  const socMetrics = {
    activeIncidents: 1,
    criticalThreats: 1,
    contained: 2,
    resolved24h: 24,
    daysMonitored: 365,
    meanTimeToDetection: '4.2 minutes',
    meanTimeToResponse: '12.8 minutes',
    threatCoverage: '99.7%',
    falsePositiveRate: '0.3%',
    clientSatisfaction: '4.9/5.0'
  };

  const activityFeed = [
    {
      id: 1,
      type: 'resolved',
      title: 'Incident Resolved',
      description: 'INC-2024-004 - Phishing email campaign blocked',
      timestamp: '2 min ago',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'incident',
      title: 'New Incident Created',
      description: 'INC-2024-001 - Suspicious PowerShell activity',
      timestamp: '15 min ago',
      icon: AlertTriangle,
      color: 'text-orange-600'
    },
    {
      id: 3,
      type: 'hunt',
      title: 'Threat Hunt Completed',
      description: 'Proactive hunt for living-off-the-land techniques',
      timestamp: '1 hour ago',
      icon: Search,
      color: 'text-blue-600'
    },
    {
      id: 4,
      type: 'containment',
      title: 'Containment Action',
      description: 'Isolated infected endpoint at AcmeTech Corp',
      timestamp: '2 hours ago',
      icon: Shield,
      color: 'text-purple-600'
    }
  ];

  const securityMetrics = [
    { label: 'Mean Time to Detection', value: '4.2 minutes', color: 'text-green-600' },
    { label: 'Mean Time to Response', value: '12.8 minutes', color: 'text-blue-600' },
    { label: 'Threat Coverage', value: '99.7%', color: 'text-purple-600' },
    { label: 'False Positive Rate', value: '0.3%', color: 'text-orange-600' },
    { label: 'Client Satisfaction', value: '4.9/5.0', color: 'text-green-600' }
  ];


  const incidents = [
    {
      id: 'INC-2024-001',
      title: 'Suspicious PowerShell Activity',
      severity: 'High',
      status: 'Investigating',
      assignee: 'Sarah Mitchell',
      created: '15 min ago',
      description: 'Anomalous PowerShell execution detected on multiple endpoints'
    },
    {
      id: 'INC-2024-002',
      title: 'Unusual Network Traffic',
      severity: 'Medium',
      status: 'Contained',
      assignee: 'Mike Rodriguez',
      created: '2 hours ago',
      description: 'Abnormal data exfiltration patterns identified'
    },
    {
      id: 'INC-2024-003',
      title: 'Failed Login Attempts',
      severity: 'Low',
      status: 'Monitoring',
      assignee: 'Alex Thompson',
      created: '4 hours ago',
      description: 'Multiple failed authentication attempts from single IP'
    }
  ];

  const threatIntelligence = [
    {
      id: 1,
      type: 'IOC',
      indicator: '192.168.100.5',
      threatType: 'Command & Control',
      confidence: 'High',
      firstSeen: '2024-01-15',
      lastSeen: '2024-01-16'
    },
    {
      id: 2,
      type: 'Hash',
      indicator: 'a1b2c3d4e5f6...',
      threatType: 'Malware',
      confidence: 'Medium',
      firstSeen: '2024-01-14',
      lastSeen: '2024-01-15'
    },
    {
      id: 3,
      type: 'Domain',
      indicator: 'malicious-site.com',
      threatType: 'Phishing',
      confidence: 'High',
      firstSeen: '2024-01-13',
      lastSeen: '2024-01-16'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-2">
            <Eye className="h-8 w-8 text-blue-500" />
            <h1 className="text-4xl font-bold">SafeSOC Demo</h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Experience AI-powered endpoint detection and response with real-time behavioral analysis and automated threat blocking
          </p>
        </div>

        {/* AI EDR Status Banner */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Eye className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="text-xl font-semibold text-white">AI EDR Active</h3>
                  <p className="text-slate-400">Real-time behavioral analysis • AI-powered detection • Automated response</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-500">{socMetrics.daysMonitored}</div>
                <div className="text-sm text-slate-400">Days Monitored</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-orange-500">{socMetrics.activeIncidents}</div>
              <div className="text-sm text-slate-400">Active Incidents</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-red-500">{socMetrics.criticalThreats}</div>
              <div className="text-sm text-slate-400">Critical Threats</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-yellow-500">{socMetrics.contained}</div>
              <div className="text-sm text-slate-400">Contained</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-500">{socMetrics.resolved24h}</div>
              <div className="text-sm text-slate-400">Resolved (24h)</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-slate-700">Dashboard</TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-slate-700">Incidents</TabsTrigger>
            <TabsTrigger value="threat-intel" className="data-[state=active]:bg-slate-700">Threat Intel</TabsTrigger>
            <TabsTrigger value="threat-hunting" className="data-[state=active]:bg-slate-700">Threat Hunting</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SOC Activity Feed */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-white">SOC Activity Feed</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activityFeed.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg">
                        <IconComponent className={`h-5 w-5 ${activity.color} mt-0.5`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">{activity.title}</h4>
                            <span className="text-xs text-slate-400">{activity.timestamp}</span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{activity.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Security Metrics */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <CardTitle className="text-white">Security Metrics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {securityMetrics.map((metric, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-slate-400">{metric.label}</span>
                      <span className={`font-semibold ${metric.color}`}>{metric.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Security Incidents</CardTitle>
                <CardDescription className="text-slate-400">
                  Active security incidents and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-white">{incident.id}</h4>
                            <Badge 
                              className={
                                incident.severity === 'High' ? 'bg-red-600 text-white' :
                                incident.severity === 'Medium' ? 'bg-yellow-600 text-white' :
                                'bg-blue-600 text-white'
                              }
                            >
                              {incident.severity}
                            </Badge>
                            <Badge variant="outline" className="text-slate-300 border-slate-500">
                              {incident.status}
                            </Badge>
                          </div>
                          <h5 className="text-white mb-1">{incident.title}</h5>
                          <p className="text-sm text-slate-400 mb-2">{incident.description}</p>
                          <div className="text-xs text-slate-500">
                            Assigned to: {incident.assignee} • Created: {incident.created}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threat-intel" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Threat Intelligence</CardTitle>
                <CardDescription className="text-slate-400">
                  Latest threat indicators and intelligence feeds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threatIntelligence.map((threat) => (
                    <div key={threat.id} className="p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-slate-300 border-slate-500">
                              {threat.type}
                            </Badge>
                            <Badge 
                              className={
                                threat.confidence === 'High' ? 'bg-red-600 text-white' :
                                'bg-yellow-600 text-white'
                              }
                            >
                              {threat.confidence} Confidence
                            </Badge>
                          </div>
                          <div className="font-mono text-sm text-white mb-1">{threat.indicator}</div>
                          <p className="text-sm text-slate-400 mb-2">{threat.threatType}</p>
                          <div className="text-xs text-slate-500">
                            First Seen: {threat.firstSeen} • Last Seen: {threat.lastSeen}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                          Block
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threat-hunting" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Proactive Threat Hunting</CardTitle>
                <CardDescription className="text-slate-400">
                  AI-powered threat hunting and behavioral analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Active Hunts</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Search className="h-4 w-4 text-blue-500" />
                          <span className="text-white font-medium">Living Off The Land Hunt</span>
                        </div>
                        <p className="text-sm text-slate-400">Searching for legitimate tools used maliciously</p>
                        <div className="text-xs text-green-400 mt-2">✓ In Progress - 47% complete</div>
                      </div>
                      
                      <div className="p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Search className="h-4 w-4 text-purple-500" />
                          <span className="text-white font-medium">Lateral Movement Detection</span>
                        </div>
                        <p className="text-sm text-slate-400">Identifying unusual credential usage patterns</p>
                        <div className="text-xs text-blue-400 mt-2">🔄 Analyzing - 23% complete</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Hunt Results</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-white font-medium">PowerShell Anomaly Hunt</span>
                        </div>
                        <p className="text-sm text-slate-400">Found 3 suspicious PowerShell executions</p>
                        <div className="text-xs text-green-400 mt-2">✓ Completed - 3 findings</div>
                      </div>
                      
                      <div className="p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-white font-medium">DNS Exfiltration Hunt</span>
                        </div>
                        <p className="text-sm text-slate-400">No suspicious DNS activity detected</p>
                        <div className="text-xs text-green-400 mt-2">✓ Completed - Clean</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};