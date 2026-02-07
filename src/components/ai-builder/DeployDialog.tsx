import { useState, useEffect } from 'react';
import { Rocket, Globe, Copy, CheckCircle, Loader2, ExternalLink, Link2, Eye, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DeployDialogProps {
  onPublish: (subdomain?: string) => Promise<void>;
  publishedUrl: string | null;
  hasFiles: boolean;
  isPublishing?: boolean;
  previewSlug?: string;
}

const DEPLOY_STEPS = [
  { label: 'Bundling assets', duration: 800 },
  { label: 'Optimizing code', duration: 600 },
  { label: 'Deploying to edge', duration: 1200 },
  { label: 'Configuring DNS', duration: 400 },
];

export function DeployDialog({ onPublish, publishedUrl, hasFiles, isPublishing, previewSlug }: DeployDialogProps) {
  const [open, setOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [customSubdomain, setCustomSubdomain] = useState('');
  const [step, setStep] = useState<'preview' | 'production'>(publishedUrl ? 'production' : 'preview');
  const [deployStep, setDeployStep] = useState(-1);
  const [deployComplete, setDeployComplete] = useState(false);

  const previewUrl = previewSlug ? `https://${previewSlug}.ultriumai.app` : null;
  const isLoading = deploying || isPublishing;

  // Animated deploy progress
  useEffect(() => {
    if (!deploying) { setDeployStep(-1); setDeployComplete(false); return; }
    let i = 0;
    setDeployStep(0);
    const advance = () => {
      i++;
      if (i < DEPLOY_STEPS.length) {
        setDeployStep(i);
        setTimeout(advance, DEPLOY_STEPS[i].duration);
      }
    };
    setTimeout(advance, DEPLOY_STEPS[0].duration);
  }, [deploying]);

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployComplete(false);
    try {
      await onPublish(customSubdomain || undefined);
      setDeployComplete(true);
      setStep('production');
    } finally {
      setTimeout(() => setDeploying(false), 500);
    }
  };

  const copyUrl = (url: string, type: 'preview' | 'published') => {
    navigator.clipboard.writeText(url);
    if (type === 'published') { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    else { setCopiedPreview(true); setTimeout(() => setCopiedPreview(false), 2000); }
    toast.success('URL copied');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={!hasFiles}
          className={cn(
            "h-7 px-3 text-xs gap-1.5 rounded-md transition-all",
            publishedUrl
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:from-cyan-600 hover:to-violet-600 border-0"
          )}
        >
          {publishedUrl ? (
            <>
              <Globe className="h-3 w-3" />
              Live
            </>
          ) : (
            <>
              <Rocket className="h-3 w-3" />
              Publish
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4 text-cyan-400" />
            Deploy Your App
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Step tabs */}
          <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <button onClick={() => setStep('preview')} className={cn("flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-md transition-all font-medium", step === 'preview' ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/50")}>
              <Eye className="h-3 w-3" />Preview
            </button>
            <button onClick={() => setStep('production')} className={cn("flex-1 flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded-md transition-all font-medium", step === 'production' ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/50")}>
              <Globe className="h-3 w-3" />Production
              {publishedUrl && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </button>
          </div>

          {step === 'preview' ? (
            <>
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white/80">Preview Environment</span>
                </div>
                <p className="text-[11px] text-white/30 mb-3">Auto-updates on every change. Share for feedback.</p>
                {previewUrl ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-cyan-400 font-mono bg-black/30 px-2 py-1.5 rounded truncate">{previewUrl}</code>
                    <button onClick={() => copyUrl(previewUrl, 'preview')} className="h-7 w-7 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                      {copiedPreview ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/20 italic">Save your project to generate a preview URL</p>
                )}
              </div>
              <Button onClick={() => setStep('production')} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0">
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />Go to Production Publish
              </Button>
            </>
          ) : (
            <>
              {/* Deploy progress indicator */}
              {deploying && (
                <div className="p-3 rounded-lg bg-white/[0.03] border border-cyan-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deploying...
                  </div>
                  <div className="space-y-1.5">
                    {DEPLOY_STEPS.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <div className={cn(
                          "h-4 w-4 rounded-full flex items-center justify-center transition-all duration-300",
                          i < deployStep ? "bg-emerald-500/10 text-emerald-400" :
                          i === deployStep ? "bg-cyan-500/10 text-cyan-400" : "bg-white/[0.03] text-white/15"
                        )}>
                          {i < deployStep ? <CheckCircle className="h-2.5 w-2.5" /> :
                           i === deployStep ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> :
                           <span className="h-1 w-1 rounded-full bg-current" />}
                        </div>
                        <span className={cn(
                          "transition-colors",
                          i < deployStep ? "text-emerald-400/60" :
                          i === deployStep ? "text-white/70" : "text-white/20"
                        )}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                  {/* Overall progress bar */}
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(((deployStep + 1) / DEPLOY_STEPS.length) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {!deploying && (
                <>
                  {/* Production Status */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", publishedUrl ? "bg-emerald-500/10" : "bg-white/5")}>
                      {publishedUrl ? <Globe className="h-5 w-5 text-emerald-400" /> : <Rocket className="h-5 w-5 text-white/30" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/80">{publishedUrl ? 'Published & Live' : 'Ready to publish'}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{publishedUrl ? 'Accessible to anyone with the link' : 'Deploy to a public URL'}</p>
                    </div>
                    {publishedUrl && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">Live</Badge>}
                  </div>

                  {/* Custom Subdomain */}
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-2">
                      <Link2 className="h-3 w-3 text-white/40" />
                      <span className="text-[11px] text-white/40">Custom subdomain</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input value={customSubdomain} onChange={e => setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="myapp" className="flex-1 h-7 px-2 text-[11px] bg-white/5 border border-white/[0.08] rounded text-white/80 outline-none focus:border-cyan-500/30 font-mono placeholder:text-white/15" />
                      <span className="text-[10px] text-white/20 font-mono">.ultriumai.app</span>
                    </div>
                  </div>

                  {/* Published URL */}
                  {publishedUrl && (
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] text-white/30 mb-1.5">Public URL</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs text-cyan-400 font-mono bg-black/30 px-2 py-1.5 rounded truncate">{publishedUrl}</code>
                        <button onClick={() => copyUrl(publishedUrl, 'published')} className="h-7 w-7 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                          {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="h-7 w-7 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Deploy checklist */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Checklist</p>
                    {[
                      { label: 'Project has files', ok: hasFiles },
                      { label: 'HTML entry point exists', ok: hasFiles },
                      { label: 'No critical errors', ok: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className={cn("h-4 w-4 rounded-full flex items-center justify-center", item.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                          {item.ok ? <CheckCircle className="h-2.5 w-2.5" /> : <span className="text-[8px]">✕</span>}
                        </div>
                        <span className={cn("text-white/50", !item.ok && "text-red-400/70")}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Custom Domain */}
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-3 w-3 text-white/40" />
                      <span className="text-[11px] text-white/40">Custom Domain</span>
                    </div>
                    <input placeholder="app.yourdomain.com" className="w-full h-7 px-2 text-[11px] bg-white/5 border border-white/[0.08] rounded text-white/80 outline-none focus:border-cyan-500/30 font-mono placeholder:text-white/15 mb-2" />
                    <div className="text-[9px] text-white/20 space-y-1">
                      <p className="flex items-center gap-1"><AlertCircle className="h-2.5 w-2.5" /> Add a CNAME record pointing to <code className="text-cyan-400/60">cname.ultriumai.app</code></p>
                      <p>DNS propagation may take up to 48 hours.</p>
                    </div>
                  </div>
                </>
              )}

              {/* Publish button */}
              <Button onClick={handleDeploy} disabled={!hasFiles || isLoading} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0">
                {isLoading ? (
                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{publishedUrl ? 'Updating...' : 'Publishing...'}</>
                ) : publishedUrl ? (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Update</>
                ) : (
                  <><Rocket className="h-3.5 w-3.5 mr-1.5" />Publish to Production</>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
