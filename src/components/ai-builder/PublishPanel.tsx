import { useState, useCallback } from 'react';
import { X, Globe, Rocket, Check, Copy, ExternalLink, Loader2, RefreshCw, Trash2, Plus, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CustomDomain {
  id: string;
  domain: string;
  status: 'verifying' | 'active' | 'failed' | 'pending';
  isPrimary: boolean;
  addedAt: Date;
  sslStatus: 'provisioning' | 'active' | 'failed';
}

interface DeployHistory {
  id: string;
  version: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'building';
  url?: string;
  fileCount: number;
  duration?: number;
}

interface PublishPanelProps {
  open: boolean;
  onClose: () => void;
  publishedUrl: string | null;
  previewUrl: string | null;
  projectName: string;
  hasFiles: boolean;
  onPublish: () => Promise<void>;
  onUnpublish?: () => void;
}

export function PublishPanel({ open, onClose, publishedUrl, previewUrl, projectName, hasFiles, onPublish, onUnpublish }: PublishPanelProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [deployHistory, setDeployHistory] = useState<DeployHistory[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [activeSection, setActiveSection] = useState<'deploy' | 'domains' | 'history'>('deploy');

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      setDeployHistory(prev => [{
        id: crypto.randomUUID(),
        version: `v${prev.length + 1}`,
        timestamp: new Date(),
        status: 'success' as const,
        url: publishedUrl || undefined,
        fileCount: 0,
      }, ...prev].slice(0, 50));
    } catch (e) {
      setDeployHistory(prev => [{
        id: crypto.randomUUID(),
        version: `v${prev.length + 1}`,
        timestamp: new Date(),
        status: 'failed' as const,
        fileCount: 0,
      }, ...prev].slice(0, 50));
    }
    setIsPublishing(false);
  }, [onPublish, publishedUrl]);

  const addDomain = useCallback(() => {
    const d = newDomain.trim().toLowerCase();
    if (!d || customDomains.some(cd => cd.domain === d)) return;
    setCustomDomains(prev => [...prev, {
      id: crypto.randomUUID(),
      domain: d,
      status: 'verifying',
      isPrimary: prev.length === 0,
      addedAt: new Date(),
      sslStatus: 'provisioning',
    }]);
    setNewDomain('');
    setShowAddDomain(false);
    toast.success(`Domain ${d} added — configure DNS to complete setup`);
  }, [newDomain, customDomains]);

  const removeDomain = useCallback((id: string) => {
    setCustomDomains(prev => prev.filter(d => d.id !== id));
    toast.success('Domain removed');
  }, []);

  const setPrimary = useCallback((id: string) => {
    setCustomDomains(prev => prev.map(d => ({ ...d, isPrimary: d.id === id })));
    toast.success('Primary domain updated');
  }, []);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard');
  };

  const statusBadge = (status: CustomDomain['status']) => {
    const map: Record<string, { label: string; color: string }> = {
      active: { label: 'Active', color: 'bg-emerald-500/20 text-emerald-400' },
      verifying: { label: 'Verifying', color: 'bg-amber-500/20 text-amber-400' },
      pending: { label: 'Pending', color: 'bg-blue-500/20 text-blue-400' },
      failed: { label: 'Failed', color: 'bg-red-500/20 text-red-400' },
    };
    const s = map[status] || map.pending;
    return <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", s.color)}>{s.label}</span>;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[560px] max-h-[85vh] bg-[#0d0d14] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
              <Rocket className="h-4.5 w-4.5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/90">Publish & Deploy</h2>
              <p className="text-[11px] text-white/35">{projectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex border-b border-white/[0.06] shrink-0">
          {(['deploy', 'domains', 'history'] as const).map(section => (
            <button key={section} onClick={() => setActiveSection(section)} className={cn("flex-1 py-2.5 text-[11px] font-medium transition-colors border-b-2 capitalize", activeSection === section ? 'text-white/80 border-cyan-500' : 'text-white/35 border-transparent hover:text-white/55')}>
              {section === 'deploy' ? '🚀 Deploy' : section === 'domains' ? '🌐 Domains' : '📋 History'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Deploy Section */}
          {activeSection === 'deploy' && (
            <div className="p-5 space-y-4">
              {/* Current status */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-white/60">Production Status</span>
                  {publishedUrl ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/40 font-medium">Not published</span>
                  )}
                </div>

                {publishedUrl && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-white/[0.03]">
                    <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="text-[11px] text-white/60 font-mono truncate flex-1">{publishedUrl}</span>
                    <button onClick={() => copyUrl(publishedUrl)} className="h-5 w-5 rounded flex items-center justify-center text-white/25 hover:text-white/60 transition-colors">
                      <Copy className="h-3 w-3" />
                    </button>
                    <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="h-5 w-5 rounded flex items-center justify-center text-white/25 hover:text-white/60 transition-colors">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {previewUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                    <span className="text-[9px] text-white/25 uppercase font-medium">Preview</span>
                    <span className="text-[11px] text-white/40 font-mono truncate flex-1">{previewUrl}</span>
                    <button onClick={() => copyUrl(previewUrl)} className="h-5 w-5 rounded flex items-center justify-center text-white/25 hover:text-white/60 transition-colors">
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Deploy button */}
              <button
                onClick={handlePublish}
                disabled={!hasFiles || isPublishing}
                className={cn(
                  "w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all",
                  hasFiles
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                )}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : publishedUrl ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Update Production
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Publish to Production
                  </>
                )}
              </button>

              {!hasFiles && (
                <p className="text-[11px] text-white/25 text-center">Generate some code first to publish</p>
              )}
            </div>
          )}

          {/* Domains Section */}
          {activeSection === 'domains' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-white/70">Custom Domains</h3>
                  <p className="text-[10px] text-white/30 mt-0.5">Connect your own domain to this project</p>
                </div>
                <button onClick={() => setShowAddDomain(true)} className="h-7 px-3 rounded-lg bg-white/[0.06] text-white/50 text-[11px] font-medium hover:bg-white/10 transition-colors flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add Domain
                </button>
              </div>

              {showAddDomain && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <input
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="w-full h-8 px-3 text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/70 placeholder:text-white/20 outline-none focus:border-cyan-500/40 font-mono"
                    onKeyDown={e => e.key === 'Enter' && addDomain()}
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={addDomain} className="h-7 px-3 rounded-lg bg-cyan-500/20 text-cyan-400 text-[11px] font-medium hover:bg-cyan-500/30 transition-colors">
                      Add Domain
                    </button>
                    <button onClick={() => setShowAddDomain(false)} className="h-7 px-3 rounded-lg text-white/30 text-[11px] hover:text-white/50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {customDomains.length === 0 && !showAddDomain ? (
                <div className="py-8 text-center">
                  <Globe className="h-10 w-10 text-white/10 mx-auto mb-2" />
                  <p className="text-[11px] text-white/25">No custom domains connected</p>
                  <p className="text-[10px] text-white/15 mt-1">Add a domain and configure DNS to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customDomains.map(domain => (
                    <div key={domain.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-cyan-400/60" />
                          <span className="text-[12px] font-medium text-white/70 font-mono">{domain.domain}</span>
                          {domain.isPrimary && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium">PRIMARY</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {statusBadge(domain.status)}
                          <button onClick={() => removeDomain(domain.id)} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {domain.status === 'verifying' && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                          <p className="text-[10px] text-amber-400/80 font-medium mb-1">DNS Configuration Required</p>
                          <div className="space-y-1 text-[10px] text-white/40 font-mono">
                            <div>A Record → @ → 159.203.128.171</div>
                            <div>A Record → www → 159.203.128.171</div>
                            <div>TXT → _verify → {domain.id.slice(0, 12)}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-[9px] text-white/25">
                          <Shield className="h-2.5 w-2.5" />
                          SSL: {domain.sslStatus === 'active' ? <span className="text-emerald-400">Active</span> : <span className="text-amber-400">Provisioning</span>}
                        </div>
                        {!domain.isPrimary && (
                          <button onClick={() => setPrimary(domain.id)} className="text-[9px] text-cyan-400/50 hover:text-cyan-400 transition-colors">
                            Set as primary
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Section */}
          {activeSection === 'history' && (
            <div className="p-5 space-y-2">
              {deployHistory.length === 0 ? (
                <div className="py-8 text-center">
                  <Rocket className="h-10 w-10 text-white/10 mx-auto mb-2" />
                  <p className="text-[11px] text-white/25">No deploys yet</p>
                </div>
              ) : (
                deployHistory.map(deploy => (
                  <div key={deploy.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-2 w-2 rounded-full", deploy.status === 'success' ? 'bg-emerald-400' : deploy.status === 'building' ? 'bg-amber-400 animate-pulse' : 'bg-red-400')} />
                      <div>
                        <span className="text-[11px] font-medium text-white/60">{deploy.version}</span>
                        <span className="text-[10px] text-white/25 ml-2">{deploy.timestamp.toLocaleString()}</span>
                      </div>
                    </div>
                    {deploy.status === 'success' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">Success</span>
                    )}
                    {deploy.status === 'failed' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">Failed</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
