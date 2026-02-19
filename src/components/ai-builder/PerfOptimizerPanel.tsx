import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gauge, X, Play, Download } from 'lucide-react';
import type { PerfReport } from '@/hooks/useAIPerformanceOptimizer';

interface PerfOptimizerPanelProps {
  report: PerfReport | null;
  isAnalyzing: boolean;
  autoOptimize: boolean;
  onSetAutoOptimize: (v: boolean) => void;
  onAnalyze: () => void;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function PerfOptimizerPanel({
  report, isAnalyzing, autoOptimize, onSetAutoOptimize,
  onAnalyze, onGenerateCode, onInsertCode, onClose,
}: PerfOptimizerPanelProps) {
  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';
  const severityColor = (s: string) => s === 'critical' ? 'destructive' : s === 'high' ? 'destructive' : 'secondary';

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Performance Optimizer</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Auto-optimize</Label>
            <Switch checked={autoOptimize} onCheckedChange={onSetAutoOptimize} />
          </div>
          <Button size="sm" onClick={onAnalyze} className="w-full gap-1" disabled={isAnalyzing}>
            <Play className="w-3 h-3" /> {isAnalyzing ? 'Analyzing...' : 'Analyze Performance'}
          </Button>
          {report && (
            <>
              <div className="text-center py-3">
                <span className={`text-4xl font-bold ${scoreColor(report.score)}`}>{report.score}</span>
                <p className="text-xs text-muted-foreground mt-1">Performance Score</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/30 rounded p-2 text-center">
                  <span className="text-xs font-mono text-foreground">{(report.bundleSize / 1024).toFixed(0)}KB</span>
                  <p className="text-[10px] text-muted-foreground">Bundle</p>
                </div>
                <div className="bg-muted/30 rounded p-2 text-center">
                  <span className="text-xs font-mono text-foreground">{report.lcp.toFixed(0)}ms</span>
                  <p className="text-[10px] text-muted-foreground">LCP</p>
                </div>
                <div className="bg-muted/30 rounded p-2 text-center">
                  <span className="text-xs font-mono text-foreground">{report.cls.toFixed(3)}</span>
                  <p className="text-[10px] text-muted-foreground">CLS</p>
                </div>
                <div className="bg-muted/30 rounded p-2 text-center">
                  <span className="text-xs font-mono text-foreground">{report.fid.toFixed(0)}ms</span>
                  <p className="text-[10px] text-muted-foreground">FID</p>
                </div>
              </div>
              {report.issues.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Issues ({report.issues.length})</Label>
                  {report.issues.map(issue => (
                    <div key={issue.id} className="bg-muted/30 rounded p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">{issue.title}</span>
                        <Badge variant={severityColor(issue.severity) as any} className="text-[10px]">{issue.severity}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{issue.suggestion}</p>
                      {issue.filePath && <Badge variant="outline" className="text-[10px]">{issue.filePath}</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <Button size="sm" variant="outline" className="w-full text-xs gap-1" onClick={() => onInsertCode(onGenerateCode())}>
            <Download className="w-3 h-3" /> Export Monitoring Code
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
