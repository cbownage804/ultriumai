import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Activity,
  Clock,
  Users,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Play,
  Bell,
  Search,
  TrendingUp,
  Globe,
  FileText,
  Settings
} from "lucide-react";

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'contained' | 'resolved';
  category: string;
  source: string;
  firstSeen: string;
  lastActivity: string;
  affectedSystems: number;
  analyst: string;
  client?: string;
  indicators: string[];
}

interface ThreatIntel {
  id: string;
  name: string;
  type: 'malware' | 'apt_group' | 'vulnerability' | 'campaign';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ttps: string[];
  iocs: string[];
  updated: string;
}

const mockIncidents: SecurityIncident[] = [
  {
    id: 'INC-2024-001',
    title: 'Suspicious PowerShell Activity Detected',
    description: 'Anomalous PowerShell execution detected on multiple endpoints, potentially indicating lateral movement or persistence mechanisms.',
    severity: 'high',
    status: 'investigating',
    category: 'Malicious Activity',
    source: 'EDR Agent',
    firstSeen: '2024-01-15 14:23:45',
    lastActivity: '2024-01-15 16:45:12',
    affectedSystems: 7,
    analyst: 'Sarah Mitchell',
    client: 'AcmeTech Corp',
    indicators: ['powershell.exe', 'encoded commands', 'WMI queries', 'registry modifications']
  },
  {
    id: 'INC-2024-002',
    title: 'Credential Stuffing Attack Detected',
    description: 'Multiple failed login attempts detected from various IP addresses targeting user accounts, indicating potential credential stuffing attack.',
    severity: 'medium',
    status: 'contained',
    category: 'Brute Force',
    source: 'Network Monitoring',
    firstSeen: '2024-01-15 12:15:30',
    lastActivity: '2024-01-15 15:20:18',
    affectedSystems: 3,
    analyst: 'Mike Rodriguez',
    client: 'TechFlow Ltd',
    indicators: ['multiple IPs', 'failed logins', 'password spraying', 'account lockouts']
  },
  {
    id: 'INC-2024-003',
    title: 'Ransomware Encryption Attempt Blocked',
    description: 'Ransomware payload attempted to encrypt files on file server. Automatic containment successful, investigating initial access vector.',
    severity: 'critical',
    status: 'contained',
    category: 'Ransomware',
    source: 'File Integrity Monitor',
    firstSeen: '2024-01-14 22:30:15',
    lastActivity: '2024-01-15 08:45:22',
    affectedSystems: 1,
    analyst: 'Alex Thompson',
    client: 'GlobalCorp Inc',
    indicators: ['file encryption', 'ransom note', 'network shares', 'backup deletion attempts']
  }
];

const mockThreatIntel: ThreatIntel[] = [
  {
    id: 'TI-001',
    name: 'BlackCat Ransomware Group',
    type: 'apt_group',
    threatLevel: 'critical',
    description: 'Advanced persistent threat group known for sophisticated ransomware campaigns targeting enterprise networks.',
    ttps: ['Initial Access via RDP', 'Lateral Movement', 'Data Exfiltration', 'Ransomware Deployment'],
    iocs: ['185.220.101.42', 'blackcat.onion', 'backup_delete.ps1'],
    updated: '2024-01-15 10:30'
  },
  {
    id: 'TI-002',
    name: 'CVE-2024-0001 Exchange Vulnerability',
    type: 'vulnerability',
    threatLevel: 'high',
    description: 'Critical vulnerability in Microsoft Exchange allowing remote code execution without authentication.',
    ttps: ['Remote Code Execution', 'Privilege Escalation', 'Persistence'],
    iocs: ['specific HTTP requests', 'webshell artifacts', 'suspicious processes'],
    updated: '2024-01-14 16:20'
  }
];

const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  investigating: 'bg-purple-100 text-purple-800',
  contained: 'bg-orange-100 text-orange-800',
  resolved: 'bg-green-100 text-green-800'
};

export const SafeEDRDemo = () => {
  const [incidents] = useState<SecurityIncident[]>(mockIncidents);
  const [threatIntel] = useState<ThreatIntel[]>(mockThreatIntel);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const getDashboardStats = () => {
    const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
    const containedIncidents = incidents.filter(i => i.status === 'contained').length;
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;
    
    return { openIncidents, criticalIncidents, containedIncidents, resolvedIncidents };
  };

  const stats = getDashboardStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center gap-2">
          <Eye className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">SafeEDR Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience AI-powered endpoint detection and response with real-time behavioral analysis and automated threat blocking
        </p>
      </div>

      {/* Security Status */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-800">AI EDR Active</h3>
                <p className="text-blue-600">Real-time behavioral analysis • AI-powered detection • Automated response</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">365</div>
              <div className="text-sm text-blue-600">Days Monitored</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-orange-500">{stats.openIncidents}</div>
            <div className="text-sm text-muted-foreground">Active Incidents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold text-red-500">{stats.criticalIncidents}</div>
            <div className="text-sm text-muted-foreground">Critical Threats</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold text-yellow-500">{stats.containedIncidents}</div>
            <div className="text-sm text-muted-foreground">Contained</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-500">24</div>
            <div className="text-sm text-muted-foreground">Resolved (24h)</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="threat-intel">Threat Intel</TabsTrigger>
          <TabsTrigger value="hunting">Threat Hunting</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SOC Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  SOC Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <div className="font-medium">Incident Resolved</div>
                      <div className="text-sm text-muted-foreground">INC-2024-004 - Phishing email campaign blocked</div>
                    </div>
                    <div className="text-sm text-muted-foreground">2 min ago</div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div className="flex-1">
                      <div className="font-medium">New Incident Created</div>
                      <div className="text-sm text-muted-foreground">INC-2024-001 - Suspicious PowerShell activity</div>
                    </div>
                    <div className="text-sm text-muted-foreground">15 min ago</div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Eye className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <div className="font-medium">Threat Hunt Completed</div>
                      <div className="text-sm text-muted-foreground">Proactive hunt for living-off-the-land techniques</div>
                    </div>
                    <div className="text-sm text-muted-foreground">1 hour ago</div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Target className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <div className="font-medium">Containment Action</div>
                      <div className="text-sm text-muted-foreground">Isolated infected endpoint at AcmeTech Corp</div>
                    </div>
                    <div className="text-sm text-muted-foreground">2 hours ago</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Mean Time to Detection</span>
                  <span className="font-bold text-green-600">4.2 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mean Time to Response</span>
                  <span className="font-bold text-blue-600">12.8 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Threat Coverage</span>
                  <span className="font-bold text-purple-600">99.7%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>False Positive Rate</span>
                  <span className="font-bold text-orange-600">0.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Client Satisfaction</span>
                  <span className="font-bold text-green-600">4.9/5.0</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analyst Team Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                SOC Analyst Team
              </CardTitle>
              <CardDescription>24/7 expert security analysts monitoring your environment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Sarah Mitchell</div>
                      <div className="text-sm text-muted-foreground">Senior Analyst</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Active - investigating INC-2024-001</span>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Mike Rodriguez</div>
                      <div className="text-sm text-muted-foreground">Threat Hunter</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Active - proactive hunting</span>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">Alex Thompson</div>
                      <div className="text-sm text-muted-foreground">Incident Response</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">Active - containment actions</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incidents List */}
            <div className="space-y-4">
              <h3 className="font-semibold">Active Security Incidents ({incidents.length})</h3>
              {incidents.map((incident) => (
                <Card 
                  key={incident.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedIncident?.id === incident.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedIncident(incident)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{incident.id}</span>
                          <Badge className={severityColors[incident.severity]}>
                            {incident.severity}
                          </Badge>
                          <Badge className={statusColors[incident.status]}>
                            {incident.status}
                          </Badge>
                        </div>
                        <h4 className="font-medium mb-1">{incident.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {incident.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Analyst: {incident.analyst}</span>
                        <span>Systems: {incident.affectedSystems}</span>
                      </div>
                      <span>First seen: {incident.firstSeen}</span>
                    </div>
                    {incident.client && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Client: {incident.client}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Incident Details */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedIncident ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">{selectedIncident.id}</span>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <Badge className={severityColors[selectedIncident.severity]}>
                          {selectedIncident.severity} Severity
                        </Badge>
                        <Badge className={statusColors[selectedIncident.status]}>
                          {selectedIncident.status}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-2">{selectedIncident.title}</h3>
                      <p className="text-muted-foreground mb-4">{selectedIncident.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Category</div>
                        <div className="text-muted-foreground">{selectedIncident.category}</div>
                      </div>
                      <div>
                        <div className="font-medium">Source</div>
                        <div className="text-muted-foreground">{selectedIncident.source}</div>
                      </div>
                      <div>
                        <div className="font-medium">Assigned Analyst</div>
                        <div className="text-muted-foreground">{selectedIncident.analyst}</div>
                      </div>
                      <div>
                        <div className="font-medium">Affected Systems</div>
                        <div className="text-muted-foreground">{selectedIncident.affectedSystems}</div>
                      </div>
                      <div>
                        <div className="font-medium">First Seen</div>
                        <div className="text-muted-foreground">{selectedIncident.firstSeen}</div>
                      </div>
                      <div>
                        <div className="font-medium">Last Activity</div>
                        <div className="text-muted-foreground">{selectedIncident.lastActivity}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium mb-2">Indicators of Compromise</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedIncident.indicators.map((indicator, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {indicator}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button size="sm" className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Investigate
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Contain
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Report
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select an incident to view analysis details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threat-intel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Threat Intelligence Feed
              </CardTitle>
              <CardDescription>
                Latest threat intelligence from global security research and honeypot networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockThreatIntel.map((intel) => (
                  <div key={intel.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{intel.name}</span>
                          <Badge className={severityColors[intel.threatLevel]}>
                            {intel.threatLevel}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {intel.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {intel.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <div className="font-medium mb-1">Tactics, Techniques & Procedures</div>
                        <div className="flex flex-wrap gap-1">
                          {intel.ttps.map((ttp, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {ttp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">Indicators of Compromise</div>
                        <div className="flex flex-wrap gap-1">
                          {intel.iocs.map((ioc, index) => (
                            <Badge key={index} variant="outline" className="text-xs font-mono">
                              {ioc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Last updated: {intel.updated}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Search className="h-4 w-4 mr-2" />
                          Hunt
                        </Button>
                        <Button size="sm" variant="outline">
                          <Bell className="h-4 w-4 mr-2" />
                          Alert
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hunting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Proactive Threat Hunting
              </CardTitle>
              <CardDescription>
                AI-powered threat hunting queries and expert analyst investigations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Active Hunt Campaigns</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Living off the Land</div>
                        <Badge className="bg-blue-100 text-blue-800">Running</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Hunting for attackers using legitimate system tools
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress: 65%</span>
                        <span>ETA: 2 hours</span>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Lateral Movement Detection</div>
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Scanning for suspicious network activity patterns
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Results: 2 findings</span>
                        <span>Completed: 3 hours ago</span>
                      </div>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Persistence Mechanisms</div>
                        <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Identifying unauthorized persistence methods
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Start: Tomorrow 02:00</span>
                        <span>Duration: 4 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Hunt Results Summary</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Hunts Executed (30 days)</span>
                      <span className="font-bold">47</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Threats Discovered</span>
                      <span className="font-bold">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>False Positives</span>
                      <span className="font-bold">3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Hunt Success Rate</span>
                      <span className="font-bold">94.3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Notice */}
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          This is a demonstration of SafeEDR capabilities. In production, you would have AI-powered behavioral analysis continuously monitoring your endpoints with real-time threat detection and automated response.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SafeEDRDemo;