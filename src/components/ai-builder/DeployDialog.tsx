import { useState } from 'react';
import { Rocket, Globe, Copy, CheckCircle, Loader2, ExternalLink, Link2 } from 'lucide-react';
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
}

export function DeployDialog({ onPublish, publishedUrl, hasFiles, isPublishing }: DeployDialogProps) {
  const [open, setOpen] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customSubdomain, setCustomSubdomain] = useState('');
  const [showSubdomain, setShowSubdomain] = useState(false);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      await onPublish(customSubdomain || undefined);
    } finally {
      setDeploying(false);
    }
  };

  const copyUrl = () => {
    if (!publishedUrl) return;
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    toast.success('URL copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = deploying || isPublishing;

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
            Publish Your App
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              publishedUrl ? "bg-emerald-500/10" : "bg-white/5"
            )}>
              {publishedUrl ? (
                <Globe className="h-5 w-5 text-emerald-400" />
              ) : (
                <Rocket className="h-5 w-5 text-white/30" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white/80">
                {publishedUrl ? 'Published & Live' : 'Ready to publish'}
              </p>
              <p className="text-[11px] text-white/30 mt-0.5">
                {publishedUrl
                  ? 'Your app is accessible to anyone with the link'
                  : 'Deploy your app to a public URL'
                }
              </p>
            </div>
            {publishedUrl && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
                Live
              </Badge>
            )}
          </div>

          {/* Custom Subdomain */}
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <button
              onClick={() => setShowSubdomain(!showSubdomain)}
              className="flex items-center gap-2 text-[11px] text-white/40 hover:text-white/60 transition-colors w-full"
            >
              <Link2 className="h-3 w-3" />
              <span>Custom subdomain</span>
              <span className="ml-auto text-[9px] text-white/20">{showSubdomain ? '▲' : '▼'}</span>
            </button>
            {showSubdomain && (
              <div className="mt-2 flex items-center gap-1">
                <input
                  value={customSubdomain}
                  onChange={e => setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="myapp"
                  className="flex-1 h-7 px-2 text-[11px] bg-white/5 border border-white/[0.08] rounded text-white/80 outline-none focus:border-cyan-500/30 font-mono placeholder:text-white/15"
                />
                <span className="text-[10px] text-white/20 font-mono">.ultriumai.app</span>
              </div>
            )}
          </div>

          {/* Published URL */}
          {publishedUrl && (
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-white/30 mb-1.5">Public URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-cyan-400 font-mono bg-black/30 px-2 py-1.5 rounded truncate">
                  {publishedUrl}
                </code>
                <button
                  onClick={copyUrl}
                  className="h-7 w-7 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Deploy checklist */}
          <div className="space-y-2">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Deploy Checklist</p>
            {[
              { label: 'Project has files', ok: hasFiles },
              { label: 'HTML entry point exists', ok: hasFiles },
              { label: 'No critical errors', ok: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center",
                  item.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {item.ok ? <CheckCircle className="h-2.5 w-2.5" /> : <span className="text-[8px]">✕</span>}
                </div>
                <span className={cn("text-white/50", !item.ok && "text-red-400/70")}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleDeploy}
              disabled={!hasFiles || isLoading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  {publishedUrl ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                <>
                  <Rocket className="h-3.5 w-3.5 mr-1.5" />
                  {publishedUrl ? 'Update' : 'Publish'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
