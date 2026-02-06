import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Users, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { useClientCompliance } from '@/hooks/useClientCompliance';

const FRAMEWORK_LABELS: Record<string, string> = {
  soc2: 'SOC 2', hipaa: 'HIPAA', pci_dss: 'PCI-DSS', iso_27001: 'ISO 27001',
  nist_800_53: 'NIST 800-53', cis_linux: 'CIS Linux', cis_windows: 'CIS Windows',
};

export function ComplyOverview() {
  const { clients, isLoading } = useClientCompliance();

  const totalClients = clients.length;
  const clientsWithFrameworks = clients.filter(c => c.frameworks.length > 0).length;
  const allScores = clients.flatMap(c => c.frameworks.filter(f => f.is_enabled).map(f => Number(f.compliance_score)));
  const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const totalPolicies = clients.reduce((s, c) => s + c.total_policies, 0);
  const compliantPolicies = clients.reduce((s, c) => s + c.compliant_policies, 0);

  // Framework distribution
  const frameworkCounts: Record<string, number> = {};
  clients.forEach(c => c.frameworks.forEach(f => {
    frameworkCounts[f.framework_type] = (frameworkCounts[f.framework_type] || 0) + 1;
  }));

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading compliance data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Compliance Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-teal-500 opacity-50" />
            </div>
            <Progress value={avgScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tracked Clients</p>
                <p className="text-3xl font-bold text-white">{clientsWithFrameworks}<span className="text-lg text-muted-foreground">/{totalClients}</span></p>
              </div>
              <Users className="h-8 w-8 text-teal-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliant Policies</p>
                <p className="text-3xl font-bold text-green-500">{compliantPolicies}<span className="text-lg text-muted-foreground">/{totalPolicies}</span></p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Frameworks</p>
                <p className="text-3xl font-bold text-white">{Object.keys(frameworkCounts).length}</p>
              </div>
              <Shield className="h-8 w-8 text-teal-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Framework Distribution & At-Risk Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm">Framework Adoption</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(frameworkCounts).length === 0 ? (
              <p className="text-muted-foreground text-sm">No frameworks enabled yet. Go to Client Compliance to get started.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(frameworkCounts).sort((a, b) => b[1] - a[1]).map(([fw, count]) => (
                  <div key={fw} className="flex items-center justify-between">
                    <span className="text-sm text-white">{FRAMEWORK_LABELS[fw] || fw}</span>
                    <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">{count} clients</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              At-Risk Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clients.filter(c => c.avg_score > 0 && c.avg_score < 70).length === 0 ? (
              <p className="text-muted-foreground text-sm">No clients currently at risk.</p>
            ) : (
              <div className="space-y-3">
                {clients.filter(c => c.avg_score > 0 && c.avg_score < 70).slice(0, 5).map(c => (
                  <div key={c.client_id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                    <span className="text-sm text-white">{c.company_name}</span>
                    <span className="text-sm font-bold text-red-400">{c.avg_score}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
