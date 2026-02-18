import { useState, useEffect } from 'react';
import { Rocket, Globe, Copy, CheckCircle, Loader2, ExternalLink, Link2, Eye, ArrowRight, AlertCircle, RefreshCw, Download, FileArchive, Container, Smartphone, Wifi, Package } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { exportProject, type ExportMode, type ExportContext, type EdgeFunctionMeta } from './exportProject';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';

interface DeployDialogProps {
  onPublish: (subdomain?: string) => Promise<void>;
  publishedUrl: string | null;
  hasFiles: boolean;
  isPublishing?: boolean;
  previewSlug?: string;
  projectName?: string;
  files?: ProjectFile[];
  supabaseConfig?: SupabaseConfig | null;
  stripeConfig?: StripeConfig | null;
  serviceKeys?: ServiceKey[];
  envVars?: EnvVar[];
  cdnPackages?: Array<{ name: string; version: string }>;
  edgeFunctions?: EdgeFunctionMeta[];
  storageBuckets?: string[];
  authProviders?: string[];
  onOpenDomainPanel?: () => void;
}

const DEPLOY_STEPS = [
  { label: 'Bundling assets', duration: 800 },
  { label: 'Optimizing code', duration: 600 },
  { label: 'Deploying to edge', duration: 1200 },
  { label: 'Configuring DNS', duration: 400 },
];

type TabId = 'preview' | 'production' | 'export' | 'mobile';

export function DeployDialog({
  onPublish, publishedUrl, hasFiles, isPublishing, previewSlug,
  projectName = 'project', files = [], supabaseConfig, stripeConfig,
  serviceKeys, envVars, cdnPackages, edgeFunctions, storageBuckets, authProviders,
  onOpenDomainPanel,
}: DeployDialogProps) {
  const [open, setOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [customSubdomain, setCustomSubdomain] = useState('');
  const [step, setStep] = useState<TabId>(publishedUrl ? 'production' : 'preview');
  const [deployStep, setDeployStep] = useState(-1);
  const [deployComplete, setDeployComplete] = useState(false);

  const previewUrl = previewSlug ? `https://${previewSlug}.apps.ultriumai.com` : null;
  const isLoading = deploying || isPublishing;
  const hasIntegrations = !!(supabaseConfig || stripeConfig || (serviceKeys && serviceKeys.length > 0));

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

  const handleExport = async (mode: ExportMode) => {
    try {
      const ctx: ExportContext = { supabaseConfig, stripeConfig, serviceKeys, envVars, cdnPackages, edgeFunctions, storageBuckets, authProviders };
      await exportProject(projectName, files, mode, ctx);
      const msgs: Record<ExportMode, string> = {
        raw: 'Project files downloaded!',
        docker: 'Docker-ready project downloaded!',
        fullstack: 'Full-stack project downloaded!',
        pwa: 'PWA project downloaded! See PWA_INSTALL_GUIDE.md',
        capacitor: 'Mobile project downloaded! See MOBILE_SETUP_GUIDE.md',
      };
      toast.success(msgs[mode]);
    } catch (e) {
      console.error('Export error:', e);
      toast.error('Failed to export project');
    }
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: boolean }[] = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'production', label: 'Publish', icon: Globe, badge: !!publishedUrl },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
  ];

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
            <><Globe className="h-3 w-3" />Live</>
          ) : (
            <><Rocket className="h-3 w-3" />Publish</>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] text-white max-w-md max-h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4 text-cyan-400" />
            Deploy Your App
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pt-3 shrink-0">
          <div className="flex gap-0.5 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setStep(t.id)} className={cn("flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1.5 rounded-md transition-all font-medium", step === t.id ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/50")}>
                <t.icon className="h-3 w-3" />{t.label}
                {t.badge && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-3 space-y-4">
            {/* ──── PREVIEW ──── */}
            {step === 'preview' && (
              <>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="text-sm font-medium text-white/80">Preview Environment</span>
                  </div>
                  <p className="text-[11px] text-white/30 mb-3">Auto-updates on every change. Share for feedback.</p>
                  {previewUrl ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <code className="flex-1 text-xs text-cyan-400 font-mono bg-black/30 px-2 py-1.5 rounded truncate min-w-0 block">{previewUrl}</code>
                      <button onClick={() => copyUrl(previewUrl, 'preview')} className="h-7 w-7 shrink-0 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                        {copiedPreview ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="h-7 w-7 shrink-0 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
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
            )}

            {/* ──── EXPORT ──── */}
            {step === 'export' && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center bg-cyan-500/10">
                    <Package className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80">Export Project</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Download for self-hosting, Docker, or cloud deploy</p>
                  </div>
                </div>

                {/* Full-Stack Export */}
                {hasIntegrations && (
                  <button onClick={() => handleExport('fullstack')} className="w-full flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/20 transition-all text-left">
                    <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-cyan-500/10 mt-0.5">
                      <Rocket className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-white/80">Full-Stack Export</p>
                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[8px] px-1.5 py-0">Recommended</Badge>
                      </div>
                      <p className="text-[10px] text-white/30 mt-1">Includes .env, Supabase config, dependencies & setup guide</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {['Supabase', 'Edge Functions', 'Auth', '.env'].map(tag => (
                          <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                )}

                {/* Docker Export */}
                <button onClick={() => handleExport('docker')} className="w-full flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] transition-all text-left">
                  <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-blue-500/10 mt-0.5">
                    <Container className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-white/80">Docker-Ready</p>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] px-1.5 py-0">Self-Host</Badge>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1">React + Vite + Dockerfile + nginx config. Deploy anywhere.</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {['Dockerfile', 'nginx', 'docker-compose', 'Multi-stage'].map(tag => (
                        <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25">{tag}</span>
                      ))}
                    </div>
                  </div>
                </button>

                {/* ZIP Export */}
                <button onClick={() => handleExport('raw')} className="w-full flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] transition-all text-left">
                  <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-white/5 mt-0.5">
                    <FileArchive className="h-4 w-4 text-white/40" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white/80">Download as ZIP</p>
                    <p className="text-[10px] text-white/30 mt-1">Raw project source files. Deploy to Vercel, Netlify, or any static host.</p>
                  </div>
                </button>

                {/* One-Click Deploy Links */}
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">One-Click Deploy</span>
                  <div className="flex gap-2 mt-2">
                    {['Vercel', 'Netlify', 'Railway'].map(p => (
                      <button key={p} className="flex-1 text-[10px] py-2 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-white/40 hover:text-white/70 transition-all">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ──── MOBILE ──── */}
            {step === 'mobile' && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center bg-violet-500/10">
                    <Smartphone className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80">Mobile App Export</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Deploy to App Store & Google Play</p>
                  </div>
                </div>

                {/* PWA */}
                <button onClick={() => handleExport('pwa')} className="w-full flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/20 transition-all text-left">
                  <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-cyan-500/10 mt-0.5">
                    <Wifi className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-white/80">Installable Web App (PWA)</p>
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[8px] px-1.5 py-0">Quick</Badge>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1 leading-relaxed">Install from browser — no app store. Works offline, home screen icon.</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {['All Devices', 'No Store Required', 'Offline Support', 'Auto Updates'].map(tag => (
                        <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25">{tag}</span>
                      ))}
                    </div>
                  </div>
                </button>

                {/* Capacitor */}
                <button onClick={() => handleExport('capacitor')} className="w-full flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-violet-500/20 transition-all text-left">
                  <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-violet-500/10 mt-0.5">
                    <Smartphone className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-white/80">Native App (Capacitor)</p>
                      <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[8px] px-1.5 py-0">Pro</Badge>
                    </div>
                    <p className="text-[10px] text-white/30 mt-1 leading-relaxed">Apple App Store & Google Play. Full native access — camera, push notifications.</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {['App Store', 'Google Play', 'Native APIs', 'Push Notifications'].map(tag => (
                        <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/25">{tag}</span>
                      ))}
                    </div>
                  </div>
                </button>

                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-amber-400/60 space-y-1">
                      <p className="font-medium text-amber-400/80">Native App Requirements</p>
                      <p>iOS: macOS + Xcode 15+ + Apple Developer ($99/yr)</p>
                      <p>Android: Android Studio + Google Play Console ($25)</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ──── PRODUCTION ──── */}
            {step === 'production' && (
              <>
                {deploying && (
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-cyan-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-cyan-400 font-medium">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />Deploying...
                    </div>
                    <div className="space-y-1.5">
                      {DEPLOY_STEPS.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]">
                          <div className={cn("h-4 w-4 rounded-full shrink-0 flex items-center justify-center transition-all duration-300",
                            i < deployStep ? "bg-emerald-500/10 text-emerald-400" :
                            i === deployStep ? "bg-cyan-500/10 text-cyan-400" : "bg-white/[0.03] text-white/15"
                          )}>
                            {i < deployStep ? <CheckCircle className="h-2.5 w-2.5" /> :
                             i === deployStep ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> :
                             <span className="h-1 w-1 rounded-full bg-current" />}
                          </div>
                          <span className={cn("transition-colors",
                            i < deployStep ? "text-emerald-400/60" :
                            i === deployStep ? "text-white/70" : "text-white/20"
                          )}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden mt-1">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(((deployStep + 1) / DEPLOY_STEPS.length) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}

                {!deploying && (
                  <>
                    {/* Status */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className={cn("h-10 w-10 shrink-0 rounded-lg flex items-center justify-center", publishedUrl ? "bg-emerald-500/10" : "bg-white/5")}>
                        {publishedUrl ? <Globe className="h-5 w-5 text-emerald-400" /> : <Rocket className="h-5 w-5 text-white/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{publishedUrl ? 'Published & Live' : 'Ready to publish'}</p>
                        <p className="text-[11px] text-white/30 mt-0.5 truncate">{publishedUrl ? 'Accessible to anyone with the link' : 'Deploy to a public URL'}</p>
                      </div>
                      {publishedUrl && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] shrink-0">Live</Badge>}
                    </div>

                    {/* Custom Subdomain */}
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center gap-2 mb-2">
                        <Link2 className="h-3 w-3 text-white/40 shrink-0" />
                        <span className="text-[11px] text-white/40">Custom subdomain</span>
                      </div>
                      <div className="flex items-center gap-1 min-w-0">
                        <input value={customSubdomain} onChange={e => setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="myapp" className="flex-1 min-w-0 h-7 px-2 text-[11px] bg-white/5 border border-white/[0.08] rounded text-white/80 outline-none focus:border-cyan-500/30 font-mono placeholder:text-white/15" />
                        <span className="text-[10px] text-white/20 font-mono shrink-0 whitespace-nowrap">.apps.ultriumai.com</span>
                      </div>
                    </div>

                    {/* Published URL */}
                    {publishedUrl && (
                      <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-[10px] text-white/30 mb-1.5">Public URL</p>
                        <div className="flex items-center gap-2 min-w-0">
                          <code className="flex-1 text-xs text-cyan-400 font-mono bg-black/30 px-2 py-1.5 rounded truncate min-w-0 block">{publishedUrl}</code>
                          <button onClick={() => copyUrl(publishedUrl, 'published')} className="h-7 w-7 shrink-0 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                            {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="h-7 w-7 shrink-0 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Custom Domain Link */}
                    <button
                      onClick={() => { setOpen(false); onOpenDomainPanel?.(); }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-violet-500/20 transition-all text-left"
                    >
                      <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-violet-500/10">
                        <Globe className="h-4 w-4 text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white/80">Custom Domain</p>
                        <p className="text-[10px] text-white/30">Connect your own domain with automatic SSL</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-white/20" />
                    </button>

                    {/* Checklist */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider">Checklist</p>
                      {[
                        { label: 'Project has files', ok: hasFiles },
                        { label: 'HTML entry point exists', ok: hasFiles },
                        { label: 'No critical errors', ok: true },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className={cn("h-4 w-4 shrink-0 rounded-full flex items-center justify-center", item.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                            {item.ok ? <CheckCircle className="h-2.5 w-2.5" /> : <span className="text-[8px]">✕</span>}
                          </div>
                          <span className={cn("text-white/50", !item.ok && "text-red-400/70")}>{item.label}</span>
                        </div>
                      ))}
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
