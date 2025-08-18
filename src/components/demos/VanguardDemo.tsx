import { useState, useEffect } from "react";
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
  Globe,
  Brain,
  ShieldCheck,
  Cpu,
  Database,
  FileX,
  Crosshair,
  TrendingUp,
  Clock,
  Layers,
  Microscope,
  Bot,
  Radar,
  Workflow
} from "lucide-react";

export const VanguardDemo = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [realTimeThreats, setRealTimeThreats] = useState(247);
  const [behavioralAlerts, setBehavioralAlerts] = useState(3);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeThreats(prev => prev + Math.floor(Math.random() * 3));
      setBehavioralAlerts(prev => Math.max(0, prev + (Math.random() > 0.7 ? 1 : -1)));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const securityMetrics = [
    { label: "XDR Security Score", value: 98, icon: ShieldCheck, color: "text-emerald-500" },
    { label: "Zero-Day Detection", value: behavioralAlerts, icon: Brain, color: "text-purple-500" },
    { label: "Endpoints Protected", value: "50K+", icon: Cpu, color: "text-blue-500" },
    { label: "Threats Stopped Today", value: realTimeThreats, icon: Target, color: "text-red-500" }
  ];

  const advancedThreats = [
    { 
      id: 1, 
      type: "Living-off-the-Land Attack", 
      severity: "Critical", 
      target: "Domain Controller", 
      time: "37s ago", 
      status: "Auto-Quarantined",
      mitre: "T1055.012",
      confidence: 97,
      technique: "Process Hollowing"
    },
    { 
      id: 2, 
      type: "AI-Detected Anomaly", 
      severity: "High", 
      target: "CEO Workstation", 
      time: "2 min ago", 
      status: "Under Analysis",
      mitre: "T1071.001",
      confidence: 94,
      technique: "Web Protocols C2"
    },
    { 
      id: 3, 
      type: "Zero-Day Exploit", 
      severity: "Critical", 
      target: "Exchange Server", 
      time: "8 min ago", 
      status: "Contained",
      mitre: "T1190",
      confidence: 99,
      technique: "Exploit Public-Facing Application"
    }
  ];

  const xdrCapabilities = [
    { 
      name: "Behavioral AI Engine", 
      status: "Active", 
      score: 99,
      description: "ML-powered anomaly detection with 0.01% false positive rate",
      icon: Brain
    },
    { 
      name: "Quantum-Safe Encryption", 
      status: "Enabled", 
      score: 100,
      description: "Post-quantum cryptographic protection",
      icon: Lock
    },
    { 
      name: "Autonomous Response", 
      status: "Learning", 
      score: 94,
      description: "Self-healing infrastructure with predictive remediation",
      icon: Bot
    },
    { 
      name: "Threat Intelligence Fusion", 
      status: "Synchronized", 
      score: 97,
      description: "Real-time IOC feeds from 500+ global sources",
      icon: Radar
    }
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
      <div className="text-center space-y-6 py-12 bg-gradient-to-b from-background via-primary/5 to-background rounded-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <Shield className="h-12 w-12 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-ping" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            Ultrium Vanguard
          </h1>
        </div>
        <p className="text-2xl text-muted-foreground max-w-4xl mx-auto font-medium">
          Next-Generation XDR Platform - Beyond SentinelOne, Beyond CrowdStrike
        </p>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          AI-native cybersecurity with autonomous threat response, behavioral analytics, 
          and zero-trust architecture. Protecting 50,000+ endpoints worldwide.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 max-w-4xl mx-auto">
          <Badge variant="outline" className="px-4 py-3 text-center justify-center">
            <Brain className="h-4 w-4 mr-2" />
            AI-Native Detection
          </Badge>
          <Badge variant="outline" className="px-4 py-3 text-center justify-center">
            <Zap className="h-4 w-4 mr-2" />
            0.1s Response Time
          </Badge>
          <Badge variant="outline" className="px-4 py-3 text-center justify-center">
            <Target className="h-4 w-4 mr-2" />
            99.97% Detection Rate
          </Badge>
          <Badge variant="outline" className="px-4 py-3 text-center justify-center">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Zero False Positives
          </Badge>
        </div>

        <div className="pt-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-6 py-3 rounded-full border border-green-500/20">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-700 font-medium">Live Threat Detection Active</span>
          </div>
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

      {/* Advanced XDR Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">XDR Overview</TabsTrigger>
          <TabsTrigger value="threats">AI Detection</TabsTrigger>
          <TabsTrigger value="behavioral">Behavioral Analytics</TabsTrigger>
          <TabsTrigger value="forensics">Digital Forensics</TabsTrigger>
          <TabsTrigger value="automation">Autonomous Response</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Advanced Threat Detection */}
            <Card className="border-red-200 bg-gradient-to-br from-red-50/50 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-red-500" />
                  AI-Powered Threat Detection
                  <Badge className="bg-red-100 text-red-700 text-xs">LIVE</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {advancedThreats.map((threat) => (
                  <div key={threat.id} className="p-4 bg-background/80 rounded-lg border border-red-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                            {threat.mitre}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {threat.confidence}% AI Confidence
                          </Badge>
                        </div>
                        <h4 className="font-medium text-sm">{threat.type}</h4>
                        <p className="text-xs text-muted-foreground">{threat.technique}</p>
                        <p className="text-xs text-muted-foreground">Target: {threat.target}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xs text-muted-foreground">{threat.time}</p>
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                          {threat.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        <Microscope className="h-3 w-3 mr-1" />
                        Investigate
                      </Button>
                      <Button size="sm" className="text-xs h-7">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Auto-Remediate
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* XDR Performance Dashboard */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  XDR Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">0.1s</p>
                    <p className="text-xs text-green-600">Mean Time to Detection</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg">
                    <Zap className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700">0.3s</p>
                    <p className="text-xs text-blue-600">Mean Time to Response</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Threat Detection Accuracy
                      </span>
                      <span className="font-bold text-green-600">99.97%</span>
                    </div>
                    <Progress value={99.97} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <FileX className="h-4 w-4" />
                        False Positive Rate
                      </span>
                      <span className="font-bold text-green-600">0.01%</span>
                    </div>
                    <Progress value={0.01} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Autonomous Remediation
                      </span>
                      <span className="font-bold text-blue-600">94.3%</span>
                    </div>
                    <Progress value={94.3} className="h-3" />
                  </div>
                </div>
                
                <div className="pt-4 border-t bg-gradient-to-r from-purple-50/50 to-blue-50/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-purple-600">{realTimeThreats}</p>
                      <p className="text-xs text-muted-foreground">Threats Neutralized Today</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-indigo-600">50K+</p>
                      <p className="text-xs text-muted-foreground">Endpoints Protected</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Neural Threat Detection Engine
                  <Badge variant="outline" className="bg-purple-100 text-purple-700">GPT-4 Powered</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl border border-red-200">
                    <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-700">{behavioralAlerts}</p>
                    <p className="text-sm text-red-600">Zero-Day Attempts</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-200">
                    <Crosshair className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-700">47</p>
                    <p className="text-sm text-orange-600">APT Campaigns</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl border border-green-200">
                    <ShieldCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">99.97%</p>
                    <p className="text-sm text-green-600">Detection Rate</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Radar className="h-4 w-4" />
                    Real-Time AI Analysis
                  </h4>
                  <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 p-6 rounded-xl border border-purple-200">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 bg-red-500 rounded-full mt-2 animate-pulse" />
                        <div>
                          <p className="text-sm font-medium">🧠 <strong>AI Behavioral Analysis:</strong></p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Sophisticated living-off-the-land technique detected on DESKTOP-CEO01. 
                            PowerShell execution pattern matches APT29 with 97% neural network confidence.
                            MITRE ATT&CK: T1055.012 - Process Hollowing detected via ML behavioral analysis.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="h-2 w-2 bg-orange-500 rounded-full mt-2" />
                        <div>
                          <p className="text-sm font-medium">🔬 <strong>Quantum-Resistant Crypto Analysis:</strong></p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Post-quantum cryptographic signature verification completed. 
                            C2 communications using quantum-safe lattice-based encryption detected and decrypted.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-6">
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Bot className="h-3 w-3 mr-1" />
                        Auto-Investigate
                      </Button>
                      <Button size="sm" variant="outline">
                        <Microscope className="h-3 w-3 mr-1" />
                        Deep Analysis
                      </Button>
                      <Button size="sm" variant="outline">
                        <Workflow className="h-3 w-3 mr-1" />
                        Playbook Response
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-blue-500" />
                  MITRE ATT&CK Coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { tactic: "Initial Access", coverage: 100, color: "green" },
                    { tactic: "Execution", coverage: 98, color: "green" },
                    { tactic: "Persistence", coverage: 96, color: "green" },
                    { tactic: "Privilege Escalation", coverage: 94, color: "blue" },
                    { tactic: "Defense Evasion", coverage: 92, color: "blue" },
                    { tactic: "Lateral Movement", coverage: 89, color: "yellow" }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{item.tactic}</span>
                        <span className={`font-bold ${
                          item.color === 'green' ? 'text-green-600' : 
                          item.color === 'blue' ? 'text-blue-600' : 'text-yellow-600'
                        }`}>
                          {item.coverage}%
                        </span>
                      </div>
                      <Progress value={item.coverage} className="h-2" />
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">314/324</p>
                    <p className="text-xs text-muted-foreground">Techniques Covered</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavioral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Advanced Behavioral Analytics
                <Badge className="bg-purple-100 text-purple-700">ML-Powered</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">XDR Capabilities</h4>
                  {xdrCapabilities.map((capability, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-background to-primary/5 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <capability.icon className="h-6 w-6 text-primary mt-1" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{capability.name}</p>
                            <Badge className={`text-xs ${
                              capability.status === 'Active' ? 'bg-green-100 text-green-700' :
                              capability.status === 'Enabled' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {capability.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{capability.description}</p>
                          <div className="flex items-center gap-2">
                            <Progress value={capability.score} className="flex-1 h-2" />
                            <span className="text-xs font-medium">{capability.score}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Real-Time Process Analysis</h4>
                  <div className="bg-gradient-to-br from-red-500/5 to-orange-500/5 p-4 rounded-lg border border-red-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Suspicious Process: powershell.exe</span>
                        <Badge className="bg-red-100 text-red-700 text-xs">CRITICAL</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Parent: winlogon.exe (Anomalous)</p>
                        <p>• Command: Encoded base64 payload</p>
                        <p>• Network: C2 beacon detected</p>
                        <p>• ML Confidence: 99.7%</p>
                      </div>
                      <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Terminate & Isolate
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-4 rounded-lg border border-green-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Normal Process: chrome.exe</span>
                        <Badge className="bg-green-100 text-green-700 text-xs">SAFE</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Parent: explorer.exe (Expected)</p>
                        <p>• Network: HTTPS to google.com</p>
                        <p>• Behavior: Standard web browsing</p>
                        <p>• ML Confidence: 100%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="forensics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-indigo-500" />
                Digital Forensics & Investigation
                <Badge className="bg-indigo-100 text-indigo-700">Enterprise</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Timeline Reconstruction</h4>
                  <div className="space-y-3">
                    {[
                      { time: "14:23:47", event: "Initial compromise via email attachment", severity: "Critical" },
                      { time: "14:24:12", event: "Payload executed in memory", severity: "High" },
                      { time: "14:24:45", event: "Privilege escalation attempt", severity: "High" },
                      { time: "14:25:01", event: "Lateral movement to DC01", severity: "Critical" },
                      { time: "14:25:18", event: "Data exfiltration initiated", severity: "Critical" },
                      { time: "14:25:23", event: "AI auto-response triggered", severity: "Info" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground w-16">{item.time}</div>
                        <div className="flex-1">
                          <p className="text-sm">{item.event}</p>
                        </div>
                        <Badge className={getSeverityColor(item.severity)} variant="outline">
                          {item.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Evidence Collection</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <Database className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Memory Dumps</p>
                      <p className="text-xs text-muted-foreground">3 captures</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <FileX className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Disk Images</p>
                      <p className="text-xs text-muted-foreground">5 systems</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <Network className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Network Flows</p>
                      <p className="text-xs text-muted-foreground">247 sessions</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg text-center">
                      <Activity className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Log Events</p>
                      <p className="text-xs text-muted-foreground">12.5k entries</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                    <h5 className="font-medium mb-2">Chain of Custody</h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      Cryptographically signed evidence with blockchain immutability
                    </p>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                      <Lock className="h-3 w-3 mr-1" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-green-500" />
                Autonomous Security Operations
                <Badge className="bg-green-100 text-green-700">AI-Native</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-semibold">Automated Response Playbooks</h4>
                  <div className="space-y-3">
                    {[
                      { 
                        name: "Ransomware Auto-Containment", 
                        status: "Active", 
                        triggers: "47 today",
                        success: "100%",
                        description: "Instant isolation + backup restoration"
                      },
                      { 
                        name: "APT Lateral Movement Block", 
                        status: "Active", 
                        triggers: "12 today",
                        success: "98%",
                        description: "Network segmentation + credential rotation"
                      },
                      { 
                        name: "Phishing Auto-Response", 
                        status: "Learning", 
                        triggers: "156 today",
                        success: "94%",
                        description: "Email recall + user notification + retraining"
                      }
                    ].map((playbook, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-background to-green-500/5 rounded-lg border border-green-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h5 className="font-medium">{playbook.name}</h5>
                            <p className="text-sm text-muted-foreground">{playbook.description}</p>
                          </div>
                          <Badge className={`${
                            playbook.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {playbook.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Triggers: </span>
                            <span className="font-medium">{playbook.triggers}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Success: </span>
                            <span className="font-medium text-green-600">{playbook.success}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">AI Learning Status</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Neural Network</span>
                      </div>
                      <Progress value={96} className="mb-2" />
                      <p className="text-xs text-muted-foreground">Training on 2.3M security events</p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Workflow className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Playbook Evolution</span>
                      </div>
                      <Progress value={89} className="mb-2" />
                      <p className="text-xs text-muted-foreground">Self-optimizing response times</p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Threat Prediction</span>
                      </div>
                      <Progress value={94} className="mb-2" />
                      <p className="text-xs text-muted-foreground">24hr attack forecasting active</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-200">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-700">0.1s</p>
                      <p className="text-sm text-green-600">Average Response Time</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Faster than human reaction time
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Enterprise CTA Section */}
      <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-primary/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
        <CardContent className="p-12 text-center relative">
          <div className="max-w-4xl mx-auto space-y-6">
            <h3 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              The Future of Cybersecurity is Here
            </h3>
            <p className="text-xl text-muted-foreground">
              Join Fortune 500 companies protecting their digital assets with Ultrium Vanguard's 
              AI-native XDR platform. Beyond detection. Beyond response. Beyond human capability.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">99.97%</div>
                <div className="text-sm text-muted-foreground">Detection Accuracy</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-600">0.1s</div>
                <div className="text-sm text-muted-foreground">Response Time</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-600">$2.4M</div>
                <div className="text-sm text-muted-foreground">Avg. Breach Cost Prevented</div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-4">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 px-8">
                <ShieldCheck className="h-5 w-5 mr-2" />
                Deploy Enterprise Trial
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                <Users className="h-5 w-5 mr-2" />
                Executive Briefing
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Trusted by 50,000+ endpoints • SOC 2 Type II Certified • Zero-trust ready
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};