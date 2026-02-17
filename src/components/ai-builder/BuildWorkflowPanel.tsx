import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Hammer, Play, Loader2, CheckCircle2, XCircle, Download, ExternalLink,
  Settings, Package, FileCode, Github, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BuildWorkflowPanelProps {
  open: boolean;
  onClose: () => void;
  githubToken?: string;
  githubRepo?: string;
}

interface WorkflowRun {
  id: number;
  name: string;
  status: 'completed' | 'in_progress' | 'queued' | 'failure' | 'cancelled';
  conclusion: string | null;
  created_at: string;
  html_url: string;
  head_branch: string;
}

interface Artifact {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  created_at: string;
  expired: boolean;
}

export function BuildWorkflowPanel({ open, onClose, githubToken, githubRepo }: BuildWorkflowPanelProps) {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [loadingArtifacts, setLoadingArtifacts] = useState(false);
  const [triggeringWorkflow, setTriggeringWorkflow] = useState(false);
  const [workflowFile, setWorkflowFile] = useState('build-msi.yml');
  const [workflowRef, setWorkflowRef] = useState('main');
  const [workflowInputs, setWorkflowInputs] = useState('{}');

  const headers: Record<string, string> = githubToken ? {
    Authorization: `Bearer ${githubToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  } : {};

  const fetchRuns = async () => {
    if (!githubToken || !githubRepo) { toast.error('Connect GitHub first'); return; }
    setLoadingRuns(true);
    try {
      const resp = await fetch(`https://api.github.com/repos/${githubRepo}/actions/runs?per_page=20`, { headers });
      if (resp.ok) {
        const data = await resp.json();
        setRuns(data.workflow_runs || []);
      } else toast.error('Failed to fetch workflow runs');
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingRuns(false); }
  };

  const fetchArtifacts = async () => {
    if (!githubToken || !githubRepo) return;
    setLoadingArtifacts(true);
    try {
      const resp = await fetch(`https://api.github.com/repos/${githubRepo}/actions/artifacts?per_page=30`, { headers });
      if (resp.ok) {
        const data = await resp.json();
        setArtifacts((data.artifacts || []).filter((a: Artifact) => !a.expired));
      }
    } catch {}
    finally { setLoadingArtifacts(false); }
  };

  const triggerWorkflow = async () => {
    if (!githubToken || !githubRepo) { toast.error('Connect GitHub first'); return; }
    setTriggeringWorkflow(true);
    try {
      let inputs = {};
      try { inputs = JSON.parse(workflowInputs); } catch { inputs = {}; }

      const resp = await fetch(
        `https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowFile}/dispatches`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref: workflowRef, inputs }),
        }
      );

      if (resp.ok || resp.status === 204) {
        toast.success('Workflow dispatched! Refresh to see status.');
        setTimeout(fetchRuns, 3000);
      } else {
        const err = await resp.json();
        toast.error(err.message || 'Failed to trigger workflow');
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setTriggeringWorkflow(false); }
  };

  const downloadArtifact = async (artifact: Artifact) => {
    if (!githubToken) return;
    try {
      const resp = await fetch(artifact.archive_download_url, { headers, redirect: 'follow' });
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${artifact.name}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${artifact.name}`);
      } else toast.error('Download failed');
    } catch (e: any) { toast.error(e.message); }
  };

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isReady = !!githubToken && !!githubRepo;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 bg-[#0c0c14] border-white/10 shadow-2xl gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-white/[0.06]">
          <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Hammer className="h-4.5 w-4.5 text-orange-400" />
            Build Workflows
            {!isReady && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
                Connect GitHub first
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          {/* Trigger section */}
          <div className="px-5 py-4 border-b border-white/[0.06] space-y-3">
            <div className="text-xs text-white/40 font-medium">Trigger Workflow</div>
            <div className="flex items-center gap-2">
              <Input value={workflowFile} onChange={e => setWorkflowFile(e.target.value)} placeholder="workflow-file.yml" className="bg-white/5 border-white/10 text-white text-xs font-mono flex-1" />
              <Input value={workflowRef} onChange={e => setWorkflowRef(e.target.value)} placeholder="main" className="bg-white/5 border-white/10 text-white text-xs font-mono w-28" />
              <Button onClick={triggerWorkflow} disabled={triggeringWorkflow || !isReady} className="bg-orange-600 hover:bg-orange-500 text-white text-xs gap-1.5">
                {triggeringWorkflow ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                Dispatch
              </Button>
            </div>
            <Textarea value={workflowInputs} onChange={e => setWorkflowInputs(e.target.value)} placeholder='{"version": "1.0.0"}' className="bg-white/[0.03] border-white/[0.06] text-white text-xs font-mono min-h-[50px] resize-none" />
          </div>

          {/* Runs & Artifacts */}
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-4">
              {/* Runs */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40 font-medium">Workflow Runs</span>
                <Button variant="ghost" size="sm" onClick={fetchRuns} disabled={loadingRuns || !isReady} className="text-xs text-white/30 gap-1">
                  <RefreshCw className={cn("h-3 w-3", loadingRuns && "animate-spin")} /> Refresh
                </Button>
              </div>
              {runs.length === 0 ? (
                <div className="text-center py-4 text-white/15 text-xs">
                  {isReady ? 'Click Refresh to load runs' : 'Connect GitHub and select a repo first'}
                </div>
              ) : (
                <div className="space-y-1">
                  {runs.map(run => (
                    <div key={run.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.06] hover:bg-white/[0.02]">
                      {run.status === 'completed' && run.conclusion === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                      {run.status === 'completed' && run.conclusion !== 'success' && <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                      {run.status === 'in_progress' && <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin shrink-0" />}
                      {run.status === 'queued' && <RefreshCw className="h-3.5 w-3.5 text-white/20 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/70 truncate">{run.name}</div>
                        <div className="text-[10px] text-white/25">{run.head_branch} · {new Date(run.created_at).toLocaleString()}</div>
                      </div>
                      <Badge className={cn("text-[9px] px-1.5 py-0",
                        run.conclusion === 'success' ? "bg-emerald-500/20 text-emerald-400" :
                        run.conclusion === 'failure' ? "bg-red-500/20 text-red-400" :
                        "bg-white/5 text-white/30"
                      )}>{run.conclusion || run.status}</Badge>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/20" onClick={() => window.open(run.html_url, '_blank')}>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Artifacts */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <span className="text-xs text-white/40 font-medium">Build Artifacts (EXE/MSI)</span>
                <Button variant="ghost" size="sm" onClick={fetchArtifacts} disabled={loadingArtifacts || !isReady} className="text-xs text-white/30 gap-1">
                  <RefreshCw className={cn("h-3 w-3", loadingArtifacts && "animate-spin")} /> Refresh
                </Button>
              </div>
              {artifacts.length === 0 ? (
                <div className="text-center py-4 text-white/15 text-xs">
                  {isReady ? 'Click Refresh to load artifacts' : 'No artifacts yet'}
                </div>
              ) : (
                <div className="space-y-1">
                  {artifacts.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.06] hover:bg-white/[0.02]">
                      <Package className="h-3.5 w-3.5 text-orange-400/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/70 font-mono truncate">{a.name}</div>
                        <div className="text-[10px] text-white/25">{formatBytes(a.size_in_bytes)} · {new Date(a.created_at).toLocaleDateString()}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => downloadArtifact(a)} className="text-xs text-white/30 hover:text-orange-400 h-6 gap-1">
                        <Download className="h-3 w-3" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
