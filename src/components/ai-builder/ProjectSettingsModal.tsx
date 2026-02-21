/**
 * Consolidated Project Settings Modal — Tabbed settings dialog
 * Tabs: General, Domains, Integrations, Advanced
 */
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Settings, Globe, Puzzle, Shield, Trash2, Share2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ProjectSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onRename: (name: string) => void;
  publishedUrl?: string | null;
  supabaseConnected?: boolean;
  stripeConnected?: boolean;
  githubConnected?: boolean;
  hideBadge: boolean;
  onToggleHideBadge: (v: boolean) => void;
  soundEnabled: boolean;
  onToggleSound: (v: boolean) => void;
  onDeleteProject?: () => void;
}

type Tab = 'general' | 'domains' | 'integrations' | 'advanced';

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'domains', label: 'Domains', icon: Globe },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
  { id: 'advanced', label: 'Advanced', icon: Shield },
];

export function ProjectSettingsModal({
  open, onOpenChange, projectName, onRename, publishedUrl,
  supabaseConnected, stripeConnected, githubConnected,
  hideBadge, onToggleHideBadge, soundEnabled, onToggleSound,
  onDeleteProject,
}: ProjectSettingsModalProps) {
  const [tab, setTab] = useState<Tab>('general');
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState('');

  const handleSaveName = useCallback(() => {
    if (name.trim() && name !== projectName) {
      onRename(name.trim());
      toast.success('Project renamed');
    }
  }, [name, projectName, onRename]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] text-white max-w-lg p-0 gap-0" onCloseAutoFocus={() => { document.body.style.pointerEvents = ''; }}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-sm font-semibold text-white/90">Project Settings</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06] px-5 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors relative",
                tab === t.id ? "text-cyan-400" : "text-white/40 hover:text-white/60"
              )}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
              {tab === t.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 py-4 space-y-4 min-h-[250px]">
          {tab === 'general' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Project Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  className="bg-white/[0.04] border-white/[0.08] text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Description</label>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does this project do?"
                  className="bg-white/[0.04] border-white/[0.08] text-sm h-9"
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[12px] text-white/70">Build completion sound</div>
                  <div className="text-[10px] text-white/30">Play a chime when builds finish</div>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={onToggleSound} />
              </div>
            </>
          )}

          {tab === 'domains' && (
            <div className="space-y-3">
              {publishedUrl ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20">
                  <Globe className="h-4 w-4 text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-emerald-300 font-medium">Published</div>
                    <a href={publishedUrl} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-400/60 hover:text-emerald-400 truncate block">{publishedUrl}</a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-white/20 text-sm">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No custom domain configured</p>
                  <p className="text-[11px] text-white/15 mt-1">Publish your project first, then add a custom domain</p>
                </div>
              )}
            </div>
          )}

          {tab === 'integrations' && (
            <div className="space-y-2">
              {[
                { name: 'Supabase', desc: 'Database & Auth', connected: supabaseConnected, color: 'emerald' },
                { name: 'Stripe', desc: 'Payments', connected: stripeConnected, color: 'violet' },
                { name: 'GitHub', desc: 'Version Control', connected: githubConnected, color: 'white' },
              ].map(svc => (
                <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <div className="text-[12px] text-white/70 font-medium">{svc.name}</div>
                    <div className="text-[10px] text-white/30">{svc.desc}</div>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", svc.connected ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-white/30")}>
                    {svc.connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'advanced' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[12px] text-white/70 flex items-center gap-1.5">
                    {hideBadge ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    Hide "Powered by" badge
                  </div>
                  <div className="text-[10px] text-white/30">Remove branding from published preview</div>
                </div>
                <Switch checked={hideBadge} onCheckedChange={onToggleHideBadge} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[12px] text-white/70 flex items-center gap-1.5">
                    <Share2 className="h-3 w-3" />
                    Allow remixing
                  </div>
                  <div className="text-[10px] text-white/30">Let others fork your project</div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  onClick={() => {
                    if (onDeleteProject) {
                      if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
                        onDeleteProject();
                      }
                    }
                  }}
                  className="flex items-center gap-2 text-[12px] text-red-400/70 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete project
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
