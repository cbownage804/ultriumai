import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, X, Play, Download } from 'lucide-react';
import type { AuditReport } from '@/hooks/useAISecurityAuditor';

interface SecurityAuditorPanelProps {
  report: AuditReport | null;
  isScanning: boolean;
  onScan: () => void;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function SecurityAuditorPanel({
  report, isScanning, onScan, onGenerateCode, onInsertCode, onClose,
}: SecurityAuditorPanelProps) {
  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';
  const severityColor = (s: string) => {
    if (s === 'critical') return 'destructive';
    if (s === 'high') return 'destructive';
    return 'secondary';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Security Auditor</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <Button size="sm" onClick={onScan} className="w-full gap-1" disabled={isScanning}>
            <Play className="w-3 h-3" /> {isScanning ? 'Scanning...' : 'Run Security Audit'}
          </Button>
          {report && (
            <>
              <div className="text-center py-3">
                <span className={`text-4xl font-bold ${scoreColor(report.score)}`}>{report.score}</span>
                <p className="text-xs text-muted-foreground mt-1">Security Score</p>
                <p className="text-[10px] text-muted-foreground">{report.scannedFiles} files scanned</p>
              </div>
              {report.findings.length === 0 ? (
                <div className="text-center py-4">
                  <ShieldCheck className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No security issues found!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Findings ({report.findings.length})</Label>
                  {report.findings.map(f => (
                    <div key={f.id} className="bg-muted/30 rounded p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{f.title}</span>
                        <Badge variant={severityColor(f.severity) as any} className="text-[10px]">{f.severity}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{f.description}</p>
                      <p className="text-[10px] text-primary">{f.remediation}</p>
                      <div className="flex items-center gap-1">
                        {f.cwe && <Badge variant="outline" className="text-[10px]">{f.cwe}</Badge>}
                        <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
                        {f.autoFixable && <Badge variant="default" className="text-[10px]">Auto-fix</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => onInsertCode(onGenerateCode())}>
            <Download className="w-3 h-3" /> Export Security Middleware
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
