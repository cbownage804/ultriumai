import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle, Eye, Activity, Zap, Clock, Globe, Server, Brain, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ThreatAlert {
  id: string;
  type: 'malware' | 'intrusion' | 'anomaly' | 'phishing' | 'ddos' | 'breach';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  source: string;
  timestamp: string;
  status: 'active' | 'investigating' | 'resolved';
  aiAnalysis?: string;
}

interface ThreatConfig {
  realTimeMonitoring: boolean;
  anomalyDetection: boolean;
  malwareScanning: boolean;
  intrusionDetection: boolean;
  phishingProtection: boolean;
  ddosProtection: boolean;
}

export const ThreatDetection = () => {
  const [threats, setThreats] = useState<ThreatAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [config, setConfig] = useState<ThreatConfig>({
    realTimeMonitoring: true,
    anomalyDetection: true,
    malwareScanning: true,
    intrusionDetection: true,
    phishingProtection: true,
    ddosProtection: false,
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [investigatingThreat, setInvestigatingThreat] = useState<ThreatAlert | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadThreats();
    if (config.realTimeMonitoring) {
      startMonitoring();
    }
    return () => stopMonitoring();
  }, [config.realTimeMonitoring]);

  const loadThreats = async () => {
    try {
      // Simulate loading threat data
      const mockThreats: ThreatAlert[] = [
        {
          id: '1',
          type: 'intrusion',
          severity: 'high',
          title: 'Suspicious Login Attempt',
          description: 'Multiple failed login attempts from unusual location',
          source: '192.168.1.100',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          status: 'active'
        },
        {
          id: '2',
          type: 'anomaly',
          severity: 'medium',
          title: 'Unusual Network Traffic',
          description: 'Abnormal data transfer patterns detected',
          source: 'Web Server',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          status: 'investigating'
        },
        {
          id: '3',
          type: 'malware',
          severity: 'critical',
          title: 'Malware Signature Detected',
          description: 'Known malware pattern found in uploaded file',
          source: 'File Upload System',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          status: 'resolved'
        }
      ];
      setThreats(mockThreats);
    } catch (error) {
      console.error('Error loading threats:', error);
      toast({
        title: "Error",
        description: "Failed to load threat data",
        variant: "destructive",
      });
    }
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    // Simulate real-time threat detection
    const interval = setInterval(() => {
      if (Math.random() > 0.95) { // 5% chance of new threat
        const newThreat: ThreatAlert = {
          id: crypto.randomUUID(),
          type: ['malware', 'intrusion', 'anomaly', 'phishing', 'ddos'][Math.floor(Math.random() * 5)] as any,
          severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as any,
          title: 'New Threat Detected',
          description: 'AI-powered threat detection identified suspicious activity',
          source: `System-${Math.floor(Math.random() * 100)}`,
          timestamp: new Date().toISOString(),
          status: 'active'
        };
        
        setThreats(prev => [newThreat, ...prev.slice(0, 9)]);
        
        if (newThreat.severity === 'critical' || newThreat.severity === 'high') {
          toast({
            title: `${newThreat.severity.toUpperCase()} Threat Detected!`,
            description: newThreat.title,
            variant: newThreat.severity === 'critical' ? 'destructive' : 'default',
          });
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const getThreatIcon = (type: string) => {
    switch (type) {
      case 'malware': return <Zap className="h-4 w-4 text-red-500" />;
      case 'intrusion': return <Shield className="h-4 w-4 text-orange-500" />;
      case 'anomaly': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'phishing': return <Eye className="h-4 w-4 text-purple-500" />;
      case 'ddos': return <Globe className="h-4 w-4 text-blue-500" />;
      case 'breach': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const investigateThreat = async (threat: ThreatAlert) => {
    setInvestigatingThreat(threat);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-threat-investigator', {
        body: { threat }
      });
      
      if (error) throw error;
      
      setAnalysisResult(data.analysis);
      
      // Update threat with AI analysis
      setThreats(prev => prev.map(t => 
        t.id === threat.id ? { ...t, aiAnalysis: data.analysis, status: 'investigating' as const } : t
      ));
      
      toast({
        title: "AI Investigation Complete",
        description: "Threat has been analyzed with recommendations",
      });
    } catch (error) {
      console.error('AI investigation error:', error);
      toast({
        title: "Investigation Failed",
        description: "Could not complete AI analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeThreatCount = threats.filter(t => t.status === 'active').length;
  const criticalThreatCount = threats.filter(t => t.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Threat Detection & Response</h2>
            <p className="text-muted-foreground">Real-time AI-powered threat monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm text-muted-foreground">
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{activeThreatCount}</div>
                <p className="text-sm text-muted-foreground">Active Threats</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{criticalThreatCount}</div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{threats.filter(t => t.status === 'resolved').length}</div>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">99.8%</div>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Threats */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Threat Activity</CardTitle>
              <CardDescription>Latest security incidents and anomalies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threats.slice(0, 5).map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getThreatIcon(threat.type)}
                      <div>
                        <p className="font-medium">{threat.title}</p>
                        <p className="text-sm text-muted-foreground">{threat.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(threat.timestamp).toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">• {threat.source}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1"
                        onClick={() => investigateThreat(threat)}
                      >
                        <Brain className="h-3 w-3" />
                        AI Investigate
                      </Button>
                      <Badge className={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                      <Badge className={getStatusColor(threat.status)}>
                        {threat.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Protection Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Intrusion Detection</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  AI-powered network intrusion detection
                </p>
                <div className="text-xs text-green-600">✓ Active</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Malware Protection</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Real-time malware scanning and blocking
                </p>
                <div className="text-xs text-green-600">✓ Active</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Anomaly Detection</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Behavioral analysis and anomaly detection
                </p>
                <div className="text-xs text-green-600">✓ Active</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Alerts</CardTitle>
              <CardDescription>Threats requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threats.filter(t => t.status === 'active').map((threat) => (
                  <div key={threat.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getThreatIcon(threat.type)}
                        <h3 className="font-semibold">{threat.title}</h3>
                      </div>
                      <Badge className={getSeverityColor(threat.severity)}>
                        {threat.severity.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{threat.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Source: {threat.source} • {new Date(threat.timestamp).toLocaleString()}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="gap-1"
                          onClick={() => investigateThreat(threat)}
                        >
                          <Brain className="h-3 w-3" />
                          AI Investigate
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setThreats(prev => prev.map(t => 
                              t.id === threat.id ? { ...t, status: 'resolved' as const } : t
                            ));
                            toast({
                              title: "Threat Resolved",
                              description: "Threat has been marked as resolved",
                            });
                          }}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {threats.filter(t => t.status === 'active').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No active threats detected. Your systems are secure.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Threat Detection Configuration</CardTitle>
              <CardDescription>Configure your security monitoring preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="realtime">Real-time Monitoring</Label>
                      <p className="text-sm text-muted-foreground">Continuous threat scanning</p>
                    </div>
                    <Switch
                      id="realtime"
                      checked={config.realTimeMonitoring}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, realTimeMonitoring: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="anomaly">Anomaly Detection</Label>
                      <p className="text-sm text-muted-foreground">AI-powered behavioral analysis</p>
                    </div>
                    <Switch
                      id="anomaly"
                      checked={config.anomalyDetection}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, anomalyDetection: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="malware">Malware Scanning</Label>
                      <p className="text-sm text-muted-foreground">Real-time malware detection</p>
                    </div>
                    <Switch
                      id="malware"
                      checked={config.malwareScanning}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, malwareScanning: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="intrusion">Intrusion Detection</Label>
                      <p className="text-sm text-muted-foreground">Network intrusion monitoring</p>
                    </div>
                    <Switch
                      id="intrusion"
                      checked={config.intrusionDetection}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, intrusionDetection: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="phishing">Phishing Protection</Label>
                      <p className="text-sm text-muted-foreground">Email and web phishing detection</p>
                    </div>
                    <Switch
                      id="phishing"
                      checked={config.phishingProtection}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, phishingProtection: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="ddos">DDoS Protection</Label>
                      <p className="text-sm text-muted-foreground">Distributed denial of service protection</p>
                    </div>
                    <Switch
                      id="ddos"
                      checked={config.ddosProtection}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, ddosProtection: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={() => toast({ title: "Configuration Saved", description: "Threat detection settings updated successfully" })}>
                Save Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Threat Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Threats Detected (24h)</span>
                    <span className="font-semibold">{threats.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Critical Threats</span>
                    <span className="font-semibold text-destructive">{criticalThreatCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time (avg)</span>
                    <span className="font-semibold">2.3 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">False Positives</span>
                    <span className="font-semibold">0.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Protection Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Malware Blocked</span>
                      <span>98.7%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.7%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Intrusions Prevented</span>
                      <span>95.2%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95.2%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Phishing Detected</span>
                      <span>99.1%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '99.1%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Investigation Dialog */}
      <Dialog open={investigatingThreat !== null} onOpenChange={() => {
        setInvestigatingThreat(null);
        setAnalysisResult(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Threat Investigation
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis and remediation recommendations
            </DialogDescription>
          </DialogHeader>
          
          {investigatingThreat && (
            <div className="space-y-4">
              {/* Threat Summary */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getThreatIcon(investigatingThreat.type)}
                    <span className="font-semibold">{investigatingThreat.title}</span>
                  </div>
                  <Badge className={getSeverityColor(investigatingThreat.severity)}>
                    {investigatingThreat.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{investigatingThreat.description}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  Source: {investigatingThreat.source} • {new Date(investigatingThreat.timestamp).toLocaleString()}
                </div>
              </div>

              {/* AI Analysis */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">AI Analysis</span>
                </div>
                
                {isAnalyzing ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Analyzing threat...</span>
                  </div>
                ) : analysisResult ? (
                  <ScrollArea className="h-[300px] border rounded-lg p-4">
                    <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                      {analysisResult}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Click "Start Investigation" to analyze this threat</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => investigateThreat(investigatingThreat)}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Start Investigation
                    </Button>
                  </div>
                )}
              </div>

              {analysisResult && (
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setInvestigatingThreat(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setThreats(prev => prev.map(t => 
                      t.id === investigatingThreat.id ? { ...t, status: 'resolved' as const } : t
                    ));
                    setInvestigatingThreat(null);
                    toast({
                      title: "Threat Resolved",
                      description: "Threat has been marked as resolved",
                    });
                  }}>
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};