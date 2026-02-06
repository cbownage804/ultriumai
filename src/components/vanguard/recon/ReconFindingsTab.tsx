import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Search, Loader2, ExternalLink, Shield } from 'lucide-react';
import { useReconFindings } from '@/hooks/useReconPentest';
import { SeverityIndicator, FindingStatusBadge } from './ReconPentestDashboard';

export function ReconFindingsTab() {
  const { loading, findings, updateFinding } = useReconFindings();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFinding, setSelectedFinding] = useState<any>(null);

  const filtered = findings.filter(f => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (searchQuery && !f.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !f.affected_host.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = async (findingId: string, newStatus: string) => {
    await updateFinding(findingId, { status: newStatus } as any);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-white">Vulnerability Findings</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/30" />
            <Input placeholder="Search findings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-48 bg-white/5 border-white/10 text-white text-sm h-9" />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white h-9 text-sm">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f14] border-white/10">
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f0f14] border-white/10">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_remediation">In Remediation</SelectItem>
              <SelectItem value="remediated">Remediated</SelectItem>
              <SelectItem value="false_positive">False Positive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardContent className="py-12 text-center text-white/30">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>{findings.length === 0 ? 'No findings yet. Run a vulnerability scan.' : 'No findings match your filters.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(finding => (
            <Card key={finding.id} className="bg-black/40 border-white/10 backdrop-blur-xl hover:border-blue-500/30 transition-colors cursor-pointer"
              onClick={() => setSelectedFinding(finding)}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SeverityIndicator severity={finding.severity} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{finding.title}</p>
                        {finding.cve_ids?.length > 0 && (
                          <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 font-mono">
                            {finding.cve_ids[0]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/40">
                        {finding.affected_host}
                        {finding.affected_port ? `:${finding.affected_port}` : ''} •
                        {finding.affected_service || 'unknown'} •
                        CVSS {finding.cvss_score}
                        {finding.exploitability && finding.exploitability !== 'none' && (
                          <> • <span className="text-orange-400">{finding.exploitability.replace('_', ' ')}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CvssBadge score={finding.cvss_score} />
                    <FindingStatusBadge status={finding.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Finding Detail Modal */}
      <Dialog open={!!selectedFinding} onOpenChange={() => setSelectedFinding(null)}>
        <DialogContent className="bg-[#0f0f14] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedFinding && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <SeverityIndicator severity={selectedFinding.severity} />
                  {selectedFinding.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <InfoBlock label="CVSS Score" value={selectedFinding.cvss_score.toString()} />
                  <InfoBlock label="Severity" value={selectedFinding.severity} />
                  <InfoBlock label="Exploitability" value={selectedFinding.exploitability || 'Unknown'} />
                  <InfoBlock label="Host" value={`${selectedFinding.affected_host}${selectedFinding.affected_port ? ':' + selectedFinding.affected_port : ''}`} />
                  <InfoBlock label="Service" value={selectedFinding.affected_service || 'N/A'} />
                  <InfoBlock label="Remediation Effort" value={selectedFinding.remediation_effort || 'N/A'} />
                </div>

                {selectedFinding.cve_ids?.length > 0 && (
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">CVE References</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedFinding.cve_ids.map((cve: string) => (
                        <a key={cve} href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noopener noreferrer">
                          <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 font-mono hover:bg-red-500/10 cursor-pointer">
                            {cve} <ExternalLink className="h-3 w-3 ml-1" />
                          </Badge>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedFinding.description && (
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Description</p>
                    <p className="text-sm text-white/70">{selectedFinding.description}</p>
                  </div>
                )}

                {selectedFinding.proof_of_concept && (
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Proof of Concept</p>
                    <pre className="text-xs text-green-400 bg-black/60 p-3 rounded-lg overflow-x-auto font-mono">
                      {selectedFinding.proof_of_concept}
                    </pre>
                  </div>
                )}

                {selectedFinding.remediation && (
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Remediation</p>
                    <p className="text-sm text-white/70">{selectedFinding.remediation}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {['open', 'confirmed', 'in_remediation', 'remediated', 'accepted_risk', 'false_positive'].map(s => (
                      <Button key={s} size="sm" variant={selectedFinding.status === s ? 'default' : 'outline'}
                        className={selectedFinding.status === s ? 'bg-blue-600' : 'border-white/10 text-white/50'}
                        onClick={() => handleStatusChange(selectedFinding.id, s)}>
                        {s.replace(/_/g, ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CvssBadge({ score }: { score: number }) {
  let color = 'bg-white/10 text-white/40';
  if (score >= 9) color = 'bg-red-500/20 text-red-400';
  else if (score >= 7) color = 'bg-orange-500/20 text-orange-400';
  else if (score >= 4) color = 'bg-yellow-500/20 text-yellow-400';
  else if (score > 0) color = 'bg-blue-500/20 text-blue-400';
  return <Badge className={`text-xs font-mono ${color}`}>{score.toFixed(1)}</Badge>;
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white font-medium capitalize">{value}</p>
    </div>
  );
}
