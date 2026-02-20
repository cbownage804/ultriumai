// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useEnvironmentManager } from '@/hooks/useEnvironmentManager';
import { useOneClickRollback } from '@/hooks/useOneClickRollback';
import { useUptimeMonitor } from '@/hooks/useUptimeMonitor';
import { useBuildCacheManager } from '@/hooks/useBuildCacheManager';
import { useCustomBuildScripts } from '@/hooks/useCustomBuildScripts';
import { useCMSMode } from '@/hooks/useCMSMode';
import { useMarkdownBlog } from '@/hooks/useMarkdownBlog';
import { useImageOptimizer } from '@/hooks/useImageOptimizer';
import { useVideoEmbedManager } from '@/hooks/useVideoEmbedManager';
import { useI18nGenerator } from '@/hooks/useI18nGenerator';
import { useBuiltInAnalytics } from '@/hooks/useBuiltInAnalytics';
import { useErrorTracking } from '@/hooks/useErrorTracking';
import { useSessionReplay } from '@/hooks/useSessionReplay';
import { useABTesting } from '@/hooks/useABTesting';
import { useAIUsageAnalytics } from '@/hooks/useAIUsageAnalytics';
import { useDependencyScanner } from '@/hooks/useDependencyScanner';
import { useCSPGenerator } from '@/hooks/useCSPGenerator';
import { useGDPRCompliance } from '@/hooks/useGDPRCompliance';
import { useRateLimiter } from '@/hooks/useRateLimiter';
import { useSecretRotation } from '@/hooks/useSecretRotation';
import { useSnippetLibrary } from '@/hooks/useSnippetLibrary';
import { useSplitDiffEditor } from '@/hooks/useSplitDiffEditor';
import { useCommentSystem } from '@/hooks/useCommentSystem';
import { useTeamActivityFeed } from '@/hooks/useTeamActivityFeed';
import { useApprovalWorkflow } from '@/hooks/useApprovalWorkflow';
import { useProjectForking } from '@/hooks/useProjectForking';
import { useFigmaImport } from '@/hooks/useFigmaImport';
import { useColorPaletteExtractor } from '@/hooks/useColorPaletteExtractor';
import { useIconPicker } from '@/hooks/useIconPicker';
import { useResponsiveBreakpointEditor } from '@/hooks/useResponsiveBreakpointEditor';
import { useAnimationBuilder } from '@/hooks/useAnimationBuilder';
import { useVisualSchemaBuilder } from '@/hooks/useVisualSchemaBuilder';
import { useSeedDataGenerator } from '@/hooks/useSeedDataGenerator';
import { useAPIEndpointTester } from '@/hooks/useAPIEndpointTester';
import { useWebhookBuilder } from '@/hooks/useWebhookBuilder';
import { useCronJobScheduler } from '@/hooks/useCronJobScheduler';

import {
  EnvironmentManagerPanel, RollbackPanel, UptimeMonitorPanel,
  BuildCachePanel, BuildScriptsPanel, CMSModePanel, MarkdownBlogPanel,
  ImageOptimizerPanel, VideoEmbedPanel, I18nPanel,
  AnalyticsDashboardPanel, ErrorTrackingPanel, SessionReplayPanel,
  ABTestingPanel, AIUsagePanel, DependencyScannerPanel, CSPGeneratorPanel,
  GDPRPanel, RateLimiterPanel, SecretRotationPanel,
  SnippetLibraryPanel, SplitDiffPanel, CommentPanel, TeamActivityPanel,
  ApprovalPanel, ForkingPanel,
  FigmaImportPanel, ColorPaletteExtractorPanel, IconPickerPanel,
  BreakpointEditorPanel, AnimationBuilderPanel,
  VisualSchemaBuilderPanel, SeedDataPanel,
  APIEndpointTesterPanel, WebhookBuilderPanel, CronSchedulerPanel,
} from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  // Infrastructure
  showEnvManager: boolean; setShowEnvManager: (v: boolean) => void;
  showRollback: boolean; setShowRollback: (v: boolean) => void;
  showUptimeMonitor: boolean; setShowUptimeMonitor: (v: boolean) => void;
  showBuildCache: boolean; setShowBuildCache: (v: boolean) => void;
  showBuildScripts: boolean; setShowBuildScripts: (v: boolean) => void;
  showCMSMode: boolean; setShowCMSMode: (v: boolean) => void;
  showBlogEngine: boolean; setShowBlogEngine: (v: boolean) => void;
  showImageOptimizer: boolean; setShowImageOptimizer: (v: boolean) => void;
  showVideoEmbed: boolean; setShowVideoEmbed: (v: boolean) => void;
  showI18n: boolean; setShowI18n: (v: boolean) => void;
  // Analytics
  showAnalyticsDashboard: boolean; setShowAnalyticsDashboard: (v: boolean) => void;
  showErrorTracking: boolean; setShowErrorTracking: (v: boolean) => void;
  showSessionReplay: boolean; setShowSessionReplay: (v: boolean) => void;
  showABTesting: boolean; setShowABTesting: (v: boolean) => void;
  showAIUsage: boolean; setShowAIUsage: (v: boolean) => void;
  // Security
  showDepScanner: boolean; setShowDepScanner: (v: boolean) => void;
  showCSPGenerator: boolean; setShowCSPGenerator: (v: boolean) => void;
  showGDPR: boolean; setShowGDPR: (v: boolean) => void;
  showRateLimiter: boolean; setShowRateLimiter: (v: boolean) => void;
  showSecretRotation: boolean; setShowSecretRotation: (v: boolean) => void;
  // Collab tools
  showSnippetLibrary: boolean; setShowSnippetLibrary: (v: boolean) => void;
  showSplitDiff: boolean; setShowSplitDiff: (v: boolean) => void;
  showComments: boolean; setShowComments: (v: boolean) => void;
  showTeamActivity: boolean; setShowTeamActivity: (v: boolean) => void;
  showApprovals: boolean; setShowApprovals: (v: boolean) => void;
  showForking: boolean; setShowForking: (v: boolean) => void;
  // Design tools
  showFigmaImport: boolean; setShowFigmaImport: (v: boolean) => void;
  showColorExtractor: boolean; setShowColorExtractor: (v: boolean) => void;
  showIconPicker: boolean; setShowIconPicker: (v: boolean) => void;
  showBreakpointEditor: boolean; setShowBreakpointEditor: (v: boolean) => void;
  showAnimationBuilder: boolean; setShowAnimationBuilder: (v: boolean) => void;
  showVisualSchema: boolean; setShowVisualSchema: (v: boolean) => void;
  showSeedData: boolean; setShowSeedData: (v: boolean) => void;
  showAPITester: boolean; setShowAPITester: (v: boolean) => void;
  showWebhookBuilder: boolean; setShowWebhookBuilder: (v: boolean) => void;
  showCronScheduler: boolean; setShowCronScheduler: (v: boolean) => void;
  // Extra
  versions: any;
  restoreVersion: (id: string) => void;
}

export function InfraPanelGroup(props: Props) {
  const environmentManager = useEnvironmentManager();
  const rollbackManager = useOneClickRollback();
  const uptimeMonitor = useUptimeMonitor();
  const buildCache = useBuildCacheManager();
  const buildScripts = useCustomBuildScripts();
  const cmsMode = useCMSMode();
  const markdownBlog = useMarkdownBlog();
  const imageOptimizer = useImageOptimizer();
  const videoEmbed = useVideoEmbedManager();
  const i18nGenerator = useI18nGenerator();
  const builtInAnalytics = useBuiltInAnalytics();
  const errorTracking = useErrorTracking();
  const sessionReplay = useSessionReplay();
  const abTesting = useABTesting();
  const aiUsageAnalytics = useAIUsageAnalytics();
  const dependencyScanner = useDependencyScanner();
  const cspGenerator = useCSPGenerator();
  const gdprCompliance = useGDPRCompliance();
  const rateLimiter = useRateLimiter();
  const secretRotation = useSecretRotation();
  const snippetLibrary = useSnippetLibrary();
  const splitDiffEditor = useSplitDiffEditor();
  const commentSystem = useCommentSystem();
  const teamActivityFeed = useTeamActivityFeed();
  const approvalWorkflow = useApprovalWorkflow();
  const projectForking = useProjectForking();
  const figmaImport = useFigmaImport();
  const colorExtractor = useColorPaletteExtractor();
  const iconPicker = useIconPicker();
  const breakpointEditor = useResponsiveBreakpointEditor();
  const animationBuilder = useAnimationBuilder();
  const visualSchema = useVisualSchemaBuilder();
  const seedData = useSeedDataGenerator();
  const apiTester = useAPIEndpointTester();
  const webhookBuilder = useWebhookBuilder();
  const cronScheduler = useCronJobScheduler();

  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showEnvManager} name="Environment Manager">
        <EnvironmentManagerPanel open={props.showEnvManager} onClose={() => props.setShowEnvManager(false)} environments={environmentManager.environments} activeEnv={environmentManager.activeEnv} onSwitch={environmentManager.switchEnvironment} onPromote={environmentManager.promote} onUpdateVars={environmentManager.updateEnvVars} />
      </SafePanel>
      <SafePanel show={props.showRollback} name="Rollback">
        <RollbackPanel open={props.showRollback} onClose={() => props.setShowRollback(false)} snapshots={rollbackManager.snapshots} currentFiles={props.project.files} onRollback={(id: string) => { const files = rollbackManager.rollback(id); if (files) { props.pushUndo('Before rollback', props.project.files); props.setFiles(files); } }} onGetDiff={(id: string) => rollbackManager.getDiff(id, props.project.files)} isRollingBack={rollbackManager.isRollingBack} />
      </SafePanel>
      <SafePanel show={props.showUptimeMonitor} name="Uptime Monitor">
        <UptimeMonitorPanel open={props.showUptimeMonitor} onClose={() => props.setShowUptimeMonitor(false)} checks={uptimeMonitor.checks} stats={uptimeMonitor.getStats()} isMonitoring={uptimeMonitor.isMonitoring} url={uptimeMonitor.url} onStart={uptimeMonitor.startMonitoring} onStop={uptimeMonitor.stopMonitoring} publishedUrl={props.publishedUrl} />
      </SafePanel>
      <SafePanel show={props.showBuildCache} name="Build Cache">
        <BuildCachePanel open={props.showBuildCache} onClose={() => props.setShowBuildCache(false)} stats={buildCache.stats} onInvalidate={() => buildCache.invalidate()} />
      </SafePanel>
      <SafePanel show={props.showBuildScripts} name="Build Scripts">
        <BuildScriptsPanel open={props.showBuildScripts} onClose={() => props.setShowBuildScripts(false)} scripts={buildScripts.scripts} onToggle={buildScripts.toggleScript} onRun={(id: string) => { buildScripts.runScript(id, props.project.files); }} onRemove={buildScripts.removeScript} />
      </SafePanel>
      <SafePanel show={props.showCMSMode} name="CMS Mode">
        <CMSModePanel open={props.showCMSMode} onClose={() => props.setShowCMSMode(false)} isEnabled={cmsMode.isEnabled} onToggle={cmsMode.toggleCMS} blocks={cmsMode.blocks} onUpdateBlock={cmsMode.updateBlock} onExport={cmsMode.exportContent} editingBlock={cmsMode.editingBlock} onSetEditing={cmsMode.setEditingBlock} />
      </SafePanel>
      <SafePanel show={props.showBlogEngine} name="Blog Engine">
        <MarkdownBlogPanel open={props.showBlogEngine} onClose={() => props.setShowBlogEngine(false)} posts={markdownBlog.posts} onGenerate={() => { const files = markdownBlog.generateBlogSystem(); files.forEach((f: any) => props.upsertFile(f.path, f.content)); }} onRemovePost={markdownBlog.removePost} onInsertFiles={(files: any[]) => files.forEach((f: any) => props.upsertFile(f.path, f.content))} />
      </SafePanel>
      <SafePanel show={props.showImageOptimizer} name="Image Optimizer">
        <ImageOptimizerPanel open={props.showImageOptimizer} onClose={() => props.setShowImageOptimizer(false)} images={imageOptimizer.images} isProcessing={imageOptimizer.isProcessing} onOptimize={(f: any) => imageOptimizer.optimizeImage(f)} onGenerateTag={imageOptimizer.generateImgTag} onRemove={imageOptimizer.removeImage} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showVideoEmbed} name="Video Embed">
        <VideoEmbedPanel open={props.showVideoEmbed} onClose={() => props.setShowVideoEmbed(false)} embeds={videoEmbed.embeds} onAdd={videoEmbed.addEmbed} onRemove={videoEmbed.removeEmbed} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showI18n} name="I18n">
        <I18nPanel open={props.showI18n} onClose={() => props.setShowI18n(false)} strings={i18nGenerator.strings} locales={i18nGenerator.locales} onExtract={() => i18nGenerator.extractStrings(props.project.files)} onAddLocale={i18nGenerator.addLocale} onRemoveLocale={i18nGenerator.removeLocale} onUpdateTranslation={i18nGenerator.updateTranslation} onGenerateFiles={() => { const files = i18nGenerator.generateFiles(); files.forEach((f: any) => props.upsertFile(f.path, f.content)); }} />
      </SafePanel>
      <SafePanel show={props.showAnalyticsDashboard} name="Analytics Dashboard">
        <AnalyticsDashboardPanel open={props.showAnalyticsDashboard} onClose={() => props.setShowAnalyticsDashboard(false)} summary={builtInAnalytics.getSummary()} isTracking={builtInAnalytics.isTracking} onStartTracking={builtInAnalytics.startTracking} onStopTracking={builtInAnalytics.stopTracking} onGenerateScript={builtInAnalytics.generateTrackingScript} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showErrorTracking} name="Error Tracking">
        <ErrorTrackingPanel open={props.showErrorTracking} onClose={() => props.setShowErrorTracking(false)} errors={errorTracking.errors} stats={errorTracking.getStats()} onResolve={errorTracking.resolveError} onDelete={errorTracking.deleteError} onInsertCode={insertCode} onGenerateBoundary={errorTracking.generateErrorBoundary} />
      </SafePanel>
      <SafePanel show={props.showSessionReplay} name="Session Replay">
        <SessionReplayPanel open={props.showSessionReplay} onClose={() => props.setShowSessionReplay(false)} sessions={sessionReplay.sessions} isRecording={sessionReplay.isRecording} onStartRecording={sessionReplay.startRecording} onStopRecording={sessionReplay.stopRecording} onGenerateCode={sessionReplay.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showABTesting} name="A/B Testing">
        <ABTestingPanel open={props.showABTesting} onClose={() => props.setShowABTesting(false)} experiments={abTesting.experiments} onAdd={abTesting.addExperiment} onRemove={abTesting.removeExperiment} onToggle={abTesting.toggleExperiment} onGenerateCode={abTesting.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showAIUsage} name="AI Usage">
        <AIUsagePanel open={props.showAIUsage} onClose={() => props.setShowAIUsage(false)} usage={aiUsageAnalytics.usage} summary={aiUsageAnalytics.getSummary()} onExport={aiUsageAnalytics.exportReport} />
      </SafePanel>
      <SafePanel show={props.showDepScanner} name="Dependency Scanner">
        <DependencyScannerPanel open={props.showDepScanner} onClose={() => props.setShowDepScanner(false)} results={dependencyScanner.results} isScanning={dependencyScanner.isScanning} onScan={() => dependencyScanner.scan(props.project.files)} />
      </SafePanel>
      <SafePanel show={props.showCSPGenerator} name="CSP Generator">
        <CSPGeneratorPanel open={props.showCSPGenerator} onClose={() => props.setShowCSPGenerator(false)} policy={cspGenerator.policy} onUpdatePolicy={cspGenerator.updatePolicy} onGenerate={() => cspGenerator.generate(props.project.files)} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showGDPR} name="GDPR">
        <GDPRPanel open={props.showGDPR} onClose={() => props.setShowGDPR(false)} config={gdprCompliance.config} onUpdateConfig={gdprCompliance.updateConfig} onGenerateCode={gdprCompliance.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showRateLimiter} name="Rate Limiter">
        <RateLimiterPanel open={props.showRateLimiter} onClose={() => props.setShowRateLimiter(false)} config={rateLimiter.config} onUpdateConfig={rateLimiter.updateConfig} onGenerateCode={rateLimiter.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showSecretRotation} name="Secret Rotation">
        <SecretRotationPanel open={props.showSecretRotation} onClose={() => props.setShowSecretRotation(false)} secrets={secretRotation.secrets} onAdd={secretRotation.addSecret} onRemove={secretRotation.removeSecret} onRotate={secretRotation.rotateSecret} />
      </SafePanel>
      <SafePanel show={props.showSnippetLibrary} name="Snippet Library">
        <SnippetLibraryPanel open={props.showSnippetLibrary} onClose={() => props.setShowSnippetLibrary(false)} snippets={snippetLibrary.snippets} searchQuery={snippetLibrary.searchQuery} onSearchChange={snippetLibrary.setSearchQuery} onAdd={snippetLibrary.addSnippet} onRemove={snippetLibrary.removeSnippet} onInsert={insertCode} onExport={snippetLibrary.exportSnippets} onImport={snippetLibrary.importSnippets} />
      </SafePanel>
      <SafePanel show={props.showSplitDiff} name="Split Diff">
        <SplitDiffPanel open={props.showSplitDiff} onClose={() => props.setShowSplitDiff(false)} diff={splitDiffEditor.activeDiff} />
      </SafePanel>
      <SafePanel show={props.showComments} name="Comments">
        <CommentPanel open={props.showComments} onClose={() => props.setShowComments(false)} comments={commentSystem.comments} activeFile={props.activeFile?.path} onAdd={commentSystem.addComment} onResolve={commentSystem.resolveComment} onDelete={commentSystem.deleteComment} onNavigate={(file: string) => { props.setActiveFile(file); props.setRightTab('code'); }} unresolvedCount={commentSystem.unresolvedCount} />
      </SafePanel>
      <SafePanel show={props.showTeamActivity} name="Team Activity">
        <TeamActivityPanel open={props.showTeamActivity} onClose={() => props.setShowTeamActivity(false)} activities={teamActivityFeed.activities} filter={teamActivityFeed.filter} onFilterChange={teamActivityFeed.setFilter} getActionIcon={teamActivityFeed.getActionIcon} getActionLabel={teamActivityFeed.getActionLabel} />
      </SafePanel>
      <SafePanel show={props.showApprovals} name="Approvals">
        <ApprovalPanel open={props.showApprovals} onClose={() => props.setShowApprovals(false)} requests={approvalWorkflow.requests} requireApproval={approvalWorkflow.requireApproval} onToggleRequire={approvalWorkflow.setRequireApproval} onApprove={approvalWorkflow.approve} onReject={approvalWorkflow.reject} onCancel={approvalWorkflow.cancelRequest} pendingCount={approvalWorkflow.pendingCount} />
      </SafePanel>
      <SafePanel show={props.showForking} name="Forking">
        <ForkingPanel open={props.showForking} onClose={() => props.setShowForking(false)} forks={projectForking.forks} transfers={projectForking.transfers} projectName={props.project.name} projectId={props.currentProjectId || ''} fileCount={props.project.files.length} onFork={(includeHistory: boolean) => projectForking.forkProject(props.currentProjectId || '', props.project.name, props.project.files, includeHistory)} onTransfer={(email: string, reason: string) => projectForking.transferProject(props.currentProjectId || '', props.project.name, email, reason)} />
      </SafePanel>
      <SafePanel show={props.showFigmaImport} name="Figma Import">
        <FigmaImportPanel open={props.showFigmaImport} onClose={() => props.setShowFigmaImport(false)} importedComponents={figmaImport.components} isImporting={figmaImport.isImporting} onImport={figmaImport.importFromFigma} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showColorExtractor} name="Color Palette">
        <ColorPaletteExtractorPanel open={props.showColorExtractor} onClose={() => props.setShowColorExtractor(false)} palette={colorExtractor.palette} onExtract={() => colorExtractor.extract(props.project.files)} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showIconPicker} name="Icon Picker">
        <IconPickerPanel open={props.showIconPicker} onClose={() => props.setShowIconPicker(false)} icons={iconPicker.icons} searchQuery={iconPicker.searchQuery} onSearchChange={iconPicker.setSearchQuery} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showBreakpointEditor} name="Breakpoint Editor">
        <BreakpointEditorPanel open={props.showBreakpointEditor} onClose={() => props.setShowBreakpointEditor(false)} breakpoints={breakpointEditor.breakpoints} onAdd={breakpointEditor.addBreakpoint} onRemove={breakpointEditor.removeBreakpoint} onGenerateCode={breakpointEditor.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showAnimationBuilder} name="Animation Builder">
        <AnimationBuilderPanel open={props.showAnimationBuilder} onClose={() => props.setShowAnimationBuilder(false)} animations={animationBuilder.animations} onAdd={animationBuilder.addAnimation} onRemove={animationBuilder.removeAnimation} onGenerateCode={animationBuilder.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showVisualSchema} name="Visual Schema">
        <VisualSchemaBuilderPanel open={props.showVisualSchema} onClose={() => props.setShowVisualSchema(false)} tables={visualSchema.tables} onAdd={visualSchema.addTable} onRemove={visualSchema.removeTable} onGenerateSQL={visualSchema.generateSQL} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showSeedData} name="Seed Data">
        <SeedDataPanel open={props.showSeedData} onClose={() => props.setShowSeedData(false)} generators={seedData.generators} onAdd={seedData.addGenerator} onRemove={seedData.removeGenerator} onGenerate={(id: string) => { const sql = seedData.generate(id); if (sql) insertCode(sql); }} />
      </SafePanel>
      <SafePanel show={props.showAPITester} name="API Tester">
        <APIEndpointTesterPanel open={props.showAPITester} onClose={() => props.setShowAPITester(false)} requests={apiTester.requests} activeRequest={apiTester.activeRequest} response={apiTester.response} isLoading={apiTester.isLoading} onAddRequest={apiTester.addRequest} onRemoveRequest={apiTester.removeRequest} onSelectRequest={apiTester.selectRequest} onUpdateRequest={apiTester.updateRequest} onSend={apiTester.sendRequest} />
      </SafePanel>
      <SafePanel show={props.showWebhookBuilder} name="Webhook Builder">
        <WebhookBuilderPanel open={props.showWebhookBuilder} onClose={() => props.setShowWebhookBuilder(false)} webhooks={webhookBuilder.webhooks} onAdd={webhookBuilder.addWebhook} onRemove={webhookBuilder.removeWebhook} onGenerateCode={(id: string) => { const code = webhookBuilder.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
      <SafePanel show={props.showCronScheduler} name="Cron Scheduler">
        <CronSchedulerPanel open={props.showCronScheduler} onClose={() => props.setShowCronScheduler(false)} jobs={cronScheduler.jobs} onAdd={cronScheduler.addJob} onRemove={cronScheduler.removeJob} onGenerateCode={(id: string) => { const code = cronScheduler.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
    </>
  );
}
