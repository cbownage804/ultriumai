import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Shield, Zap, AlertTriangle, Lock, Unlock, Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PenTestOptions {
  depth: number;
  aggressive: boolean;
  includeSubdomains: boolean;
  socialEngineering: boolean;
  physicalSecurity: boolean;
}

interface PenetrationTestingProps {
  onScanComplete?: () => void;
}

export const PenetrationTesting = ({ onScanComplete }: PenetrationTestingProps) => {
  const [target, setTarget] = useState("");
  const [testOptions, setTestOptions] = useState<PenTestOptions>({
    depth: 5,
    aggressive: true,
    includeSubdomains: true,
    socialEngineering: false,
    physicalSecurity: false,
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testResult, setTestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("configure");
  const { toast } = useToast();

  const startPenTest = async () => {
    if (!target.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target URL or IP address",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestProgress(0);
    setTestResult(null);

    // Simulate penetration test progress
    const progressInterval = setInterval(() => {
      setTestProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 8;
      });
    }, 1500);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('ai-security-scanner', {
        body: {
          target: target.trim(),
          scanType: 'penetration',
          options: testOptions,
        },
      });

      if (response.error) {
        throw response.error;
      }

      setTestProgress(100);
      setTestResult(response.data);
      setActiveTab("results");
      
      toast({
        title: "Penetration Test Complete",
        description: `Identified ${response.data.findings} potential attack vectors`,
      });

      if (onScanComplete) {
        onScanComplete();
      }
    } catch (error) {
      console.error('Pen test error:', error);
      toast({
        title: "Penetration Test Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsTesting(false);
      setTestProgress(0);
    }
  };

  const testPhases = [
    { name: "Reconnaissance", icon: Network, description: "Information gathering and target enumeration" },
    { name: "Scanning", icon: Target, description: "Port scanning and service enumeration" },
    { name: "Exploitation", icon: Zap, description: "Attempting to exploit discovered vulnerabilities" },
    { name: "Post-Exploitation", icon: Unlock, description: "Privilege escalation and lateral movement" },
    { name: "Reporting", icon: Shield, description: "Documenting findings and attack paths" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Penetration Testing</h2>
          <p className="text-muted-foreground">Automated ethical hacking and exploitation testing</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configure">Configure Test</TabsTrigger>
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
          <TabsTrigger value="results" disabled={!testResult}>Results</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Penetration Test Configuration</CardTitle>
              <CardDescription>Configure your ethical hacking assessment parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only test systems you own or have explicit permission to test. Unauthorized penetration testing is illegal.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="target">Target URL or IP Address</Label>
                <Input
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="https://example.com or 192.168.1.1"
                  disabled={isTesting}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="depth">Test Depth Level</Label>
                    <Input
                      id="depth"
                      type="number"
                      min={1}
                      max={10}
                      value={testOptions.depth}
                      onChange={(e) => setTestOptions(prev => ({ ...prev, depth: parseInt(e.target.value) || 5 }))}
                      disabled={isTesting}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="aggressive">Aggressive Testing</Label>
                      <p className="text-sm text-muted-foreground">May trigger security alerts</p>
                    </div>
                    <Switch
                      id="aggressive"
                      checked={testOptions.aggressive}
                      onCheckedChange={(checked) => setTestOptions(prev => ({ ...prev, aggressive: checked }))}
                      disabled={isTesting}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="subdomains">Include Subdomains</Label>
                      <p className="text-sm text-muted-foreground">Test subdomain targets</p>
                    </div>
                    <Switch
                      id="subdomains"
                      checked={testOptions.includeSubdomains}
                      onCheckedChange={(checked) => setTestOptions(prev => ({ ...prev, includeSubdomains: checked }))}
                      disabled={isTesting}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="social">Social Engineering</Label>
                      <p className="text-sm text-muted-foreground">Phishing and social attacks</p>
                    </div>
                    <Switch
                      id="social"
                      checked={testOptions.socialEngineering}
                      onCheckedChange={(checked) => setTestOptions(prev => ({ ...prev, socialEngineering: checked }))}
                      disabled={isTesting}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="physical">Physical Security</Label>
                      <p className="text-sm text-muted-foreground">Physical access testing</p>
                    </div>
                    <Switch
                      id="physical"
                      checked={testOptions.physicalSecurity}
                      onCheckedChange={(checked) => setTestOptions(prev => ({ ...prev, physicalSecurity: checked }))}
                      disabled={isTesting}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={startPenTest} 
                disabled={isTesting || !target.trim()}
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <Target className="mr-2 h-4 w-4 animate-spin" />
                    Testing... {Math.round(testProgress)}%
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    Start Penetration Test
                  </>
                )}
              </Button>

              {isTesting && (
                <div className="space-y-2">
                  <Progress value={testProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Executing penetration testing methodology...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methodology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Penetration Testing Methodology</CardTitle>
              <CardDescription>Our systematic approach to ethical hacking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {testPhases.map((phase, index) => {
                  const Icon = phase.icon;
                  return (
                    <div key={phase.name} className="flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                            {index + 1}
                          </span>
                          <h3 className="font-semibold">{phase.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attack Vectors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Web application exploits
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Network service attacks
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Authentication bypasses
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Privilege escalation
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Data exfiltration paths
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance Standards</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    OWASP Testing Guide
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    NIST SP 800-115
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    PTES (Penetration Testing Execution Standard)
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    OSSTMM Methodology
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Industry best practices
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {testResult && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-destructive">{testResult.critical}</div>
                    <p className="text-sm text-muted-foreground">Critical Exploits</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-500">{testResult.high}</div>
                    <p className="text-sm text-muted-foreground">High Risk</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-500">{testResult.medium}</div>
                    <p className="text-sm text-muted-foreground">Medium Risk</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-500">{testResult.low}</div>
                    <p className="text-sm text-muted-foreground">Low Risk</p>
                  </CardContent>
                </Card>
              </div>

              {/* Executive Summary */}
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>{testResult.summary}</AlertDescription>
              </Alert>

              {/* Attack Paths */}
              <Card>
                <CardHeader>
                  <CardTitle>Attack Paths & Exploitation Results</CardTitle>
                  <CardDescription>Successful exploitation attempts and attack chains</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {testResult.results?.map((finding: any, index: number) => (
                      <div key={finding.id || index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">{finding.title}</h3>
                          </div>
                          <Badge variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {finding.severity?.toUpperCase() || 'MEDIUM'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{finding.description}</p>
                        
                        {finding.impact && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Business Impact:</h4>
                            <p className="text-sm text-muted-foreground">{finding.impact}</p>
                          </div>
                        )}
                        
                        {finding.recommendation && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Remediation:</h4>
                            <p className="text-sm text-muted-foreground">{finding.recommendation}</p>
                          </div>
                        )}
                      </div>
                    )) || (
                      <p className="text-center text-muted-foreground py-8">
                        No exploitation results available. This could indicate strong security posture.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};