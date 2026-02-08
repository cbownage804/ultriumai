import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Rocket, Globe, CheckCircle, XCircle, Clock, Loader2,
  ExternalLink, Copy, Settings2, ChevronRight, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DeployStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  detail?: string;
}

interface DeployPipelinePanelProps {
  open: boolean;
  onClose: () => void;
  onDeploy: () => Promise<void>;
  publishedUrl: string | null;
  isDeploying: boolean;
  projectName: string;
  customDomain?: string;
  onOpenDomainPanel?: () => void;
}

export function DeployPipelinePanel({
  open, onClose, onDeploy, publishedUrl, isDeploying, projectName,
  customDomain, onOpenDomainPanel,
}: DeployPipelinePanelProps) {
  const [steps, setSteps] = useState<DeployStep[]>([]);
  const [deployHistory, setDeployHistory] = useState<{ id: string; timestamp: Date; status: 'success' | 'error'; url?: string; duration: number }[]>([]);

  // Simulate deploy pipeline steps
  useEffect(() => {
    if (!isDeploying) return;
    const pipeline: DeployStep[] = [
      { id: 'lint', label: 'Linting & validation', status: 'pending' },
      { id: 'bundle', label: 'Bundling assets', status: 'pending' },
      { id: 'optimize', label: 'Optimizing for production', status: 'pending' },
      { id: 'upload', label: 'Uploading to CDN', status: 'pending' },
      { id: 'dns', label: 'Configuring routes', status: 'pending' },
      { id: 'ssl', label: 'SSL verification', status: 'pending' },
    ];
    setSteps(pipeline);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= pipeline.length) {
        clearInterval(interval);
        setDeployHistory(prev => [{
          id: crypto.randomUUID(),
          timestamp: new Date(),
          status: 'success' as const,
          url: publishedUrl || undefined,
          duration: pipeline.length * 800,
        }, ...prev].slice(0, 10));
        return;
      }
      setSteps(prev => prev.map((s, i) => {
        if (i === idx) return { ...s, status: 'running' };
        if (i === idx - 1) return { ...s, status: 'success', duration: Math.floor(Math.random() * 400 + 200) };
        return s;
      }));
      idx++;
    }, 800);

    return () => clearInterval(interval);
  }, [isDeploying]);

  // Mark last step as success when deploying finishes
  useEffect(() => {
    if (!isDeploying && steps.length > 0 && steps.some(s => s.status === 'running')) {
      setSteps(prev => prev.map(s => s.status === 'running' || s.status === 'pending' ? { ...s, status: 'success', duration: Math.floor(Math.random() * 300 + 100) } : s));
    }
  }, [isDeploying]);

  if (!open) return null;

  const StepIcon = ({ status }: { status: DeployStep['status'] }) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
      case 'error': return <XCircle className="h-3.5 w-3.5 text-red-400" />;
      case 'running': return <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />;
      default: return <Clock className="h-3.5 w-3.5 text-white/15" />;
    }
  };

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-white/70">Deploy Pipeline</span>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white/50 text-xs">✕</button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Deploy button */}
          <button
            onClick={onDeploy}
            disabled={isDeploying}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all",
              isDeploying
                ? "bg-cyan-500/10 text-cyan-400/60 cursor-wait"
                : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:shadow-lg hover:shadow-cyan-500/20"
            )}
          >
            {isDeploying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
            {isDeploying ? 'Deploying...' : 'Deploy to Production'}
          </button>

          {/* Pipeline steps */}
          {steps.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Pipeline</span>
              <div className="space-y-0.5">
                {steps.map(step => (
                  <div key={step.id} className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors",
                    step.status === 'running' && "bg-cyan-500/5"
                  )}>
                    <StepIcon status={step.status} />
                    <span className={cn("flex-1", step.status === 'running' ? "text-white/70" : step.status === 'success' ? "text-white/50" : "text-white/25")}>
                      {step.label}
                    </span>
                    {step.duration && <span className="text-[9px] text-white/15 font-mono">{step.duration}ms</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Published URL */}
          {publishedUrl && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Live URL</span>
              <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2">
                <Globe className="h-3 w-3 text-emerald-400/60 shrink-0" />
                <span className="text-[11px] text-white/50 font-mono truncate flex-1">{publishedUrl}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(publishedUrl); toast.success('Copied!'); }}
                  className="text-white/20 hover:text-white/50"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <a href={publishedUrl} target="_blank" rel="noopener" className="text-white/20 hover:text-white/50">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Custom Domain */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Custom Domain</span>
            {customDomain ? (
              <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-2.5 py-2">
                <Shield className="h-3 w-3 text-emerald-400" />
                <span className="text-[11px] text-emerald-300/80 font-mono flex-1">{customDomain}</span>
                <CheckCircle className="h-3 w-3 text-emerald-400" />
              </div>
            ) : (
              <button
                onClick={onOpenDomainPanel}
                className="w-full flex items-center gap-2 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-lg px-2.5 py-2 text-[11px] text-white/30 hover:text-white/50 hover:border-white/[0.12] transition-colors"
              >
                <Globe className="h-3 w-3" />
                <span className="flex-1 text-left">Connect custom domain</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Deploy History */}
          {deployHistory.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">History</span>
              <div className="space-y-1">
                {deployHistory.map(d => (
                  <div key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white/[0.02] text-[10px]">
                    {d.status === 'success' ? <CheckCircle className="h-3 w-3 text-emerald-400/60" /> : <XCircle className="h-3 w-3 text-red-400/60" />}
                    <span className="text-white/30 flex-1">{d.timestamp.toLocaleTimeString()}</span>
                    <span className="text-white/15 font-mono">{(d.duration / 1000).toFixed(1)}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
