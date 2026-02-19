import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Rocket, Plus, Play, RotateCcw, ArrowRight, X } from 'lucide-react';
import type { CanaryDeployment, CanaryMetrics } from '@/hooks/useCanaryDeploy';

interface CanaryDeployPanelProps {
  deployments: CanaryDeployment[];
  metrics: CanaryMetrics[];
  activeDeploymentId: string | null;
  setActiveDeploymentId: (id: string | null) => void;
  getActiveDeployment: () => CanaryDeployment | null;
  createDeployment: (name: string, version: string) => CanaryDeployment;
  updateDeployment: (id: string, update: Partial<CanaryDeployment>) => void;
  startRollout: (id: string) => void;
  advanceCanary: (id: string) => void;
  rollback: (id: string) => void;
  shouldAutoRollback: (id: string) => boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-muted-foreground', rolling: 'bg-blue-500', monitoring: 'bg-yellow-500',
  completed: 'bg-green-500', 'rolled-back': 'bg-red-500',
};

export function CanaryDeployPanel({
  deployments, metrics, activeDeploymentId, setActiveDeploymentId, getActiveDeployment,
  createDeployment, updateDeployment, startRollout, advanceCanary, rollback, shouldAutoRollback, onClose,
}: CanaryDeployPanelProps) {
  const active = getActiveDeployment();

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Canary Deployment</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-3 border-b border-border">
        <Button size="sm" className="w-full" onClick={() => createDeployment('Release', 'v' + (deployments.length + 1) + '.0.0')}>
          <Plus className="w-3 h-3 mr-1" /> New Deployment
        </Button>
      </div>

      {!active && (
        <ScrollArea className="flex-1 p-3">
          {deployments.map(d => (
            <div key={d.id} className="border border-border rounded-lg p-2 mb-2 cursor-pointer hover:bg-muted" onClick={() => setActiveDeploymentId(d.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusColors[d.status]}`} />
                  <span className="text-sm font-medium">{d.name}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>{d.currentVersion} → {d.canaryVersion}</span>
                <span>{d.canaryPercentage}% canary</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${d.canaryPercentage}%` }} />
              </div>
            </div>
          ))}
          {deployments.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No deployments yet.</p>}
        </ScrollArea>
      )}

      {active && (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveDeploymentId(null)}>← Back</Button>

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${statusColors[active.status]}`} />
              <span className="font-medium">{active.name}</span>
              <Badge variant="outline" className="text-[10px]">{active.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Current</Label><Input value={active.currentVersion} className="h-7 text-xs" readOnly /></div>
              <div><Label className="text-xs">Canary</Label><Input value={active.canaryVersion} onChange={e => updateDeployment(active.id, { canaryVersion: e.target.value })} className="h-7 text-xs" /></div>
            </div>

            <div>
              <Label className="text-xs">Canary Traffic: {active.canaryPercentage}%</Label>
              <div className="w-full bg-muted rounded-full h-3 mt-1">
                <div className="bg-primary rounded-full h-3 transition-all flex items-center justify-center" style={{ width: `${Math.max(active.canaryPercentage, 5)}%` }}>
                  <span className="text-[8px] text-primary-foreground font-medium">{active.canaryPercentage}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Step Increment</Label>
                <Slider value={[active.stepIncrement]} onValueChange={([v]) => updateDeployment(active.id, { stepIncrement: v })} min={5} max={50} step={5} />
                <span className="text-[10px] text-muted-foreground">{active.stepIncrement}%</span>
              </div>
              <div><Label className="text-xs">Error Threshold</Label>
                <Slider value={[active.errorRateThreshold]} onValueChange={([v]) => updateDeployment(active.id, { errorRateThreshold: v })} min={1} max={20} step={1} />
                <span className="text-[10px] text-muted-foreground">{active.errorRateThreshold}%</span>
              </div>
            </div>

            {metrics.length > 0 && (
              <div className="border border-border rounded-lg p-2">
                <Label className="text-xs font-semibold">Latest Metrics</Label>
                <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                  <div><span className="text-muted-foreground">Canary Errors:</span> <span className={metrics[metrics.length - 1].canaryErrorRate > active.errorRateThreshold ? 'text-red-400' : 'text-green-400'}>{metrics[metrics.length - 1].canaryErrorRate.toFixed(1)}%</span></div>
                  <div><span className="text-muted-foreground">Stable Errors:</span> {metrics[metrics.length - 1].stableErrorRate.toFixed(1)}%</div>
                  <div><span className="text-muted-foreground">Canary Latency:</span> {Math.round(metrics[metrics.length - 1].canaryLatencyMs)}ms</div>
                  <div><span className="text-muted-foreground">Stable Latency:</span> {Math.round(metrics[metrics.length - 1].stableLatencyMs)}ms</div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {active.status === 'pending' && (
                <Button size="sm" className="flex-1 text-xs" onClick={() => startRollout(active.id)}>
                  <Play className="w-3 h-3 mr-1" /> Start Rollout
                </Button>
              )}
              {active.status === 'rolling' && (
                <>
                  <Button size="sm" className="flex-1 text-xs" onClick={() => advanceCanary(active.id)}>
                    <ArrowRight className="w-3 h-3 mr-1" /> Advance
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => rollback(active.id)}>
                    <RotateCcw className="w-3 h-3 mr-1" /> Rollback
                  </Button>
                </>
              )}
            </div>

            {shouldAutoRollback(active.id) && active.status === 'rolling' && (
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                ⚠️ Error rate exceeds threshold. Auto-rollback recommended.
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
