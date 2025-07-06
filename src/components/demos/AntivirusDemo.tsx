import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Scan,
  FileText,
  Globe,
  Clock,
  TrendingUp,
  Zap,
  Settings,
  Download,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";

interface ThreatData {
  id: string;
  name: string;
  type: 'virus' | 'malware' | 'trojan' | 'rootkit' | 'adware' | 'spyware';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'quarantined' | 'cleaned' | 'monitoring' | 'blocked';
  path: string;
  detected: string;
  description: string;
  client?: string;
}

interface ScanStatus {
  isScanning: boolean;
  progress: number;
  filesScanned: number;
  totalFiles: number;
  threatsFound: number;
  scanType: string;
  estimatedTime: string;
}

const mockThreats: ThreatData[] = [
  {
    id: 'THR-001',
    name: 'Trojan.Win32.Agent.xyz',
    type: 'trojan',
    severity: 'critical',
    status: 'quarantined',
    path: 'C:\\Users\\John\\Downloads\\invoice.exe',
    detected: '2024-01-15 14:23',
    description: 'Banking trojan attempting to steal financial credentials',
    client: 'AcmeTech Corp'
  },
  {
    id: 'THR-002', 
    name: 'Adware.Generic.Chrome',
    type: 'adware',
    severity: 'medium',
    status: 'cleaned',
    path: 'C:\\Program Files\\BrowserHelper\\addon.dll',
    detected: '2024-01-15 11:45',
    description: 'Browser hijacker modifying search results and displaying ads',
    client: 'TechFlow Ltd'
  },
  {
    id: 'THR-003',
    name: 'Virus.Win32.Conficker',
    type: 'virus',
    severity: 'high',
    status: 'blocked',
    path: 'C:\\Windows\\System32\\infected.dll',
    detected: '2024-01-14 16:30',
    description: 'Network worm attempting to spread across domain',
    client: 'GlobalCorp Inc'
  },
  {
    id: 'THR-004',
    name: 'Spyware.Keylogger.Pro',
    type: 'spyware',
    severity: 'high',
    status: 'monitoring',
    path: 'C:\\Users\\Admin\\AppData\\keylog.exe',
    detected: '2024-01-14 09:15',
    description: 'Keylogger capturing user credentials and sensitive data',
    client: 'SecureData LLC'
  }
];

const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800', 
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const statusColors = {
  quarantined: 'bg-orange-100 text-orange-800',
  cleaned: 'bg-green-100 text-green-800',
  monitoring: 'bg-blue-100 text-blue-800',
  blocked: 'bg-red-100 text-red-800'
};

export const AntivirusDemo = () => {
  const [threats] = useState<ThreatData[]>(mockThreats);
  const [scanStatus, setScanStatus] = useState<ScanStatus>({
    isScanning: false,
    progress: 0,
    filesScanned: 0,
    totalFiles: 248576,
    threatsFound: 0,
    scanType: 'Full System Scan',
    estimatedTime: '45 minutes'
  });

  const [selectedThreat, setSelectedThreat] = useState<ThreatData | null>(null);

  const startScan = () => {
    setScanStatus(prev => ({ ...prev, isScanning: true, progress: 0, filesScanned: 0, threatsFound: 0 }));
    
    // Simulate scan progress
    const interval = setInterval(() => {
      setScanStatus(prev => {
        const newProgress = Math.min(prev.progress + 1, 100);
        const newFilesScanned = Math.floor((newProgress / 100) * prev.totalFiles);
        
        if (newProgress >= 100) {
          clearInterval(interval);
          return {
            ...prev,
            isScanning: false,
            progress: 100,
            filesScanned: prev.totalFiles,
            threatsFound: 4
          };
        }
        
        return {
          ...prev,
          progress: newProgress,
          filesScanned: newFilesScanned,
          threatsFound: newProgress > 25 ? Math.floor(newProgress / 25) : 0
        };
      });
    }, 100);
  };

  const getThreatStats = () => {
    const critical = threats.filter(t => t.severity === 'critical').length;
    const high = threats.filter(t => t.severity === 'high').length;
    const quarantined = threats.filter(t => t.status === 'quarantined').length;
    const cleaned = threats.filter(t => t.status === 'cleaned').length;
    
    return { critical, high, quarantined, cleaned, total: threats.length };
  };

  const stats = getThreatStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Ultrium Antivirus Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience advanced endpoint protection with AI-powered threat detection and automated response
        </p>
      </div>

      {/* Protection Status */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">System Protected</h3>
                <p className="text-green-600">Real-time protection active • Definitions updated 2 hours ago</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">247</div>
              <div className="text-sm text-green-600">Devices Protected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
            <div className="text-sm text-muted-foreground">Critical Threats</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-orange-500">{stats.quarantined}</div>
            <div className="text-sm text-muted-foreground">Quarantined</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-500">{stats.cleaned}</div>
            <div className="text-sm text-muted-foreground">Cleaned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-blue-500">99.8%</div>
            <div className="text-sm text-muted-foreground">Detection Rate</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scan Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Virus Scanner
                </CardTitle>
                <CardDescription>
                  Run comprehensive system scans to detect threats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={startScan} 
                    disabled={scanStatus.isScanning}
                    className="h-20 flex-col"
                  >
                    <Play className="h-6 w-6 mb-2" />
                    Quick Scan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={startScan} 
                    disabled={scanStatus.isScanning}
                    className="h-20 flex-col"
                  >
                    <Scan className="h-6 w-6 mb-2" />
                    Full Scan
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    disabled={scanStatus.isScanning}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    Custom Scan
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    disabled={scanStatus.isScanning}
                  >
                    <Globe className="h-6 w-6 mb-2" />
                    Web Shield
                  </Button>
                </div>

                {scanStatus.isScanning && (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{scanStatus.scanType} in progress...</span>
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    </div>
                    <Progress value={scanStatus.progress} className="w-full" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>Files scanned: {scanStatus.filesScanned.toLocaleString()}</div>
                      <div>Threats found: {scanStatus.threatsFound}</div>
                      <div>Progress: {scanStatus.progress}%</div>
                      <div>Time remaining: {scanStatus.estimatedTime}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scan Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Scan History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Full System Scan</div>
                      <div className="text-sm text-muted-foreground">Completed 2 hours ago</div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-800">Clean</Badge>
                      <div className="text-sm text-muted-foreground">248,576 files</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Quick Scan</div>
                      <div className="text-sm text-muted-foreground">Completed 6 hours ago</div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-red-100 text-red-800">4 Threats</Badge>
                      <div className="text-sm text-muted-foreground">45,231 files</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Web Protection Scan</div>
                      <div className="text-sm text-muted-foreground">Completed yesterday</div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-yellow-100 text-yellow-800">2 Blocked</Badge>
                      <div className="text-sm text-muted-foreground">Real-time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threats List */}
            <div className="space-y-4">
              <h3 className="font-semibold">Detected Threats ({threats.length})</h3>
              {threats.map((threat) => (
                <Card 
                  key={threat.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedThreat?.id === threat.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedThreat(threat)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{threat.name}</span>
                          <Badge className={severityColors[threat.severity]}>
                            {threat.severity}
                          </Badge>
                          <Badge className={statusColors[threat.status]}>
                            {threat.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {threat.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Path: {threat.path}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Type: {threat.type}</span>
                      <span>Detected: {threat.detected}</span>
                    </div>
                    {threat.client && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Client: {threat.client}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Threat Details */}
            <Card>
              <CardHeader>
                <CardTitle>Threat Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedThreat ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="font-medium">{selectedThreat.name}</span>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <Badge className={severityColors[selectedThreat.severity]}>
                          {selectedThreat.severity} Risk
                        </Badge>
                        <Badge className={statusColors[selectedThreat.status]}>
                          {selectedThreat.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{selectedThreat.description}</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium">Threat Type</div>
                        <div className="text-muted-foreground capitalize">{selectedThreat.type}</div>
                      </div>
                      <div>
                        <div className="font-medium">File Location</div>
                        <div className="text-muted-foreground font-mono text-xs bg-muted p-2 rounded">
                          {selectedThreat.path}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Detection Time</div>
                        <div className="text-muted-foreground">{selectedThreat.detected}</div>
                      </div>
                      {selectedThreat.client && (
                        <div>
                          <div className="font-medium">Affected Client</div>
                          <div className="text-muted-foreground">{selectedThreat.client}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button size="sm" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Quarantine
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Remove
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export Log
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a threat to view analysis details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="protection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Protection Settings
              </CardTitle>
              <CardDescription>
                Configure real-time protection and security policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Real-time Protection</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">File System Protection</div>
                        <div className="text-sm text-muted-foreground">Monitors file operations in real-time</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Web Protection</div>
                        <div className="text-sm text-muted-foreground">Blocks malicious websites and downloads</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Email Protection</div>
                        <div className="text-sm text-muted-foreground">Scans email attachments and links</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Advanced Features</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Behavioral Analysis</div>
                        <div className="text-sm text-muted-foreground">AI-powered threat behavior detection</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Cloud Scanning</div>
                        <div className="text-sm text-muted-foreground">Leverages cloud threat intelligence</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Automatic Updates</div>
                        <div className="text-sm text-muted-foreground">Keeps definitions current automatically</div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Threats Blocked (24h)</span>
                  <span className="font-bold">47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Files Scanned (24h)</span>
                  <span className="font-bold">1.2M</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Web Threats Blocked</span>
                  <span className="font-bold">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email Threats Blocked</span>
                  <span className="font-bold">12</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Performance Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>System Impact</span>
                  <Badge className="bg-green-100 text-green-800">Low</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU Usage</span>
                    <span>2.1%</span>
                  </div>
                  <Progress value={2.1} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>45MB</span>
                  </div>
                  <Progress value={3.5} className="h-2" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Update</span>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Demo Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          This is a demonstration of Ultrium Antivirus capabilities. In production, you would see real-time threat detection and automated response across all managed endpoints.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AntivirusDemo;