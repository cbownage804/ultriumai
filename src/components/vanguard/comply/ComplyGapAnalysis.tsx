import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Target, CheckCircle, XCircle, Clock, AlertTriangle, Calendar,
  TrendingUp, BarChart3, Filter
} from 'lucide-react';
import { useClientCompliance, ComplyClientSummary } from '@/hooks/useClientCompliance';
import { format, differenceInDays } from 'date-fns';

const FRAMEWORK_LABELS: Record<string, string> = {
  soc2: 'SOC 2', hipaa: 'HIPAA', pci_dss: 'PCI-DSS', iso_27001: 'ISO 27001',
  nist_800_53: 'NIST 800-53', gdpr: 'GDPR', ccpa: 'CCPA / CPRA', cmmc: 'CMMC 2.0',
  fedramp: 'FedRAMP', glba: 'GLBA', wisp: 'WISP', cis_linux: 'CIS Linux', cis_windows: 'CIS Windows',
};

interface GapItem {
  framework: string;
  clientName: string;
  clientId: string;
  totalPolicies: number;
  compliantPolicies: number;
  inProgressPolicies: number;
  notStartedPolicies: number;
  nonCompliantPolicies: number;
  readinessPercent: number;
}

export function ComplyGapAnalysis() {
  const { clients, isLoading } = useClientCompliance();
  const [filterFramework, setFilterFramework] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [auditDates, setAuditDates] = useState<Record<string, string>>({});

  // Build gap data from clients
  const gapItems: GapItem[] = [];
  clients.forEach(client => {
    client.frameworks.filter(f => f.is_enabled).forEach(fw => {
      // We need per-framework policy breakdown — approximate from available data
      const totalPolicies = client.total_policies; // simplified
      const compliantPolicies = client.compliant_policies;
      const readiness = totalPolicies > 0 ? Math.round((compliantPolicies / totalPolicies) * 100) : 0;

      gapItems.push({
        framework: fw.framework_type,
        clientName: client.company_name,
        clientId: client.client_id,
        totalPolicies,
        compliantPolicies,
        inProgressPolicies: 0,
        notStartedPolicies: totalPolicies - compliantPolicies,
        nonCompliantPolicies: 0,
        readinessPercent: readiness,
      });
    });
  });

  const filtered = gapItems.filter(g => {
    if (filterFramework !== 'all' && g.framework !== filterFramework) return false;
    if (filterClient !== 'all' && g.clientId !== filterClient) return false;
    return true;
  });

  const overallReadiness = filtered.length > 0
    ? Math.round(filtered.reduce((s, g) => s + g.readinessPercent, 0) / filtered.length)
    : 0;

  const getReadinessColor = (pct: number) => {
    if (pct >= 90) return 'text-green-400';
    if (pct >= 70) return 'text-yellow-400';
    if (pct >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getReadinessBg = (pct: number) => {
    if (pct >= 90) return 'bg-green-500/20 border-green-500/30';
    if (pct >= 70) return 'bg-yellow-500/20 border-yellow-500/30';
    if (pct >= 40) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const uniqueFrameworks = [...new Set(gapItems.map(g => g.framework))];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading gap analysis...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Overall Readiness</p>
            <p className={`text-4xl font-bold ${getReadinessColor(overallReadiness)}`}>{overallReadiness}%</p>
            <Progress value={overallReadiness} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Frameworks Tracked</p>
            <p className="text-4xl font-bold text-white">{uniqueFrameworks.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Clients in Scope</p>
            <p className="text-4xl font-bold text-white">{clients.filter(c => c.frameworks.length > 0).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Critical Gaps</p>
            <p className="text-4xl font-bold text-red-400">{filtered.filter(g => g.readinessPercent < 50).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterFramework} onValueChange={setFilterFramework}>
          <SelectTrigger className="w-[200px] bg-black/40 border-white/10">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Frameworks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            {uniqueFrameworks.map(fw => (
              <SelectItem key={fw} value={fw}>{FRAMEWORK_LABELS[fw] || fw}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[200px] bg-black/40 border-white/10">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(c => (
              <SelectItem key={c.client_id} value={c.client_id}>{c.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gap Breakdown */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-400" />
            Gap Analysis Breakdown
          </CardTitle>
          <CardDescription>Controls status per client and framework</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No frameworks enabled yet. Enable frameworks on client compliance pages to see gap analysis.</p>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {filtered.sort((a, b) => a.readinessPercent - b.readinessPercent).map((gap, idx) => {
                  const auditKey = `${gap.clientId}_${gap.framework}`;
                  const auditDate = auditDates[auditKey];
                  const daysUntilAudit = auditDate ? differenceInDays(new Date(auditDate), new Date()) : null;

                  return (
                    <div key={idx} className={`p-4 rounded-lg border ${getReadinessBg(gap.readinessPercent)} transition-colors`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white">{gap.clientName}</span>
                          <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">
                            {FRAMEWORK_LABELS[gap.framework] || gap.framework}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          {daysUntilAudit !== null && (
                            <Badge className={daysUntilAudit <= 30 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}>
                              <Calendar className="h-3 w-3 mr-1" />
                              {daysUntilAudit > 0 ? `${daysUntilAudit}d to audit` : 'Audit overdue'}
                            </Badge>
                          )}
                          <span className={`text-lg font-bold ${getReadinessColor(gap.readinessPercent)}`}>
                            {gap.readinessPercent}%
                          </span>
                        </div>
                      </div>

                      <Progress value={gap.readinessPercent} className="h-2 mb-3" />

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-400" />
                          {gap.compliantPolicies} compliant
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-400" />
                          {gap.inProgressPolicies} in progress
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3 text-red-400" />
                          {gap.notStartedPolicies} remaining
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Audit date:</span>
                          <Input
                            type="date"
                            className="h-7 w-[140px] text-xs bg-black/30 border-white/10"
                            value={auditDate || ''}
                            onChange={e => setAuditDates(prev => ({ ...prev, [auditKey]: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
