import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Activity, 
  Network, 
  Search,
  Lock,
  Zap,
  Target,
  Users,
  Server,
  Globe
} from "lucide-react";

export const VanguardDemo = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const securityMetrics = [
    { label: "Security Score", value: 94, icon: Shield, color: "text-green-500" },
    { label: "Active Threats", value: 3, icon: AlertTriangle, color: "text-red-500" },
    { label: "Monitored Assets", value: 1247, icon: Server, color: "text-blue-500" },
    { label: "SOC Alerts", value: 12, icon: Eye, color: "text-yellow-500" }
  ];

  const recentThreats = [
    { id: 1, type: "Malware", severity: "Critical", target: "Web Server 01", time: "2 min ago", status: "Contained" },
    { id: 2, type: "Phishing", severity: "High", target: "Email Gateway", time: "15 min ago", status: "Blocked" },
    { id: 3, type: "DDoS", severity: "Medium", target: "Load Balancer", time: "1 hour ago", status: "Mitigated" }
  ];

  const networkAssets = [
    { name: "Primary Firewall", status: "Secure", score: 98 },
    { name: "Web Application", status: "Vulnerable", score: 72 },
    { name: "Database Server", status: "Secure", score: 95 },
    { name: "Email Server", status: "Patched", score: 89 }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-100 text-red-800 border-red-200";
      case "High": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Secure": return "text-green-600";
      case "Vulnerable": return "text-red-600";
      case "Patched": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Ultrium Vanguard
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Enterprise cybersecurity operations platform with real-time threat detection, 
          SOC automation, and comprehensive security monitoring
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="h-3 w-3 mr-1" />
            Real-time Monitoring
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered Detection
          </Badge>
          <Badge variant="outline" className="px-3 py-1">
            <Target className="h-3 w-3 mr-1" />
            Advanced Threat Hunting
          </Badge>
        </div>
      </div>

      {/* Security Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {securityMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="text-3xl font-bold">{metric.value}</p>
                </div>
                <metric.icon className={`h-8 w-8 ${metric.color}`} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">SOC Overview</TabsTrigger>
          <TabsTrigger value="threats">Threat Detection</TabsTrigger>
          <TabsTrigger value="network">Network Security</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Threats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Recent Security Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentThreats.map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(threat.severity)}>
                          {threat.severity}
                        </Badge>
                        <span className="font-medium">{threat.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{threat.target}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-muted-foreground">{threat.time}</p>
                      <Badge variant="outline">{threat.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SOC Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-500" />
                  SOC Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Alert Response Time</span>
                      <span>2.3 min avg</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Threat Resolution Rate</span>
                      <span>94% resolved</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Uptime</span>
                      <span>99.8%</span>
                    </div>
                    <Progress value={99.8} className="h-2" />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">247</p>
                      <p className="text-sm text-muted-foreground">Threats Blocked Today</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">1.2s</p>
                      <p className="text-sm text-muted-foreground">Avg Detection Time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-500" />
                Advanced Threat Hunting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700">3</p>
                  <p className="text-sm text-red-600">Active Threats</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                  <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">12</p>
                  <p className="text-sm text-yellow-600">Under Investigation</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">891</p>
                  <p className="text-sm text-green-600">Threats Mitigated</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold">AI-Powered Threat Intelligence</h4>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm mb-2">🔍 <strong>Behavioral Anomaly Detected:</strong></p>
                  <p className="text-sm text-muted-foreground">
                    Unusual network traffic pattern detected from IP 192.168.1.47. 
                    Pattern matches known APT28 signature with 87% confidence.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">Investigate</Button>
                    <Button size="sm">Block Traffic</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-500" />
                Network Security Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {networkAssets.map((asset, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Server className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className={`text-sm ${getStatusColor(asset.status)}`}>
                          {asset.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{asset.score}%</p>
                      <Progress value={asset.score} className="w-20 h-2" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Network Topology Scan</h4>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Real-time network mapping and vulnerability assessment
                </p>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Run Full Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-500" />
                Compliance & Governance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Compliance Frameworks</h4>
                  <div className="space-y-3">
                    {[
                      { name: "SOC 2 Type II", status: "Compliant", score: 96 },
                      { name: "ISO 27001", status: "Compliant", score: 94 },
                      { name: "GDPR", status: "Action Required", score: 78 },
                      { name: "HIPAA", status: "Compliant", score: 91 }
                    ].map((framework, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">{framework.name}</p>
                          <p className={`text-sm ${framework.status === 'Compliant' ? 'text-green-600' : 'text-orange-600'}`}>
                            {framework.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{framework.score}%</p>
                          <Progress value={framework.score} className="w-16 h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Security Posture</h4>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-700">A+</p>
                      <p className="text-sm text-green-600">Overall Security Grade</p>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Policy Adherence</span>
                        <span className="text-green-600">98%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vulnerability Management</span>
                        <span className="text-green-600">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Incident Response</span>
                        <span className="text-green-600">92%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Experience Enterprise-Grade Security</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Protect your organization with Ultrium Vanguard's comprehensive cybersecurity platform. 
            Advanced threat detection, real-time monitoring, and automated response capabilities.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg">Start Free Trial</Button>
            <Button size="lg" variant="outline">Schedule Demo</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};