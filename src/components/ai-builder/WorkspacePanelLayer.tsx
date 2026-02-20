import { SafePanel } from './SafePanel';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import {
  TemplateLibrary, EditHistoryTimeline,
  KeyboardShortcutsPanel, BillingPanel, ProjectShareDialog, SEOEditor,
  CustomDomainPanel, PublishPanel, DiffReviewPanel, QuickFileSwitcher,
  AIImageGenPanel, SecretsManagerPanel,
} from './lazyPanels';
import { BugReportModal } from '@/components/help/BugReportModal';
import { EnhancedCommandPalette } from './EnhancedCommandPalette';
import type { CommandAction } from './EnhancedCommandPalette';

/**
 * WorkspacePanelLayer renders core panel overlays/modals.
 * Sprint-specific panels have been moved to conditionally-mounted PanelGroup components.
 */
interface WorkspacePanelLayerProps {
  panelVisibility: Record<string, boolean>;
  panelSetters: Record<string, (v: any) => void>;
  hooks: Record<string, any>;
  handleSend: (input: string, imageDataUrls?: string[] | null, skipQuestions?: boolean) => void;
  upsertFile: (path: string, content: string) => void;
  activeFile: { path: string; content: string; language?: string } | null;
  setActiveFile: (path: string) => void;
  setRightTab: (tab: any) => void;
  project: { files: ProjectFile[]; name: string };
  commandActions: CommandAction[];
  recentFiles: string[];
  publishedUrl: string | null;
  hostedPreviewUrl: string | null;
  previewSlug: string | null;
  currentProjectId: string | null;
  sendMessage: (...args: any[]) => void;
  supabaseConfig: any;
  stripeConfig: any;
  serviceKeys: any;
  selectedModel: string;
  collaborators: any[];
  setCollaborators: (fn: any) => void;
  assets: any[];
  setAssets: (fn: any) => void;
  envVars: any[];
  setEnvVars: (fn: any) => void;
  pushUndo: (label: string, files: ProjectFile[]) => void;
  setFiles: (files: ProjectFile[]) => void;
  persistedDeployHistory: any[];
  rollbackToVersion: (name: string, id: string) => Promise<any>;
  handlePublish: () => void;
  handleSetActiveFile: (path: string) => void;
  pendingDiffChanges: any[];
  setPendingDiffChanges: (v: any) => void;
  showBugReport: boolean;
  setShowBugReport: (v: boolean) => void;
}

export function WorkspacePanelLayer(props: WorkspacePanelLayerProps) {
  const {
    panelVisibility: pv, panelSetters: ps, hooks: h,
    handleSend, upsertFile, activeFile, setActiveFile, setRightTab, project,
    commandActions, recentFiles, publishedUrl, hostedPreviewUrl, previewSlug,
    currentProjectId, collaborators, setCollaborators, assets, setAssets,
    envVars, setEnvVars, pushUndo, setFiles,
    persistedDeployHistory, rollbackToVersion, handlePublish, handleSetActiveFile,
    pendingDiffChanges, setPendingDiffChanges, showBugReport, setShowBugReport,
  } = props;

  return (
    <>
      <SafePanel show={pv.showTemplates} name="Template Library">
        <TemplateLibrary isOpen={pv.showTemplates} onClose={() => ps.setShowTemplates(false)} onSelectTemplate={(prompt: string) => handleSend(prompt)} />
      </SafePanel>
      <SafePanel show={pv.showEditHistory} name="Edit History">
        <EditHistoryTimeline isOpen={pv.showEditHistory} onClose={() => ps.setShowEditHistory(false)} versions={h.versions} onRestore={(id: string) => { h.restoreVersion(id); ps.setShowEditHistory(false); }} />
      </SafePanel>
      <SafePanel show={pv.showShortcuts} name="Keyboard Shortcuts">
        <KeyboardShortcutsPanel open={pv.showShortcuts} onOpenChange={ps.setShowShortcuts} />
      </SafePanel>
      <SafePanel show={pv.showBilling} name="Billing">
        <BillingPanel isOpen={pv.showBilling} onClose={() => ps.setShowBilling(false)} />
      </SafePanel>
      <SafePanel show={pv.showShareDialog} name="Share">
        <ProjectShareDialog isOpen={pv.showShareDialog} onClose={() => ps.setShowShareDialog(false)} projectName={project.name} collaborators={collaborators} onInvite={(email: string, role: string) => setCollaborators((prev: any[]) => [...prev, { id: crypto.randomUUID(), email, role, avatarColor: ['#06b6d4','#8b5cf6','#f43f5e','#22c55e'][prev.length % 4], joinedAt: new Date() }])} onChangeRole={(id: string, role: string) => setCollaborators((prev: any[]) => prev.map((c: any) => c.id === id ? { ...c, role } : c))} onRemove={(id: string) => setCollaborators((prev: any[]) => prev.filter((c: any) => c.id !== id))} />
      </SafePanel>
      <SafePanel show={pv.showSEOEditor} name="SEO Editor">
        <SEOEditor isOpen={pv.showSEOEditor} onClose={() => ps.setShowSEOEditor(false)} files={project.files} onUpdateFile={upsertFile} />
      </SafePanel>
      <SafePanel show={pv.showDomainPanel} name="Custom Domain">
        <CustomDomainPanel isOpen={pv.showDomainPanel} onClose={() => ps.setShowDomainPanel(false)} previewUrl={previewSlug ? `https://${previewSlug}.apps.ultriumai.com` : hostedPreviewUrl} publishedUrl={publishedUrl} />
      </SafePanel>
      <SafePanel show={pv.showPublishPanel} name="Publish">
        <PublishPanel open={pv.showPublishPanel} onClose={() => ps.setShowPublishPanel(false)} publishedUrl={publishedUrl} previewUrl={previewSlug ? `https://${previewSlug}.apps.ultriumai.com` : hostedPreviewUrl} projectName={project.name} hasFiles={project.files.length > 0} onPublish={handlePublish} files={project.files} deployHistory={persistedDeployHistory} onRollback={async (id: string) => { await rollbackToVersion(project.name, id); }} />
      </SafePanel>
      <SafePanel show={pv.showDiffReview} name="Diff Review">
        <DiffReviewPanel isOpen={pv.showDiffReview} onClose={() => ps.setShowDiffReview(false)} changes={pendingDiffChanges} onApprove={() => { pendingDiffChanges.forEach((c: any) => upsertFile(c.path, c.newContent)); setPendingDiffChanges([]); ps.setShowDiffReview(false); }} onReject={() => { setPendingDiffChanges([]); ps.setShowDiffReview(false); }} onApproveFile={(path: string) => { const c = pendingDiffChanges.find((ch: any) => ch.path === path); if (c) upsertFile(c.path, c.newContent); }} onRejectFile={() => {}} />
      </SafePanel>
      <SafePanel show={pv.showQuickSwitcher} name="Quick Switcher">
        <QuickFileSwitcher open={pv.showQuickSwitcher} onOpenChange={ps.setShowQuickSwitcher} files={project.files} onSelectFile={(path: string) => { setActiveFile(path); setRightTab('code'); }} />
      </SafePanel>
      <BugReportModal open={showBugReport} onOpenChange={setShowBugReport} />
      <SafePanel show={pv.showImageGen} name="AI Image Gen">
        <AIImageGenPanel open={pv.showImageGen} onClose={() => ps.setShowImageGen(false)} onInsertAsAsset={(name: string, url: string) => { setAssets((prev: any[]) => [...prev, { id: crypto.randomUUID(), name, type: 'image' as const, dataUrl: url, size: 0, createdAt: new Date() } as any]); }} />
      </SafePanel>
      <SafePanel show={pv.showSecretsManager} name="Secrets Manager">
        <SecretsManagerPanel open={pv.showSecretsManager} onClose={() => ps.setShowSecretsManager(false)} onSecretsChange={(secrets: any[]) => setEnvVars((prev: any[]) => { const secretKeys = new Set(secrets.map((s: any) => s.key)); const kept = prev.filter((p: any) => !secretKeys.has(p.key)); return [...kept, ...secrets]; })} />
      </SafePanel>
      <SafePanel show={pv.showEnhancedPalette} name="Command Palette">
        <EnhancedCommandPalette open={pv.showEnhancedPalette} onOpenChange={ps.setShowEnhancedPalette} files={project.files} actions={commandActions} onSelectFile={(path: string) => { handleSetActiveFile(path); setRightTab('code'); }} recentFiles={recentFiles} />
      </SafePanel>
    </>
  );
}
