import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, FileText, Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ComplianceControl {
  id: string;
  name: string;
  status: 'compliant' | 'non-compliant' | 'partial';
  description: string;
  evidence: string;
}

interface Framework {
  id: string;
  name: string;
  score: number;
  controls: ComplianceControl[];
}

export const ComplianceScorecard = () => {
  const [frameworks] = useState<Framework[]>([
    {
      id: 'hipaa',
      name: 'HIPAA',
      score: 92,
      controls: [
        { id: '1', name: 'Access Controls', status: 'compliant', description: 'Implement access controls to protect ePHI', evidence: 'RLS policies enabled on all tables' },
        { id: '2', name: 'Audit Controls', status: 'compliant', description: 'Hardware, software, and procedural mechanisms to record and examine access', evidence: 'Audit logging enabled' },
        { id: '3', name: 'Integrity Controls', status: 'compliant', description: 'Protect ePHI from improper alteration or destruction', evidence: 'Data validation in place' },
        { id: '4', name: 'Transmission Security', status: 'partial', description: 'Implement technical security measures for ePHI transmission', evidence: 'TLS 1.3 enabled, some legacy systems pending' },
        { id: '5', name: 'Person Authentication', status: 'compliant', description: 'Verify identity before accessing ePHI', evidence: 'MFA enabled for all users' },
      ]
    },
    {
      id: 'soc2',
      name: 'SOC 2 Type II',
      score: 88,
      controls: [
        { id: '1', name: 'Security - Access Control', status: 'compliant', description: 'Restrict access to authorized personnel', evidence: 'RBAC implemented' },
        { id: '2', name: 'Security - Encryption', status: 'compliant', description: 'Encrypt data at rest and in transit', evidence: 'AES-256 encryption enabled' },
        { id: '3', name: 'Availability - Monitoring', status: 'compliant', description: 'Monitor system performance and availability', evidence: 'Real-time monitoring active' },
        { id: '4', name: 'Availability - Backup', status: 'partial', description: 'Regular backups and disaster recovery', evidence: 'Daily backups, DR testing needed' },
        { id: '5', name: 'Confidentiality', status: 'compliant', description: 'Protect confidential information', evidence: 'DLP policies configured' },
        { id: '6', name: 'Processing Integrity', status: 'non-compliant', description: 'Ensure system processing is complete and accurate', evidence: 'Data validation gaps identified' },
      ]
    },
    {
      id: 'pci',
      name: 'PCI-DSS',
      score: 85,
      controls: [
        { id: '1', name: 'Firewall Configuration', status: 'compliant', description: 'Install and maintain firewall configuration', evidence: 'Firewall rules documented and reviewed' },
        { id: '2', name: 'Default Passwords', status: 'compliant', description: 'Do not use vendor-supplied defaults', evidence: 'Password policy enforced' },
        { id: '3', name: 'Cardholder Data Protection', status: 'compliant', description: 'Protect stored cardholder data', evidence: 'Tokenization in place' },
        { id: '4', name: 'Encryption in Transit', status: 'compliant', description: 'Encrypt transmission of cardholder data', evidence: 'TLS 1.3 for all transactions' },
        { id: '5', name: 'Anti-virus', status: 'partial', description: 'Use and regularly update anti-virus software', evidence: '95% endpoint coverage' },
        { id: '6', name: 'Vulnerability Management', status: 'partial', description: 'Develop secure systems and applications', evidence: 'Monthly scans, remediation pending' },
      ]
    },
    {
      id: 'nist',
      name: 'NIST CSF',
      score: 90,
      controls: [
        { id: '1', name: 'Identify - Asset Management', status: 'compliant', description: 'Maintain asset inventory', evidence: 'CMDB populated and current' },
        { id: '2', name: 'Protect - Access Control', status: 'compliant', description: 'Limit access to authorized users', evidence: 'Zero trust implemented' },
        { id: '3', name: 'Protect - Training', status: 'partial', description: 'Security awareness training', evidence: 'Annual training, quarterly needed' },
        { id: '4', name: 'Detect - Monitoring', status: 'compliant', description: 'Continuous security monitoring', evidence: 'SIEM operational' },
        { id: '5', name: 'Respond - Planning', status: 'compliant', description: 'Incident response planning', evidence: 'IR playbooks documented' },
        { id: '6', name: 'Recover - Planning', status: 'compliant', description: 'Recovery planning', evidence: 'BCP/DR plans in place' },
      ]
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'non-compliant':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      compliant: 'bg-green-500',
      'non-compliant': 'bg-red-500',
      partial: 'bg-yellow-500'
    };
    return <Badge className={colors[status] || 'bg-muted'}>{status}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {frameworks.map(framework => (
          <Card key={framework.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{framework.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(framework.score)}`}>
                {framework.score}%
              </div>
              <Progress value={framework.score} className="mt-2 h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{framework.controls.filter(c => c.status === 'compliant').length} compliant</span>
                <span>{framework.controls.filter(c => c.status !== 'compliant').length} gaps</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Details
              </CardTitle>
              <CardDescription>
                Control-level compliance status for each framework
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={frameworks[0]?.id}>
            <TabsList className="flex-wrap">
              {frameworks.map(framework => (
                <TabsTrigger key={framework.id} value={framework.id}>
                  {framework.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {frameworks.map(framework => (
              <TabsContent key={framework.id} value={framework.id} className="space-y-4">
                <div className="space-y-3">
                  {framework.controls.map(control => (
                    <div key={control.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(control.status)}
                          <div>
                            <p className="font-medium">{control.name}</p>
                            <p className="text-sm text-muted-foreground">{control.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{control.evidence}</span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(control.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
