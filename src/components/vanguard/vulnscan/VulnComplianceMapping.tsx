import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Shield, FileCheck, AlertTriangle, CheckCircle, XCircle, 
  ChevronDown, ChevronRight, Download, ExternalLink, Info
} from "lucide-react";

interface Vulnerability {
  id: string;
  vulnerability_id: string;
  title: string;
  description: string | null;
  severity: string;
  cve_id: string | null;
  cvss_score: number | null;
  affected_service: string | null;
  status: string | null;
}

interface VulnComplianceMappingProps {
  vulnerabilities: Vulnerability[];
}

// Compliance framework mappings
const COMPLIANCE_FRAMEWORKS = {
  'PCI-DSS': {
    name: 'PCI DSS 4.0',
    description: 'Payment Card Industry Data Security Standard',
    color: 'bg-blue-500',
    controls: [
      { id: '6.2', name: 'Protect systems from malware', vulnKeywords: ['malware', 'virus', 'trojan', 'ransomware'] },
      { id: '6.3', name: 'Identify and address security vulnerabilities', vulnKeywords: ['vulnerability', 'cve', 'exploit'] },
      { id: '6.4', name: 'Protect web applications', vulnKeywords: ['xss', 'sql injection', 'csrf', 'web'] },
      { id: '11.3', name: 'Penetration testing', vulnKeywords: ['pentest', 'penetration'] },
      { id: '11.4', name: 'Intrusion detection', vulnKeywords: ['intrusion', 'ids', 'ips'] },
      { id: '2.2', name: 'Secure system configurations', vulnKeywords: ['configuration', 'misconfiguration', 'default'] },
      { id: '8.3', name: 'Strong authentication', vulnKeywords: ['authentication', 'password', 'credential', 'brute'] },
    ]
  },
  'HIPAA': {
    name: 'HIPAA Security Rule',
    description: 'Health Insurance Portability and Accountability Act',
    color: 'bg-green-500',
    controls: [
      { id: '164.312(a)', name: 'Access Control', vulnKeywords: ['access', 'authentication', 'authorization', 'privilege'] },
      { id: '164.312(c)', name: 'Integrity Controls', vulnKeywords: ['integrity', 'tampering', 'modification'] },
      { id: '164.312(d)', name: 'Authentication', vulnKeywords: ['authentication', 'credential', 'password', 'mfa'] },
      { id: '164.312(e)', name: 'Transmission Security', vulnKeywords: ['ssl', 'tls', 'encryption', 'certificate'] },
      { id: '164.308(a)', name: 'Risk Analysis', vulnKeywords: ['vulnerability', 'risk', 'assessment'] },
    ]
  },
  'SOC2': {
    name: 'SOC 2 Type II',
    description: 'Service Organization Control 2',
    color: 'bg-purple-500',
    controls: [
      { id: 'CC6.1', name: 'Logical access security', vulnKeywords: ['access', 'authentication', 'authorization'] },
      { id: 'CC6.6', name: 'Vulnerability management', vulnKeywords: ['vulnerability', 'patch', 'update'] },
      { id: 'CC6.7', name: 'Transmission integrity', vulnKeywords: ['ssl', 'tls', 'encryption'] },
      { id: 'CC7.1', name: 'Detection of changes', vulnKeywords: ['change', 'modification', 'integrity'] },
      { id: 'CC7.2', name: 'Monitoring for security events', vulnKeywords: ['monitoring', 'detection', 'alert'] },
    ]
  },
  'NIST': {
    name: 'NIST CSF 2.0',
    description: 'Cybersecurity Framework',
    color: 'bg-orange-500',
    controls: [
      { id: 'ID.RA', name: 'Risk Assessment', vulnKeywords: ['risk', 'assessment', 'vulnerability'] },
      { id: 'PR.AC', name: 'Access Control', vulnKeywords: ['access', 'authentication', 'privilege'] },
      { id: 'PR.DS', name: 'Data Security', vulnKeywords: ['data', 'encryption', 'protection'] },
      { id: 'PR.IP', name: 'Protective Technology', vulnKeywords: ['firewall', 'ids', 'antivirus'] },
      { id: 'DE.CM', name: 'Continuous Monitoring', vulnKeywords: ['monitoring', 'scanning', 'detection'] },
      { id: 'DE.AE', name: 'Anomalies and Events', vulnKeywords: ['anomaly', 'intrusion', 'incident'] },
      { id: 'RS.AN', name: 'Analysis', vulnKeywords: ['analysis', 'forensic', 'investigation'] },
    ]
  },
  'CIS': {
    name: 'CIS Controls v8',
    description: 'Center for Internet Security Controls',
    color: 'bg-red-500',
    controls: [
      { id: '4', name: 'Secure Configuration', vulnKeywords: ['configuration', 'misconfiguration', 'hardening'] },
      { id: '5', name: 'Account Management', vulnKeywords: ['account', 'privilege', 'access'] },
      { id: '7', name: 'Continuous Vulnerability Management', vulnKeywords: ['vulnerability', 'patch', 'remediation'] },
      { id: '10', name: 'Malware Defenses', vulnKeywords: ['malware', 'virus', 'ransomware'] },
      { id: '12', name: 'Network Infrastructure', vulnKeywords: ['network', 'firewall', 'segmentation'] },
      { id: '16', name: 'Application Security', vulnKeywords: ['application', 'web', 'sql', 'xss'] },
    ]
  }
};

export function VulnComplianceMapping({ vulnerabilities }: VulnComplianceMappingProps) {
  const [activeFramework, setActiveFramework] = useState<string>('PCI-DSS');
  const [expandedControls, setExpandedControls] = useState<Set<string>>(new Set());

  // Map vulnerabilities to compliance controls
  const complianceData = useMemo(() => {
    const results: Record<string, {
      framework: typeof COMPLIANCE_FRAMEWORKS[keyof typeof COMPLIANCE_FRAMEWORKS];
      controls: Array<{
        control: { id: string; name: string };
        matchedVulns: Vulnerability[];
        status: 'pass' | 'fail' | 'warning';
      }>;
      score: number;
      criticalIssues: number;
    }> = {};

    for (const [key, framework] of Object.entries(COMPLIANCE_FRAMEWORKS)) {
      const controlResults = framework.controls.map(control => {
        const matchedVulns = vulnerabilities.filter(v => {
          const searchText = `${v.title} ${v.description || ''} ${v.cve_id || ''} ${v.affected_service || ''}`.toLowerCase();
          return control.vulnKeywords.some(kw => searchText.includes(kw.toLowerCase()));
        });

        const openVulns = matchedVulns.filter(v => v.status !== 'patched' && v.status !== 'suppressed');
        const hasCritical = openVulns.some(v => v.severity.toLowerCase() === 'critical');
        const hasHigh = openVulns.some(v => v.severity.toLowerCase() === 'high');

        let status: 'pass' | 'fail' | 'warning' = 'pass';
        if (hasCritical || openVulns.length > 3) status = 'fail';
        else if (hasHigh || openVulns.length > 0) status = 'warning';

        return { control, matchedVulns: openVulns, status };
      });

      const passCount = controlResults.filter(c => c.status === 'pass').length;
      const score = Math.round((passCount / controlResults.length) * 100);
      const criticalIssues = controlResults.filter(c => c.status === 'fail').length;

      results[key] = {
        framework,
        controls: controlResults,
        score,
        criticalIssues
      };
    }

    return results;
  }, [vulnerabilities]);

  const toggleControl = (controlId: string) => {
    const newExpanded = new Set(expandedControls);
    if (newExpanded.has(controlId)) {
      newExpanded.delete(controlId);
    } else {
      newExpanded.add(controlId);
    }
    setExpandedControls(newExpanded);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'fail': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    }
  };

  const activeData = complianceData[activeFramework];

  return (
    <div className="space-y-6">
      {/* Framework Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(complianceData).map(([key, data]) => (
          <Card 
            key={key}
            className={`cursor-pointer transition-all ${
              activeFramework === key ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
            }`}
            onClick={() => setActiveFramework(key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${data.framework.color}`} />
                <span className="font-medium text-sm truncate">{key}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{data.score}%</span>
                  {data.criticalIssues > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {data.criticalIssues} critical
                    </Badge>
                  )}
                </div>
                <Progress 
                  value={data.score} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Framework Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${activeData.framework.color}`} />
              <div>
                <CardTitle>{activeData.framework.name}</CardTitle>
                <CardDescription>{activeData.framework.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-500">
                {activeData.controls.filter(c => c.status === 'pass').length}
              </p>
              <p className="text-xs text-muted-foreground">Passing</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-500">
                {activeData.controls.filter(c => c.status === 'warning').length}
              </p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-500">
                {activeData.controls.filter(c => c.status === 'fail').length}
              </p>
              <p className="text-xs text-muted-foreground">Failing</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-2xl font-bold">{activeData.controls.length}</p>
              <p className="text-xs text-muted-foreground">Total Controls</p>
            </div>
          </div>

          {/* Controls List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {activeData.controls.map((item, idx) => (
                <Collapsible 
                  key={idx}
                  open={expandedControls.has(item.control.id)}
                  onOpenChange={() => toggleControl(item.control.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {item.control.id}
                            </Badge>
                            <span className="font-medium">{item.control.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.matchedVulns.length > 0 && (
                          <Badge className={getStatusColor(item.status)}>
                            {item.matchedVulns.length} issue{item.matchedVulns.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {expandedControls.has(item.control.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-8 mt-2 mb-4 space-y-2">
                      {item.matchedVulns.length === 0 ? (
                        <div className="p-3 bg-green-500/10 rounded-lg text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 inline mr-2" />
                          No open vulnerabilities affecting this control
                        </div>
                      ) : (
                        item.matchedVulns.map(vuln => (
                          <div 
                            key={vuln.id}
                            className="flex items-center justify-between p-2 bg-background/50 rounded border"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={
                                vuln.severity.toLowerCase() === 'critical' ? 'bg-red-500/10 text-red-500' :
                                vuln.severity.toLowerCase() === 'high' ? 'bg-orange-500/10 text-orange-500' :
                                'bg-yellow-500/10 text-yellow-500'
                              }>
                                {vuln.severity}
                              </Badge>
                              <span className="text-sm">{vuln.title}</span>
                            </div>
                            {vuln.cve_id && (
                              <a 
                                href={`https://nvd.nist.gov/vuln/detail/${vuln.cve_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                {vuln.cve_id}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
