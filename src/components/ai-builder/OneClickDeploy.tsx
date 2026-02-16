import { useState } from 'react';
import {
  Rocket, Globe, Loader2, ExternalLink, CheckCircle, Copy, X, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface OneClickDeployProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  files: ProjectFile[];
  vercelToken?: string;
  netlifyToken?: string;
  onTokenSave?: (provider: 'vercel' | 'netlify', token: string) => void;
}

type Provider = 'vercel' | 'netlify';
type DeployStatus = 'idle' | 'deploying' | 'success' | 'error';

interface DeployState {
  status: DeployStatus;
  url: string | null;
  error: string | null;
  step: number;
}

const DEPLOY_STEPS = ['Preparing files', 'Uploading bundle', 'Building project', 'Deploying to CDN'];

export function OneClickDeploy({
  open, onClose, projectName, files, vercelToken, netlifyToken, onTokenSave,
}: OneClickDeployProps) {
  const [provider, setProvider] = useState<Provider>('vercel');
  const [deploy, setDeploy] = useState<DeployState>({ status: 'idle', url: null, error: null, step: -1 });
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [projectSlug, setProjectSlug] = useState(
    projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
  );

  const activeToken = provider === 'vercel' ? vercelToken : netlifyToken;
  const needsToken = !activeToken;

  const handleSaveToken = () => {
    if (!tokenInput.trim()) return;
    onTokenSave?.(provider, tokenInput.trim());
    setTokenInput('');
    setShowTokenInput(false);
    toast.success(`${provider === 'vercel' ? 'Vercel' : 'Netlify'} token saved`);
  };

  const simulateSteps = (callback: () => Promise<void>) => {
    setDeploy({ status: 'deploying', url: null, error: null, step: 0 });
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < DEPLOY_STEPS.length) {
        setDeploy(prev => ({ ...prev, step: i }));
      } else {
        clearInterval(interval);
      }
    }, 1200);

    callback().then(() => {
      clearInterval(interval);
    }).catch(() => {
      clearInterval(interval);
    });
  };

  const handleDeployVercel = async () => {
    if (!vercelToken || files.length === 0) return;

    simulateSteps(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('vercel-deploy', {
          body: {
            projectName: projectSlug,
            files: files.map(f => ({ path: f.path, content: f.content })),
            vercelToken,
          },
        });

        if (error) throw error;

        if (data?.url) {
          setDeploy({ status: 'success', url: data.url, error: null, step: DEPLOY_STEPS.length });
          toast.success('Deployed to Vercel!');
        } else {
          setDeploy({ status: 'success', url: null, error: null, step: DEPLOY_STEPS.length });
          toast.success('Deployment initiated');
        }
      } catch (err: any) {
        setDeploy({ status: 'error', url: null, error: err.message || 'Deployment failed', step: -1 });
        toast.error(err.message || 'Deployment failed');
      }
    });
  };

  const handleDeployNetlify = async () => {
    if (!netlifyToken || files.length === 0) return;

    simulateSteps(async () => {
      try {
        // Netlify deploy via their API
        // Step 1: Create a site or deploy to existing
        const createRes = await fetch('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${netlifyToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: projectSlug }),
        });

        let siteId: string;
        if (createRes.ok) {
          const site = await createRes.json();
          siteId = site.id;
        } else if (createRes.status === 422) {
          // Site name taken, try to find existing
          const listRes = await fetch(`https://api.netlify.com/api/v1/sites?name=${projectSlug}`, {
            headers: { Authorization: `Bearer ${netlifyToken}` },
          });
          const sites = await listRes.json();
          const existing = sites.find?.((s: any) => s.name === projectSlug);
          if (existing) {
            siteId = existing.id;
          } else {
            throw new Error('Site name taken and not found in your account');
          }
        } else {
          throw new Error(`Netlify API error: ${createRes.status}`);
        }

        // Step 2: Create a deploy with file digests
        // For simplicity, we use the zip deploy approach
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const f of files) {
          zip.file(f.path, f.content);
        }
        // Add a basic index.html if not present
        if (!files.some(f => f.path === 'index.html')) {
          zip.file('index.html', '<html><body><h1>Deployed</h1></body></html>');
        }
        const blob = await zip.generateAsync({ type: 'blob' });

        const deployRes = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${netlifyToken}`,
            'Content-Type': 'application/zip',
          },
          body: blob,
        });

        if (!deployRes.ok) {
          const errText = await deployRes.text();
          throw new Error(`Deploy failed: ${errText}`);
        }

        const deployData = await deployRes.json();
        const url = deployData.ssl_url || deployData.url || `https://${projectSlug}.netlify.app`;

        setDeploy({ status: 'success', url, error: null, step: DEPLOY_STEPS.length });
        toast.success('Deployed to Netlify!');
      } catch (err: any) {
        setDeploy({ status: 'error', url: null, error: err.message || 'Deployment failed', step: -1 });
        toast.error(err.message || 'Deployment failed');
      }
    });
  };

  const handleDeploy = () => {
    if (provider === 'vercel') handleDeployVercel();
    else handleDeployNetlify();
  };

  const handleCopy = () => {
    if (!deploy.url) return;
    navigator.clipboard.writeText(deploy.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('URL copied');
  };

  if (!open) return null;

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Rocket className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-white/80">One-Click Deploy</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Provider selector */}
          <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <button
              onClick={() => { setProvider('vercel'); setDeploy({ status: 'idle', url: null, error: null, step: -1 }); }}
              className={cn("flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all", provider === 'vercel' ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/50")}
            >
              ▲ Vercel
            </button>
            <button
              onClick={() => { setProvider('netlify'); setDeploy({ status: 'idle', url: null, error: null, step: -1 }); }}
              className={cn("flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all", provider === 'netlify' ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/50")}
            >
              ◆ Netlify
            </button>
          </div>

          {/* Project slug */}
          <div>
            <label className="text-[10px] text-white/30 mb-1 block">Project name</label>
            <Input
              value={projectSlug}
              onChange={e => setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className="h-7 text-[11px] font-mono bg-white/5 border-white/[0.08] text-white/80"
              placeholder="my-app"
            />
            <p className="text-[9px] text-white/20 mt-1">
              {provider === 'vercel' ? `${projectSlug}.vercel.app` : `${projectSlug}.netlify.app`}
            </p>
          </div>

          {/* Token management */}
          {needsToken || showTokenInput ? (
            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.03]">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-3 w-3 text-amber-400" />
                <span className="text-[11px] text-amber-400 font-medium">
                  {provider === 'vercel' ? 'Vercel' : 'Netlify'} API token required
                </span>
              </div>
              <Input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder={`Paste your ${provider} token...`}
                className="h-7 text-[11px] bg-white/5 border-white/[0.08] text-white/80 mb-2"
                onKeyDown={e => e.key === 'Enter' && handleSaveToken()}
              />
              <div className="flex gap-1.5">
                <Button size="sm" onClick={handleSaveToken} disabled={!tokenInput.trim()} className="h-6 text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-0 flex-1">
                  Save Token
                </Button>
                {!needsToken && (
                  <Button size="sm" onClick={() => setShowTokenInput(false)} className="h-6 text-[10px] bg-white/5 text-white/40 hover:bg-white/10 border-0">
                    Cancel
                  </Button>
                )}
              </div>
              <p className="text-[9px] text-white/20 mt-1.5">
                {provider === 'vercel'
                  ? 'Get a token at vercel.com/account/tokens'
                  : 'Get a token at app.netlify.com/user/applications#personal-access-tokens'
                }
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowTokenInput(true)}
              className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
            >
              Update {provider} token
            </button>
          )}

          {/* Deploy progress */}
          {deploy.status === 'deploying' && (
            <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/[0.03] space-y-2">
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deploying to {provider === 'vercel' ? 'Vercel' : 'Netlify'}...
              </div>
              <div className="space-y-1">
                {DEPLOY_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <div className={cn(
                      "h-3.5 w-3.5 rounded-full shrink-0 flex items-center justify-center transition-all",
                      i < deploy.step ? "text-emerald-400" :
                      i === deploy.step ? "text-cyan-400" : "text-white/15"
                    )}>
                      {i < deploy.step ? <CheckCircle className="h-2.5 w-2.5" /> :
                       i === deploy.step ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> :
                       <span className="h-1 w-1 rounded-full bg-current" />}
                    </div>
                    <span className={cn(
                      i < deploy.step ? "text-emerald-400/60" :
                      i === deploy.step ? "text-white/70" : "text-white/20"
                    )}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success */}
          {deploy.status === 'success' && deploy.url && (
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03]">
              <p className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                Deployed successfully!
              </p>
              <div className="flex items-center gap-1.5 min-w-0">
                <code className="flex-1 text-[11px] text-cyan-400 font-mono bg-black/30 px-2 py-1.5 rounded truncate min-w-0 block">
                  {deploy.url}
                </code>
                <button onClick={handleCopy} className="h-6 w-6 shrink-0 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
                  {copied ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
                <a href={deploy.url} target="_blank" rel="noopener noreferrer" className="h-6 w-6 shrink-0 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Error */}
          {deploy.status === 'error' && deploy.error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/[0.03]">
              <p className="text-xs text-red-400 font-medium mb-1 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Deployment failed
              </p>
              <p className="text-[10px] text-red-400/60 font-mono">{deploy.error}</p>
            </div>
          )}

          {/* File count */}
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/30">Files to deploy</span>
              <span className="text-white/50 font-mono">{files.length}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1">
              <span className="text-white/30">Total size</span>
              <span className="text-white/50 font-mono">
                {(files.reduce((acc, f) => acc + (f.content?.length || 0), 0) / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Deploy button */}
      <div className="px-3 py-2 border-t border-white/[0.06] shrink-0">
        <Button
          onClick={handleDeploy}
          disabled={needsToken || files.length === 0 || deploy.status === 'deploying'}
          className="w-full h-8 text-xs bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0"
        >
          {deploy.status === 'deploying' ? (
            <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Deploying...</>
          ) : (
            <><Rocket className="h-3 w-3 mr-1.5" />Deploy to {provider === 'vercel' ? 'Vercel' : 'Netlify'}</>
          )}
        </Button>
      </div>
    </div>
  );
}
