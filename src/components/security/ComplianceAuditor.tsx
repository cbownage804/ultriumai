import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertTriangle, Shield, FileText, Award, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComplianceStandard {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface ComplianceResult {
  standard: string;
  score: number;
  passed: number;
  failed: number;
  total: number;
  findings: ComplianceFinding[];
}

interface ComplianceFinding {
  control: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  remediation: string;
}

interface ComplianceAuditorProps {
  onScanComplete?: () => void;
}

export const ComplianceAuditor = ({ onScanComplete }: ComplianceAuditorProps) => {
  const [target, setTarget] = useState("");
  const [standards, setStandards] = useState<ComplianceStandard[]>([
    { id: 'owasp', name: 'OWASP Top 10', description: 'Web application security risks', selected: true },
    { id: 'nist', name: 'NIST Cybersecurity Framework', description: 'Comprehensive security framework', selected: true },
    { id: 'iso27001', name: 'ISO 27001', description: 'Information security management', selected: false },
    { id: 'pci', name: 'PCI DSS', description: 'Payment card industry standards', selected: false },
    { id: 'gdpr', name: 'GDPR', description: 'Data protection regulation', selected: false },
    { id: 'sox', name: 'SOX', description: 'Sarbanes-Oxley Act compliance', selected: false },
    { id: 'hipaa', name: 'HIPAA', description: 'Healthcare information protection', selected: false },
    { id: 'fisma', name: 'FISMA', description: 'Federal information security management', selected: false },
  ]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditResults, setAuditResults] = useState<ComplianceResult[]>([]);
  const [activeTab, setActiveTab] = useState("configure");
  const { toast } = useToast();

  const startAudit = async () => {
    if (!target.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target URL or system identifier",
        variant: "destructive",
      });
      return;
    }

    const selectedStandards = standards.filter(s => s.selected);
    if (selectedStandards.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one compliance standard",
        variant: "destructive",
      });
      return;
    }

    setIsAuditing(true);
    setAuditProgress(0);
    setAuditResults([]);

    // Simulate audit progress
    const progressInterval = setInterval(() => {
      setAuditProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 8;
      });
    }, 1000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('ai-security-scanner', {
        body: {
          target: target.trim(),
          scanType: 'compliance',
          options: {
            standards: selectedStandards.map(s => s.id),
          },
        },
      });

      if (response.error) {
        throw response.error;
      }

      setAuditProgress(100);
      
      // Use real compliance results from API response if available
      const apiResults = response.data?.results || [];
      
      let results: ComplianceResult[];
      if (apiResults.length > 0) {
        // Use real results from the API
        results = apiResults;
      } else {
        // If no API results, show empty state requiring configuration
        results = selectedStandards.map(standard => ({
          standard: standard.name,
          score: 0,
          passed: 0,
          failed: 0,
          total: 0,
          findings: []
        }));
      }

      setAuditResults(results);
      setActiveTab("results");
      
      toast({
        title: "Compliance Audit Complete",
        description: `Audited ${selectedStandards.length} standards`,
      });

      if (onScanComplete) {
        onScanComplete();
      }
    } catch (error) {
      console.error('Audit error:', error);
      toast({
        title: "Audit Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsAuditing(false);
      setAuditProgress(0);
    }
  };

  const toggleStandard = (id: string) => {
    setStandards(prev => 
      prev.map(s => s.id === id ? { ...s, selected: !s.selected } : s)
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Award className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Compliance Auditor</h2>
          <p className="text-muted-foreground">Automated compliance assessment and reporting</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="configure">Configure Audit</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="results" disabled={auditResults.length === 0}>Results</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Audit Configuration</CardTitle>
              <CardDescription>Configure your compliance assessment parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="target">Target System or URL</Label>
                <Input
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="https://example.com or System Name"
                  disabled={isAuditing}
                />
              </div>

              <div className="space-y-4">
                <Label>Select Compliance Standards</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {standards.map((standard) => (
                    <div key={standard.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={standard.id}
                        checked={standard.selected}
                        onCheckedChange={() => toggleStandard(standard.id)}
                        disabled={isAuditing}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={standard.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {standard.name}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {standard.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={startAudit} 
                disabled={isAuditing || !target.trim()}
                className="w-full"
              >
                {isAuditing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Auditing... {Math.round(auditProgress)}%
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-4 w-4" />
                    Start Compliance Audit
                  </>
                )}
              </Button>

              {isAuditing && (
                <div className="space-y-2">
                  <Progress value={auditProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    Evaluating compliance standards...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {standards.map((standard) => (
              <Card key={standard.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{standard.name}</CardTitle>
                  <CardDescription>{standard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={standard.selected ? "default" : "secondary"}>
                        {standard.selected ? "Selected" : "Not Selected"}
                      </Badge>
                    </div>
                    
                    {standard.id === 'owasp' && (
                      <div className="text-sm text-muted-foreground">
                        <p>Key controls: Injection, Authentication, Data Exposure, XXE, Access Control</p>
                      </div>
                    )}
                    
                    {standard.id === 'nist' && (
                      <div className="text-sm text-muted-foreground">
                        <p>Framework: Identify, Protect, Detect, Respond, Recover</p>
                      </div>
                    )}
                    
                    {standard.id === 'iso27001' && (
                      <div className="text-sm text-muted-foreground">
                        <p>114 security controls across 14 domains</p>
                      </div>
                    )}
                    
                    {standard.id === 'pci' && (
                      <div className="text-sm text-muted-foreground">
                        <p>12 requirements for payment card data protection</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {auditResults.length > 0 && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{auditResults.length}</div>
                    <p className="text-sm text-muted-foreground">Standards Audited</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(Math.round(auditResults.reduce((acc, r) => acc + r.score, 0) / auditResults.length))}`}>
                      {Math.round(auditResults.reduce((acc, r) => acc + r.score, 0) / auditResults.length)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {auditResults.reduce((acc, r) => acc + r.passed, 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Controls Passed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {auditResults.reduce((acc, r) => acc + r.failed, 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Controls Failed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Results */}
              {auditResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{result.standard}</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                          {result.score}%
                        </span>
                        <Badge variant={result.score >= 90 ? "default" : result.score >= 75 ? "secondary" : "destructive"}>
                          {result.score >= 90 ? "Compliant" : result.score >= 75 ? "Mostly Compliant" : "Non-Compliant"}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {result.passed} passed, {result.failed} failed out of {result.total} controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${result.score}%` }}
                        ></div>
                      </div>
                      
                      <div className="space-y-3">
                        {result.findings.map((finding, findingIndex) => (
                          <div key={findingIndex} className="flex items-start gap-3 p-3 border rounded-lg">
                            {getStatusIcon(finding.status)}
                            <div className="flex-1">
                              <h4 className="font-medium">{finding.control}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                              <p className="text-sm font-medium">Remediation:</p>
                              <p className="text-sm text-muted-foreground">{finding.remediation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};