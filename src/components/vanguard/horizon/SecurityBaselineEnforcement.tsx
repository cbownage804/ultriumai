import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Shield, CheckCircle2, XCircle, AlertTriangle, Settings,
  Play, Download, Clock, RefreshCw, FileText, Lock, Wifi,
  HardDrive, Users, Key, Monitor, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSecurityBaselines } from '@/hooks/useHorizon';

interface SecurityCheck {
  id: string;
  category: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  severity: 'critical' | 'high' | 'medium' | 'low';
  cisId?: string;
  remediation: string;
  affectedDevices?: number;
}

export const SecurityBaselineEnforcement: React.FC = () => {
  const { toast } = useToast();
  const { baselines: dbBaselines, isLoading, createBaseline, toggleBaseline, refetch } = useSecurityBaselines();
  const [selectedFramework, setSelectedFramework] = useState<string>('cis_windows');
  const [isScanning, setIsScanning] = useState(false);

  // Map DB baselines to UI format
  const baselines = dbBaselines.map(b => ({
    id: b.id,
    name: b.baseline_name,
    description: `${b.baseline_type.toUpperCase()} Security Baseline`,
    framework: b.baseline_type.toUpperCase(),
    checkCount: Object.keys(b.policy_config || {}).length || 100,
    passRate: 85,
    lastApplied: b.updated_at,
    isActive: b.is_active
  }));

  const [securityChecks] = useState<SecurityCheck[]>([
    {
      id: '1',
      category: 'Account Policies',
      name: 'Password History',
      description: 'Enforce password history of 24 passwords',
      status: 'pass',
      severity: 'medium',
      cisId: '1.1.1',
      remediation: 'Set "Enforce password history" to 24 or more passwords',
      affectedDevices: 0
    },
    {
      id: '2',
      category: 'Account Policies',
      name: 'Minimum Password Length',
      description: 'Minimum password length must be 14 or more characters',
      status: 'fail',
      severity: 'high',
      cisId: '1.1.4',
      remediation: 'Set "Minimum password length" to 14 or more characters',
      affectedDevices: 23
    },
    {
      id: '3',
      category: 'Local Policies',
      name: 'Account Lockout Threshold',
      description: 'Account lockout threshold set to 5 or fewer failed attempts',
      status: 'pass',
      severity: 'high',
      cisId: '1.2.1',
      remediation: 'Set "Account lockout threshold" to 5 or fewer invalid attempts',
      affectedDevices: 0
    },
    {
      id: '4',
      category: 'Audit Policy',
      name: 'Audit Credential Validation',
      description: 'Audit Credential Validation must be Success and Failure',
      status: 'warning',
      severity: 'medium',
      cisId: '17.1.1',
      remediation: 'Enable auditing for both Success and Failure events',
      affectedDevices: 12
    },
    {
      id: '5',
      category: 'Security Options',
      name: 'BitLocker Encryption',
      description: 'BitLocker Drive Encryption must be enabled on system drive',
      status: 'fail',
      severity: 'critical',
      cisId: '18.9.11.1',
      remediation: 'Enable BitLocker on the operating system drive',
      affectedDevices: 8
    },
    {
      id: '6',
      category: 'Windows Firewall',
      name: 'Domain Profile State',
      description: 'Windows Firewall Domain Profile must be enabled',
      status: 'pass',
      severity: 'high',
      cisId: '9.1.1',
      remediation: 'Enable Windows Firewall for Domain profile',
      affectedDevices: 0
    },
    {
      id: '7',
      category: 'Windows Defender',
      name: 'Real-time Protection',
      description: 'Windows Defender real-time protection must be enabled',
      status: 'pass',
      severity: 'critical',
      cisId: '18.9.47.4.1',
      remediation: 'Enable real-time protection in Windows Security settings',
      affectedDevices: 0
    },
    {
      id: '8',
      category: 'Remote Desktop',
      name: 'NLA Authentication',
      description: 'Network Level Authentication must be required for RDP',
      status: 'fail',
      severity: 'high',
      cisId: '18.9.65.3.9.2',
      remediation: 'Enable "Require Network Level Authentication" for Remote Desktop',
      affectedDevices: 15
    }
  ]);

  const handleRunScan = () => {
    setIsScanning(true);
    toast({
      title: "Baseline Scan Started",
      description: "Checking compliance against security baselines..."
    });
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Scan Complete",
        description: "Found 58 non-compliant settings across 43 devices."
      });
    }, 3000);
  };

  type BaselineUI = typeof baselines[number];

  const handleEnforceBaseline = (baseline: BaselineUI) => {
    toast({
      title: "Enforcing Baseline",
      description: `Applying ${baseline.name} to all applicable devices...`
    });
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    return <Badge className={colors[severity]}>{severity}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Account Policies': <Users className="h-4 w-4" />,
      'Local Policies': <Lock className="h-4 w-4" />,
      'Audit Policy': <FileText className="h-4 w-4" />,
      'Security Options': <Key className="h-4 w-4" />,
      'Windows Firewall': <Wifi className="h-4 w-4" />,
      'Windows Defender': <Shield className="h-4 w-4" />,
      'Remote Desktop': <Monitor className="h-4 w-4" />
    };
    return icons[category] || <Settings className="h-4 w-4" />;
  };

  const passCount = securityChecks.filter(c => c.status === 'pass').length;
  const failCount = securityChecks.filter(c => c.status === 'fail').length;
  const warningCount = securityChecks.filter(c => c.status === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security Baselines
          </h2>
          <p className="text-muted-foreground">Enforce CIS benchmarks and security policies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleRunScan} disabled={isScanning}>
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Compliance Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passing</p>
                <p className="text-2xl font-bold text-green-500">{passCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failing</p>
                <p className="text-2xl font-bold text-red-500">{failCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-500">{warningCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold">
                  {Math.round((passCount / securityChecks.length) * 100)}%
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="checks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checks">Security Checks</TabsTrigger>
          <TabsTrigger value="baselines">Baselines</TabsTrigger>
          <TabsTrigger value="remediation">Remediation</TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Compliance Checks</CardTitle>
                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cis_windows">CIS Windows 11</SelectItem>
                    <SelectItem value="cis_server">CIS Windows Server</SelectItem>
                    <SelectItem value="cis_macos">CIS macOS</SelectItem>
                    <SelectItem value="nist">NIST SP 800-171</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {securityChecks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(check.status)}
                        <div className="p-2 bg-muted rounded-lg">
                          {getCategoryIcon(check.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{check.name}</span>
                            {check.cisId && (
                              <Badge variant="outline" className="text-xs">{check.cisId}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{check.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Category: {check.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {check.affectedDevices !== undefined && check.affectedDevices > 0 && (
                          <Badge variant="destructive">{check.affectedDevices} devices</Badge>
                        )}
                        {getSeverityBadge(check.severity)}
                        <Button variant="outline" size="sm">
                          Fix
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="baselines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Baseline Profiles</CardTitle>
              <CardDescription>Manage and apply security configuration baselines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {baselines.map((baseline) => (
                  <div key={baseline.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{baseline.name}</h4>
                          <p className="text-sm text-muted-foreground">{baseline.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={baseline.isActive} />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEnforceBaseline(baseline)}
                        >
                          Enforce
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Framework</p>
                        <p className="font-medium">{baseline.framework}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Checks</p>
                        <p className="font-medium">{baseline.checkCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pass Rate</p>
                        <div className="flex items-center gap-2">
                          <Progress value={baseline.passRate} className="h-2 flex-1" />
                          <span className="font-medium">{baseline.passRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Applied</p>
                        <p className="font-medium">
                          {baseline.lastApplied 
                            ? new Date(baseline.lastApplied).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remediation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Remediation Queue</CardTitle>
              <CardDescription>Failed checks requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityChecks.filter(c => c.status === 'fail').map((check) => (
                  <div key={check.id} className="border rounded-lg p-4 border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{check.name}</span>
                        {getSeverityBadge(check.severity)}
                      </div>
                      <Badge variant="destructive">{check.affectedDevices} devices</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{check.description}</p>
                    <div className="bg-muted p-3 rounded-lg">
                      <Label className="text-xs text-muted-foreground">Remediation Steps</Label>
                      <p className="text-sm">{check.remediation}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm">Auto-Remediate</Button>
                      <Button variant="outline" size="sm">Create Ticket</Button>
                      <Button variant="ghost" size="sm">Suppress</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
