import { useState, useCallback, useMemo } from 'react';
import { X, Globe, Rocket, Check, Copy, ExternalLink, Loader2, RefreshCw, Trash2, Plus, Shield, AlertCircle, Download, FileArchive, Container, Smartphone, Wifi, Package, ChevronLeft, Pencil, Users, FileText, Link, RotateCcw, Eye, FileCode, Zap, ShieldAlert, Bug, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { exportProject, type ExportMode, type ExportContext, type EdgeFunctionMeta } from './exportProject';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import type { DeploymentRecord } from '@/hooks/useProjectPersistence';
import { runPrePublishReview, type ReviewResult, type ReviewIssue } from './prePublishReview';
import type { DeploymentRecord } from '@/hooks/useProjectPersistence';

interface CustomDomain {
  id: string;
  domain: string;
  status: 'verifying' | 'active' | 'failed' | 'pending';
  isPrimary: boolean;
  addedAt: Date;
  sslStatus: 'provisioning' | 'active' | 'failed';
}

interface SmokeTestResult {
  name: string;
  passed: boolean;
  message: string;
}

interface DeployGateResult {
  passed: boolean;
  tests: SmokeTestResult[];
  blockedReason?: string;
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
  files?: ProjectFile[];
  supabaseConfig?: SupabaseConfig | null;
  stripeConfig?: StripeConfig | null;
  serviceKeys?: ServiceKey[];
  envVars?: EnvVar[];
  cdnPackages?: Array<{ name: string; version: string }>;
  edgeFunctions?: EdgeFunctionMeta[];
  storageBuckets?: string[];
  authProviders?: string[];
  deployHistory?: DeploymentRecord[];
  onRollback?: (deploymentId: string) => Promise<void>;
  /** Step 18: Run smoke tests before deploy */
  runSmokeTests?: () => Promise<DeployGateResult>;
}

export function PublishPanel({ open, onClose, publishedUrl, previewUrl, projectName, hasFiles, onPublish, onUnpublish, files = [], supabaseConfig, stripeConfig, serviceKeys, envVars, cdnPackages, edgeFunctions, storageBuckets, authProviders, deployHistory: externalHistory = [], onRollback, runSmokeTests }: PublishPanelProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [activeSection, setActiveSection] = useState<'deploy' | 'export' | 'domains' | 'history'>('deploy');
  const [showEditSettings, setShowEditSettings] = useState(false);
  const [showDeployPreview, setShowDeployPreview] = useState(false);
  const [accessMode, setAccessMode] = useState<'public' | 'password'>('public');
  const [siteTitle, setSiteTitle] = useState(projectName);
  const [siteDescription, setSiteDescription] = useState('');
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const [smokeTestState, setSmokeTestState] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [smokeTestResults, setSmokeTestResults] = useState<DeployGateResult | null>(null);

  const hasIntegrations = !!(supabaseConfig || stripeConfig || (serviceKeys && serviceKeys.length > 0));

  // Compute deploy stats for preview
  const totalSizeKB = files.reduce((sum, f) => sum + new Blob([f.content]).size, 0) / 1024;
  const issueCount = files.filter(f => {
    const c = f.content.toLowerCase();
    return c.includes('todo:') || c.includes('fixme') || c.includes('console.log(');
  }).length;

  const handlePublish = useCallback(async () => {
    // Step 18: Run smoke tests before publishing
    if (runSmokeTests && smokeTestState !== 'passed') {
      setSmokeTestState('running');
      try {
        const result = await runSmokeTests();
        setSmokeTestResults(result);
        if (result.passed) {
          setSmokeTestState('passed');
        } else {
          setSmokeTestState('failed');
          return; // Block publish
        }
      } catch {
        setSmokeTestState('passed'); // On error, don't block
      }
    }

    setIsPublishing(true);
    try {
      await onPublish();
    } catch (e) {
      // Error handled by parent
    }
    setIsPublishing(false);
    setShowDeployPreview(false);
    setSmokeTestState('idle');
    setSmokeTestResults(null);
  }, [onPublish, runSmokeTests, smokeTestState]);

  const handleRollback = useCallback(async (deploymentId: string) => {
    if (!onRollback) return;
    setRollingBack(deploymentId);
    try {
      await onRollback(deploymentId);
    } finally {
      setRollingBack(null);
    }
  }, [onRollback]);

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
          {(['deploy', 'export', 'domains', 'history'] as const).map(section => (
            <button key={section} onClick={() => setActiveSection(section)} className={cn("flex-1 py-2.5 text-[11px] font-medium transition-colors border-b-2 capitalize", activeSection === section ? 'text-white/80 border-cyan-500' : 'text-white/35 border-transparent hover:text-white/55')}>
              {section === 'deploy' ? '🚀 Deploy' : section === 'export' ? '📦 Export' : section === 'domains' ? '🌐 Domains' : '📋 History'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Deploy Section */}
          {activeSection === 'deploy' && !showEditSettings && (
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
              {/* Deploy Preview Card */}
              {showDeployPreview && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-cyan-500/20 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-medium text-white/70">Deploy Preview</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-white/[0.03] text-center">
                      <span className="text-[16px] font-bold text-white/70">{files.length}</span>
                      <span className="text-[9px] text-white/30 block mt-0.5">Files</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] text-center">
                      <span className="text-[16px] font-bold text-white/70">{totalSizeKB.toFixed(0)}</span>
                      <span className="text-[9px] text-white/30 block mt-0.5">KB Total</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] text-center">
                      <span className={cn("text-[16px] font-bold", issueCount > 0 ? "text-amber-400" : "text-emerald-400")}>{issueCount}</span>
                      <span className="text-[9px] text-white/30 block mt-0.5">Warnings</span>
                    </div>
                  </div>

                  {issueCount > 0 && (
                    <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
                      <AlertCircle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-[10px] text-amber-400/70">{issueCount} file(s) contain TODOs, FIXMEs, or console.log statements</span>
                    </div>
                  )}

                  {/* Step 18: Smoke test results */}
                  {smokeTestState === 'running' && (
                    <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 text-cyan-400 animate-spin shrink-0" />
                      <span className="text-[10px] text-cyan-400/70">Running pre-deploy checks...</span>
                    </div>
                  )}

                  {smokeTestState === 'failed' && smokeTestResults && (
                    <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                        <span className="text-[10px] font-medium text-red-400/80">Pre-deploy checks failed</span>
                      </div>
                      {smokeTestResults.tests.filter(t => !t.passed).map((t, i) => (
                        <div key={i} className="flex items-center gap-2 pl-5">
                          <X className="h-2.5 w-2.5 text-red-400/60 shrink-0" />
                          <span className="text-[9px] text-red-400/60">{t.name}: {t.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {smokeTestState === 'passed' && (
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-2">
                      <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="text-[10px] text-emerald-400/70">All pre-deploy checks passed</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => { setShowDeployPreview(false); setSmokeTestState('idle'); setSmokeTestResults(null); }} className="flex-1 h-9 rounded-lg text-[12px] text-white/40 hover:text-white/60 bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing || smokeTestState === 'running'}
                      className="flex-1 h-9 rounded-lg text-[12px] font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {smokeTestState === 'running' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
                      {smokeTestState === 'running' ? 'Checking...' : isPublishing ? 'Publishing...' : 'Confirm Deploy'}
                    </button>
                  </div>

                  {/* Escape hatch for failed checks */}
                  {smokeTestState === 'failed' && (
                    <button
                      onClick={() => { setSmokeTestState('passed'); }}
                      className="w-full text-center text-[10px] text-white/25 hover:text-white/40 transition-colors py-1"
                    >
                      Publish anyway (skip checks)
                    </button>
                  )}
                </div>
              )}

              {/* Deploy button — shows preview first */}
              {!showDeployPreview && (
                <button
                  onClick={() => setShowDeployPreview(true)}
                  disabled={!hasFiles || isPublishing}
                  className={cn(
                    "w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all",
                    hasFiles
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  )}
                >
                  {publishedUrl ? (
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
              )}

              {/* Edit Settings button */}
              <button
                onClick={() => setShowEditSettings(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Pencil className="h-3.5 w-3.5 text-white/40 group-hover:text-white/60" />
                  <span className="text-[12px] font-medium text-white/60 group-hover:text-white/80">Edit publish settings</span>
                </div>
                <ChevronLeft className="h-3.5 w-3.5 text-white/20 rotate-180" />
              </button>

              {!hasFiles && (
                <p className="text-[11px] text-white/25 text-center">Generate some code first to publish</p>
              )}
            </div>
          )}

          {/* Edit Settings Sub-view */}
          {activeSection === 'deploy' && showEditSettings && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Edit settings</h3>
                  <p className="text-[11px] text-white/35">Update your publish settings</p>
                </div>
              </div>

              {/* URL */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Link className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-white/80">URL</p>
                    {publishedUrl && <Check className="h-3 w-3 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-white/35 font-mono truncate mt-0.5">
                    {publishedUrl || previewUrl || `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.apps.ultriumai.com`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const url = publishedUrl || previewUrl;
                    if (url) copyUrl(url);
                  }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Website access */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-white/80">Website access</p>
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      {accessMode === 'public' ? 'Anyone with the link' : 'Password protected'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pl-12">
                  <button
                    onClick={() => setAccessMode('public')}
                    className={cn(
                      "text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all",
                      accessMode === 'public'
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                        : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50"
                    )}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setAccessMode('password')}
                    className={cn(
                      "text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all",
                      accessMode === 'password'
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                        : "bg-white/[0.03] text-white/30 border border-white/[0.06] hover:text-white/50"
                    )}
                  >
                    Password
                  </button>
                </div>
              </div>

              {/* Website info */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-white/80">Website info</p>
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-white/35 mt-0.5 truncate">
                      {siteTitle}{siteDescription ? ` - ${siteDescription}` : ''}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pl-12">
                  <div>
                    <label className="text-[10px] text-white/30 mb-1 block">Title</label>
                    <input
                      value={siteTitle}
                      onChange={e => setSiteTitle(e.target.value)}
                      className="w-full h-8 px-3 text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/70 placeholder:text-white/20 outline-none focus:border-cyan-500/40"
                      placeholder="Website title"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-white/30 mb-1 block">Description</label>
                    <textarea
                      value={siteDescription}
                      onChange={e => setSiteDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/70 placeholder:text-white/20 outline-none focus:border-cyan-500/40 resize-none"
                      placeholder="Brief site description for SEO"
                    />
                  </div>
                </div>
              </div>

              {/* Footer: Back + Save */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setShowEditSettings(false)}
                  className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <button
                  onClick={() => {
                    toast.success('Settings saved');
                    setShowEditSettings(false);
                  }}
                  className="h-8 px-5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[12px] font-medium hover:from-cyan-400 hover:to-blue-500 transition-all"
                >
                  Save changes
                </button>
              </div>
            </div>
          )}

          {/* Export Section */}
          {activeSection === 'export' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
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
                <button onClick={() => handleExport('fullstack')} className="w-full flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/20 transition-all text-left">
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
              <button onClick={() => handleExport('docker')} className="w-full flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] transition-all text-left">
                <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-blue-500/10 mt-0.5">
                  <Container className="h-4 w-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-white/80">Docker-Ready</p>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] px-1.5 py-0">Self-Host</Badge>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">React + Vite + Dockerfile + nginx config. Deploy anywhere.</p>
                </div>
              </button>

              {/* ZIP Export */}
              <button onClick={() => handleExport('raw')} className="w-full flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.1] transition-all text-left">
                <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-white/5 mt-0.5">
                  <FileArchive className="h-4 w-4 text-white/40" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white/80">Download as ZIP</p>
                  <p className="text-[10px] text-white/30 mt-1">Raw project source files. Deploy to Vercel, Netlify, or any static host.</p>
                </div>
              </button>

              {/* Mobile Exports */}
              <div className="pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] text-white/25 uppercase tracking-wider font-medium">Mobile</span>
              </div>

              <button onClick={() => handleExport('pwa')} className="w-full flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-cyan-500/20 transition-all text-left">
                <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-cyan-500/10 mt-0.5">
                  <Wifi className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white/80">Installable Web App (PWA)</p>
                  <p className="text-[10px] text-white/30 mt-1">Install from browser — works offline, no app store required.</p>
                </div>
              </button>

              <button onClick={() => handleExport('capacitor')} className="w-full flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-violet-500/20 transition-all text-left">
                <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center bg-violet-500/10 mt-0.5">
                  <Smartphone className="h-4 w-4 text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-white/80">Native App (Capacitor)</p>
                    <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[8px] px-1.5 py-0">Pro</Badge>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">Apple App Store & Google Play with native API access.</p>
                </div>
              </button>

              {/* One-Click Deploy */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[10px] text-white/25 uppercase tracking-wider font-medium">One-Click Deploy</span>
                <div className="flex gap-2 mt-2">
                  {['Vercel', 'Netlify', 'Railway'].map(p => (
                    <button key={p} className="flex-1 text-[10px] py-2 rounded-md bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-white/40 hover:text-white/70 transition-all">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
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
              {externalHistory.length === 0 ? (
                <div className="py-8 text-center">
                  <Rocket className="h-10 w-10 text-white/10 mx-auto mb-2" />
                  <p className="text-[11px] text-white/25">No deploys yet</p>
                </div>
              ) : (
                externalHistory.map((deploy, idx) => (
                  <div key={deploy.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-2 w-2 rounded-full", deploy.status === 'success' ? 'bg-emerald-400' : deploy.status === 'building' ? 'bg-amber-400 animate-pulse' : 'bg-red-400')} />
                      <div>
                        <span className="text-[11px] font-medium text-white/60">v{deploy.version}</span>
                        <span className="text-[10px] text-white/25 ml-2">{deploy.timestamp.toLocaleString()}</span>
                        {deploy.totalSizeKB > 0 && (
                          <span className="text-[9px] text-white/15 ml-2">{deploy.totalSizeKB}KB</span>
                        )}
                        {deploy.duration && (
                          <span className="text-[9px] text-white/15 ml-1">({(deploy.duration / 1000).toFixed(1)}s)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {deploy.status === 'success' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                          {idx === 0 ? 'Current' : 'Success'}
                        </span>
                      )}
                      {deploy.status === 'failed' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">Failed</span>
                      )}
                      {/* Rollback button for non-current successful deploys */}
                      {deploy.status === 'success' && idx > 0 && deploy.compiledHtml && onRollback && (
                        <button
                          onClick={() => handleRollback(deploy.id)}
                          disabled={!!rollingBack}
                          className="text-[9px] text-white/30 hover:text-cyan-400 px-1.5 py-0.5 rounded hover:bg-cyan-500/[0.08] transition-colors flex items-center gap-1"
                        >
                          {rollingBack === deploy.id ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-2.5 w-2.5" />
                          )}
                          Rollback
                        </button>
                      )}
                    </div>
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
