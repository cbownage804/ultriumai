import { SafePanel } from './SafePanel';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import {
  TemplateLibrary, EnvironmentManagerPanel, RollbackPanel, UptimeMonitorPanel,
  BuildCachePanel, BuildScriptsPanel, CMSModePanel, MarkdownBlogPanel,
  ImageOptimizerPanel, VideoEmbedPanel, I18nPanel, EditHistoryTimeline,
  KeyboardShortcutsPanel, BillingPanel, ProjectShareDialog, SEOEditor,
  CustomDomainPanel, PublishPanel, DiffReviewPanel, QuickFileSwitcher,
  AIImageGenPanel, SecretsManagerPanel, SnippetLibraryPanel, SplitDiffPanel,
  CommentPanel, TeamActivityPanel, ApprovalPanel, ForkingPanel,
  AnalyticsDashboardPanel, ErrorTrackingPanel, SessionReplayPanel,
  ABTestingPanel, AIUsagePanel, DependencyScannerPanel, CSPGeneratorPanel,
  GDPRPanel, RateLimiterPanel, SecretRotationPanel, CLICompanionPanel,
  GitHubActionsPanel, SlackDiscordPanel, WhiteLabelPanel, PluginSDKPanel,
  AIRefactoringPanel, NLRegexPanel, CommitMessagePanel, AutoImportPanel,
  AIDocWriterPanel, CoEditingPanel, VoiceChatPanel, ScreenSharePanel,
  CodeReactionsPanel, WhiteboardPanel, VisualRegressionPanel,
  AccessibilityPanel, CodeCoveragePanel, MutationTestingPanel,
  LoadTestingPanel, PageBuilderPanel, ThemeStudioPanel, FormBuilderPanel,
  ChartDashboardPanel, LayoutGridPanel, GraphQLBuilderPanel,
  WebSocketPanel, FileUploadPanel, PaymentPanel, EmailTemplatePanel,
  TutorialCreatorPanel, CodePlaygroundPanel, CustomLintingPanel,
  DependencyGraphPanel, GitBlameTimelinePanel, MultiRegionPanel,
  FeatureFlagsPanel, CanaryDeployPanel, SSGPanel, DockerExportPanel,
  SubscriptionManagerPanel, InvoiceGeneratorPanel, UsageMeteringPanel,
  AffiliateTrackingPanel, RevenueDashboardPanel, CapacitorExportPanel,
  PushNotificationPanel, OfflineFirstPanel, GestureBuilderPanel,
  AppStoreAssetsPanel, CodeTranslatorPanel, SmartScaffoldingPanel,
  WorkflowAutomationPanel, PerfOptimizerPanel, SecurityAuditorPanel,
  StateMachinePanel, DataValidationPanel, CacheStrategyPanel,
  ReactiveStorePanel, DataMigrationPanel, RegexPlaygroundPanel,
  JsonYamlConverterPanel, ColorContrastPanel, TailwindSorterPanel,
  MarkdownPreviewPanel, ToastDesignerPanel, NotificationCenterPanel,
  ChatWidgetPanel, EmailSequencePanel, SMSTemplatePanel,
  StepperWizardPanel, CommandMenuPanel, BreadcrumbPanel,
  MegaMenuPanel, ContextMenuPanel, DockerComposePanel,
  KubernetesPanel, CICDPipelinePanel, StructuredLoggerPanel,
  HealthCheckPanel, OAuthSetupPanel, MFAFlowPanel, SessionManagerPanel,
  APIKeyPanel, PermissionMatrixPanel, RichTextConfigPanel,
  FilePreviewGenPanel, AvatarGenPanel, CarouselBuilderPanel,
  GalleryLightboxPanel, FullTextSearchPanel, FacetedFilterPanel,
  AutocompletePanel, TagSystemPanel, SEOMetaPanel, KPIDashboardPanel,
  AlertingRulesPanel, AuditTrailPanel, ClickHeatmapPanel,
  BudgetMonitorPanel, ChangelogAutoPanel, READMEGeneratorPanel,
  LicensePickerPanel, OpenAPISpecPanel,
} from './lazyPanels';
import { ProjectHealthPanel } from './ProjectHealthPanel';
import { BugReportModal } from '@/components/help/BugReportModal';
import { EnhancedCommandPalette } from './EnhancedCommandPalette';
import type { CommandAction } from './EnhancedCommandPalette';

/**
 * WorkspacePanelLayer renders all panel overlays/modals.
 * Each panel is wrapped in SafePanel for crash isolation + Suspense.
 *
 * Props are intentionally typed as `any` for the hook instances to keep
 * this extraction manageable — the real types live in each hook.
 */
interface WorkspacePanelLayerProps {
  // Visibility flags — all the showX booleans
  panelVisibility: Record<string, boolean>;
  // Setter functions — all the setShowX functions
  panelSetters: Record<string, (v: any) => void>;
  // Hook instances
  hooks: Record<string, any>;
  // Shared callbacks
  handleSend: (input: string, imageDataUrls?: string[] | null, skipQuestions?: boolean) => void;
  upsertFile: (path: string, content: string) => void;
  activeFile: { path: string; content: string; language?: string } | null;
  setActiveFile: (path: string) => void;
  setRightTab: (tab: any) => void;
  project: { files: ProjectFile[]; name: string };
  // Command palette
  commandActions: CommandAction[];
  recentFiles: string[];
  // Misc
  publishedUrl: string | null;
  hostedPreviewUrl: string | null;
  previewSlug: string | null;
  currentProjectId: string | null;
  // For panels that need sendMessage
  sendMessage: (...args: any[]) => void;
  supabaseConfig: any;
  stripeConfig: any;
  serviceKeys: any;
  selectedModel: string;
  // Shared state
  collaborators: any[];
  setCollaborators: (fn: any) => void;
  assets: any[];
  setAssets: (fn: any) => void;
  envVars: any[];
  setEnvVars: (fn: any) => void;
  installedPackages: any[];
  previousFiles: ProjectFile[] | null;
  pushUndo: (label: string, files: ProjectFile[]) => void;
  setFiles: (files: ProjectFile[]) => void;
  // Deploy history
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
    currentProjectId, sendMessage, supabaseConfig, stripeConfig, serviceKeys,
    selectedModel, collaborators, setCollaborators, assets, setAssets,
    envVars, setEnvVars, installedPackages, previousFiles, pushUndo, setFiles,
    persistedDeployHistory, rollbackToVersion, handlePublish, handleSetActiveFile,
    pendingDiffChanges, setPendingDiffChanges, showBugReport, setShowBugReport,
  } = props;

  const insertCode = (code: string) => {
    if (activeFile) upsertFile(activeFile.path, activeFile.content + '\n' + code);
  };

  return (
    <>
      <SafePanel show={pv.showTemplates} name="Template Library">
        <TemplateLibrary isOpen={pv.showTemplates} onClose={() => ps.setShowTemplates(false)} onSelectTemplate={(prompt: string) => handleSend(prompt)} />
      </SafePanel>
      <SafePanel show={pv.showEnvManager} name="Environment Manager">
        <EnvironmentManagerPanel open={pv.showEnvManager} onClose={() => ps.setShowEnvManager(false)} environments={h.environmentManager.environments} activeEnv={h.environmentManager.activeEnv} onSwitch={h.environmentManager.switchEnvironment} onPromote={h.environmentManager.promote} onUpdateVars={h.environmentManager.updateEnvVars} />
      </SafePanel>
      <SafePanel show={pv.showRollback} name="Rollback">
        <RollbackPanel open={pv.showRollback} onClose={() => ps.setShowRollback(false)} snapshots={h.rollbackManager.snapshots} currentFiles={project.files} onRollback={(id: string) => { const files = h.rollbackManager.rollback(id); if (files) { pushUndo('Before rollback', project.files); setFiles(files); } }} onGetDiff={(id: string) => h.rollbackManager.getDiff(id, project.files)} isRollingBack={h.rollbackManager.isRollingBack} />
      </SafePanel>
      <SafePanel show={pv.showUptimeMonitor} name="Uptime Monitor">
        <UptimeMonitorPanel open={pv.showUptimeMonitor} onClose={() => ps.setShowUptimeMonitor(false)} checks={h.uptimeMonitor.checks} stats={h.uptimeMonitor.getStats()} isMonitoring={h.uptimeMonitor.isMonitoring} url={h.uptimeMonitor.url} onStart={h.uptimeMonitor.startMonitoring} onStop={h.uptimeMonitor.stopMonitoring} publishedUrl={publishedUrl} />
      </SafePanel>
      <SafePanel show={pv.showBuildCache} name="Build Cache">
        <BuildCachePanel open={pv.showBuildCache} onClose={() => ps.setShowBuildCache(false)} stats={h.buildCache.stats} onInvalidate={() => h.buildCache.invalidate()} />
      </SafePanel>
      <SafePanel show={pv.showBuildScripts} name="Build Scripts">
        <BuildScriptsPanel open={pv.showBuildScripts} onClose={() => ps.setShowBuildScripts(false)} scripts={h.buildScripts.scripts} onToggle={h.buildScripts.toggleScript} onRun={(id: string) => { h.buildScripts.runScript(id, project.files); }} onRemove={h.buildScripts.removeScript} />
      </SafePanel>
      <SafePanel show={pv.showCMSMode} name="CMS Mode">
        <CMSModePanel open={pv.showCMSMode} onClose={() => ps.setShowCMSMode(false)} isEnabled={h.cmsMode.isEnabled} onToggle={h.cmsMode.toggleCMS} blocks={h.cmsMode.blocks} onUpdateBlock={h.cmsMode.updateBlock} onExport={h.cmsMode.exportContent} editingBlock={h.cmsMode.editingBlock} onSetEditing={h.cmsMode.setEditingBlock} />
      </SafePanel>
      <SafePanel show={pv.showBlogEngine} name="Blog Engine">
        <MarkdownBlogPanel open={pv.showBlogEngine} onClose={() => ps.setShowBlogEngine(false)} posts={h.markdownBlog.posts} onGenerate={() => { const files = h.markdownBlog.generateBlogSystem(); files.forEach((f: any) => upsertFile(f.path, f.content)); }} onRemovePost={h.markdownBlog.removePost} onInsertFiles={(files: any[]) => files.forEach((f: any) => upsertFile(f.path, f.content))} />
      </SafePanel>
      <SafePanel show={pv.showImageOptimizer} name="Image Optimizer">
        <ImageOptimizerPanel open={pv.showImageOptimizer} onClose={() => ps.setShowImageOptimizer(false)} images={h.imageOptimizer.images} isProcessing={h.imageOptimizer.isProcessing} onOptimize={(f: any) => h.imageOptimizer.optimizeImage(f)} onGenerateTag={h.imageOptimizer.generateImgTag} onRemove={h.imageOptimizer.removeImage} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={pv.showVideoEmbed} name="Video Embed">
        <VideoEmbedPanel open={pv.showVideoEmbed} onClose={() => ps.setShowVideoEmbed(false)} embeds={h.videoEmbed.embeds} onAdd={h.videoEmbed.addEmbed} onRemove={h.videoEmbed.removeEmbed} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={pv.showI18n} name="I18n">
        <I18nPanel open={pv.showI18n} onClose={() => ps.setShowI18n(false)} strings={h.i18nGenerator.strings} locales={h.i18nGenerator.locales} onExtract={() => h.i18nGenerator.extractStrings(project.files)} onAddLocale={h.i18nGenerator.addLocale} onRemoveLocale={h.i18nGenerator.removeLocale} onUpdateTranslation={h.i18nGenerator.updateTranslation} onGenerateFiles={() => { const files = h.i18nGenerator.generateFiles(); files.forEach((f: any) => upsertFile(f.path, f.content)); }} />
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
      <SafePanel show={pv.showSnippetLibrary} name="Snippet Library">
        <SnippetLibraryPanel open={pv.showSnippetLibrary} onClose={() => ps.setShowSnippetLibrary(false)} snippets={h.snippetLibrary.snippets} searchQuery={h.snippetLibrary.searchQuery} onSearchChange={h.snippetLibrary.setSearchQuery} onAdd={h.snippetLibrary.addSnippet} onRemove={h.snippetLibrary.removeSnippet} onInsert={insertCode} onExport={h.snippetLibrary.exportSnippets} onImport={h.snippetLibrary.importSnippets} />
      </SafePanel>
      <SafePanel show={pv.showSplitDiff} name="Split Diff">
        <SplitDiffPanel open={pv.showSplitDiff} onClose={() => ps.setShowSplitDiff(false)} diff={h.splitDiffEditor.activeDiff} />
      </SafePanel>
      <SafePanel show={pv.showComments} name="Comments">
        <CommentPanel open={pv.showComments} onClose={() => ps.setShowComments(false)} comments={h.commentSystem.comments} activeFile={activeFile?.path} onAdd={h.commentSystem.addComment} onResolve={h.commentSystem.resolveComment} onDelete={h.commentSystem.deleteComment} onNavigate={(file: string) => { setActiveFile(file); setRightTab('code'); }} unresolvedCount={h.commentSystem.unresolvedCount} />
      </SafePanel>
      <SafePanel show={pv.showTeamActivity} name="Team Activity">
        <TeamActivityPanel open={pv.showTeamActivity} onClose={() => ps.setShowTeamActivity(false)} activities={h.teamActivityFeed.activities} filter={h.teamActivityFeed.filter} onFilterChange={h.teamActivityFeed.setFilter} getActionIcon={h.teamActivityFeed.getActionIcon} getActionLabel={h.teamActivityFeed.getActionLabel} />
      </SafePanel>
      <SafePanel show={pv.showApprovals} name="Approvals">
        <ApprovalPanel open={pv.showApprovals} onClose={() => ps.setShowApprovals(false)} requests={h.approvalWorkflow.requests} requireApproval={h.approvalWorkflow.requireApproval} onToggleRequire={h.approvalWorkflow.setRequireApproval} onApprove={h.approvalWorkflow.approve} onReject={h.approvalWorkflow.reject} onCancel={h.approvalWorkflow.cancelRequest} pendingCount={h.approvalWorkflow.pendingCount} />
      </SafePanel>
      <SafePanel show={pv.showForking} name="Forking">
        <ForkingPanel open={pv.showForking} onClose={() => ps.setShowForking(false)} forks={h.projectForking.forks} transfers={h.projectForking.transfers} projectName={project.name} projectId={currentProjectId || ''} fileCount={project.files.length} onFork={(includeHistory: boolean) => h.projectForking.forkProject(currentProjectId || '', project.name, project.files, includeHistory)} onTransfer={(email: string, reason: string) => h.projectForking.transferProject(currentProjectId || '', project.name, email, reason)} />
      </SafePanel>
      <SafePanel show={pv.showAnalyticsDashboard} name="Analytics Dashboard">
        <AnalyticsDashboardPanel open={pv.showAnalyticsDashboard} onClose={() => ps.setShowAnalyticsDashboard(false)} summary={h.builtInAnalytics.getSummary()} isTracking={h.builtInAnalytics.isTracking} onStartTracking={h.builtInAnalytics.startTracking} onStopTracking={h.builtInAnalytics.stopTracking} onGenerateScript={h.builtInAnalytics.generateTrackingScript} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={pv.showErrorTracking} name="Error Tracking">
        <ErrorTrackingPanel open={pv.showErrorTracking} onClose={() => ps.setShowErrorTracking(false)} errors={h.errorTracking.errors} stats={h.errorTracking.getStats()} onResolve={h.errorTracking.resolveError} onDelete={h.errorTracking.deleteError} onInsertCode={insertCode} onGenerateBoundary={h.errorTracking.generateErrorBoundary} />
      </SafePanel>
      <SafePanel show={pv.showSessionReplay} name="Session Replay">
        <SessionReplayPanel open={pv.showSessionReplay} onClose={() => ps.setShowSessionReplay(false)} sessions={h.sessionReplay.sessions} isRecording={h.sessionReplay.isRecording} onStartRecording={h.sessionReplay.startRecording} onStopRecording={h.sessionReplay.stopRecording} onDeleteSession={h.sessionReplay.deleteSession} onInsertCode={insertCode} onGenerateScript={h.sessionReplay.generateReplayScript} />
      </SafePanel>
      <SafePanel show={pv.showABTesting} name="A/B Testing">
        <ABTestingPanel open={pv.showABTesting} onClose={() => ps.setShowABTesting(false)} tests={h.abTesting.tests} onCreate={h.abTesting.createTest} onStart={h.abTesting.startTest} onPause={h.abTesting.pauseTest} onComplete={h.abTesting.completeTest} onDelete={h.abTesting.deleteTest} onGenerateCode={h.abTesting.generateABCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={pv.showAIUsage} name="AI Usage">
        <AIUsagePanel open={pv.showAIUsage} onClose={() => ps.setShowAIUsage(false)} summary={h.aiUsageAnalytics.getSummary()} estimatedMonthlyCost={h.aiUsageAnalytics.getEstimatedMonthlyCost()} />
      </SafePanel>
      <SafePanel show={pv.showDepScanner} name="Dependency Scanner">
        <DependencyScannerPanel open={pv.showDepScanner} onClose={() => ps.setShowDepScanner(false)} latestScan={h.dependencyScanner.getLatestScan()} isScanning={h.dependencyScanner.isScanning} onScan={() => h.dependencyScanner.scanDependencies(installedPackages)} />
      </SafePanel>
      <SafePanel show={pv.showCSPGenerator} name="CSP Generator">
        <CSPGeneratorPanel open={pv.showCSPGenerator} onClose={() => ps.setShowCSPGenerator(false)} config={h.cspGenerator.config} onAnalyze={h.cspGenerator.analyzeProject} onToggleDirective={h.cspGenerator.toggleDirective} onAddSource={h.cspGenerator.addSource} onRemoveSource={h.cspGenerator.removeSource} onSetReportOnly={h.cspGenerator.setReportOnly} onGenerateCSP={h.cspGenerator.generateCSP} onGenerateMetaTag={h.cspGenerator.generateMetaTag} files={project.files} />
      </SafePanel>
      <SafePanel show={pv.showGDPR} name="GDPR">
        <GDPRPanel open={pv.showGDPR} onClose={() => ps.setShowGDPR(false)} components={h.gdprCompliance.components} companyName={h.gdprCompliance.companyName} contactEmail={h.gdprCompliance.contactEmail} onSetCompanyName={h.gdprCompliance.setCompanyName} onSetContactEmail={h.gdprCompliance.setContactEmail} onGenerateAll={h.gdprCompliance.generateAll} onInsertCode={(code: string, name: string) => upsertFile(`src/components/${name}`, code)} />
      </SafePanel>
      <SafePanel show={pv.showRateLimiter} name="Rate Limiter">
        <RateLimiterPanel open={pv.showRateLimiter} onClose={() => ps.setShowRateLimiter(false)} rules={h.rateLimiter.rules} onAdd={h.rateLimiter.addRule} onUpdate={h.rateLimiter.updateRule} onRemove={h.rateLimiter.removeRule} onToggle={h.rateLimiter.toggleRule} onGenerateMiddleware={h.rateLimiter.generateMiddleware} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={pv.showSecretRotation} name="Secret Rotation">
        <SecretRotationPanel open={pv.showSecretRotation} onClose={() => ps.setShowSecretRotation(false)} secrets={h.secretRotation.secrets} onAdd={h.secretRotation.addSecret} onMarkRotated={h.secretRotation.markRotated} onRemove={h.secretRotation.removeSecret} expiredCount={h.secretRotation.getExpiredSecrets().length} warningCount={h.secretRotation.getWarningSecrets().length} />
      </SafePanel>
      <SafePanel show={pv.showCLICompanion} name="CLI Companion">
        <CLICompanionPanel config={h.cliCompanion.config} setConfig={h.cliCompanion.setConfig} files={project.files} onGenerateBundle={h.cliCompanion.generateProjectBundle} onAddScript={h.cliCompanion.addScript} onRemoveScript={h.cliCompanion.removeScript} onClose={() => ps.setShowCLICompanion(false)} />
      </SafePanel>
      <SafePanel show={pv.showGHActions} name="GitHub Actions">
        <GitHubActionsPanel workflows={h.githubActionsGen.workflows} onAddWorkflow={h.githubActionsGen.addWorkflow} onRemoveWorkflow={h.githubActionsGen.removeWorkflow} onToggleStep={h.githubActionsGen.toggleStep} onGenerateYAML={h.githubActionsGen.generateYAML} onClose={() => ps.setShowGHActions(false)} />
      </SafePanel>
      <SafePanel show={pv.showSlackDiscord} name="Slack/Discord">
        <SlackDiscordPanel bots={h.slackDiscordBot.bots} logs={h.slackDiscordBot.logs} eventLabels={h.slackDiscordBot.EVENT_LABELS} onAddBot={h.slackDiscordBot.addBot} onRemoveBot={h.slackDiscordBot.removeBot} onToggleEvent={h.slackDiscordBot.toggleEvent} onGenerateCode={h.slackDiscordBot.generateEdgeFunctionCode} onTestNotification={h.slackDiscordBot.sendTestNotification} onClose={() => ps.setShowSlackDiscord(false)} />
      </SafePanel>
      <SafePanel show={pv.showWhiteLabel} name="White Label">
        <WhiteLabelPanel config={h.whiteLabelExport.config} setConfig={h.whiteLabelExport.setConfig} files={project.files} onApply={h.whiteLabelExport.applyWhiteLabel} onPreview={h.whiteLabelExport.previewChanges} onGenerateCSS={h.whiteLabelExport.generateBrandCSS} onClose={() => ps.setShowWhiteLabel(false)} />
      </SafePanel>
      <SafePanel show={pv.showPluginSDK} name="Plugin SDK">
        <PluginSDKPanel plugins={h.pluginSDK.plugins} templates={h.pluginSDK.templates} activeTemplate={h.pluginSDK.activeTemplate} onSetActiveTemplate={h.pluginSDK.setActiveTemplate} onCreatePlugin={h.pluginSDK.createPlugin} onDeletePlugin={h.pluginSDK.deletePlugin} onPublishPlugin={h.pluginSDK.publishPlugin} onGenerateTypes={h.pluginSDK.generateSDKTypes} onClose={() => ps.setShowPluginSDK(false)} />
      </SafePanel>
      <SafePanel show={pv.showRefactoring} name="AI Refactoring">
        <AIRefactoringPanel suggestions={h.aiRefactoring.suggestions} isAnalyzing={h.aiRefactoring.isAnalyzing} stats={h.aiRefactoring.stats} onAnalyze={() => h.aiRefactoring.analyzeProject(project.files)} onApplyRefactor={(s: any) => { sendMessage(s.suggestedPrompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel); h.aiRefactoring.markApplied(s.id); }} onDismiss={h.aiRefactoring.dismissSuggestion} onClearAll={h.aiRefactoring.clearAll} onClose={() => ps.setShowRefactoring(false)} />
      </SafePanel>
      <SafePanel show={pv.showNLRegex} name="NL Regex">
        <NLRegexPanel entries={h.nlToRegex.entries} currentPattern={h.nlToRegex.currentPattern} currentFlags={h.nlToRegex.currentFlags} testInput={h.nlToRegex.testInput} commonPatterns={h.nlToRegex.commonPatterns} onSetPattern={h.nlToRegex.setCurrentPattern} onSetFlags={h.nlToRegex.setCurrentFlags} onSetTestInput={h.nlToRegex.setTestInput} onAddEntry={h.nlToRegex.addEntry} onQuickMatch={h.nlToRegex.quickMatch} onSendToAI={(p: string) => sendMessage(p, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)} onClose={() => ps.setShowNLRegex(false)} />
      </SafePanel>
      <SafePanel show={pv.showCommitMsg} name="Commit Messages">
        <CommitMessagePanel messages={h.aiCommitMessages.messages} diffs={h.aiCommitMessages.currentDiffs} typeLabels={h.aiCommitMessages.typeLabels} onGenerate={() => { const diffs = h.aiCommitMessages.computeDiffs(previousFiles || [], project.files); h.aiCommitMessages.generateLocal(diffs); }} onGenerateAI={(p: string) => sendMessage(p, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)} onClear={h.aiCommitMessages.clearHistory} onClose={() => ps.setShowCommitMsg(false)} />
      </SafePanel>
      <SafePanel show={pv.showAutoImport} name="Auto Import">
        <AutoImportPanel suggestions={h.smartAutoImport.suggestions} onApply={(s: any) => { const file = project.files.find((f: ProjectFile) => f.path === s.filePath); if (file) { const updated = h.smartAutoImport.applyImport(file.content, s.importStatement); upsertFile(s.filePath, updated); } }} onAnalyze={() => { const af = activeFile ? project.files.find((f: ProjectFile) => f.path === activeFile.path) : null; if (af) h.smartAutoImport.analyzeFile(af.content, af.path, project.files); }} onClear={h.smartAutoImport.clearSuggestions} onClose={() => ps.setShowAutoImport(false)} />
      </SafePanel>
      <SafePanel show={pv.showDocWriter} name="Doc Writer">
        <AIDocWriterPanel results={h.aiDocWriter.results} verbosity={h.aiDocWriter.verbosity} onSetVerbosity={h.aiDocWriter.setVerbosity} onGenerateJSDoc={() => { const af = activeFile ? project.files.find((f: ProjectFile) => f.path === activeFile.path) : null; if (af) sendMessage(h.aiDocWriter.buildJSDocPrompt(af, h.aiDocWriter.verbosity), project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel); }} onGenerateReadme={() => sendMessage(h.aiDocWriter.buildReadmePrompt(project.files, project.name, h.aiDocWriter.verbosity), project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)} onGenerateAPIDoc={() => { const af = activeFile ? project.files.find((f: ProjectFile) => f.path === activeFile.path) : null; if (af) sendMessage(h.aiDocWriter.buildAPIDocPrompt(af, h.aiDocWriter.verbosity), project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel); }} onGenerateComponentDoc={() => { const af = activeFile ? project.files.find((f: ProjectFile) => f.path === activeFile.path) : null; if (af) sendMessage(h.aiDocWriter.buildComponentDocPrompt(af, h.aiDocWriter.verbosity), project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel); }} onClose={() => ps.setShowDocWriter(false)} />
      </SafePanel>
      <SafePanel show={pv.showCoEditing} name="Co-Editing">
        <CoEditingPanel sessions={h.coEditing.sessions} activeSessionId={h.coEditing.activeSessionId} isConnected={h.coEditing.isConnected} conflictCount={h.coEditing.conflictCount} onStartSession={(fp: string) => h.coEditing.startSession(fp, 'self', 'me@local')} onJoinSession={(id: string) => h.coEditing.joinSession(id, 'self', 'me@local')} onEndSession={h.coEditing.endSession} onClose={() => ps.setShowCoEditing(false)} />
      </SafePanel>
      <SafePanel show={pv.showVoiceChat} name="Voice Chat">
        <VoiceChatPanel channels={h.voiceChat.channels} activeChannelId={h.voiceChat.activeChannelId} isMuted={h.voiceChat.isMuted} isDeafened={h.voiceChat.isDeafened} isPushToTalk={h.voiceChat.isPushToTalk} onJoinChannel={(id: string) => h.voiceChat.joinChannel(id, 'self', 'me@local')} onLeaveChannel={h.voiceChat.leaveChannel} onToggleMute={h.voiceChat.toggleMute} onToggleDeafen={h.voiceChat.toggleDeafen} onTogglePTT={h.voiceChat.togglePushToTalk} onCreateChannel={h.voiceChat.createChannel} onClose={() => ps.setShowVoiceChat(false)} />
      </SafePanel>
      <SafePanel show={pv.showScreenShare} name="Screen Share">
        <ScreenSharePanel sessions={h.screenShare.sessions} activeSessionId={h.screenShare.activeSessionId} isSharing={h.screenShare.isSharing} isViewing={h.screenShare.isViewing} selectedTool={h.screenShare.selectedTool} annotationColor={h.screenShare.annotationColor} onStartSharing={() => h.screenShare.startSharing('self', 'me@local')} onStopSharing={h.screenShare.stopSharing} onJoinViewing={(id: string) => h.screenShare.joinViewing(id, 'self', 'me@local')} onSetTool={h.screenShare.setSelectedTool} onSetColor={h.screenShare.setAnnotationColor} onClearAnnotations={() => { const s = h.screenShare.getActiveSession(); if (s) h.screenShare.clearAnnotations(s.id); }} onClose={() => ps.setShowScreenShare(false)} />
      </SafePanel>
      <SafePanel show={pv.showCodeReactions} name="Code Reactions">
        <CodeReactionsPanel reactions={h.codeReactions.reactions} annotations={h.codeReactions.annotations} availableEmojis={h.codeReactions.availableEmojis} onAddReaction={(fp: string, l: number, e: string) => h.codeReactions.addReaction(fp, l, e, 'self', 'me@local')} onAddAnnotation={(fp: string, ls: number, le: number, t: string) => h.codeReactions.addAnnotation(fp, ls, le, t, 'self', 'me@local', '#8b5cf6')} onResolveAnnotation={h.codeReactions.resolveAnnotation} onDeleteAnnotation={h.codeReactions.deleteAnnotation} activeFilePath={activeFile?.path} onClose={() => ps.setShowCodeReactions(false)} />
      </SafePanel>
      <SafePanel show={pv.showWhiteboard} name="Whiteboard">
        <WhiteboardPanel boards={h.whiteboard.boards} activeBoardId={h.whiteboard.activeBoardId} selectedTool={h.whiteboard.selectedTool} strokeColor={h.whiteboard.strokeColor} strokeWidth={h.whiteboard.strokeWidth} fillColor={h.whiteboard.fillColor} onSetActiveBoardId={h.whiteboard.setActiveBoardId} onSetSelectedTool={h.whiteboard.setSelectedTool} onSetStrokeColor={h.whiteboard.setStrokeColor} onSetStrokeWidth={h.whiteboard.setStrokeWidth} onSetFillColor={h.whiteboard.setFillColor} onCreateBoard={h.whiteboard.createBoard} onClearBoard={h.whiteboard.clearBoard} onDeleteBoard={h.whiteboard.deleteBoard} onZoomIn={() => { const b = h.whiteboard.getActiveBoard(); if (b) h.whiteboard.setZoom(b.id, b.zoom + 0.1); }} onZoomOut={() => { const b = h.whiteboard.getActiveBoard(); if (b) h.whiteboard.setZoom(b.id, b.zoom - 0.1); }} onClose={() => ps.setShowWhiteboard(false)} />
      </SafePanel>
      <SafePanel show={pv.showVisualRegression} name="Visual Regression">
        <VisualRegressionPanel open={pv.showVisualRegression} onClose={() => ps.setShowVisualRegression(false)} snapshots={h.visualRegression.snapshots} diffs={h.visualRegression.diffs} isCapturing={h.visualRegression.isCapturing} threshold={h.visualRegression.threshold} onSetThreshold={h.visualRegression.setThreshold} onCapture={h.visualRegression.captureSnapshot} onRunSuite={h.visualRegression.runFullSuite} onApprove={h.visualRegression.approveBaseline} />
      </SafePanel>
      <SafePanel show={pv.showA11yScore} name="Accessibility">
        <AccessibilityPanel open={pv.showA11yScore} onClose={() => ps.setShowA11yScore(false)} score={h.a11yScoring.latestScore} isScanning={h.a11yScoring.isScanning} onScan={() => h.a11yScoring.scan(project.files)} onGoToFile={(p: string) => { const f = project.files.find((f: ProjectFile) => f.path === p); if (f) setActiveFile(f.path); }} />
      </SafePanel>
      <SafePanel show={pv.showCoverage} name="Code Coverage">
        <CodeCoveragePanel open={pv.showCoverage} onClose={() => ps.setShowCoverage(false)} report={h.codeCoverage.report} isAnalyzing={h.codeCoverage.isAnalyzing} onAnalyze={() => h.codeCoverage.analyze(project.files, project.files.filter((f: ProjectFile) => f.path.includes('.test.')))} onGoToFile={(p: string) => { const f = project.files.find((f: ProjectFile) => f.path === p); if (f) setActiveFile(f.path); }} />
      </SafePanel>
      <SafePanel show={pv.showMutationTest} name="Mutation Testing">
        <MutationTestingPanel open={pv.showMutationTest} onClose={() => ps.setShowMutationTest(false)} report={h.mutationTesting.report} isRunning={h.mutationTesting.isRunning} onRun={() => h.mutationTesting.run(project.files)} onGoToFile={(p: string) => { const f = project.files.find((f: ProjectFile) => f.path === p); if (f) setActiveFile(f.path); }} />
      </SafePanel>
      <SafePanel show={pv.showLoadTest} name="Load Testing">
        <LoadTestingPanel open={pv.showLoadTest} onClose={() => ps.setShowLoadTest(false)} results={h.loadTesting.results} isRunning={h.loadTesting.isRunning} onRun={h.loadTesting.run} />
      </SafePanel>
      {/* Sprint N-AD panels with spread props */}
      <SafePanel show={pv.showPageBuilder} name="Page Builder"><PageBuilderPanel pages={h.pageBuilder.pages} activePage={h.pageBuilder.getActivePage()} blockTypes={h.pageBuilder.blockTypes} onCreatePage={h.pageBuilder.createPage} onSetActivePage={h.pageBuilder.setActivePage} onAddBlock={h.pageBuilder.addBlock} onRemoveBlock={h.pageBuilder.removeBlock} onMoveBlock={h.pageBuilder.moveBlock} onUpdateProp={h.pageBuilder.updateBlockProp} onGenerateCode={h.pageBuilder.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowPageBuilder(false)} /></SafePanel>
      <SafePanel show={pv.showThemeStudio} name="Theme Studio"><ThemeStudioPanel tokens={h.themeStudio.tokens} previewMode={h.themeStudio.previewMode} activePreset={h.themeStudio.activePreset} presets={h.themeStudio.presets} onSetPreviewMode={h.themeStudio.setPreviewMode} onUpdateToken={h.themeStudio.updateToken} onAddToken={h.themeStudio.addToken} onRemoveToken={h.themeStudio.removeToken} onApplyPreset={h.themeStudio.applyPreset} onGenerateCSS={h.themeStudio.generateCSS} onGenerateTailwind={h.themeStudio.generateTailwindConfig} onInsertCode={(code: string) => upsertFile('design-tokens.css', code)} onClose={() => ps.setShowThemeStudio(false)} /></SafePanel>
      <SafePanel show={pv.showFormBuilder} name="Form Builder"><FormBuilderPanel forms={h.formBuilder.forms} activeForm={h.formBuilder.getActiveForm()} fieldTypes={h.formBuilder.fieldTypes} onCreateForm={h.formBuilder.createForm} onSetActiveForm={h.formBuilder.setActiveForm} onAddField={h.formBuilder.addField} onUpdateField={h.formBuilder.updateField} onRemoveField={h.formBuilder.removeField} onMoveField={h.formBuilder.moveField} onGenerateZod={h.formBuilder.generateZodSchema} onGenerateReact={h.formBuilder.generateReactForm} onInsertCode={insertCode} onClose={() => ps.setShowFormBuilder(false)} /></SafePanel>
      <SafePanel show={pv.showChartDashboard} name="Chart Dashboard"><ChartDashboardPanel dashboards={h.chartDashboard.dashboards} activeDashboard={h.chartDashboard.getActiveDashboard()} chartTypes={h.chartDashboard.chartTypes} onCreateDashboard={h.chartDashboard.createDashboard} onSetActiveDashboard={h.chartDashboard.setActiveDashboard} onAddWidget={h.chartDashboard.addWidget} onUpdateWidget={h.chartDashboard.updateWidget} onRemoveWidget={h.chartDashboard.removeWidget} onGenerateCode={h.chartDashboard.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowChartDashboard(false)} /></SafePanel>
      <SafePanel show={pv.showLayoutGrid} name="Layout Grid"><LayoutGridPanel layouts={h.layoutGrid.layouts} activeLayout={h.layoutGrid.getActiveLayout()} presets={h.layoutGrid.presets} onCreateLayout={h.layoutGrid.createLayout} onSetActiveLayout={h.layoutGrid.setActiveLayout} onApplyPreset={h.layoutGrid.applyPreset} onAddArea={h.layoutGrid.addArea} onUpdateArea={h.layoutGrid.updateArea} onRemoveArea={h.layoutGrid.removeArea} onUpdateLayout={h.layoutGrid.updateLayout} onGenerateCSS={h.layoutGrid.generateCSS} onGenerateTailwind={h.layoutGrid.generateTailwind} onInsertCode={insertCode} onClose={() => ps.setShowLayoutGrid(false)} /></SafePanel>
      <SafePanel show={pv.showGraphQL} name="GraphQL"><GraphQLBuilderPanel open={pv.showGraphQL} onClose={() => ps.setShowGraphQL(false)} schemas={h.graphqlBuilder.schemas} activeSchema={h.graphqlBuilder.getActiveSchema()} scalarTypes={h.graphqlBuilder.SCALAR_TYPES} onCreateSchema={h.graphqlBuilder.createSchema} onSetActiveSchema={h.graphqlBuilder.setActiveSchemaId} onAddType={h.graphqlBuilder.addType} onAddField={h.graphqlBuilder.addField} onUpdateField={h.graphqlBuilder.updateTypeField} onRemoveField={h.graphqlBuilder.removeField} onRemoveType={h.graphqlBuilder.removeType} onAddQuery={h.graphqlBuilder.addQuery} onRemoveQuery={h.graphqlBuilder.removeQuery} onGenerateSDL={h.graphqlBuilder.generateSDL} onGenerateResolvers={h.graphqlBuilder.generateResolvers} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showWSManager} name="WebSocket"><WebSocketPanel open={pv.showWSManager} onClose={() => ps.setShowWSManager(false)} channels={h.wsManager.channels} messages={h.wsManager.messages} activeChannel={h.wsManager.getActiveChannel()} onSetActiveChannel={h.wsManager.setActiveChannelId} onCreateChannel={h.wsManager.createChannel} onUpdateChannel={h.wsManager.updateChannel} onRemoveChannel={h.wsManager.removeChannel} onAddEvent={h.wsManager.addEvent} onRemoveEvent={h.wsManager.removeEvent} onSimulateMessage={h.wsManager.simulateMessage} onClearMessages={h.wsManager.clearMessages} onGenerateServer={h.wsManager.generateServerCode} onGenerateClient={h.wsManager.generateClientCode} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showFileUpload} name="File Upload"><FileUploadPanel open={pv.showFileUpload} onClose={() => ps.setShowFileUpload(false)} configs={h.fileUploadMgr.configs} previews={h.fileUploadMgr.previews} activeConfig={h.fileUploadMgr.getActiveConfig()} mimePresets={h.fileUploadMgr.MIME_PRESETS} onSetActiveConfig={h.fileUploadMgr.setActiveConfigId} onCreateConfig={h.fileUploadMgr.createConfig} onUpdateConfig={h.fileUploadMgr.updateConfig} onRemoveConfig={h.fileUploadMgr.removeConfig} onSimulateUpload={h.fileUploadMgr.simulateUpload} onClearPreviews={h.fileUploadMgr.clearPreviews} onGeneratePolicy={h.fileUploadMgr.generateStoragePolicy} onGenerateComponent={h.fileUploadMgr.generateUploadComponent} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showPayments} name="Payments"><PaymentPanel open={pv.showPayments} onClose={() => ps.setShowPayments(false)} products={h.paymentIntegration.products} config={h.paymentIntegration.config} onSetConfig={h.paymentIntegration.setConfig} onAddProduct={h.paymentIntegration.addProduct} onUpdateProduct={h.paymentIntegration.updateProduct} onRemoveProduct={h.paymentIntegration.removeProduct} onGenerateCheckout={h.paymentIntegration.generateCheckoutCode} onGenerateWebhook={h.paymentIntegration.generateWebhookCode} onGeneratePricing={h.paymentIntegration.generatePricingComponent} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showEmailTemplates} name="Email Templates"><EmailTemplatePanel open={pv.showEmailTemplates} onClose={() => ps.setShowEmailTemplates(false)} templates={h.emailTemplates.templates} activeTemplate={h.emailTemplates.getActiveTemplate()} presetKeys={h.emailTemplates.TEMPLATE_PRESETS} onSetActiveTemplate={h.emailTemplates.setActiveTemplateId} onCreateTemplate={h.emailTemplates.createTemplate} onUpdateTemplate={h.emailTemplates.updateTemplate} onRemoveTemplate={h.emailTemplates.removeTemplate} onAddVariable={h.emailTemplates.addVariable} onRemoveVariable={h.emailTemplates.removeVariable} onPreview={h.emailTemplates.previewWithData} onGenerateSend={h.emailTemplates.generateSendFunction} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showTutorialCreator} name="Tutorial Creator"><TutorialCreatorPanel tutorials={h.tutorialCreator.tutorials} activeTutorialId={h.tutorialCreator.activeTutorialId} setActiveTutorialId={h.tutorialCreator.setActiveTutorialId} getActiveTutorial={h.tutorialCreator.getActiveTutorial} previewStepIndex={h.tutorialCreator.previewStepIndex} setPreviewStepIndex={h.tutorialCreator.setPreviewStepIndex} createTutorial={h.tutorialCreator.createTutorial} updateTutorial={h.tutorialCreator.updateTutorial} removeTutorial={h.tutorialCreator.removeTutorial} addStep={h.tutorialCreator.addStep} updateStep={h.tutorialCreator.updateStep} removeStep={h.tutorialCreator.removeStep} generateTutorialCode={h.tutorialCreator.generateTutorialCode} onInsertCode={insertCode} onClose={() => ps.setShowTutorialCreator(false)} /></SafePanel>
      <SafePanel show={pv.showCodePlayground} name="Code Playground"><CodePlaygroundPanel snippets={h.codePlayground.snippets} activeSnippetId={h.codePlayground.activeSnippetId} setActiveSnippetId={h.codePlayground.setActiveSnippetId} getActiveSnippet={h.codePlayground.getActiveSnippet} SNIPPET_TEMPLATES={h.codePlayground.SNIPPET_TEMPLATES} createSnippet={h.codePlayground.createSnippet} updateSnippet={h.codePlayground.updateSnippet} removeSnippet={h.codePlayground.removeSnippet} runSnippet={h.codePlayground.runSnippet} duplicateSnippet={h.codePlayground.duplicateSnippet} onInsertCode={insertCode} onClose={() => ps.setShowCodePlayground(false)} /></SafePanel>
      <SafePanel show={pv.showCustomLinting} name="Custom Linting"><CustomLintingPanel rules={h.customLinting.rules} results={h.customLinting.results} activeRuleId={h.customLinting.activeRuleId} setActiveRuleId={h.customLinting.setActiveRuleId} getActiveRule={h.customLinting.getActiveRule} RULE_PRESETS={h.customLinting.RULE_PRESETS} createRule={h.customLinting.createRule} updateRule={h.customLinting.updateRule} removeRule={h.customLinting.removeRule} simulateLint={h.customLinting.simulateLint} clearResults={h.customLinting.clearResults} generateEslintConfig={h.customLinting.generateEslintConfig} onInsertCode={insertCode} onClose={() => ps.setShowCustomLinting(false)} /></SafePanel>
      <SafePanel show={pv.showDepGraph} name="Dependency Graph"><DependencyGraphPanel nodes={h.dependencyGraph.nodes} edges={h.dependencyGraph.edges} circularDeps={h.dependencyGraph.circularDeps} selectedNodeId={h.dependencyGraph.selectedNodeId} setSelectedNodeId={h.dependencyGraph.setSelectedNodeId} layout={h.dependencyGraph.layout} setLayout={h.dependencyGraph.setLayout} getSelectedNode={h.dependencyGraph.getSelectedNode} getNodeDependencies={h.dependencyGraph.getNodeDependencies} getStats={h.dependencyGraph.getStats} analyzeFiles={h.dependencyGraph.analyzeFiles} onClose={() => ps.setShowDepGraph(false)} /></SafePanel>
      <SafePanel show={pv.showGitBlame} name="Git Blame"><GitBlameTimelinePanel blameFiles={h.gitBlame.blameFiles} timeline={h.gitBlame.timeline} activeFileId={h.gitBlame.activeFileId} setActiveFileId={h.gitBlame.setActiveFileId} selectedLine={h.gitBlame.selectedLine} setSelectedLine={h.gitBlame.setSelectedLine} getActiveFile={h.gitBlame.getActiveFile} getLineInfo={h.gitBlame.getLineInfo} getAuthorStats={h.gitBlame.getAuthorStats} onClose={() => ps.setShowGitBlame(false)} /></SafePanel>
      <SafePanel show={pv.showMultiRegion} name="Multi Region"><MultiRegionPanel regions={h.multiRegionDeploy.regions} config={h.multiRegionDeploy.config} setConfig={h.multiRegionDeploy.setConfig} AVAILABLE_REGIONS={h.multiRegionDeploy.AVAILABLE_REGIONS} addRegion={h.multiRegionDeploy.addRegion} removeRegion={h.multiRegionDeploy.removeRegion} setPrimary={h.multiRegionDeploy.setPrimary} toggleRegion={h.multiRegionDeploy.toggleRegion} simulateHealthCheck={h.multiRegionDeploy.simulateHealthCheck} generateNginxConfig={h.multiRegionDeploy.generateNginxConfig} onInsertCode={insertCode} onClose={() => ps.setShowMultiRegion(false)} /></SafePanel>
      <SafePanel show={pv.showFeatureFlags} name="Feature Flags"><FeatureFlagsPanel flags={h.featureFlags.flags} activeFlagId={h.featureFlags.activeFlagId} setActiveFlagId={h.featureFlags.setActiveFlagId} getActiveFlag={h.featureFlags.getActiveFlag} createFlag={h.featureFlags.createFlag} updateFlag={h.featureFlags.updateFlag} removeFlag={h.featureFlags.removeFlag} addVariant={h.featureFlags.addVariant} removeVariant={h.featureFlags.removeVariant} generateHookCode={h.featureFlags.generateHookCode} onInsertCode={insertCode} onClose={() => ps.setShowFeatureFlags(false)} /></SafePanel>
      <SafePanel show={pv.showCanaryDeploy} name="Canary Deploy"><CanaryDeployPanel deployments={h.canaryDeploy.deployments} metrics={h.canaryDeploy.metrics} activeDeploymentId={h.canaryDeploy.activeDeploymentId} setActiveDeploymentId={h.canaryDeploy.setActiveDeploymentId} getActiveDeployment={h.canaryDeploy.getActiveDeployment} createDeployment={h.canaryDeploy.createDeployment} updateDeployment={h.canaryDeploy.updateDeployment} startRollout={h.canaryDeploy.startRollout} advanceCanary={h.canaryDeploy.advanceCanary} rollback={h.canaryDeploy.rollback} shouldAutoRollback={h.canaryDeploy.shouldAutoRollback} onClose={() => ps.setShowCanaryDeploy(false)} /></SafePanel>
      <SafePanel show={pv.showSSG} name="SSG"><SSGPanel pages={h.ssgGenerator.pages} config={h.ssgGenerator.config} setConfig={h.ssgGenerator.setConfig} isGenerating={h.ssgGenerator.isGenerating} addPage={h.ssgGenerator.addPage} updatePage={h.ssgGenerator.updatePage} removePage={h.ssgGenerator.removePage} generateAll={h.ssgGenerator.generateAll} generateSitemap={h.ssgGenerator.generateSitemap} generateBuildScript={h.ssgGenerator.generateBuildScript} getStats={h.ssgGenerator.getStats} onInsertCode={insertCode} onClose={() => ps.setShowSSG(false)} /></SafePanel>
      <SafePanel show={pv.showDockerExport} name="Docker Export"><DockerExportPanel config={h.dockerExport.config} setConfig={h.dockerExport.setConfig} services={h.dockerExport.services} addEnvVar={h.dockerExport.addEnvVar} removeEnvVar={h.dockerExport.removeEnvVar} addService={h.dockerExport.addService} removeService={h.dockerExport.removeService} generateDockerfile={h.dockerExport.generateDockerfile} generateDockerCompose={h.dockerExport.generateDockerCompose} generateNginxConf={h.dockerExport.generateNginxConf} onInsertCode={insertCode} onClose={() => ps.setShowDockerExport(false)} /></SafePanel>
      <SafePanel show={pv.showSubscriptions} name="Subscriptions"><SubscriptionManagerPanel open={pv.showSubscriptions} onClose={() => ps.setShowSubscriptions(false)} plans={h.subscriptionMgr.plans} activePlanId={h.subscriptionMgr.activePlanId} setActivePlanId={h.subscriptionMgr.setActivePlanId} getActivePlan={h.subscriptionMgr.getActivePlan} stats={h.subscriptionMgr.getStats()} createPlan={h.subscriptionMgr.createPlan} updatePlan={h.subscriptionMgr.updatePlan} removePlan={h.subscriptionMgr.removePlan} addFeature={h.subscriptionMgr.addFeature} removeFeature={h.subscriptionMgr.removeFeature} generatePricingPage={h.subscriptionMgr.generatePricingPage} generateWebhookHandler={h.subscriptionMgr.generateWebhookHandler} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showInvoices} name="Invoices"><InvoiceGeneratorPanel open={pv.showInvoices} onClose={() => ps.setShowInvoices(false)} invoices={h.invoiceGen.invoices} activeInvoiceId={h.invoiceGen.activeInvoiceId} setActiveInvoiceId={h.invoiceGen.setActiveInvoiceId} getActiveInvoice={h.invoiceGen.getActiveInvoice} createInvoice={h.invoiceGen.createInvoice} updateInvoice={h.invoiceGen.updateInvoice} removeInvoice={h.invoiceGen.removeInvoice} addItem={h.invoiceGen.addItem} removeItem={h.invoiceGen.removeItem} calculateTotal={h.invoiceGen.calculateTotal} generateInvoiceComponent={h.invoiceGen.generateInvoiceComponent} generatePDFExport={h.invoiceGen.generatePDFExport} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showUsageMetering} name="Usage Metering"><UsageMeteringPanel open={pv.showUsageMetering} onClose={() => ps.setShowUsageMetering(false)} meters={h.usageMetering.meters} activeMeterId={h.usageMetering.activeMeterId} setActiveMeterId={h.usageMetering.setActiveMeterId} getActiveMeter={h.usageMetering.getActiveMeter} UNIT_PRESETS={h.usageMetering.UNIT_PRESETS} createMeter={h.usageMetering.createMeter} updateMeter={h.usageMetering.updateMeter} removeMeter={h.usageMetering.removeMeter} recordUsage={h.usageMetering.recordUsage} getMeterUsagePercent={h.usageMetering.getMeterUsagePercent} calculateOverage={h.usageMetering.calculateOverage} generateMeteringMiddleware={h.usageMetering.generateMeteringMiddleware} generateUsageDashboard={h.usageMetering.generateUsageDashboard} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showAffiliates} name="Affiliates"><AffiliateTrackingPanel open={pv.showAffiliates} onClose={() => ps.setShowAffiliates(false)} affiliates={h.affiliateTracking.affiliates} referrals={h.affiliateTracking.referrals} activeAffiliateId={h.affiliateTracking.activeAffiliateId} setActiveAffiliateId={h.affiliateTracking.setActiveAffiliateId} getActiveAffiliate={h.affiliateTracking.getActiveAffiliate} defaultCommission={h.affiliateTracking.defaultCommission} setDefaultCommission={h.affiliateTracking.setDefaultCommission} stats={h.affiliateTracking.getStats()} createAffiliate={h.affiliateTracking.createAffiliate} updateAffiliate={h.affiliateTracking.updateAffiliate} removeAffiliate={h.affiliateTracking.removeAffiliate} addReferral={h.affiliateTracking.addReferral} generateTrackingScript={h.affiliateTracking.generateTrackingScript} generateAffiliateDashboard={h.affiliateTracking.generateAffiliateDashboard} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showRevenue} name="Revenue"><RevenueDashboardPanel open={pv.showRevenue} onClose={() => ps.setShowRevenue(false)} entries={h.revenueDashboard.entries} dateRange={h.revenueDashboard.dateRange} setDateRange={h.revenueDashboard.setDateRange} metrics={h.revenueDashboard.getMetrics()} revenueBySource={h.revenueDashboard.getRevenueBySource()} dailyRevenue={h.revenueDashboard.getDailyRevenue()} seedDemoData={h.revenueDashboard.seedDemoData} generateDashboardComponent={h.revenueDashboard.generateDashboardComponent} onInsertCode={insertCode} /></SafePanel>
      <SafePanel show={pv.showCapacitor} name="Capacitor"><CapacitorExportPanel config={h.capacitorExport.config} exportResult={h.capacitorExport.exportResult} availablePermissions={h.capacitorExport.availablePermissions} onUpdateConfig={h.capacitorExport.updateConfig} onTogglePlatform={h.capacitorExport.togglePlatform} onTogglePermission={h.capacitorExport.togglePermission} onGenerate={h.capacitorExport.generateExport} onInsertCode={insertCode} onClose={() => ps.setShowCapacitor(false)} /></SafePanel>
      <SafePanel show={pv.showPushNotifications} name="Push Notifications"><PushNotificationPanel notifications={h.pushNotifications.notifications} segments={h.pushNotifications.segments} onAddNotification={h.pushNotifications.addNotification} onUpdateNotification={h.pushNotifications.updateNotification} onRemoveNotification={h.pushNotifications.removeNotification} onGenerateCode={h.pushNotifications.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowPushNotifications(false)} /></SafePanel>
      <SafePanel show={pv.showOfflineFirst} name="Offline First"><OfflineFirstPanel config={h.offlineFirst.config} isOnline={h.offlineFirst.isOnline} onUpdateConfig={h.offlineFirst.updateConfig} onAddTable={h.offlineFirst.addOfflineTable} onRemoveTable={h.offlineFirst.removeOfflineTable} onToggleOnline={h.offlineFirst.toggleOnline} onGenerateSW={h.offlineFirst.generateServiceWorker} onGenerateSyncHook={h.offlineFirst.generateSyncHook} onInsertCode={insertCode} onClose={() => ps.setShowOfflineFirst(false)} /></SafePanel>
      <SafePanel show={pv.showGestureBuilder} name="Gesture Builder"><GestureBuilderPanel mappings={h.gestureBuilder.mappings} gesturePresets={h.gestureBuilder.gesturePresets} animationPresets={h.gestureBuilder.animationPresets} onAddMapping={h.gestureBuilder.addMapping} onUpdateMapping={h.gestureBuilder.updateMapping} onRemoveMapping={h.gestureBuilder.removeMapping} onGenerateCode={h.gestureBuilder.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowGestureBuilder(false)} /></SafePanel>
      <SafePanel show={pv.showAppStoreAssets} name="App Store Assets"><AppStoreAssetsPanel metadata={h.appStoreAssets.metadata} screenshots={h.appStoreAssets.screenshots} devicePresets={h.appStoreAssets.devicePresets} appCategories={h.appStoreAssets.appCategories} onUpdateMetadata={h.appStoreAssets.updateMetadata} onAddKeyword={h.appStoreAssets.addKeyword} onRemoveKeyword={h.appStoreAssets.removeKeyword} onAddScreenshot={h.appStoreAssets.addScreenshot} onUpdateScreenshot={h.appStoreAssets.updateScreenshot} onRemoveScreenshot={h.appStoreAssets.removeScreenshot} onGenerateFastlane={h.appStoreAssets.generateFastlaneMetadata} onGenerateStoreListing={h.appStoreAssets.generateStoreListingHTML} onInsertCode={insertCode} onClose={() => ps.setShowAppStoreAssets(false)} /></SafePanel>
      <SafePanel show={pv.showCodeTranslator} name="Code Translator"><CodeTranslatorPanel sourceLanguage={h.codeTranslator.sourceLanguage} targetLanguage={h.codeTranslator.targetLanguage} sourceCode={h.codeTranslator.sourceCode} supportedLanguages={h.codeTranslator.supportedLanguages} jobs={h.codeTranslator.jobs} onSetSourceLanguage={h.codeTranslator.setSourceLanguage} onSetTargetLanguage={h.codeTranslator.setTargetLanguage} onSetSourceCode={h.codeTranslator.setSourceCode} onTranslate={h.codeTranslator.translate} onRemoveJob={h.codeTranslator.removeJob} onInsertCode={insertCode} onClose={() => ps.setShowCodeTranslator(false)} /></SafePanel>
      <SafePanel show={pv.showSmartScaffold} name="Smart Scaffold"><SmartScaffoldingPanel templates={h.smartScaffolding.templates} selectedTemplate={h.smartScaffolding.selectedTemplate} entityName={h.smartScaffolding.entityName} onSetSelectedTemplate={h.smartScaffolding.setSelectedTemplate} onSetEntityName={h.smartScaffolding.setEntityName} onScaffold={h.smartScaffolding.scaffold} onInsertCode={insertCode} onClose={() => ps.setShowSmartScaffold(false)} /></SafePanel>
      <SafePanel show={pv.showWorkflowAutomation} name="Workflow Automation"><WorkflowAutomationPanel workflows={h.workflowAutomation.workflows} nlPrompt={h.workflowAutomation.nlPrompt} onSetNlPrompt={h.workflowAutomation.setNlPrompt} onAddWorkflow={h.workflowAutomation.addWorkflow} onRemoveWorkflow={h.workflowAutomation.removeWorkflow} onToggleWorkflow={h.workflowAutomation.toggleWorkflow} onGenerateFromNL={h.workflowAutomation.generateFromNL} onGenerateCode={h.workflowAutomation.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowWorkflowAutomation(false)} /></SafePanel>
      <SafePanel show={pv.showPerfOptimizer} name="Perf Optimizer"><PerfOptimizerPanel report={h.perfOptimizer.report} isAnalyzing={h.perfOptimizer.isAnalyzing} autoOptimize={h.perfOptimizer.autoOptimize} onSetAutoOptimize={h.perfOptimizer.setAutoOptimize} onAnalyze={() => h.perfOptimizer.analyze(project.files)} onGenerateCode={h.perfOptimizer.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowPerfOptimizer(false)} /></SafePanel>
      <SafePanel show={pv.showSecurityAuditor} name="Security Auditor"><SecurityAuditorPanel report={h.securityAuditor.report} isScanning={h.securityAuditor.isScanning} onScan={() => h.securityAuditor.scan(project.files)} onGenerateCode={h.securityAuditor.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowSecurityAuditor(false)} /></SafePanel>
      <SafePanel show={pv.showStateMachine} name="State Machine"><StateMachinePanel config={h.stateMachineDesigner.config} onSetMachineName={h.stateMachineDesigner.setMachineName} onAddState={h.stateMachineDesigner.addState} onRemoveState={h.stateMachineDesigner.removeState} onUpdateState={h.stateMachineDesigner.updateState} onAddTransition={h.stateMachineDesigner.addTransition} onRemoveTransition={h.stateMachineDesigner.removeTransition} onAddContextField={h.stateMachineDesigner.addContextField} onRemoveContextField={h.stateMachineDesigner.removeContextField} onGenerateCode={h.stateMachineDesigner.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowStateMachine(false)} /></SafePanel>
      <SafePanel show={pv.showDataValidation} name="Data Validation"><DataValidationPanel schemas={h.dataValidation.schemas} activeSchemaId={h.dataValidation.activeSchemaId} onSetActiveSchema={h.dataValidation.setActiveSchemaId} activeSchema={h.dataValidation.getActiveSchema()} onCreateSchema={h.dataValidation.createSchema} onDeleteSchema={h.dataValidation.deleteSchema} onAddField={h.dataValidation.addField} onRemoveField={h.dataValidation.removeField} onUpdateField={h.dataValidation.updateField} onGenerateCode={h.dataValidation.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowDataValidation(false)} /></SafePanel>
      <SafePanel show={pv.showCacheStrategy} name="Cache Strategy"><CacheStrategyPanel rules={h.cacheStrategy.rules} presets={h.cacheStrategy.presets} onAddRule={h.cacheStrategy.addRule} onRemoveRule={h.cacheStrategy.removeRule} onUpdateRule={h.cacheStrategy.updateRule} onApplyPreset={h.cacheStrategy.applyPreset} formatDuration={h.cacheStrategy.formatDuration} onGenerateCode={h.cacheStrategy.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowCacheStrategy(false)} /></SafePanel>
      <SafePanel show={pv.showReactiveStore} name="Reactive Store"><ReactiveStorePanel slices={h.reactiveStore.slices} activeSliceId={h.reactiveStore.activeSliceId} onSetActiveSlice={h.reactiveStore.setActiveSliceId} activeSlice={h.reactiveStore.getActiveSlice()} onCreateSlice={h.reactiveStore.createSlice} onDeleteSlice={h.reactiveStore.deleteSlice} onUpdateSlice={h.reactiveStore.updateSlice} onAddField={h.reactiveStore.addField} onRemoveField={h.reactiveStore.removeField} onAddAction={h.reactiveStore.addAction} onRemoveAction={h.reactiveStore.removeAction} onAddSelector={h.reactiveStore.addSelector} onRemoveSelector={h.reactiveStore.removeSelector} onGenerateCode={h.reactiveStore.generateCode} onInsertCode={insertCode} onClose={() => ps.setShowReactiveStore(false)} /></SafePanel>
      <SafePanel show={pv.showDataMigration} name="Data Migration"><DataMigrationPanel migrations={h.dataMigration.migrations} activeMigrationId={h.dataMigration.activeMigrationId} onSetActiveMigration={h.dataMigration.setActiveMigrationId} activeMigration={h.dataMigration.getActiveMigration()} onCreateMigration={h.dataMigration.createMigration} onDeleteMigration={h.dataMigration.deleteMigration} onAddAction={h.dataMigration.addAction} onRemoveAction={h.dataMigration.removeAction} onGenerateSQL={h.dataMigration.generateUpSQL} onInsertCode={insertCode} onClose={() => ps.setShowDataMigration(false)} /></SafePanel>
      {/* Sprint V-AD: Spread-prop panels */}
      <SafePanel show={pv.showRegexPlayground} name="Regex Playground"><RegexPlaygroundPanel {...h.regexPlayground} onInsertCode={insertCode} onClose={() => ps.setShowRegexPlayground(false)} /></SafePanel>
      <SafePanel show={pv.showJsonYamlConverter} name="JSON/YAML"><JsonYamlConverterPanel {...h.jsonYamlConverter} onInsertCode={insertCode} onClose={() => ps.setShowJsonYamlConverter(false)} /></SafePanel>
      <SafePanel show={pv.showColorContrast} name="Color Contrast"><ColorContrastPanel {...h.colorContrast} onInsertCode={insertCode} onClose={() => ps.setShowColorContrast(false)} /></SafePanel>
      <SafePanel show={pv.showTailwindSorter} name="Tailwind Sorter"><TailwindSorterPanel {...h.tailwindSorter} onInsertCode={insertCode} onClose={() => ps.setShowTailwindSorter(false)} /></SafePanel>
      <SafePanel show={pv.showMarkdownPreview} name="Markdown Preview"><MarkdownPreviewPanel {...h.markdownPreview} onInsertCode={insertCode} onClose={() => ps.setShowMarkdownPreview(false)} /></SafePanel>
      <SafePanel show={pv.showToastDesigner} name="Toast Designer"><ToastDesignerPanel {...h.toastDesigner} onInsertCode={insertCode} onClose={() => ps.setShowToastDesigner(false)} /></SafePanel>
      <SafePanel show={pv.showNotifCenter} name="Notification Center"><NotificationCenterPanel {...h.notifCenter} onInsertCode={insertCode} onClose={() => ps.setShowNotifCenter(false)} /></SafePanel>
      <SafePanel show={pv.showChatWidget} name="Chat Widget"><ChatWidgetPanel {...h.chatWidget} onInsertCode={insertCode} onClose={() => ps.setShowChatWidget(false)} /></SafePanel>
      <SafePanel show={pv.showEmailSequence} name="Email Sequence"><EmailSequencePanel {...h.emailSequence} onInsertCode={insertCode} onClose={() => ps.setShowEmailSequence(false)} /></SafePanel>
      <SafePanel show={pv.showSMSTemplate} name="SMS Template"><SMSTemplatePanel {...h.smsTemplate} onInsertCode={insertCode} onClose={() => ps.setShowSMSTemplate(false)} /></SafePanel>
      <SafePanel show={pv.showStepperWizard} name="Stepper Wizard"><StepperWizardPanel {...h.stepperWizard} onInsertCode={insertCode} onClose={() => ps.setShowStepperWizard(false)} /></SafePanel>
      <SafePanel show={pv.showCommandMenuBuilder} name="Command Menu"><CommandMenuPanel {...h.commandMenuBuilder} onInsertCode={insertCode} onClose={() => ps.setShowCommandMenuBuilder(false)} /></SafePanel>
      <SafePanel show={pv.showBreadcrumbGen} name="Breadcrumb"><BreadcrumbPanel {...h.breadcrumbGen} onInsertCode={insertCode} onClose={() => ps.setShowBreadcrumbGen(false)} /></SafePanel>
      <SafePanel show={pv.showMegaMenu} name="Mega Menu"><MegaMenuPanel {...h.megaMenu} onInsertCode={insertCode} onClose={() => ps.setShowMegaMenu(false)} /></SafePanel>
      <SafePanel show={pv.showContextMenu} name="Context Menu"><ContextMenuPanel {...h.contextMenuDesigner} onInsertCode={insertCode} onClose={() => ps.setShowContextMenu(false)} /></SafePanel>
      <SafePanel show={pv.showDockerCompose} name="Docker Compose"><DockerComposePanel {...h.dockerCompose} onInsertCode={insertCode} onClose={() => ps.setShowDockerCompose(false)} /></SafePanel>
      <SafePanel show={pv.showK8s} name="Kubernetes"><KubernetesPanel {...h.k8sGenerator} onInsertCode={insertCode} onClose={() => ps.setShowK8s(false)} /></SafePanel>
      <SafePanel show={pv.showCICDPipeline} name="CI/CD Pipeline"><CICDPipelinePanel {...h.cicdPipeline} onInsertCode={insertCode} onClose={() => ps.setShowCICDPipeline(false)} /></SafePanel>
      <SafePanel show={pv.showStructuredLogger} name="Structured Logger"><StructuredLoggerPanel {...h.structuredLogger} onInsertCode={insertCode} onClose={() => ps.setShowStructuredLogger(false)} /></SafePanel>
      <SafePanel show={pv.showHealthCheck} name="Health Check"><HealthCheckPanel {...h.healthCheck} onInsertCode={insertCode} onClose={() => ps.setShowHealthCheck(false)} /></SafePanel>
      <SafePanel show={pv.showOAuthSetup} name="OAuth Setup"><OAuthSetupPanel {...h.oauthSetup} onInsertCode={insertCode} onClose={() => ps.setShowOAuthSetup(false)} /></SafePanel>
      <SafePanel show={pv.showMFAFlow} name="MFA Flow"><MFAFlowPanel {...h.mfaFlow} onInsertCode={insertCode} onClose={() => ps.setShowMFAFlow(false)} /></SafePanel>
      <SafePanel show={pv.showSessionMgr} name="Session Manager"><SessionManagerPanel {...h.sessionMgr} onInsertCode={insertCode} onClose={() => ps.setShowSessionMgr(false)} /></SafePanel>
      <SafePanel show={pv.showAPIKeyMgmt} name="API Key Mgmt"><APIKeyPanel {...h.apiKeyMgmt} onInsertCode={insertCode} onClose={() => ps.setShowAPIKeyMgmt(false)} /></SafePanel>
      <SafePanel show={pv.showPermMatrix} name="Permission Matrix"><PermissionMatrixPanel {...h.permMatrix} onInsertCode={insertCode} onClose={() => ps.setShowPermMatrix(false)} /></SafePanel>
      <SafePanel show={pv.showRichTextConfig} name="Rich Text Config"><RichTextConfigPanel {...h.richTextConfig} onInsertCode={insertCode} onClose={() => ps.setShowRichTextConfig(false)} /></SafePanel>
      <SafePanel show={pv.showFilePreviewGen} name="File Preview Gen"><FilePreviewGenPanel {...h.filePreviewGen} onInsertCode={insertCode} onClose={() => ps.setShowFilePreviewGen(false)} /></SafePanel>
      <SafePanel show={pv.showAvatarGen} name="Avatar Gen"><AvatarGenPanel {...h.avatarGen} onInsertCode={insertCode} onClose={() => ps.setShowAvatarGen(false)} /></SafePanel>
      <SafePanel show={pv.showCarouselBuilder} name="Carousel Builder"><CarouselBuilderPanel {...h.carouselBuilder} onInsertCode={insertCode} onClose={() => ps.setShowCarouselBuilder(false)} /></SafePanel>
      <SafePanel show={pv.showGalleryLightbox} name="Gallery Lightbox"><GalleryLightboxPanel {...h.galleryLightbox} onInsertCode={insertCode} onClose={() => ps.setShowGalleryLightbox(false)} /></SafePanel>
      <SafePanel show={pv.showFTS} name="Full Text Search"><FullTextSearchPanel {...h.ftsSetup} onInsertCode={insertCode} onClose={() => ps.setShowFTS(false)} /></SafePanel>
      <SafePanel show={pv.showFacetedFilter} name="Faceted Filter"><FacetedFilterPanel {...h.facetedFilter} onInsertCode={insertCode} onClose={() => ps.setShowFacetedFilter(false)} /></SafePanel>
      <SafePanel show={pv.showAutocomplete} name="Autocomplete"><AutocompletePanel {...h.autocompleteGen} onInsertCode={insertCode} onClose={() => ps.setShowAutocomplete(false)} /></SafePanel>
      <SafePanel show={pv.showTagSystem} name="Tag System"><TagSystemPanel {...h.tagSystem} onInsertCode={insertCode} onClose={() => ps.setShowTagSystem(false)} /></SafePanel>
      <SafePanel show={pv.showSEOMeta} name="SEO Meta"><SEOMetaPanel {...h.seoMetaGen} onInsertCode={insertCode} onClose={() => ps.setShowSEOMeta(false)} /></SafePanel>
      <SafePanel show={pv.showKPIDashboard} name="KPI Dashboard"><KPIDashboardPanel {...h.kpiDashboard} onInsertCode={insertCode} onClose={() => ps.setShowKPIDashboard(false)} /></SafePanel>
      <SafePanel show={pv.showAlertingRules} name="Alerting Rules"><AlertingRulesPanel {...h.alertingRules} onInsertCode={insertCode} onClose={() => ps.setShowAlertingRules(false)} /></SafePanel>
      <SafePanel show={pv.showAuditTrail} name="Audit Trail"><AuditTrailPanel {...h.auditTrail} onInsertCode={insertCode} onClose={() => ps.setShowAuditTrail(false)} /></SafePanel>
      <SafePanel show={pv.showClickHeatmap} name="Click Heatmap"><ClickHeatmapPanel {...h.clickHeatmap} onInsertCode={insertCode} onClose={() => ps.setShowClickHeatmap(false)} /></SafePanel>
      <SafePanel show={pv.showBudgetMonitor} name="Budget Monitor"><BudgetMonitorPanel {...h.budgetMonitor} onInsertCode={insertCode} onClose={() => ps.setShowBudgetMonitor(false)} /></SafePanel>
      <SafePanel show={pv.showChangelogAuto} name="Changelog Auto"><ChangelogAutoPanel {...h.changelogAutoGen} onInsertCode={insertCode} onClose={() => ps.setShowChangelogAuto(false)} /></SafePanel>
      <SafePanel show={pv.showREADMEGen} name="README Gen"><READMEGeneratorPanel {...h.readmeGen} files={project.files} onInsertCode={insertCode} onClose={() => ps.setShowREADMEGen(false)} /></SafePanel>
      <SafePanel show={pv.showLicensePicker} name="License Picker"><LicensePickerPanel {...h.licensePicker} onInsertCode={insertCode} onClose={() => ps.setShowLicensePicker(false)} /></SafePanel>
      <SafePanel show={pv.showOpenAPISpec} name="OpenAPI Spec"><OpenAPISpecPanel {...h.openAPISpec} onInsertCode={insertCode} onClose={() => ps.setShowOpenAPISpec(false)} /></SafePanel>
      <SafePanel show={pv.showProjectHealth} name="Project Health"><ProjectHealthPanel {...h.projectHealth} files={project.files} onInsertCode={insertCode} onClose={() => ps.setShowProjectHealth(false)} /></SafePanel>
    </>
  );
}
