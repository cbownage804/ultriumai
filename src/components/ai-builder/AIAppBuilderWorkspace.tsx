import { useEffect, useState, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import { useAIAppBuilder } from '@/hooks/useAIAppBuilder';
import { useProjectFileSystem, type ProjectFile } from '@/hooks/useProjectFileSystem';
import { useAgentMode } from '@/hooks/useAgentMode';
import { useAutoErrorRecovery } from '@/hooks/useAutoErrorRecovery';
import type { RemoteCursor } from './CodeEditor';
import { supabase } from '@/integrations/supabase/client';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import { useCodeSmellDetector } from '@/hooks/useCodeSmellDetector';
import { useDocGenerator } from '@/hooks/useDocGenerator';
import { PromptHistoryPanel } from './PromptHistoryPanel';
import { UndoPreviewPopover } from './UndoPreviewPopover';
import { useAutoFixLoop } from '@/hooks/useAutoFixLoop';
import { useGithubSync } from '@/hooks/useGithubSync';
import { useInlineAIEdit } from '@/hooks/useInlineAIEdit';
import { useBranching } from '@/hooks/useBranching';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { usePreviewHosting } from '@/hooks/usePreviewHosting';
import { usePreviewCapture } from '@/hooks/usePreviewCapture';
import { BuilderChatPanel } from './BuilderChatPanel';
import { BuilderPreviewPanel } from './BuilderPreviewPanel';
import { ProjectFileTree } from './ProjectFileTree';
import { FileTabBar } from './FileTabBar';
import { CodeEditor } from './CodeEditor';
import { ExportButton } from './ExportButton';
import { ProjectSettings, type SupabaseConfig, type GithubConfig, type StripeConfig, type VercelConfig, type ServiceKey, type EnvVar } from './ProjectSettings';
import { GithubSyncButton } from './GithubSyncButton';
import { VercelDeployButton } from './VercelDeployButton';
import { TemplateLibrary } from './TemplateLibrary';
import { SharePreview } from './SharePreview';
import { BranchManager } from './BranchManager';
import { ProjectManager } from './ProjectManager';
import { CollaborativePresence } from './CollaborativePresence';
import { CommandPalette } from './CommandPalette';
import { GeneratingOverlay } from './GeneratingOverlay';
import { FileSearchPanel } from './FileSearchPanel';
import { FileBreadcrumb } from './FileBreadcrumb';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { ConsolePanel } from './ConsolePanel';
import { DeployDialog } from './DeployDialog';
import { EnvVarsPanel, type EnvVariable } from './EnvVarsPanel';
import { RLSPolicyTester } from './RLSPolicyTester';
import { FileConflictDialog } from './FileConflictDialog';
import { QuickFileSwitcher } from './QuickFileSwitcher';
import { AssetManager, type ProjectAsset } from './AssetManager';
import { PackageManager, type CDNPackage } from './PackageManager';
import { useProjectBundler } from '@/hooks/useProjectBundler';
import { useReactCompiler, detectReactProject } from '@/hooks/useReactCompiler';
import { useASTBundler } from '@/hooks/useASTBundler';
import { useIncrementalCompiler } from '@/hooks/useIncrementalCompiler';
import { useTypeScriptValidator } from '@/hooks/useTypeScriptValidator';
import { useConflictResolver } from '@/hooks/useConflictResolver';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { OnboardingTour } from './OnboardingTour';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel';
import { ActivityFeed, type ActivityEntry } from './ActivityFeed';
import { BillingPanel, CreditsPill } from './BillingPanel';
import { ProjectShareDialog, CollaboratorAvatars } from './ProjectShareDialog';
import { SEOEditor } from './SEOEditor';
import { BuildNotificationCenter, type BuildNotification } from './BuildNotificationCenter';
import type { KnowledgeConfig } from './KnowledgePanel';
import { AICodeIntelligence, type CodeSuggestion } from './AICodeIntelligence';
import { DatabaseExplorer } from './DatabaseExplorer';
import { ComponentLibrary } from './ComponentLibrary';
import { TestingDebugSuite, type TestCase } from './TestingDebugSuite';
import { DiffReviewPanel } from './DiffReviewPanel';
import { CustomDomainPanel } from './CustomDomainPanel';
import { ExportGuidePanel } from './ExportGuidePanel';
import { TerminalEmulator } from './TerminalEmulator';
import { AgentModePanel } from './AgentModePanel';
import { ResponsivePreviewBar, type ViewportMode, getViewportWidth } from './ResponsivePreviewBar';
import { BuildLogPanel } from './BuildLogPanel';
import { VersionTimelineSlider } from './VersionTimelineSlider';
import { VersionDiffViewer } from './VersionDiffViewer';
import { SplitEditorPane } from './SplitEditorPane';
import { usePostBuildSmokeTest } from './usePostBuildSmokeTest';
import { useVersionTimeline } from '@/hooks/useVersionTimeline';
import { useBuildLog } from '@/hooks/useBuildLog';
import { useHotModuleRecovery } from './useHotModuleRecovery';
import { useSelfReviewPass } from './useSelfReviewPass';
import { useDependencyConflictDetection } from './useDependencyConflictDetection';
import { useSmartFileScaffolding } from './useSmartFileScaffolding';
import { useInlineErrorAnnotations } from './useInlineErrorAnnotations';
import { usePromptMemory } from './usePromptMemory';
import { useLighthouseAudit } from './useLighthouseAudit';
import { useBundleSizeTracking } from './useBundleSizeTracking';
import { useDeleteButtonAutoPatcher } from './useDeleteButtonAutoPatcher';
import { usePromptPhasePlanner } from './usePromptPhasePlanner';
import { PhasePlannerPanel } from './PhasePlannerPanel';
import { QuestionsCard } from './QuestionsCard';
import { useBuilderQuestions } from './useBuilderQuestions';
import { DeployPipelinePanel } from './DeployPipelinePanel';
import { useOutputValidation } from './useOutputValidation';
import { useBuildAnalytics } from '@/hooks/useBuildAnalytics';
import { ComponentPalette } from './ComponentPalette';
import { ChangelogPanel, type ChangelogEntry } from './ChangelogPanel';
import { AIAutocompleteIndicator } from './AIAutocomplete';
import { BuilderHelpCenter } from './BuilderHelpCenter';
import { WelcomeOverlay } from './WelcomeOverlay';
import { ConfirmDialog } from './ConfirmDialog';
import { GPTConnectorPanel, type LinkedGPTConfig } from './GPTConnectorPanel';
import { SetupWizard } from './SetupWizard';
import { OneClickDeploy } from './OneClickDeploy';
import { EditHistoryTimeline } from './EditHistoryTimeline';
import { detectSupabaseIntents, buildSupabaseContext, buildErrorDiagnosisContext, analyzeConversationComplexity } from './SupabaseConversational';
import { buildAuthTemplate } from './authTemplates';
import { MobilePWAInstall } from './MobilePWAInstall';
import { BugReportModal } from '@/components/help/BugReportModal';
import { EnhancedCommandPalette, type CommandAction } from './EnhancedCommandPalette';
import { MultiFileSearchReplace } from './MultiFileSearchReplace';
import { InBrowserTestRunner } from './InBrowserTestRunner';
import { PluginMarketplace } from './PluginMarketplace';
import { usePluginRegistry } from '@/hooks/usePluginRegistry';
import { useCollaborationEngine } from '@/hooks/useCollaborationEngine';
import { useAPIBuilder } from '@/hooks/useAPIBuilder';
import { ShortcutsHint } from './ShortcutsHint';
import { useProjectReview } from './useProjectReview';
import { ProjectReviewPanel } from './ProjectReviewPanel';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';
import { SupabaseIDEPanel } from './SupabaseIDEPanel';
import { GitHubPanel } from './GitHubPanel';
import { DatabaseMigrationPanel } from './DatabaseMigrationPanel';
import { EdgeFunctionEditorPanel } from './EdgeFunctionEditorPanel';
import { BuildWorkflowPanel } from './BuildWorkflowPanel';
import { PreviewDevToolsPanel } from './PreviewDevToolsPanel';
import { VisualEditToolbar } from './VisualEditToolbar';
import { NPMPackageManagerPanel } from './NPMPackageManagerPanel';
import { PublishPanel } from './PublishPanel';
import { AIImageGenPanel } from './AIImageGenPanel';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { SessionRecoveryDialog } from './SessionRecoveryDialog';
import { useIndexedDBPersistence } from '@/hooks/useIndexedDBPersistence';
import { useSchemaIntrospection } from '@/hooks/useSchemaIntrospection';
import { HeaderCreditsIndicator } from './HeaderCreditsIndicator';
import ultriumLogo from '/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png';
import { SymbolSearchPanel } from './SymbolSearchPanel';
import { SecretsManagerPanel } from './SecretsManagerPanel';
import { ProjectDropdownMenu } from './ProjectDropdownMenu';
import { ToolbarPanelsDropdown } from './ToolbarPanelsDropdown';
import { ModelSwitcherPanel } from './ModelSwitcherPanel';
import { PromptChainPanel } from './PromptChainPanel';
import { CodeReviewPanel } from './CodeReviewPanel';
import { TestGeneratorPanel } from './TestGeneratorPanel';
import { NLQueryPanel } from './NLQueryPanel';
import { SnippetLibraryPanel } from './SnippetLibraryPanel';
import { SplitDiffPanel } from './SplitDiffPanel';
import { CommentPanel } from './CommentPanel';
import { TeamActivityPanel } from './TeamActivityPanel';
import { ApprovalPanel } from './ApprovalPanel';
import { ForkingPanel } from './ForkingPanel';
import { FigmaImportPanel } from './FigmaImportPanel';
import { ColorPaletteExtractorPanel } from './ColorPaletteExtractorPanel';
import { IconPickerPanel } from './IconPickerPanel';
import { BreakpointEditorPanel } from './BreakpointEditorPanel';
import { AnimationBuilderPanel } from './AnimationBuilderPanel';
import { VisualSchemaBuilderPanel } from './VisualSchemaBuilderPanel';
import { SeedDataPanel } from './SeedDataPanel';
import { APIEndpointTesterPanel } from './APIEndpointTesterPanel';
import { WebhookBuilderPanel } from './WebhookBuilderPanel';
import { CronSchedulerPanel } from './CronSchedulerPanel';
import { usePromptChains } from '@/hooks/usePromptChains';
import { useAICodeReview } from '@/hooks/useAICodeReview';
import { useTestGenerator } from '@/hooks/useTestGenerator';
import { useNLDatabaseQuery } from '@/hooks/useNLDatabaseQuery';
import { useMultiCursorEditor } from '@/hooks/useMultiCursorEditor';
import { useMinimapHeatZones } from '@/hooks/useMinimapHeatZones';
import { useSymbolNavigator } from '@/hooks/useSymbolNavigator';
import { useSnippetLibrary } from '@/hooks/useSnippetLibrary';
import { useSplitDiffEditor } from '@/hooks/useSplitDiffEditor';
import { useCommentSystem } from '@/hooks/useCommentSystem';
import { useProjectRBAC } from '@/hooks/useProjectRBAC';
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
import { EnvironmentManagerPanel } from './EnvironmentManagerPanel';
import { RollbackPanel } from './RollbackPanel';
import { UptimeMonitorPanel } from './UptimeMonitorPanel';
import { BuildCachePanel } from './BuildCachePanel';
import { BuildScriptsPanel } from './BuildScriptsPanel';
import { CMSModePanel } from './CMSModePanel';
import { MarkdownBlogPanel } from './MarkdownBlogPanel';
import { ImageOptimizerPanel } from './ImageOptimizerPanel';
import { VideoEmbedPanel } from './VideoEmbedPanel';
import { I18nPanel } from './I18nPanel';
import { AnalyticsDashboardPanel } from './AnalyticsDashboardPanel';
import { ErrorTrackingPanel } from './ErrorTrackingPanel';
import { SessionReplayPanel } from './SessionReplayPanel';
import { ABTestingPanel } from './ABTestingPanel';
import { AIUsagePanel } from './AIUsagePanel';
import { DependencyScannerPanel } from './DependencyScannerPanel';
import { CSPGeneratorPanel } from './CSPGeneratorPanel';
import { GDPRPanel } from './GDPRPanel';
import { RateLimiterPanel } from './RateLimiterPanel';
import { SecretRotationPanel } from './SecretRotationPanel';
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

import {
  Eye, Code, Pencil, Database, CreditCard, Key, Bot, MessageSquare,
  PanelLeftClose, PanelLeftOpen, Activity, Undo2, Redo2, Search,
  History, Variable, Image, Package, Columns, Keyboard, Rocket,
  Shield, Brain, FolderOpen, Zap, Clock, Globe, Users, BookOpen, Gauge,
  Settings, ChevronDown, ArrowLeft, Sparkles, Layers, Bug, Terminal, GitBranch as GitBranchIcon, RefreshCw,
  Table2, ChevronsLeft, ChevronsRight, BarChart3, Puzzle, Play, Replace, Palette, Server, ClipboardCheck,
  Github, Hammer, FileCode, ImagePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Lazy load heavy panels
const DatabasePanel = lazy(() => import('./DatabasePanel').then(m => ({ default: m.DatabasePanel })));
const AuthConfigPanel = lazy(() => import('./AuthConfigPanel').then(m => ({ default: m.AuthConfigPanel })));
const KnowledgePanel = lazy(() => import('./KnowledgePanel').then(m => ({ default: m.KnowledgePanel })));
const StorageBrowser = lazy(() => import('./StorageBrowser').then(m => ({ default: m.StorageBrowser })));
const EdgeFunctionEditor = lazy(() => import('./EdgeFunctionEditor').then(m => ({ default: m.EdgeFunctionEditor })));
const PerformanceProfilerLazy = lazy(() => import('./PerformanceProfiler').then(m => ({ default: m.PerformanceProfiler })));
const BuildAnalyticsPanelLazy = lazy(() => import('./BuildAnalyticsPanel').then(m => ({ default: m.BuildAnalyticsPanel })));
const SchemaDesignerLazy = lazy(() => import('./SchemaDesigner').then(m => ({ default: m.SchemaDesigner })));
const DesignSystemPanelLazy = lazy(() => import('./DesignSystemPanel').then(m => ({ default: m.DesignSystemPanel })));
const CollaborationPanelLazy = lazy(() => import('./CollaborationPanel').then(m => ({ default: m.CollaborationPanel })));
const APIBuilderPanelLazy = lazy(() => import('./APIBuilderPanel').then(m => ({ default: m.APIBuilderPanel })));

const PanelLoader = () => <div className="flex items-center justify-center h-full text-white/15 text-xs">Loading...</div>;

export function AIAppBuilderWorkspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    messages, setMessages, isGenerating, latestFiles, previousFiles, mode, setMode, thinkingPhase, versions, setVersions,
    totalTokensUsed, contextBudget, sendMessage, stopGenerating, clearChat, restoreVersion, forwardErrorToChat,
    partialFiles, isStreamingPreview, completedFileCount,
  } = useAIAppBuilder();

  const {
    project, setFiles, upsertFile, deleteFile,
    setActiveFile, closeFile, resetProject, renameProject,
    reorderOpenFiles, getCompiledHTML, activeFile,
  } = useProjectFileSystem();

  const { undoStack, redoStack, canUndo, canRedo, pushUndo, undo, redo } = useUndoRedo();
  const promptHistory = usePromptHistory();
  const codeSmellDetector = useCodeSmellDetector();
  const docGenerator = useDocGenerator();
  const [showPromptHistory, setShowPromptHistory] = useState(false);
  const {
    branches, activeBranch, activeBranchName,
    createBranch, switchBranch, mergeBranch, deleteBranch, updateBranchFiles,
  } = useBranching();
  const {
    savedProjects, currentProjectId, isSaving, isLoading, lastSaved,
    deployHistory: persistedDeployHistory,
    loadProjects, saveProject, loadProject, deleteProject, publishProject,
    rollbackToVersion,
    scheduleAutoSave,
  } = useProjectPersistence();
  const {
    currentRun: agentRun,
    taskQueue: agentTaskQueue,
    notifications: agentNotifications,
    pendingApproval: agentPendingApproval,
    startAgentRun, cancelRun: cancelAgent,
    enqueueTask, cancelTask: cancelAgentTask,
    retryTask: retryAgentTask, clearCompleted: clearAgentCompleted,
    reorderQueue: reorderAgentQueue,
    respondToPlan: respondToAgentPlan,
    executeAgentTask, getNextQueuedTask, isAnyRunning: isAgentRunning,
  } = useAgentMode();
  const autoRecovery = useAutoErrorRecovery();

  // Phase 47: Wire useAutoFixLoop for structured error auto-fix
  const autoFixLoop = useAutoFixLoop({
    maxAttempts: 3,
    baseDelayMs: 500,
    onSendFix: (prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel, undefined, true),
  });

  // Phase 46: Wire useGithubSync
  const githubSync = useGithubSync();

  // Phase 45: Wire useInlineAIEdit
  const inlineAIEdit = useInlineAIEdit((prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel));

  const versionTimeline = useVersionTimeline();
  const buildLog = useBuildLog();
  const smokeTest = usePostBuildSmokeTest(buildLog.addEntry);
  const hotRecovery = useHotModuleRecovery(buildLog.addEntry);
  const selfReview = useSelfReviewPass();
  const conflictDetection = useDependencyConflictDetection();
  const fileScaffolding = useSmartFileScaffolding();
  const errorAnnotations = useInlineErrorAnnotations();
  const promptMemory = usePromptMemory();
  const lighthouseAudit = useLighthouseAudit(buildLog.addEntry);
  const bundleSize = useBundleSizeTracking(buildLog.addEntry);
  const deleteAutoPatcher = useDeleteButtonAutoPatcher();
  const phasePlanner = usePromptPhasePlanner();
  const builderQuestions = useBuilderQuestions();
  const { saveDraft, saveDraftImmediate, loadDraft, clearDraft, hasDraft } = useDraftPersistence();
  const { previewUrl: hostedPreviewUrl, isUploading: isUploadingPreview, uploadPreview, uploadPreviewNow, clearPreviewTimer } = usePreviewHosting();
  const idbPersistence = useIndexedDBPersistence();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  const [rightTab, setRightTab] = useState<'preview' | 'code' | 'split'>('preview');
  const [previewCurrentUrl, setPreviewCurrentUrl] = useState('/');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig | null>(null);
  const [githubConfig, setGithubConfig] = useState<GithubConfig | null>(null);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
  const [vercelConfig, setVercelConfig] = useState<VercelConfig | null>(null);
  const [serviceKeys, setServiceKeys] = useState<ServiceKey[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [showFileTree, setShowFileTree] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showFileSearch, setShowFileSearch] = useState(false);

  // Panel states
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [showRLSTester, setShowRLSTester] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [showPackages, setShowPackages] = useState(false);
  const [cdnPackages, setCdnPackages] = useState<CDNPackage[]>([]);
  const { findReferencedFiles } = useProjectBundler();
  const astBundler = useASTBundler();
  const incrementalCompiler = useIncrementalCompiler();
  const tsValidator = useTypeScriptValidator();
  const conflictResolver = useConflictResolver();

  // Incremental bundler: uses AST bundler for per-file compilation + caching
  const bundleForBrowser = useCallback((files: ProjectFile[]) => {
    const result = incrementalCompiler.compileIncremental(
      files,
      (file) => {
        const graph = astBundler.buildDependencyGraph([file]);
        const node = graph.get(file.path);
        if (!node) return file.content;
        return `/* ═══ ${file.path} ═══ */\n(function() {\n"use strict";\n${astBundler.stripModuleSyntax(file.content, node)}\n})();`;
      },
      (f) => astBundler.topologicalSort(astBundler.buildDependencyGraph(f)).filter(p => f.some(file => file.path === p)),
    );
    return result.output;
  }, [astBundler, incrementalCompiler]);
  const liveSync = useLivePreviewSync();
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const channelRef = useRef<any>(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const prevIsGeneratingRef = useRef(isGenerating);
  const [fixAttemptCount, setFixAttemptCount] = useState(0);
  const [lastFixError, setLastFixError] = useState<string | null>(null);
  const MAX_FIX_ATTEMPTS = 3;
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedModel, setSelectedModel] = useState('google/gemini-3-flash-preview');
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [pendingConflicts, setPendingConflicts] = useState<{ path: string; userContent: string; aiContent: string }[] | null>(null);
  const [showDatabase, setShowDatabase] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showEdgeFunctions, setShowEdgeFunctions] = useState(false);
  const [knowledge, setKnowledge] = useState<KnowledgeConfig>({ customInstructions: '', contextFiles: [] });
  const [edgeFunctions, setEdgeFunctions] = useState<{ name: string; status: 'deployed' | 'draft' | 'error'; lastDeployed?: string }[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSEOEditor, setShowSEOEditor] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showExportGuide, setShowExportGuide] = useState(false);
  const [collaborators, setCollaborators] = useState<{ id: string; email: string; role: 'viewer' | 'editor' | 'admin'; avatarColor: string; joinedAt: Date }[]>([]);
  const [buildNotifications, setBuildNotifications] = useState<BuildNotification[]>([]);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [showCodeIntel, setShowCodeIntel] = useState(false);
  const [showDbExplorer, setShowDbExplorer] = useState(false);
  const [showComponentLib, setShowComponentLib] = useState(false);
  const [showTestingSuite, setShowTestingSuite] = useState(false);
  const [codeSuggestions, setCodeSuggestions] = useState<CodeSuggestion[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [showDiffReview, setShowDiffReview] = useState(false);
  const [pendingDiffChanges, setPendingDiffChanges] = useState<{ path: string; oldContent: string; newContent: string; isNew: boolean }[]>([]);
  const [showDomainPanel, setShowDomainPanel] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [isVisualEditActive, setIsVisualEditActive] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [showBuildLog, setShowBuildLog] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [splitRightFile, setSplitRightFile] = useState<string | null>(null);
  const buildStartTimeRef = useRef<number>(0);
  const [showDeployPipeline, setShowDeployPipeline] = useState(false);
  const [showComponentPalette, setShowComponentPalette] = useState(false);
  const [aiAutocompleteEnabled, setAiAutocompleteEnabled] = useState(true);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const [showGPTConnector, setShowGPTConnector] = useState(false);
  const [linkedGPT, setLinkedGPT] = useState<LinkedGPTConfig | null>(null);
  const [showPerformanceProfiler, setShowPerformanceProfiler] = useState(false);
  const [showBuildAnalytics, setShowBuildAnalytics] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const buildAnalytics = useBuildAnalytics();
  const outputValidation = useOutputValidation();
  const [showChangelog, setShowChangelog] = useState(false);
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showSchemaDesigner, setShowSchemaDesigner] = useState(false);
  const [showOneClickDeploy, setShowOneClickDeploy] = useState(false);
  const [netlifyToken, setNetlifyToken] = useState<string | null>(null);
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showEnhancedPalette, setShowEnhancedPalette] = useState(false);
  const [showMultiSearch, setShowMultiSearch] = useState(false);
  const [showTestRunner, setShowTestRunner] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  const pluginRegistry = usePluginRegistry();
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const collaborationEngine = useCollaborationEngine(currentProjectId);
  const [showAPIBuilder, setShowAPIBuilder] = useState(false);
  const apiBuilder = useAPIBuilder();
  const projectReview = useProjectReview();
  const supabaseConnection = useSupabaseConnection();
  const schemaIntrospection = useSchemaIntrospection();
  const [showSupabaseIDE, setShowSupabaseIDE] = useState(false);
  const [showGitHubPanel, setShowGitHubPanel] = useState(false);
  const [showMigrationPanel, setShowMigrationPanel] = useState(false);
  const [showEdgeFnEditor, setShowEdgeFnEditor] = useState(false);
  const [showBuildWorkflow, setShowBuildWorkflow] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showNPMManager, setShowNPMManager] = useState(false);
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [installedPackages, setInstalledPackages] = useState<{ name: string; version: string; description?: string; isDevDep?: boolean }[]>([]);
  const [showImageGen, setShowImageGen] = useState(false);
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [showSecretsManager, setShowSecretsManager] = useState(false);
  const [showModelSwitcher, setShowModelSwitcher] = useState(false);
  const [showPromptChains, setShowPromptChains] = useState(false);
  const [showCodeReview, setShowCodeReview] = useState(false);
  const [showTestGenerator, setShowTestGenerator] = useState(false);
  const [showNLQuery, setShowNLQuery] = useState(false);
  const promptChains = usePromptChains();
  const codeReview = useAICodeReview();
  const testGenerator = useTestGenerator();
  const multiCursorEditor = useMultiCursorEditor();
  const minimapHeatZones = useMinimapHeatZones();
  const symbolNavigator = useSymbolNavigator();
  const snippetLibrary = useSnippetLibrary();
  const splitDiffEditor = useSplitDiffEditor();
  const commentSystem = useCommentSystem();
  const projectRBAC = useProjectRBAC();
  const teamActivityFeed = useTeamActivityFeed();
  const approvalWorkflow = useApprovalWorkflow();
  const projectForking = useProjectForking();
  const [showSnippetLibrary, setShowSnippetLibrary] = useState(false);
  const [showSplitDiff, setShowSplitDiff] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showTeamActivity, setShowTeamActivity] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showForking, setShowForking] = useState(false);
  const [showFigmaImport, setShowFigmaImport] = useState(false);
  const [showColorExtractor, setShowColorExtractor] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showBreakpointEditor, setShowBreakpointEditor] = useState(false);
  const [showAnimationBuilder, setShowAnimationBuilder] = useState(false);
  const [showVisualSchema, setShowVisualSchema] = useState(false);
  const [showSeedData, setShowSeedData] = useState(false);
  const [showAPITester, setShowAPITester] = useState(false);
  const [showWebhookBuilder, setShowWebhookBuilder] = useState(false);
  const [showCronScheduler, setShowCronScheduler] = useState(false);
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
  const [showEnvManager, setShowEnvManager] = useState(false);
  const [showRollback, setShowRollback] = useState(false);
  const [showUptimeMonitor, setShowUptimeMonitor] = useState(false);
  const [showBuildCache, setShowBuildCache] = useState(false);
  const [showBuildScripts, setShowBuildScripts] = useState(false);
  const [showCMSMode, setShowCMSMode] = useState(false);
  const [showBlogEngine, setShowBlogEngine] = useState(false);
  const [showImageOptimizer, setShowImageOptimizer] = useState(false);
  const [showVideoEmbed, setShowVideoEmbed] = useState(false);
  const [showI18n, setShowI18n] = useState(false);
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
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [showErrorTracking, setShowErrorTracking] = useState(false);
  const [showSessionReplay, setShowSessionReplay] = useState(false);
  const [showABTesting, setShowABTesting] = useState(false);
  const [showAIUsage, setShowAIUsage] = useState(false);
  const [showDepScanner, setShowDepScanner] = useState(false);
  const [showCSPGenerator, setShowCSPGenerator] = useState(false);
  const [showGDPR, setShowGDPR] = useState(false);
  const [showRateLimiter, setShowRateLimiter] = useState(false);
  const [showSecretRotation, setShowSecretRotation] = useState(false);
  const addActivity = useCallback((type: ActivityEntry['type'], label: string, detail?: string) => {
    setActivityEntries(prev => [{ id: crypto.randomUUID(), type, label, detail, timestamp: new Date() }, ...prev].slice(0, 100));
  }, []);

  // Sync env vars from EnvVarsPanel into compilation envVars
  useEffect(() => {
    if (envVariables.length > 0) {
      const mapped = envVariables
        .filter(v => v.key && v.value)
        .map(v => ({ key: v.key, value: v.value }));
      setEnvVars(prev => {
        const panelKeys = new Set(mapped.map(m => m.key));
        const kept = prev.filter(p => !panelKeys.has(p.key));
        return [...kept, ...mapped];
      });
    }
  }, [envVariables]);

  // Fetch schema when Supabase config changes (for AI context injection + type generation)
  useEffect(() => {
    if (supabaseConfig?.url && serviceKeys.length > 0) {
      const serviceKey = serviceKeys.find(k => k.serviceId === 'supabase_service_role');
      if (serviceKey) {
        schemaIntrospection.fetchSchema(supabaseConfig.url, serviceKey.apiKey).then(schema => {
          if (schema) {
            const typesFile = schemaIntrospection.generateTypesFile();
            if (typesFile) upsertFile(typesFile.path, typesFile.content);
          }
        });
      }
    }
  }, [supabaseConfig?.url, serviceKeys]);

  // Collaborative cursor broadcasting via Supabase Realtime
  useEffect(() => {
    if (!currentProjectId) return;
    const channel = supabase.channel(`cursors:${currentProjectId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'cursor' }, ({ payload }: any) => {
        if (!payload) return;
        setRemoteCursors(prev => {
          const filtered = prev.filter(c => c.userId !== payload.userId);
          return [...filtered, payload as RemoteCursor];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentProjectId]);

  const handleCursorChange = useCallback((line: number, column: number) => {
    setCursorPosition({ line, column });
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor',
        payload: { userId: 'self', email: '', color: '#06b6d4', line, column },
      });
    }
  }, []);

  // Sync latest files from AI
  useEffect(() => {
    if (latestFiles.length > 0) {
      if (project.files.length > 0) {
        pushUndo('AI generation', project.files);
        versionTimeline.addSnapshot('Before AI generation', project.files, 'auto');
      }
      const conflicts = latestFiles.filter(f => dirtyFiles.has(f.path));
      if (conflicts.length > 0) {
        setPendingConflicts(conflicts.map(f => ({
          path: f.path,
          userContent: project.files.find(pf => pf.path === f.path)?.content || '',
          aiContent: f.content,
        })));
        const nonConflicting = latestFiles.filter(f => !dirtyFiles.has(f.path));
        for (const file of nonConflicting) upsertFile(file.path, file.content);
      } else {
        if (project.files.length === 0) {
          setFiles(latestFiles);
        } else {
          for (const file of latestFiles) upsertFile(file.path, file.content);
        }
      }
      updateBranchFiles(latestFiles);
      setDirtyFiles(prev => {
        const next = new Set(prev);
        latestFiles.forEach(f => next.delete(f.path));
        return next;
      });
      setFixAttemptCount(0);
      setLastFixError(null);
      // Log files to build log
      latestFiles.forEach(f => buildLog.logFileWrite(f.path));
      // Phase 87: Show compiling state while preview rebuilds
      setIsCompiling(true);
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsCompiling(false);
          // Phase 100: Auto-detect code smells after build
          const smells = codeSmellDetector.analyzeFiles([...project.files, ...latestFiles]);
          if (smells.length > 0) setCodeSuggestions(smells);
        }, 800);
      });
    }
  }, [latestFiles]);

  // Auto-process agent queue: when no task is running and there's a queued task, start it
  useEffect(() => {
    if (isAgentRunning) return;
    const next = getNextQueuedTask();
    if (!next) return;
    const extraArgs = [supabaseConfig, stripeConfig, serviceKeys, next.imageDataUrls || null, selectedModel, knowledge.customInstructions || undefined];
    executeAgentTask(next, sendMessage, project.files, extraArgs);
  }, [isAgentRunning, getNextQueuedTask, executeAgentTask, sendMessage, project.files, supabaseConfig, stripeConfig, serviceKeys, selectedModel, knowledge]);

  // Sync agent notifications to build notification center
  useEffect(() => {
    if (agentNotifications.length > 0) {
      const latest = agentNotifications[0];
      setBuildNotifications(prev => [{
        id: latest.id,
        type: (latest.type === 'warning' ? 'info' : latest.type) as 'success' | 'error' | 'info' | 'deploy',
        title: latest.title,
        detail: latest.detail,
        timestamp: latest.timestamp,
        read: false,
      }, ...prev].slice(0, 50));
    }
  }, [agentNotifications]);

  // Auto-name project on first build based on user's initial prompt
  const hasAutoNamed = useRef(false);

  // AI completion notification
  useEffect(() => {
    if (prevIsGeneratingRef.current && !isGenerating && latestFiles.length > 0) {
      const duration = buildStartTimeRef.current ? Date.now() - buildStartTimeRef.current : 0;
      toast.success(`Generated ${latestFiles.length} file${latestFiles.length > 1 ? 's' : ''}`, {
        action: { label: 'View', onClick: () => setRightTab('preview') },
      });
      setBuildNotifications(prev => [{
        id: crypto.randomUUID(),
        type: 'success' as const,
        title: `Generated ${latestFiles.length} file${latestFiles.length > 1 ? 's' : ''}`,
        timestamp: new Date(),
        read: false,
      }, ...prev].slice(0, 50));
      buildLog.logBuildComplete(latestFiles.length, duration);
      // Run TypeScript validation before preview
      const validationResult = tsValidator.validate(latestFiles);
      if (validationResult.errorCount > 0) {
        buildLog.addEntry('warning' as any, `⚠️ ${validationResult.errorCount} validation error(s), ${validationResult.warningCount} warning(s)`);
        validationResult.diagnostics.filter(d => d.severity === 'error').slice(0, 5).forEach(d =>
          buildLog.addEntry('warning' as any, `  ❌ ${d.file}:${d.line} — ${d.message}`)
        );
      } else if (validationResult.warningCount > 0) {
        buildLog.addEntry('info', `✅ Validation passed with ${validationResult.warningCount} warning(s) (${validationResult.validationTimeMs}ms)`);
      } else {
        buildLog.addEntry('info', `✅ Validation passed (${validationResult.validationTimeMs}ms)`);
      }
      // Run post-build smoke test + all quality checks
      const smokeResult = smokeTest.runSmokeTest(latestFiles);
      const conflictWarnings = conflictDetection.detectConflicts(latestFiles);
      if (conflictWarnings.length > 0) {
        buildLog.addEntry('warning' as any, `🔗 ${conflictWarnings.length} dependency conflict(s) detected`);
        conflictWarnings.slice(0, 3).forEach(w => buildLog.addEntry('info', `  ⚠ ${w.message}`));
      }
      errorAnnotations.updateAnnotations(
        [...smokeResult.warnings, ...conflictWarnings],
        smokeResult.errors
      );
      lighthouseAudit.runAudit(latestFiles);
      bundleSize.analyzeBundle(latestFiles);
      // Auto-patch broken delete/remove buttons deterministically (zero credits)
      const patchResult = deleteAutoPatcher.patchDeleteButtons(latestFiles);
      if (patchResult.patched) {
        patchResult.files.forEach(f => upsertFile(f.path, f.content));
        buildLog.addEntry('info', `🔧 Auto-patched ${patchResult.fixes.length} delete/remove issue(s)`);
        patchResult.fixes.forEach(fix => buildLog.addEntry('info', `  ✅ ${fix}`));
      }
      // Auto-generate companion test files for new components
      const companions = fileScaffolding.generateCompanionFiles(latestFiles, project.files);
      if (companions.length > 0) {
        companions.forEach(f => upsertFile(f.path, f.content));
        buildLog.addEntry('info', `🧪 Auto-generated ${companions.length} test file(s)`);
      }
      // Mark preview as good for hot recovery & update conflict resolver base snapshot
      hotRecovery.markAsGood([...project.files]);
      conflictResolver.setBaseSnapshot([...project.files]);
      versionTimeline.addSnapshot(`AI: ${messages[messages.length - 2]?.content?.slice(0, 40) || 'generation'}`, [...project.files], 'ai-generation');

      // Record build analytics (Phase 5)
      const lastMsg = messages[messages.length - 1];
      buildAnalytics.recordBuild({
        type: 'build',
        durationMs: duration,
        filesGenerated: latestFiles.length,
        creditsUsed: 3,
        success: true,
        errorCount: validationResult.errorCount,
        validationScore: validationResult.errorCount === 0 ? 100 : Math.max(0, 100 - validationResult.errorCount * 10),
        promptLength: lastMsg?.content?.length || 0,
      });

      // Auto-name project on first successful build
      if (!hasAutoNamed.current && project.name === 'Untitled Project') {
        // Find the first real user message (skip internal planning/system prompts)
        const firstUserMsg = messages.find(m => {
          if (m.role !== 'user') return false;
          const c = m.content;
          if (c.includes('PLANNING MODE') || c.includes('Return ONLY valid JSON') ||
              c.includes('return a structured plan as JSON') || c.includes('filesToCreate') ||
              c.includes('filesToModify') || c.includes('Analyze the user') ||
              c.includes('[PLANNING') || c.includes('Do Not Generate') ||
              (c.includes('"approach"') && c.includes('"steps"'))) {
            return false;
          }
          return true;
        });
        if (firstUserMsg) {
          const prompt = firstUserMsg.content
            .replace(/\[Currently viewing:.*?\]\n?/g, '')
            .replace(/\[Auto-detected relevant files:.*?\]\n?/g, '')
            .replace(/\[.*?(?:planning|mode|do not generate).*?\]\s*/gi, '')
            .replace(/^\s*\[.*?\]\s*/g, '')
            .trim();
          
          // Strip common prompt prefixes to extract the subject
          const cleaned = prompt
            .replace(/^(please\s+)?(can you\s+)?(help me\s+)?(create|build|make|design|generate|develop|code|write)\s+(me\s+)?(a|an|the)?\s*/i, '')
            .replace(/\s+(app|application|website|site|page|tool|platform|system|dashboard|portal)\s*$/i, (match) => match)
            .trim();
          
          // Take first meaningful chunk (up to 35 chars, break at word boundary)
          const subject = cleaned.length <= 35
            ? cleaned
            : cleaned.slice(0, 35).replace(/\s+\S*$/, '').trim();
          
          // Title case each word
          const projectName = subject
            .split(/\s+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
          
          if (projectName.length >= 3) {
            renameProject(projectName);
            hasAutoNamed.current = true;
          }
        }
      }
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating, latestFiles.length, messages, project.name, renameProject]);

  // Hot-reload streaming files + auto-switch to currently streaming file tab
  const streamingFilePath = isStreamingPreview && partialFiles.length > 0
    ? partialFiles[partialFiles.length - 1]?.path || null
    : null;

  useEffect(() => {
    if (isStreamingPreview && partialFiles.length > 0) {
      for (const file of partialFiles) upsertFile(file.path, file.content);
      // Auto-switch to the file currently being streamed
      const lastFile = partialFiles[partialFiles.length - 1];
      if (lastFile && rightTab === 'code') {
        setActiveFile(lastFile.path);
      }
    }
  }, [partialFiles, isStreamingPreview]);

  // Auto-save (cloud) — includes chat messages + versions for persistence
  useEffect(() => {
    if (project.files.length > 0) scheduleAutoSave(project.name, project.files, messages, { versions });
  }, [project.files, project.name, messages, versions, scheduleAutoSave]);

  // Auto-save to IndexedDB (Phase 10 — fast local persistence)
  const sessionId = currentProjectId || 'draft';
  useEffect(() => {
    idbPersistence.saveToIDB(sessionId, project.name, project.files, messages);
  }, [project.files, project.name, messages, sessionId]);

  // Auto-save draft to localStorage (survives refresh)
  useEffect(() => {
    saveDraft(project.name, project.files, messages);
  }, [project.files, project.name, messages, saveDraft]);

  // Immediately persist draft when user switches tabs or navigates away
  const latestRef = useRef({ name: project.name, files: project.files, messages });
  latestRef.current = { name: project.name, files: project.files, messages };

  useEffect(() => {
    const flushDraft = () => saveDraftImmediate(latestRef.current.name, latestRef.current.files, latestRef.current.messages);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushDraft();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', flushDraft);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', flushDraft);
      flushDraft(); // also flush on unmount (route change)
    };
  }, [saveDraftImmediate]);

  // Auto-load project from URL ?project=<id> param
  const initialProjectId = searchParams.get('project');
  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (!initialProjectId || hasAutoLoaded.current) return;
    hasAutoLoaded.current = true;
    (async () => {
      const loaded = await loadProject(initialProjectId);
      if (loaded) {
        setFiles((loaded.files as any[]) || []);
        renameProject(loaded.name);
        if (loaded.published_url) setPublishedUrl(loaded.published_url);
        if (loaded.settings?.chatMessages) {
          setMessages(loaded.settings.chatMessages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
        if (loaded.settings?.versions) {
          setVersions(loaded.settings.versions.map((v: any) => ({ ...v, timestamp: new Date(v.timestamp) })));
        }
      }
    })();
  }, [initialProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore draft on mount (only if no project param and not explicitly new)
  const isNewProject = searchParams.get('new') === 'true';
  useEffect(() => {
    if (initialProjectId || isNewProject) return; // skip draft restore when loading a specific project or starting fresh
    if (project.files.length > 0 || messages.length > 0) return;
    // Try IndexedDB first (larger, more reliable), fall back to localStorage draft
    (async () => {
      const idbSession = await idbPersistence.checkRecovery();
      if (idbSession && (idbSession.files.length > 0 || idbSession.messages.length > 0)) {
        setShowRecoveryDialog(true);
        return;
      }
      // Fall back to localStorage draft
      const draft = loadDraft();
      if (draft && (draft.files.length > 0 || draft.messages.length > 0)) {
        setFiles(draft.files);
        renameProject(draft.name);
        if (draft.messages.length > 0) {
          setMessages(draft.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      }
    })();
  }, []); // intentionally run once on mount

  // Handle recovery dialog actions
  const handleRestoreSession = useCallback(() => {
    const session = idbPersistence.recoverableSession;
    if (!session) return;
    setFiles(session.files);
    renameProject(session.name);
    if (session.messages.length > 0) {
      setMessages(session.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    }
    setShowRecoveryDialog(false);
    toast.success('Session restored');
  }, [idbPersistence.recoverableSession, setFiles, renameProject, setMessages]);

  const handleDiscardSession = useCallback(() => {
    idbPersistence.clearSession();
    setShowRecoveryDialog(false);
    // Fall back to localStorage draft
    const draft = loadDraft();
    if (draft && (draft.files.length > 0 || draft.messages.length > 0)) {
      setFiles(draft.files);
      renameProject(draft.name);
      if (draft.messages.length > 0) {
        setMessages(draft.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
    }
  }, [idbPersistence, loadDraft, setFiles, renameProject, setMessages]);

  // Clear draft when starting a new project
  useEffect(() => {
    if (isNewProject) {
      clearDraft();
      idbPersistence.clearSession();
    }
  }, [isNewProject]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-upload preview to Supabase Storage for live hosting
  const compiledForHosting = useMemo(
    () => getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser),
    [project.files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser]
  );
  useEffect(() => {
    if (previewSlug && compiledForHosting) {
      uploadPreview(previewSlug, compiledForHosting);
    }
    return () => clearPreviewTimer();
  }, [compiledForHosting, previewSlug, uploadPreview, clearPreviewTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) handleRedo(); else handleUndo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(prev => !prev); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); setShowQuickSwitcher(prev => !prev); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') { e.preventDefault(); setShowFileSearch(prev => !prev); }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); setShowShortcuts(prev => !prev); }
      // Phase 51: Additional shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); setShowFileTree(prev => !prev); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') { e.preventDefault(); setShowConsole(prev => !prev); }
      if ((e.metaKey || e.ctrlKey) && e.key === '.') { e.preventDefault(); setRightTab(prev => prev === 'preview' ? 'code' : 'preview'); }
      if ((e.metaKey || e.ctrlKey) && e.key === '`') { e.preventDefault(); setShowTerminal(prev => !prev); }
      if (e.key === 'Escape') {
        // Stop AI generation first (highest priority)
        if (isGenerating) { e.preventDefault(); stopGenerating(); return; }
        if (showSettingsPanel) { setShowSettingsPanel(false); return; }
        if (showFileSearch) { setShowFileSearch(false); return; }
        if (showVersionHistory) { setShowVersionHistory(false); return; }
        if (showConsole) { setShowConsole(false); return; }
        if (showEnvVars) { setShowEnvVars(false); return; }
        if (showAssets) { setShowAssets(false); return; }
        if (showPackages) { setShowPackages(false); return; }
        if (showActivity) { setShowActivity(false); return; }
        if (showBilling) { setShowBilling(false); return; }
        if (showFileTree) { setShowFileTree(false); return; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [project.files, canUndo, canRedo, isGenerating, stopGenerating, showSettingsPanel, showFileSearch, showVersionHistory, showConsole, showEnvVars, showAssets, showPackages, showActivity, showBilling, showFileTree]);

  const handleSend = (input: string, imageDataUrls?: string[] | null, skipQuestions?: boolean) => {
    // Questions: intercept large prompts and ask clarifying questions first
    if (!skipQuestions) {
      const pendingQ = builderQuestions.analyzeForQuestions(input);
      if (pendingQ) {
        setMessages(prev => [
          ...prev,
          { id: crypto.randomUUID(), role: 'user', content: input, timestamp: new Date() },
          { id: crypto.randomUUID(), role: 'assistant', content: '🤔 Before I start, I have a few questions to make sure I build exactly what you want:', timestamp: new Date() },
        ]);
        return;
      }
    }

    // Phase planner: intercept large prompts and decompose into phases
    const plan = phasePlanner.analyzePrompt(input);
    if (plan) {
      const phaseList = plan.phases.map((p, i) => `${i + 1}. **${p.title}** — ${p.description}`).join('\n');
      const planMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: `🚧 **This is a large project!** I've broken it into ${plan.phases.length} phases to save credits and ensure quality:\n\n${phaseList}\n\nClick **"Start Phase 1"** below to begin. Each phase builds on the last, and you can skip or cancel at any time.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: input, timestamp: new Date() }, planMessage]);
      return;
    }

    const contextPrefix = activeFile && rightTab === 'code' ? `[Currently viewing: ${activeFile.path}]\n` : '';
    const referencedFiles = findReferencedFiles(input, project.files);
    const contextHint = referencedFiles.length > 0 ? `[Auto-detected relevant files: ${referencedFiles.map(f => f.path).join(', ')}]\n` : '';
    
    // Detect Supabase intents and inject backend context
    const supabaseIntents = detectSupabaseIntents(input);
    const supabaseContext = buildSupabaseContext(supabaseIntents, !!supabaseConfig);
    
    // Process prompt memory (detect user corrections)
    promptMemory.processUserMessage(input);
    // Log to prompt history
    promptHistory.addEntry(input, selectedModel, project.files.length);

    const knowledgeCtx = [
      knowledge.customInstructions || '',
      knowledge.contextFiles.length > 0 ? '\n\nContext files:\n' + knowledge.contextFiles.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n') : '',
      supabaseContext,
      selfReview.buildSelfReviewInstruction(),
      promptMemory.buildMemoryContext(),
      schemaIntrospection.getSchemaSummary() || '',
    ].filter(Boolean).join('\n') || undefined;
    
    const fullInput = contextPrefix + contextHint + input;

    // Build log tracking
    buildStartTimeRef.current = Date.now();
    buildLog.logBuildStart(input);

    // Agent mode: enqueue task and let the auto-process useEffect handle execution
    if (mode === 'build') {
      enqueueTask(input, imageDataUrls);
    } else {
      sendMessage(fullInput, project.files, supabaseConfig, stripeConfig, serviceKeys, imageDataUrls, selectedModel, knowledgeCtx);
    }
    autoRecovery.resetRecovery();
  };

  // Phase planner: handle proceeding to next phase
  const handlePhaseAdvance = useCallback(() => {
    const phasePrompt = phasePlanner.getCurrentPhasePrompt();
    if (!phasePrompt) return;

    const contextPrefix = activeFile && rightTab === 'code' ? `[Currently viewing: ${activeFile.path}]\n` : '';
    const knowledgeCtx = [
      knowledge.customInstructions || '',
      selfReview.buildSelfReviewInstruction(),
      promptMemory.buildMemoryContext(),
    ].filter(Boolean).join('\n') || undefined;

    const fullInput = contextPrefix + phasePrompt;

    buildStartTimeRef.current = Date.now();
    buildLog.logBuildStart(`Phase ${(phasePlanner.activePlan?.currentPhaseIndex || 0) + 1}`);

    if (mode === 'build') {
      enqueueTask(phasePrompt);
    } else {
      sendMessage(fullInput, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel, knowledgeCtx);
    }

    phasePlanner.advancePhase();
  }, [phasePlanner, activeFile, rightTab, knowledge, selfReview, promptMemory, mode, enqueueTask, sendMessage, project.files, supabaseConfig, stripeConfig, serviceKeys, selectedModel, buildLog]);

  const getLastAIResponse = useCallback(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    return lastAssistant?.content || '';
  }, [messages]);

  const handleFixError = useCallback((errorPrompt: string) => {
    // Enrich even simple fix requests with full project context
    const diagnosisContext = buildErrorDiagnosisContext(
      { message: errorPrompt },
      project.files,
      undefined,
      getLastAIResponse(),
    );
    sendMessage(diagnosisContext, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel, undefined, true);
  }, [sendMessage, project.files, supabaseConfig, stripeConfig, serviceKeys, selectedModel, getLastAIResponse]);

  const handleSmartFixError = useCallback((error: import('./ErrorConsole').PreviewError, context: string) => {
    const isSameError = lastFixError === error.message;
    const newCount = isSameError ? fixAttemptCount + 1 : 1;
    setFixAttemptCount(newCount);
    setLastFixError(error.message);
    if (newCount > MAX_FIX_ATTEMPTS) { toast.error('Unable to auto-fix — try describing the issue differently.'); return; }
    const retryContext = newCount > 1 ? `\n\nThis is attempt ${newCount}/${MAX_FIX_ATTEMPTS}. Previous fix attempts did not resolve the issue. Try a COMPLETELY DIFFERENT approach — rewrite the broken function from scratch.` : '';
    const diagnosisContext = buildErrorDiagnosisContext(
      { message: error.message, source: error.source, line: error.line },
      project.files,
      undefined,
      getLastAIResponse(),
    );
    sendMessage(`${diagnosisContext}\n\nFix this error in my app. Here is the full context:\n\n${context}${retryContext}\n\nPlease fix the code and return the corrected file(s).`, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel, undefined, true);
  }, [sendMessage, project.files, supabaseConfig, stripeConfig, serviceKeys, selectedModel, fixAttemptCount, lastFixError, getLastAIResponse]);

  // Auto-fix pipeline: uses Phase 47 useAutoFixLoop + hot recovery
  const handleAutoFixError = useCallback((error: import('./ErrorConsole').PreviewError) => {
    // Forward error to chat for inline display
    forwardErrorToChat({ message: error.message, source: error.source, line: error.line });
    // Hot Module Recovery: check if we should rollback instead of fix
    const rollbackFiles = hotRecovery.reportCrash(error.message);
    if (rollbackFiles) {
      pushUndo('Before hot recovery rollback', project.files);
      setFiles(rollbackFiles);
      toast.info('Auto-rolled back to last working state');
      return;
    }
    if (isGenerating) return;
    // Phase 47: Use structured auto-fix loop with exponential backoff
    autoFixLoop.attemptFix(
      { id: crypto.randomUUID(), message: error.message, source: error.source, line: error.line, timestamp: new Date(), type: 'error' },
      project.files,
      messages.slice(-4).map(m => m.content),
    );
  }, [isGenerating, fixAttemptCount, autoRecovery, project.files, sendMessage, supabaseConfig, stripeConfig, serviceKeys, selectedModel, forwardErrorToChat, getLastAIResponse]);

  const handleForkFromMessage = useCallback(async (messageId: string) => {
    await saveProject(project.name, project.files, branches, activeBranch, messages);
    const msgIndex = messages.findIndex(m => m.id === messageId);
    const truncatedMessages = messages.slice(0, msgIndex + 1);
    const forkName = `${project.name} (fork)`;
    setMessages(truncatedMessages);
    renameProject(forkName);
    await saveProject(forkName, project.files, branches, activeBranch, truncatedMessages);
    toast.success(`Forked as "${forkName}"`);
  }, [saveProject, project.name, project.files, branches, activeBranch, messages, setMessages, renameProject]);

  const handleRevertToMessage = useCallback((messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.filesSnapshot) { toast.error('No snapshot available for this message'); return; }
    pushUndo('Before revert', project.files);
    setFiles(msg.filesSnapshot);
    toast.success('Reverted to message snapshot');
  }, [messages, pushUndo, project.files, setFiles]);

  const handleSelectStarterTemplate = useCallback((template: import('./AppStarterTemplates').AppStarterTemplate) => {
    pushUndo('Before template', project.files);
    setFiles(template.files);
    sendMessage(
      `I've loaded the "${template.name}" starter template. ${template.aiContext}\n\nThe project now has these files: ${template.files.map(ft => ft.path).join(', ')}. Please acknowledge and wait for my next instruction on how to customize it.`,
      template.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel
    );
  }, [pushUndo, project.files, setFiles, sendMessage, supabaseConfig, stripeConfig, serviceKeys, selectedModel]);

  const handleGenerateAuthPages = useCallback((providers: string[]) => {
    const isReact = project.files.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
    const template = buildAuthTemplate(providers, isReact);

    // Inject auth template files into the project
    pushUndo('Before auth template', project.files);
    const updatedFiles = [...project.files];
    for (const tFile of template.files) {
      const existing = updatedFiles.findIndex(f => f.path === tFile.path);
      if (existing >= 0) {
        updatedFiles[existing] = { ...updatedFiles[existing], content: tFile.content };
      } else {
        updatedFiles.push({ path: tFile.path, content: tFile.content, language: tFile.path.endsWith('.tsx') ? 'typescript' : 'javascript' });
      }
    }
    setFiles(updatedFiles);

    // Send message with auth context so the AI knows auth is wired
    const prompt = `I've injected a complete authentication system with ${providers.join(', ')} providers. ${template.aiContext}\n\nThe auth files are: ${template.files.map(f => f.path).join(', ')}. Please integrate these into the existing app — register the auth routes in the router, wrap protected pages, and add a logout button to the navigation. Preserve all existing functionality.`;
    sendMessage(prompt, updatedFiles, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel);
  }, [sendMessage, project.files, supabaseConfig, stripeConfig, serviceKeys, selectedModel, pushUndo, setFiles]);

  const handleCreateEdgeFunction = useCallback((name: string) => {
    const template = `// Deno edge function: ${name}\nimport { serve } from "https://deno.land/std@0.168.0/http/server.ts";\n\nconst corsHeaders = {\n  "Access-Control-Allow-Origin": "*",\n  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",\n};\n\nserve(async (req) => {\n  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });\n\n  try {\n    const body = await req.json();\n    return new Response(JSON.stringify({ message: "Hello from ${name}", data: body }), {\n      headers: { ...corsHeaders, "Content-Type": "application/json" },\n    });\n  } catch (e) {\n    return new Response(JSON.stringify({ error: e.message }), {\n      status: 500,\n      headers: { ...corsHeaders, "Content-Type": "application/json" },\n    });\n  }\n});`;
    upsertFile(`functions/${name}/index.ts`, template);
    setEdgeFunctions(prev => [...prev, { name, status: 'draft' }]);
    addActivity('file_edit', `Created edge function: ${name}`);
  }, [upsertFile, addActivity]);

  const handleDeleteEdgeFunction = useCallback((name: string) => {
    deleteFile(`functions/${name}/index.ts`);
    setEdgeFunctions(prev => prev.filter(f => f.name !== name));
    toast.success(`Function "${name}" deleted`);
    addActivity('file_edit', `Deleted edge function: ${name}`);
  }, [deleteFile, addActivity]);

  const handleGithubPullFiles = useCallback((pulledFiles: { path: string; content: string; language: string }[]) => {
    pushUndo('GitHub pull', project.files);
    setFiles(pulledFiles as any[]);
    addActivity('file_edit', `Pulled ${pulledFiles.length} files from GitHub`);
  }, [pushUndo, project.files, setFiles, addActivity]);

  useEffect(() => {
    if (project.name) {
      const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
      if (slug) setPreviewSlug(slug);
    }
  }, [project.name]);

  const handleConflictResolve = useCallback((resolutions: Record<string, 'mine' | 'ai'>) => {
    if (!pendingConflicts) return;
    for (const conflict of pendingConflicts) {
      if (resolutions[conflict.path] === 'ai') upsertFile(conflict.path, conflict.aiContent);
    }
    setPendingConflicts(null);
    setDirtyFiles(prev => {
      const next = new Set(prev);
      pendingConflicts.forEach(c => { if (resolutions[c.path] === 'ai') next.delete(c.path); });
      return next;
    });
  }, [pendingConflicts, upsertFile]);

  const handleContentChange = useCallback((path: string, content: string) => {
    upsertFile(path, content);
    setDirtyFiles(prev => new Set(prev).add(path));
  }, [upsertFile]);

  const handleAIEditRequest = useCallback((selector: string, elementContext: string, prompt: string) => {
    sendMessage(`The user selected an element in the preview and wants you to edit it.\n\nElement selector: ${selector}\nElement HTML:\n${elementContext}\n\nUser request: "${prompt}"\n\nPlease update the relevant file(s) to apply this change.`, project.files, supabaseConfig, stripeConfig, serviceKeys);
  }, [sendMessage, project.files, supabaseConfig, stripeConfig, serviceKeys]);

  // Persist visual edits (text/color) to project source files
  const handleVisualEdit = useCallback((selector: string, property: string, value: string) => {
    // Find HTML files that might contain the edited content
    const htmlFiles = project.files.filter(f => 
      f.path.endsWith('.html') || f.path.endsWith('.htm') || f.path === 'index.html'
    );
    
    if (htmlFiles.length === 0) return;

    for (const file of htmlFiles) {
      let updated = file.content;
      let changed = false;

      if (property === 'replaceWithImage') {
        // Directly inject the image into source files instead of sending huge base64 to AI chat
        const imgTag = `<img src="${value}" alt="Image" style="max-width:200px;height:auto;" />`;
        
        // Update iframe directly for instant visual feedback
        const iframe = document.querySelector('iframe');
        const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
        if (iframeDoc) {
          const el = iframeDoc.querySelector(selector) as HTMLElement;
          if (el) el.outerHTML = imgTag;
        }

        // Persist: find and replace the element in source HTML files
        for (const f of htmlFiles) {
          // Try to find the element by parsing the selector's tag
          const parts = selector.split(' > ');
          const lastPart = parts[parts.length - 1]?.replace(/:nth-child\(\d+\)/, '') || '';
          if (lastPart) {
            // Simple regex to find the element — works for common cases
            const tagRegex = new RegExp(`<${lastPart}[^>]*>[^<]*</${lastPart}>`, 'i');
            const match = f.content.match(tagRegex);
            if (match) {
              const newContent = f.content.replace(match[0], imgTag);
              if (newContent !== f.content) {
                upsertFile(f.path, newContent);
                return;
              }
            }
          }
        }
        // Fallback: ask AI with a short prompt (no data URL in message)
        sendMessage(
          `Replace the element at "${selector}" with this image tag in the HTML source: ${imgTag}`,
          project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel
        );
        return;
      } else if (property === 'resize') {
        const [w, h] = value.split('x');
        const style = `${w ? `width:${w}px;` : ''}${h ? `height:${h}px;` : ''}object-fit:contain;`;
        sendMessage(
          `Apply this visual edit: resize the element at selector "${selector}" to ${w ? `width ${w}px` : ''}${w && h ? ' and ' : ''}${h ? `height ${h}px` : ''}. Add inline style: style="${style}" to the element.`,
          project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel
        );
        return;
      } else if (property === 'text') {
        sendMessage(
          `Apply this visual edit to the source file. Change the text content of the element matching selector "${selector}" to: "${value}". Only update the text, keep everything else the same.`,
          project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel
        );
        return;
      } else if (property === 'color') {
        sendMessage(
          `Apply this visual edit to the source file. Change the text color of the element matching selector "${selector}" to: "${value}". Add an inline style or update the existing CSS.`,
          project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel
        );
        return;
      }
    }
  }, [project.files, sendMessage, supabaseConfig, stripeConfig, serviceKeys, selectedModel]);

  const handleInlineAIAction = useCallback((action: string, selection: string, filePath: string) => {
    const prompts: Record<string, string> = {
      explain: `Explain this code from ${filePath}:\n\n\`\`\`\n${selection}\n\`\`\``,
      refactor: `Refactor this code from ${filePath} to be cleaner and more efficient:\n\n\`\`\`\n${selection}\n\`\`\``,
      test: `Generate unit tests for this code from ${filePath}:\n\n\`\`\`\n${selection}\n\`\`\``,
      fix: `Fix any issues in this code from ${filePath}:\n\n\`\`\`\n${selection}\n\`\`\``,
    };
    sendMessage(prompts[action] || selection, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel);
    addActivity('ai_generation', `AI ${action}`, filePath);
  }, [sendMessage, project.files, supabaseConfig, stripeConfig, serviceKeys, selectedModel, addActivity]);

  const handleReplaceInFiles = useCallback((query: string, replacement: string, isRegex: boolean, caseSensitive: boolean) => {
    let count = 0;
    const regex = isRegex ? new RegExp(query, caseSensitive ? 'g' : 'gi') : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
    for (const file of project.files) {
      const newContent = file.content.replace(regex, () => { count++; return replacement; });
      if (newContent !== file.content) upsertFile(file.path, newContent);
    }
    if (count > 0) { pushUndo('Replace all', project.files); addActivity('file_edit', `Replaced ${count} occurrences`); }
    return count;
  }, [project.files, upsertFile, pushUndo, addActivity]);

  const handleClear = () => {
    setConfirmAction({
      title: 'Clear chat & project?',
      description: 'This will remove all messages, generated files, and reset the project to a blank state. This cannot be undone.',
      onConfirm: () => { clearChat(); resetProject(); setStableHTML(null); },
    });
  };

  const handleRename = async () => {
    const newName = editName.trim();
    if (newName && newName !== project.name) {
      renameProject(newName);
      // Immediately persist the rename to Supabase
      await saveProject(newName, project.files, branches, activeBranch, messages);
      toast.success(`Renamed to "${newName}"`);
    }
    setIsEditingName(false);
  };

  const handleUndo = useCallback(() => {
    const restored = undo(project.files);
    if (restored) { setFiles(restored); toast.success('Undone'); }
  }, [undo, project.files, setFiles]);

  const handleRedo = useCallback(() => {
    const restored = redo(project.files);
    if (restored) { setFiles(restored); toast.success('Redone'); }
  }, [redo, project.files, setFiles]);

  const handleCreateBranch = useCallback((name: string) => {
    createBranch(name, project.files);
    toast.success(`Branch "${name}" created`);
  }, [createBranch, project.files]);

  const handleSwitchBranch = useCallback((branchId: string) => {
    const files = switchBranch(branchId, project.files);
    if (files && files.length > 0) { pushUndo('Branch switch', project.files); setFiles(files); }
    toast.success('Switched branch');
  }, [switchBranch, project.files, pushUndo, setFiles]);

  const handleMergeBranch = useCallback((branchId: string) => {
    pushUndo('Before merge', project.files);
    const merged = mergeBranch(branchId, project.files);
    setFiles(merged);
    toast.success('Branch merged');
  }, [mergeBranch, project.files, pushUndo, setFiles]);

  const { captureAndUpload } = usePreviewCapture();

  const handleSave = useCallback(async () => {
    const extraSettings: Record<string, any> = { versions };
    if (linkedGPT) extraSettings.linkedGPT = linkedGPT;
    const projectId = await saveProject(project.name, project.files, branches, activeBranch, messages, extraSettings);
    setDirtyFiles(new Set());
    clearDraft();
    toast.success('Project saved');
    // Capture thumbnail in background (non-blocking)
    const html = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT);
    if (projectId && html) {
      captureAndUpload(html, projectId).catch(() => {});
    }
  }, [saveProject, project.name, project.files, branches, activeBranch, messages, clearDraft, getCompiledHTML, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, captureAndUpload, linkedGPT]);

  // Auto-capture thumbnail after generation completes
  const wasGeneratingRef = useRef(false);
  useEffect(() => {
    if (wasGeneratingRef.current && !isGenerating && project.files.length > 0 && currentProjectId) {
      const html = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT);
      if (html) {
        setTimeout(() => {
          captureAndUpload(html, currentProjectId).catch(() => {});
        }, 2000);
      }
    }
    wasGeneratingRef.current = isGenerating;
  }, [isGenerating, project.files.length, currentProjectId, getCompiledHTML, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, captureAndUpload]);

  // Auto-advance to next phase when generation completes and autoAdvance is on
  useEffect(() => {
    if (
      wasGeneratingRef.current === false &&
      !isGenerating &&
      phasePlanner.activePlan?.autoAdvance &&
      !phasePlanner.isComplete &&
      phasePlanner.activePlan.currentPhaseIndex > 0
    ) {
      const timer = setTimeout(() => {
        handlePhaseAdvance();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isGenerating, phasePlanner.activePlan?.autoAdvance, phasePlanner.activePlan?.currentPhaseIndex, phasePlanner.isComplete, handlePhaseAdvance]);

  const handleLoadProject = useCallback(async (projectId: string) => {
    const loaded = await loadProject(projectId);
    if (loaded) {
      setFiles(loaded.files as any[]);
      renameProject(loaded.name);
      if (loaded.published_url) setPublishedUrl(loaded.published_url);
      if (loaded.settings?.chatMessages) {
        setMessages(loaded.settings.chatMessages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
      if (loaded.settings?.versions) {
        setVersions(loaded.settings.versions.map((v: any) => ({ ...v, timestamp: new Date(v.timestamp) })));
      }
      if (loaded.settings?.linkedGPT) {
        setLinkedGPT(loaded.settings.linkedGPT);
      } else {
        setLinkedGPT(null);
      }
      toast.success(`Loaded "${loaded.name}"`);
    }
  }, [loadProject, setFiles, renameProject, setMessages, setVersions]);

  const handlePublish = useCallback(async () => {
    const compiledHTML = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT);
    if (!compiledHTML) { toast.error('Nothing to publish'); return; }
    setBuildNotifications(prev => [{ id: crypto.randomUUID(), type: 'deploy' as const, title: 'Deploying to production...', timestamp: new Date(), read: false }, ...prev]);
    const url = await publishProject(project.name, compiledHTML);
    if (url) {
      setPublishedUrl(url);
      toast.success('Published successfully!');
      setBuildNotifications(prev => [{ id: crypto.randomUUID(), type: 'success' as const, title: 'Published to production', detail: url, timestamp: new Date(), read: false }, ...prev].slice(0, 50));
    }
  }, [publishProject, project.name, getCompiledHTML, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser]);

  const handleRemix = useCallback(async (projectId: string) => {
    const loaded = await loadProject(projectId);
    if (loaded) {
      setFiles(loaded.files as any[]);
      renameProject(`Remix of ${loaded.name}`);
      toast.success(`Remixed "${loaded.name}" — save to create your own copy`);
    }
  }, [loadProject, setFiles, renameProject]);

  const handleAssetUpload = useCallback((asset: ProjectAsset) => { setAssets(prev => [...prev, asset]); }, []);
  const handleAssetDelete = useCallback((id: string) => { setAssets(prev => prev.filter(a => a.id !== id)); toast.success('Asset deleted'); }, []);

  const STARTER_CONTENT: Record<string, string> = {
    html: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Page</title>\n</head>\n<body>\n  \n</body>\n</html>',
    css: '/* styles */\n',
    js: '// script\n',
    json: '{}',
    md: '# Title\n',
  };

  const handleCreateFile = useCallback((path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const content = STARTER_CONTENT[ext] || '';
    upsertFile(path, content);
    setRightTab('code');
    toast.success(`Created ${path}`);
  }, [upsertFile]);

  const handleRenameFile = useCallback((oldPath: string, newPath: string) => {
    const file = project.files.find(f => f.path === oldPath);
    if (!file) return;
    upsertFile(newPath, file.content);
    deleteFile(oldPath);
    toast.success(`Renamed to ${newPath.split('/').pop()}`);
  }, [project.files, upsertFile, deleteFile]);

  // ── React Compiler integration ──
  const { compileReactProject } = useReactCompiler();
  const isReactProject = useMemo(() => detectReactProject(project.files), [project.files]);

  const liveCompiledHTML = useMemo(() => {
    // If this is a React project, use the React compiler pipeline
    if (isReactProject) {
      const result = compileReactProject(project.files, {
        supabaseConfig: supabaseConfig || undefined,
        stripeConfig: stripeConfig || undefined,
        envVars,
      });
      if (result.errors.length > 0) {
        console.warn('[ReactCompiler] Warnings:', result.errors);
      }
      return result.html || null;
    }
    // Otherwise use the vanilla HTML compiler
    return getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT);
  }, [project.files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT, isReactProject, compileReactProject]);
  const [stableHTML, setStableHTML] = useState<string | null>(null);

  // Defer preview updates until build completes — but allow CSS hot-patches through immediately
  useEffect(() => {
    if (!isGenerating && liveCompiledHTML) {
      // Try hot-patching first (CSS-only changes skip full reload)
      const patched = liveSync.applyPatches(previewIframeRef, project.files);
      if (!patched) {
        // Full reload needed — update srcdoc
        setStableHTML(liveCompiledHTML);
        liveSync.resetSnapshot(project.files);
      }
    }
  }, [isGenerating, liveCompiledHTML, project.files]);

  // Also hot-patch during manual edits (when not generating)
  useEffect(() => {
    if (!isGenerating && stableHTML && project.files.length > 0) {
      liveSync.applyPatches(previewIframeRef, project.files);
    }
  }, [project.files, isGenerating, stableHTML]);

  // For first load (no previous build), show immediately
  const compiledHTML = stableHTML || liveCompiledHTML;
  const hasFiles = project.files.length > 0;

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview' | 'editor'>('chat');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close other panels when opening one
  const openPanel = (panel: 'history' | 'envVars' | 'assets' | 'packages' | 'database' | 'auth' | 'knowledge' | 'storage' | 'edgeFunctions' | 'activity' | 'codeIntel' | 'componentLib' | 'testingSuite' | 'exportGuide' | 'helpCenter' | 'gptConnector' | 'setupWizard' | 'schemaDesigner' | 'oneClickDeploy' | 'designSystem') => {
    setShowVersionHistory(panel === 'history' ? !showVersionHistory : false);
    setShowEnvVars(panel === 'envVars' ? !showEnvVars : false);
    setShowAssets(panel === 'assets' ? !showAssets : false);
    setShowPackages(panel === 'packages' ? !showPackages : false);
    setShowDatabase(panel === 'database' ? !showDatabase : false);
    setShowAuth(panel === 'auth' ? !showAuth : false);
    setShowKnowledge(panel === 'knowledge' ? !showKnowledge : false);
    setShowStorage(panel === 'storage' ? !showStorage : false);
    setShowEdgeFunctions(panel === 'edgeFunctions' ? !showEdgeFunctions : false);
    setShowActivity(panel === 'activity' ? !showActivity : false);
    setShowCodeIntel(panel === 'codeIntel' ? !showCodeIntel : false);
    setShowComponentLib(panel === 'componentLib' ? !showComponentLib : false);
    setShowTestingSuite(panel === 'testingSuite' ? !showTestingSuite : false);
    setShowExportGuide(panel === 'exportGuide' ? !showExportGuide : false);
    setShowHelpCenter(panel === 'helpCenter' ? !showHelpCenter : false);
    setShowGPTConnector(panel === 'gptConnector' ? !showGPTConnector : false);
    setShowSetupWizard(panel === 'setupWizard' ? !showSetupWizard : false);
    setShowSchemaDesigner(panel === 'schemaDesigner' ? !showSchemaDesigner : false);
    setShowOneClickDeploy(panel === 'oneClickDeploy' ? !showOneClickDeploy : false);
    setShowDesignSystem(panel === 'designSystem' ? !showDesignSystem : false);
  };

  // Track recent files
  const handleSetActiveFile = useCallback((path: string) => {
    setActiveFile(path);
    setRecentFiles(prev => [path, ...prev.filter(p => p !== path)].slice(0, 10));
  }, [setActiveFile]);

  // Command palette actions
  const commandActions = useMemo((): CommandAction[] => [
    { id: 'preview', label: 'Switch to Preview', icon: Eye, category: 'view', shortcut: '⌘1', action: () => setRightTab('preview') },
    { id: 'code', label: 'Switch to Code', icon: Code, category: 'view', shortcut: '⌘2', action: () => setRightTab('code') },
    { id: 'split', label: 'Switch to Split View', icon: Columns, category: 'view', shortcut: '⌘3', action: () => setRightTab('split') },
    { id: 'save', label: 'Save Project', icon: Settings, category: 'edit', shortcut: '⌘S', action: handleSave },
    { id: 'undo', label: 'Undo', icon: Undo2, category: 'edit', shortcut: '⌘Z', action: handleUndo },
    { id: 'redo', label: 'Redo', icon: Redo2, category: 'edit', shortcut: '⌘⇧Z', action: handleRedo },
    { id: 'search', label: 'Multi-File Search & Replace', icon: Replace, category: 'edit', shortcut: '⌘⇧F', action: () => setShowMultiSearch(true), keywords: ['find', 'replace', 'search'] },
    { id: 'test-runner', label: 'Open Test Runner', icon: Play, category: 'run', action: () => setShowTestRunner(true), keywords: ['test', 'run', 'jest', 'vitest'] },
    { id: 'extensions', label: 'Extensions Marketplace', icon: Puzzle, category: 'panel', action: () => setShowExtensions(true), keywords: ['plugin', 'extension', 'marketplace'] },
    { id: 'terminal', label: 'Toggle Terminal', icon: Terminal, category: 'panel', shortcut: '⌘`', action: () => setShowTerminal(t => !t) },
    { id: 'files', label: 'Toggle File Tree', icon: FolderOpen, category: 'panel', action: () => setShowFileTree(t => !t) },
    { id: 'publish', label: 'Publish App', icon: Rocket, category: 'deploy', action: handlePublish, keywords: ['deploy', 'publish'] },
    { id: 'templates', label: 'Open Templates', icon: Layers, category: 'panel', action: () => setShowTemplates(true) },
    { id: 'analytics', label: 'Build Analytics', icon: BarChart3, category: 'panel', action: () => setShowBuildAnalytics(true) },
    { id: 'database', label: 'Database Panel', icon: Database, category: 'panel', action: () => openPanel('database'), keywords: ['supabase', 'db'] },
    { id: 'console', label: 'Toggle Console', icon: Activity, category: 'panel', action: () => setShowConsole(c => !c) },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, category: 'panel', shortcut: '⌘/', action: () => setShowShortcuts(true) },
    { id: 'prompt-history', label: 'Prompt History', icon: Clock, category: 'panel', action: () => setShowPromptHistory(true), keywords: ['history', 'prompts', 'favorites'] },
    { id: 'code-smells', label: 'Analyze Code Quality', icon: Zap, category: 'run', action: () => { const smells = codeSmellDetector.analyzeFiles(project.files); setCodeSuggestions(smells); setShowCodeIntel(true); toast.success(`Found ${smells.length} suggestions`); }, keywords: ['lint', 'quality', 'refactor', 'smell'] },
    { id: 'gen-readme', label: 'Generate README', icon: BookOpen, category: 'run', action: () => { const prompt = docGenerator.generateReadmePrompt(project.files, project.name); handleSend(prompt); }, keywords: ['doc', 'readme', 'documentation'] },
    { id: 'doc-file', label: 'Document Current File', icon: FileCode, category: 'run', action: () => { if (activeFile) { const prompt = docGenerator.generateDocPrompt(activeFile); handleSend(prompt); } else { toast.error('Open a file first'); } }, keywords: ['jsdoc', 'comment', 'document'] },
  ], [handleSave, handleUndo, handleRedo, handlePublish, openPanel, codeSmellDetector, project.files, docGenerator, project.name, activeFile, handleSend]);

  // Sidebar removed — all tools accessible via ⌘K command palette (Lovable-style)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full w-full flex flex-col bg-[#09090b] overflow-hidden relative">
      <WelcomeOverlay onQuickStart={(prompt) => handleSend(prompt)} />
      <OnboardingTour />
      <ShortcutsHint />
      <SessionRecoveryDialog
        session={idbPersistence.recoverableSession}
        open={showRecoveryDialog}
        onRestore={handleRestoreSession}
        onDiscard={handleDiscardSession}
      />
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => { confirmAction?.onConfirm(); setConfirmAction(null); }}
        title={confirmAction?.title || ''}
        description={confirmAction?.description || ''}
        confirmLabel="Yes, clear everything"
        variant="danger"
      />
        {/* ── Top Bar — Lovable-style ── */}
        <div className="flex items-center justify-between px-2 h-11 border-b border-white/[0.06] bg-[#0c0c0c] shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          {/* LEFT: Logo + Project name dropdown */}
          <div className="flex items-center gap-2 min-w-0">
            {/* App logo/icon */}
            <button onClick={() => navigate('/ai-studio')} className="shrink-0 flex items-center justify-center h-8 w-8">
              <img src={ultriumLogo} alt="UltriumAI" className="h-8 w-8 rounded-md object-contain" />
            </button>

            {isEditingName ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                className="h-7 w-48 text-sm bg-white/5 border-white/10 text-white"
                autoFocus
              />
            ) : (
              <ProjectDropdownMenu
                projectName={project.name}
                isGenerating={isGenerating}
                hasFiles={hasFiles}
                onRename={() => { setEditName(project.name); setIsEditingName(true); }}
                onOpenSettings={() => setShowSettingsPanel(true)}
                onPublish={() => setShowPublishPanel(true)}
                onOpenBilling={() => setShowBilling(true)}
              />
            )}

            {/* Undo/Redo with Smart Preview + History */}
            <div className="hidden md:flex items-center gap-0.5 ml-1">
              <UndoPreviewPopover
                undoStack={undoStack}
                redoStack={redoStack}
                canUndo={canUndo}
                canRedo={canRedo}
                currentFiles={project.files}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setShowPromptHistory(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                    <Clock className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Prompt History</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setShowVersionHistory(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                    <History className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Version History</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setRightTab('split')} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", rightTab === 'split' ? "text-white/60 bg-white/5" : "text-white/30 hover:text-white/60 hover:bg-white/5")}>
                    <Columns className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Split View</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* CENTER: View tabs + tool icons */}
          <div className="hidden md:flex items-center gap-1">
            {/* Preview pill (primary action) */}
            <button
              onClick={() => setRightTab('preview')}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all border",
                rightTab === 'preview'
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/30 shadow-sm shadow-violet-500/10"
                  : "text-white/50 border-transparent hover:text-violet-300/70 hover:bg-violet-500/[0.08]"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>

            {/* Divider */}
            <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

            {/* Tool icons row */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowSupabaseIDE(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  <Database className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Supabase</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setRightTab('code')} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", rightTab === 'code' ? "text-white/60 bg-white/5" : "text-white/30 hover:text-white/60 hover:bg-white/5")}>
                  <Code className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Code Editor</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowTerminal(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  <Terminal className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Terminal</TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="h-4 w-px bg-white/[0.08] mx-0.5" />

            {/* Panels dropdown (Analytics, Cloud, Code, Design, Security, Speed) */}
            <ToolbarPanelsDropdown
              onOpenPanel={(panelId) => {
                switch (panelId) {
                  case 'analytics': setShowBuildAnalytics(true); break;
                  case 'cloud': setShowSupabaseIDE(true); break;
                  case 'code': setRightTab('code'); break;
                  case 'design': setShowDesignSystem(true); break;
                  case 'security': setShowTestingSuite(true); break;
                  case 'speed': setShowPerformanceProfiler(true); break;
                }
              }}
            />
          </div>

          {/* RIGHT: URL bar + actions */}
          <div className="flex items-center gap-1.5">
            {/* URL bar */}
            <div className="hidden lg:flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/30 text-xs min-w-[180px]">
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate font-mono">{previewCurrentUrl}</span>
            </div>

            {/* Expand + Refresh */}
            <div className="hidden md:flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="h-7 w-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                    <Zap className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Expand</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => { const iframe = previewIframeRef.current; if (iframe && iframe.srcdoc) { const s = iframe.srcdoc; iframe.srcdoc = ''; requestAnimationFrame(() => { iframe.srcdoc = s; }); } }} className="h-7 w-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Refresh</TooltipContent>
              </Tooltip>
            </div>

            <div className="h-5 w-px bg-white/[0.06] mx-0.5" />

            {/* Sync status indicator (Phase 10) */}
            <SyncStatusIndicator status={idbPersistence.syncStatus} lastSaved={lastSaved} />

            {/* Credits indicator */}
            <HeaderCreditsIndicator onOpenBilling={() => setShowBilling(true)} />

            <div className="h-5 w-px bg-white/[0.06] mx-0.5" />

            {/* Share button */}
            <button
              onClick={() => setShowShareDialog(true)}
              className="h-6 px-2 rounded-md flex items-center gap-1 text-[11px] font-medium text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/[0.08] transition-colors"
            >
              <Users className="h-3 w-3" />
              Share
            </button>

            {/* Publish button */}
            <button
              onClick={() => setShowPublishPanel(true)}
              className={cn(
                "h-6 px-2.5 rounded-md flex items-center gap-1 text-[11px] font-medium transition-colors",
                publishedUrl
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                  : "bg-violet-500/15 text-violet-300/80 hover:text-violet-200 hover:bg-violet-500/25 border border-violet-500/20"
              )}
            >
              <Rocket className="h-3 w-3" />
              Publish
            </button>
          </div>
        </div>

        {/* Orange accent line under header */}
        <div className="h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 shrink-0" />

        {/* Mobile tab switcher */}
        {isMobile && (
          <div className="flex items-center h-11 border-b border-white/[0.06] bg-black/30 shrink-0 md:hidden">
            <button onClick={() => setMobileTab('chat')} className={cn("flex-1 h-full min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors", mobileTab === 'chat' ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/40")}>
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </button>
            <button onClick={() => setMobileTab('preview' as any)} className={cn("flex-1 h-full min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors", mobileTab === ('preview' as any) ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/40")}>
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
            <button onClick={() => setMobileTab('editor')} className={cn("flex-1 h-full min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors", mobileTab === 'editor' ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/40")}>
              <Code className="h-3.5 w-3.5" />
              Code
            </button>
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-hidden">
          {isMobile ? (
            mobileTab === 'chat' ? (
              <BuilderChatPanel messages={messages} isGenerating={isGenerating} fileCount={project.files.length} mode={mode} thinkingPhase={thinkingPhase} versions={versions} totalTokensUsed={totalTokensUsed} previousFiles={previousFiles} latestFiles={latestFiles} contextBudget={contextBudget} onModeChange={setMode} onSend={handleSend} onStop={stopGenerating} onClear={handleClear} onRestoreVersion={restoreVersion} onOpenTemplates={() => setShowTemplates(true)} onFixError={handleFixError} onForkFromMessage={handleForkFromMessage} onRevertToMessage={handleRevertToMessage} selectedModel={selectedModel} onModelChange={setSelectedModel} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} isVisualEditActive={isVisualEditActive} onOpenEditHistory={() => setShowEditHistory(true)} onSelectStarterTemplate={handleSelectStarterTemplate} onReview={() => { projectReview.startReview(project.files, (prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)); projectReview.setShowPanel(true); }} supabaseConfig={supabaseConfig} onUpdateMessages={setMessages} />
            ) : mobileTab === 'preview' ? (
                <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount} isVisualEditActive={isVisualEditActive} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} onAutoFixError={handleAutoFixError} onVisualEdit={handleVisualEdit} externalIframeRef={previewIframeRef} externalViewportMode={viewportMode} onExternalViewportChange={setViewportMode} onUrlChange={setPreviewCurrentUrl}>
                  <GeneratingOverlay isGenerating={isGenerating} isCompiling={isCompiling} phase={thinkingPhase} partialFiles={partialFiles} completedFileCount={completedFileCount} />
                </BuilderPreviewPanel>
            ) : (
              <div className="h-full flex flex-col bg-[#09090b]">
                {activeFile && (
                  <>
                    <FileTabBar openPaths={project.openFilePaths} activePath={project.activeFilePath} dirtyFiles={dirtyFiles} streamingFilePath={streamingFilePath} onSelect={(path) => setActiveFile(path)} onClose={(path) => closeFile(path)} onReorder={reorderOpenFiles} />
                    <div className="flex-1 min-h-0">
                      <CodeEditor file={activeFile} onContentChange={(path, content) => { upsertFile(path, content); setDirtyFiles(prev => new Set(prev).add(path)); }} remoteCursors={remoteCursors} onCursorChange={handleCursorChange} />
                    </div>
                  </>
                )}
                {!activeFile && (
                  <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
                    No file open — generate code via Chat
                  </div>
                )}
              </div>
            )
          ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Chat Panel - Collapsible */}
            {isChatCollapsed ? (
              <div className="w-10 border-r border-white/[0.06] bg-[#09090b] flex flex-col items-center pt-3 shrink-0">
                <button onClick={() => setIsChatCollapsed(false)} className="h-8 w-8 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors" title="Expand chat">
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </div>
            ) : (
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
              <div className="h-full relative flex flex-col">
                <button onClick={() => setIsChatCollapsed(true)} className="absolute top-2 right-2 z-10 h-6 w-6 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors" title="Collapse chat">
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
                {/* Agent mode step tracker */}
                <AgentModePanel run={agentRun} taskQueue={agentTaskQueue} pendingApproval={agentPendingApproval} onCancel={cancelAgent} onCancelTask={cancelAgentTask} onRetryTask={retryAgentTask} onClearCompleted={clearAgentCompleted} onReorderQueue={reorderAgentQueue} onApprovePlan={() => respondToAgentPlan(true)} onRejectPlan={() => respondToAgentPlan(false)} />
                {phasePlanner.activePlan && (
                  <PhasePlannerPanel
                    plan={phasePlanner.activePlan}
                    onProceed={handlePhaseAdvance}
                    onSkip={phasePlanner.skipPhase}
                    onCancel={phasePlanner.cancelPlan}
                    isGenerating={isGenerating}
                    onToggleAutoAdvance={phasePlanner.toggleAutoAdvance}
                    onEditTitle={phasePlanner.editPhaseTitle}
                    onRemovePhase={phasePlanner.removePhase}
                    onReorder={phasePlanner.reorderPhases}
                    totalEstimatedCredits={phasePlanner.totalEstimatedCredits}
                  />
                )}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    <BuilderChatPanel messages={messages} isGenerating={isGenerating} fileCount={project.files.length} mode={mode} thinkingPhase={thinkingPhase} versions={versions} totalTokensUsed={totalTokensUsed} previousFiles={previousFiles} latestFiles={latestFiles} contextBudget={contextBudget} onModeChange={setMode} onSend={handleSend} onStop={stopGenerating} onClear={handleClear} onRestoreVersion={restoreVersion} onOpenTemplates={() => setShowTemplates(true)} onFixError={handleFixError} onForkFromMessage={handleForkFromMessage} onRevertToMessage={handleRevertToMessage} selectedModel={selectedModel} onModelChange={setSelectedModel} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} isVisualEditActive={isVisualEditActive} onOpenEditHistory={() => setShowEditHistory(true)} onSelectStarterTemplate={handleSelectStarterTemplate} onReview={() => { projectReview.startReview(project.files, (prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)); projectReview.setShowPanel(true); }} supabaseConfig={supabaseConfig} onUpdateMessages={setMessages} />
                  </div>
                  {builderQuestions.pending && (
                    <div className="border-t border-white/[0.06] bg-[#0d0d0f]">
                      <QuestionsCard
                        questions={builderQuestions.pending.questions}
                        onSubmit={(answers) => {
                          const enriched = builderQuestions.buildEnrichedPrompt(builderQuestions.pending!.context, answers);
                          const plan = phasePlanner.analyzePrompt(enriched);
                          if (plan) {
                            const phaseList = plan.phases.map((p, i) => `${i + 1}. **${p.title}** — ${p.description}`).join('\n');
                            setMessages(prev => [...prev, {
                              id: crypto.randomUUID(), role: 'assistant' as const,
                              content: `✅ Got it! I've broken this into ${plan.phases.length} phases:\n\n${phaseList}\n\nClick **"Start Phase 1"** below to begin.`,
                              timestamp: new Date(),
                            }]);
                          } else {
                            handleSend(enriched, null, true);
                          }
                        }}
                        onSkip={() => {
                          const ctx = builderQuestions.pending?.context || '';
                          builderQuestions.dismiss();
                          const plan = phasePlanner.analyzePrompt(ctx);
                          if (plan) {
                            const phaseList = plan.phases.map((p, i) => `${i + 1}. **${p.title}** — ${p.description}`).join('\n');
                            setMessages(prev => [...prev, {
                              id: crypto.randomUUID(), role: 'assistant' as const,
                              content: `🚧 **This is a large project!** I've broken it into ${plan.phases.length} phases:\n\n${phaseList}\n\nClick **"Start Phase 1"** below to begin.`,
                              timestamp: new Date(),
                            }]);
                          } else {
                            handleSend(ctx, null, true);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
            )}

            <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors data-[resize-handle-active]:bg-cyan-500/50" />

            {/* Right Panel */}
            <ResizablePanel defaultSize={72} minSize={50}>
              <div className="h-full flex">

                {/* Side panels */}
                <VersionHistoryPanel versions={versions} currentFiles={project.files} onRestore={restoreVersion} onClose={() => setShowVersionHistory(false)} open={showVersionHistory} activeBranchName={activeBranchName} />
                <EnvVarsPanel envVars={envVariables} onChange={setEnvVariables} open={showEnvVars} onClose={() => setShowEnvVars(false)} />
                <RLSPolicyTester supabaseConfig={supabaseConfig} open={showRLSTester} onClose={() => setShowRLSTester(false)} />
                <AssetManager assets={assets} onUpload={handleAssetUpload} onDelete={handleAssetDelete} open={showAssets} onClose={() => setShowAssets(false)} />
                <Suspense fallback={<PanelLoader />}>
                  <DatabasePanel open={showDatabase} onClose={() => setShowDatabase(false)} supabaseConfig={supabaseConfig} />
                  <AuthConfigPanel open={showAuth} onClose={() => setShowAuth(false)} supabaseConfig={supabaseConfig} onGenerateAuthPages={handleGenerateAuthPages} />
                  <KnowledgePanel open={showKnowledge} onClose={() => setShowKnowledge(false)} knowledge={knowledge} onKnowledgeChange={setKnowledge} />
                  <StorageBrowser open={showStorage} onClose={() => setShowStorage(false)} supabaseConfig={supabaseConfig} />
                  <EdgeFunctionEditor open={showEdgeFunctions} onClose={() => setShowEdgeFunctions(false)} onCreateFunction={handleCreateEdgeFunction} functions={edgeFunctions} onSelectFunction={(name) => { setActiveFile(`functions/${name}/index.ts`); setRightTab('code'); }} onDeleteFunction={handleDeleteEdgeFunction} />
                </Suspense>
                <ActivityFeed open={showActivity} onClose={() => setShowActivity(false)} entries={activityEntries} />
                <ExportGuidePanel open={showExportGuide} onClose={() => setShowExportGuide(false)} />
                <Suspense fallback={<PanelLoader />}>
                  <SchemaDesignerLazy
                    open={showSchemaDesigner}
                    onClose={() => setShowSchemaDesigner(false)}
                    onGenerateSQL={(sql) => { navigator.clipboard.writeText(sql); toast.success('SQL copied — paste into Supabase SQL editor'); }}
                    onSendToChat={(msg) => { sendMessage(msg, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel); }}
                  />
                </Suspense>
                <OneClickDeploy
                  open={showOneClickDeploy}
                  onClose={() => setShowOneClickDeploy(false)}
                  projectName={project.name}
                  files={project.files}
                  vercelToken={vercelConfig?.token}
                  netlifyToken={netlifyToken || undefined}
                  onTokenSave={(provider, token) => {
                    if (provider === 'vercel') setVercelConfig({ token });
                    else setNetlifyToken(token);
                  }}
                />
                <BuilderHelpCenter open={showHelpCenter} onClose={() => setShowHelpCenter(false)} />
                <SetupWizard
                  open={showSetupWizard}
                  onClose={() => setShowSetupWizard(false)}
                  supabaseConfig={supabaseConfig}
                  stripeConfig={stripeConfig}
                  envVars={envVars}
                  onSupabaseChange={setSupabaseConfig}
                  onStripeChange={setStripeConfig}
                  onEnvVarsChange={setEnvVars}
                  onOpenAuth={() => openPanel('auth')}
                  onOpenDeploy={() => setShowDeployPipeline(true)}
                />
                <PromptHistoryPanel
                  open={showPromptHistory}
                  onClose={() => setShowPromptHistory(false)}
                  history={promptHistory.history}
                  onRerun={(prompt) => { setShowPromptHistory(false); handleSend(prompt); }}
                  onToggleFavorite={promptHistory.toggleFavorite}
                  onRemove={promptHistory.removeEntry}
                  onClear={promptHistory.clearHistory}
                  onExport={promptHistory.exportHistory}
                  onImport={promptHistory.importHistory}
                />
                <AICodeIntelligence open={showCodeIntel} onClose={() => setShowCodeIntel(false)} suggestions={codeSuggestions} onApplySuggestion={(s) => { if (s.code && activeFile) { upsertFile(activeFile.path, activeFile.content + '\n' + s.code); toast.success('Applied suggestion'); } }} onDismiss={(id) => setCodeSuggestions(prev => prev.filter(s => s.id !== id))} onRefresh={() => { const smells = codeSmellDetector.analyzeFiles(project.files); setCodeSuggestions(smells); toast.success(`Found ${smells.length} suggestions`); }} activeFilePath={project.activeFilePath} />
                <DatabaseExplorer open={showDbExplorer} onClose={() => setShowDbExplorer(false)} supabaseConfig={supabaseConfig} />
                <ComponentLibrary open={showComponentLib} onClose={() => setShowComponentLib(false)} onInsertComponent={(code) => { if (activeFile) { upsertFile(activeFile.path, activeFile.content + '\n' + code); } }} onApplyTheme={() => {}} />
                <DeployPipelinePanel open={showDeployPipeline} onClose={() => setShowDeployPipeline(false)} onDeploy={handlePublish} publishedUrl={publishedUrl} isDeploying={isGenerating} projectName={project.name} onOpenDomainPanel={() => { setShowDeployPipeline(false); setShowDomainPanel(true); }} />
                <Suspense fallback={<PanelLoader />}><PerformanceProfilerLazy open={showPerformanceProfiler} onClose={() => setShowPerformanceProfiler(false)} files={project.files} cdnPackages={cdnPackages} /></Suspense>
                <Suspense fallback={<PanelLoader />}><BuildAnalyticsPanelLazy open={showBuildAnalytics} onClose={() => setShowBuildAnalytics(false)} analytics={buildAnalytics.getAnalytics()} /></Suspense>
                <ChangelogPanel open={showChangelog} onClose={() => setShowChangelog(false)} entries={changelogEntries} />
                <TestingDebugSuite open={showTestingSuite} onClose={() => setShowTestingSuite(false)} tests={testCases} onRunTests={() => setTestCases(prev => prev.map(t => ({ ...t, status: Math.random() > 0.2 ? 'passed' as const : 'failed' as const, duration: Math.floor(Math.random() * 200 + 10) })))} onRunSingleTest={(id) => setTestCases(prev => prev.map(t => t.id === id ? { ...t, status: 'passed' as const, duration: Math.floor(Math.random() * 100 + 5) } : t))} onGenerateTests={(filePath) => { setTestCases(prev => [...prev, { id: crypto.randomUUID(), name: `test ${filePath}`, file: filePath, status: 'idle' as const }]); toast.success('Test generated'); }} projectFiles={project.files} />
                <GPTConnectorPanel open={showGPTConnector} onClose={() => setShowGPTConnector(false)} linkedGPT={linkedGPT} onLinkGPT={setLinkedGPT} onUnlinkGPT={() => setLinkedGPT(null)} />
                {projectReview.showPanel && (
                  <ProjectReviewPanel
                    isReviewing={projectReview.isReviewing}
                    result={projectReview.result}
                    onClose={() => projectReview.setShowPanel(false)}
                    onRerun={() => projectReview.startReview(project.files, (prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel))}
                    onDismiss={projectReview.dismissFinding}
                    onGoToFile={(file, line) => { handleSetActiveFile(file); setRightTab('code'); }}
                  />
                )}
                <SupabaseIDEPanel open={showSupabaseIDE} onClose={() => setShowSupabaseIDE(false)} connection={supabaseConnection} onGenerateCode={(code, fileName) => { upsertFile(fileName, code); setRightTab('code'); setActiveFile(fileName); }} />
                <GitHubPanel open={showGitHubPanel} onClose={() => setShowGitHubPanel(false)} projectName={project.name} files={project.files} onFilesImported={(imported) => { imported.forEach(f => upsertFile(f.path, f.content)); }} githubSync={githubSync} />
                <DatabaseMigrationPanel open={showMigrationPanel} onClose={() => setShowMigrationPanel(false)} connection={supabaseConnection} onGenerateCode={(code, fileName) => { upsertFile(fileName, code); setRightTab('code'); setActiveFile(fileName); }} />
                <EdgeFunctionEditorPanel open={showEdgeFnEditor} onClose={() => setShowEdgeFnEditor(false)} files={project.files} onUpsertFile={upsertFile} supabaseUrl={supabaseConnection.config?.url || supabaseConfig?.url} supabaseKey={supabaseConnection.config?.anonKey || supabaseConfig?.anonKey} />
                <BuildWorkflowPanel open={showBuildWorkflow} onClose={() => setShowBuildWorkflow(false)} githubToken={localStorage.getItem('app-builder-github-pat') || undefined} githubRepo={localStorage.getItem('app-builder-github-repo') || undefined} />
                <MultiFileSearchReplace open={showMultiSearch} onClose={() => setShowMultiSearch(false)} files={project.files} onReplaceInFiles={handleReplaceInFiles} onSelectFile={handleSetActiveFile} onSwitchToCode={() => setRightTab('code')} />
                <InBrowserTestRunner open={showTestRunner} onClose={() => setShowTestRunner(false)} files={project.files} onGenerateTest={(filePath) => { sendMessage(`Generate unit tests for ${filePath}`, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel); }} onSendToChat={(prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)} />
                <PluginMarketplace open={showExtensions} onClose={() => setShowExtensions(false)} catalogue={pluginRegistry.catalogue} installed={pluginRegistry.installed} onInstall={pluginRegistry.installPlugin} onUninstall={pluginRegistry.uninstallPlugin} onToggle={pluginRegistry.togglePlugin} onUpdateConfig={pluginRegistry.updatePluginConfig} />
                <Suspense fallback={<PanelLoader />}>
                  <CollaborationPanelLazy
                    open={showCollaboration}
                    onClose={() => setShowCollaboration(false)}
                    isConnected={collaborationEngine.isConnected}
                    participants={collaborationEngine.participants}
                    messages={collaborationEngine.messages}
                    awareness={collaborationEngine.awareness}
                    localUserId={collaborationEngine.localUserId}
                    followingUserId={collaborationEngine.followingUserId}
                    onStartSession={collaborationEngine.startSession}
                    onEndSession={collaborationEngine.endSession}
                    onSendMessage={collaborationEngine.sendMessage}
                    onFollowUser={collaborationEngine.followUser}
                    onLockFile={collaborationEngine.lockFile}
                    onUnlockFile={collaborationEngine.unlockFile}
                    onNavigateToFile={(path) => { setActiveFile(path); setRightTab('code'); }}
                    onAddSimulated={collaborationEngine.addSimulatedParticipant}
                  />
                </Suspense>
                <Suspense fallback={<PanelLoader />}>
                  <APIBuilderPanelLazy
                    open={showAPIBuilder}
                    onClose={() => setShowAPIBuilder(false)}
                    endpoints={apiBuilder.endpoints}
                    requestLogs={apiBuilder.requestLogs}
                    isMockServerRunning={apiBuilder.isMockServerRunning}
                    allTags={apiBuilder.allTags}
                    onAddEndpoint={apiBuilder.addEndpoint}
                    onRemoveEndpoint={apiBuilder.removeEndpoint}
                    onDuplicateEndpoint={apiBuilder.duplicateEndpoint}
                    onLoadTemplates={apiBuilder.loadTemplates}
                    onSimulateRequest={apiBuilder.simulateRequest}
                    onToggleMockServer={apiBuilder.toggleMockServer}
                    onExportOpenAPI={apiBuilder.exportOpenAPI}
                    onClearLogs={apiBuilder.clearLogs}
                  />
                </Suspense>
                {showDesignSystem && (
                  <div className="w-72 border-r border-border overflow-hidden">
                    <Suspense fallback={<PanelLoader />}>
                      <DesignSystemPanelLazy
                        onInjectCSS={(css) => {
                          const existingCSS = project.files.find(f => f.path === 'design-tokens.css');
                          upsertFile('design-tokens.css', css);
                          if (!existingCSS) toast.success('Created design-tokens.css');
                        }}
                        onClose={() => setShowDesignSystem(false)}
                      />
                    </Suspense>
                  </div>
                )}
                {showPackages && (
                  <div className="w-64 border-r border-white/[0.06] bg-[#0d0d14] overflow-hidden">
                    <PackageManager packages={cdnPackages} onAddPackage={(pkg) => setCdnPackages(prev => [...prev, pkg])} onRemovePackage={(name) => setCdnPackages(prev => prev.filter(p => p.name !== name))} />
                  </div>
                )}
                {showNPMManager && (
                  <NPMPackageManagerPanel
                    open={showNPMManager}
                    onClose={() => setShowNPMManager(false)}
                    installedPackages={installedPackages}
                    onInstall={(name, version) => setInstalledPackages(prev => [...prev, { name, version: version || 'latest' }])}
                    onUninstall={(name) => setInstalledPackages(prev => prev.filter(p => p.name !== name))}
                    onUpdateVersion={(name, version) => setInstalledPackages(prev => prev.map(p => p.name === name ? { ...p, version } : p))}
                  />
                )}
                {showDevTools && (
                  <div className="w-80 border-r border-white/[0.06] overflow-hidden">
                    <PreviewDevToolsPanel open={showDevTools} onClose={() => setShowDevTools(false)} iframeRef={previewIframeRef} onFixWithAI={(prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)} />
                  </div>
                )}
                {showSymbolSearch && (
                  <SymbolSearchPanel
                    open={showSymbolSearch}
                    onClose={() => setShowSymbolSearch(false)}
                    files={project.files}
                    onNavigate={(file, line) => { setActiveFile(file); setRightTab('code'); }}
                  />
                )}

                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* File tab bar (code/split only) */}
                  {hasFiles && rightTab !== 'preview' && (
                    <div className="flex items-center h-9 border-b border-white/[0.06] bg-[#0d0d14] shrink-0">
                      <FileTabBar openPaths={project.openFilePaths} activePath={project.activeFilePath} dirtyFiles={dirtyFiles} streamingFilePath={streamingFilePath} onSelect={setActiveFile} onClose={closeFile} onReorder={reorderOpenFiles} />
                      {isGenerating && (
                        <div className="ml-auto mr-3 flex items-center gap-1.5 text-[10px] text-amber-400/80">
                          <Activity className="h-3 w-3 animate-pulse" />
                          <span>generating...</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden flex">
                    <FileSearchPanel open={showFileSearch} onClose={() => setShowFileSearch(false)} files={project.files} onSelectFile={(path) => { setActiveFile(path); }} onSwitchToCode={() => setRightTab('code')} onReplaceInFiles={handleReplaceInFiles} />

                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-hidden">
                        <ResizablePanelGroup direction="horizontal" className="h-full">
                          {hasFiles && showFileTree && !showFileSearch && (
                            <>
                              <ResizablePanel defaultSize={18} minSize={12} maxSize={28}>
                                <ProjectFileTree files={project.files} activeFilePath={project.activeFilePath} onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }} onDeleteFile={deleteFile} onCreateFile={handleCreateFile} onRenameFile={handleRenameFile} />
                              </ResizablePanel>
                              <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors" />
                            </>
                          )}

                          <ResizablePanel defaultSize={hasFiles && showFileTree ? 82 : 100}>
                            {rightTab === 'split' && hasFiles ? (
                              <ResizablePanelGroup direction="horizontal" className="h-full">
                                <ResizablePanel defaultSize={50} minSize={30}>
                                  <div data-tour="preview" className="h-full">
                                    <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount} isVisualEditActive={isVisualEditActive} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} onAutoFixError={handleAutoFixError} onVisualEdit={handleVisualEdit} externalIframeRef={previewIframeRef} externalViewportMode={viewportMode} onExternalViewportChange={setViewportMode} onUrlChange={setPreviewCurrentUrl}>
                                      <GeneratingOverlay isGenerating={isGenerating} isCompiling={isCompiling} phase={thinkingPhase} partialFiles={partialFiles} completedFileCount={completedFileCount} />
                                    </BuilderPreviewPanel>
                                  </div>
                                </ResizablePanel>
                                <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors" />
                                <ResizablePanel defaultSize={50} minSize={30}>
                                  <div data-tour="code-editor" className="h-full flex flex-col bg-[#0d0d14]">
                                    <FileBreadcrumb file={activeFile} allFiles={project.files} onNavigate={(path) => { setActiveFile(path); }} />
                                    <div className="flex-1 overflow-hidden">
                                      <CodeEditor file={activeFile} onContentChange={handleContentChange} remoteCursors={remoteCursors} onCursorChange={handleCursorChange} onInlineAIAction={handleInlineAIAction} />
                                    </div>
                                  </div>
                                </ResizablePanel>
                              </ResizablePanelGroup>
                            ) : rightTab === 'preview' || !hasFiles ? (
                              <div data-tour="preview" className="h-full">
                                <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount} isVisualEditActive={isVisualEditActive} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} onAutoFixError={handleAutoFixError} onVisualEdit={handleVisualEdit} externalIframeRef={previewIframeRef} externalViewportMode={viewportMode} onExternalViewportChange={setViewportMode} onUrlChange={setPreviewCurrentUrl}>
                                  <GeneratingOverlay isGenerating={isGenerating} isCompiling={isCompiling} phase={thinkingPhase} partialFiles={partialFiles} completedFileCount={completedFileCount} />
                                </BuilderPreviewPanel>
                              </div>
                            ) : (
                              <div data-tour="code-editor" className="h-full flex flex-col bg-[#0d0d14]">
                                <FileBreadcrumb file={activeFile} allFiles={project.files} onNavigate={(path) => { setActiveFile(path); }} />
                                <div className="flex-1 overflow-hidden">
                                  <CodeEditor file={activeFile} onContentChange={handleContentChange} remoteCursors={remoteCursors} onCursorChange={handleCursorChange} onInlineAIAction={handleInlineAIAction} />
                                </div>
                              </div>
                            )}
                          </ResizablePanel>
                        </ResizablePanelGroup>
                      </div>

                      {/* Bottom panels — only visible when explicitly opened */}
                      {isGenerating && (
                        <div className="shrink-0">
                          <BuildLogPanel entries={buildLog.entries} isBuilding={isGenerating} onClear={buildLog.clear} />
                        </div>
                      )}
                      {showTimeline && versionTimeline.totalSnapshots > 0 && (
                        <div className="shrink-0 space-y-1">
                          <VersionTimelineSlider
                            snapshots={versionTimeline.snapshots}
                            currentIndex={versionTimeline.currentIndex}
                            onNavigate={(idx) => {
                              const files = versionTimeline.navigateToSnapshot(idx);
                              if (files) setFiles(files);
                            }}
                            onExit={() => { versionTimeline.exitHistoryPreview(); setShowTimeline(false); setShowDiffViewer(false); }}
                            getDiff={versionTimeline.getSnapshotDiff}
                            onToggleDiff={() => setShowDiffViewer(v => !v)}
                            showDiff={showDiffViewer}
                          />
                          {showDiffViewer && versionTimeline.currentIndex > 0 && (
                            <VersionDiffViewer
                              prevSnapshot={versionTimeline.snapshots[versionTimeline.currentIndex - 1] ?? null}
                              currSnapshot={versionTimeline.snapshots[versionTimeline.currentIndex]}
                              diff={versionTimeline.getSnapshotDiff(versionTimeline.currentIndex)}
                              onClose={() => setShowDiffViewer(false)}
                            />
                          )}
                        </div>
                      )}
                      {showConsole && (
                        <div className="shrink-0 max-h-[30vh]">
                          <ConsolePanel open={showConsole} onToggle={() => setShowConsole(!showConsole)} onFixError={handleFixError} />
                        </div>
                      )}
                      {showTerminal && (
                        <div className="shrink-0 max-h-[30vh]">
                          <TerminalEmulator open={showTerminal} onClose={() => setShowTerminal(false)} projectName={project.name} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
          )}
        </div>

        {/* Status Bar */}
        {hasFiles && !isMobile && (
          <div className="flex items-center h-6 px-3 border-t border-white/[0.06] bg-[#09090b] text-[10px] text-white/30 font-mono shrink-0 gap-3">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                isGenerating ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
              )} />
              <span>{isGenerating ? 'Building' : 'Ready'}</span>
            </div>
            <div className="h-3 w-px bg-white/[0.06]" />
            <span>{activeFile?.language || 'plaintext'}</span>
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
            <div className="h-3 w-px bg-white/[0.06]" />
            <span>{project.files.length} file{project.files.length !== 1 ? 's' : ''}</span>
            <span className="text-cyan-400/50">{activeBranchName}</span>
            {dirtyFiles.size > 0 && (
              <span className="text-amber-400/60 flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-amber-400/60" />
                {dirtyFiles.size} unsaved
              </span>
            )}
            <div className="flex-1" />
            <AIAutocompleteIndicator enabled={aiAutocompleteEnabled} onToggle={() => setAiAutocompleteEnabled(prev => !prev)} />
            <div className="h-3 w-px bg-white/[0.06]" />
            <div className="h-3 w-px bg-white/[0.06]" />
            <span>{isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}</span>
          </div>
        )}
      </div>

      <TemplateLibrary isOpen={showTemplates} onClose={() => setShowTemplates(false)} onSelectTemplate={(prompt) => handleSend(prompt)} />
      <EnvironmentManagerPanel open={showEnvManager} onClose={() => setShowEnvManager(false)} environments={environmentManager.environments} activeEnv={environmentManager.activeEnv} onSwitch={environmentManager.switchEnvironment} onPromote={environmentManager.promote} onUpdateVars={environmentManager.updateEnvVars} />
      <RollbackPanel open={showRollback} onClose={() => setShowRollback(false)} snapshots={rollbackManager.snapshots} currentFiles={project.files} onRollback={(id) => { const files = rollbackManager.rollback(id); if (files) { pushUndo('Before rollback', project.files); setFiles(files); toast.success('Rolled back'); } }} onGetDiff={(id) => rollbackManager.getDiff(id, project.files)} isRollingBack={rollbackManager.isRollingBack} />
      <UptimeMonitorPanel open={showUptimeMonitor} onClose={() => setShowUptimeMonitor(false)} checks={uptimeMonitor.checks} stats={uptimeMonitor.getStats()} isMonitoring={uptimeMonitor.isMonitoring} url={uptimeMonitor.url} onStart={uptimeMonitor.startMonitoring} onStop={uptimeMonitor.stopMonitoring} publishedUrl={publishedUrl} />
      <BuildCachePanel open={showBuildCache} onClose={() => setShowBuildCache(false)} stats={buildCache.stats} onInvalidate={() => buildCache.invalidate()} />
      <BuildScriptsPanel open={showBuildScripts} onClose={() => setShowBuildScripts(false)} scripts={buildScripts.scripts} onToggle={buildScripts.toggleScript} onRun={(id) => { const r = buildScripts.runScript(id, project.files); toast[r.success ? 'success' : 'error'](r.output.slice(0, 80)); }} onRemove={buildScripts.removeScript} />
      <CMSModePanel open={showCMSMode} onClose={() => setShowCMSMode(false)} isEnabled={cmsMode.isEnabled} onToggle={cmsMode.toggleCMS} blocks={cmsMode.blocks} onUpdateBlock={cmsMode.updateBlock} onExport={cmsMode.exportContent} editingBlock={cmsMode.editingBlock} onSetEditing={cmsMode.setEditingBlock} />
      <MarkdownBlogPanel open={showBlogEngine} onClose={() => setShowBlogEngine(false)} posts={markdownBlog.posts} onGenerate={() => { const files = markdownBlog.generateBlogSystem(); files.forEach(f => upsertFile(f.path, f.content)); toast.success(`Generated ${files.length} blog files`); }} onRemovePost={markdownBlog.removePost} onInsertFiles={(files) => files.forEach(f => upsertFile(f.path, f.content))} />
      <ImageOptimizerPanel open={showImageOptimizer} onClose={() => setShowImageOptimizer(false)} images={imageOptimizer.images} isProcessing={imageOptimizer.isProcessing} onOptimize={(f) => imageOptimizer.optimizeImage(f)} onGenerateTag={imageOptimizer.generateImgTag} onRemove={imageOptimizer.removeImage} onInsertCode={(code) => { if (activeFile) upsertFile(activeFile.path, activeFile.content + '\n' + code); }} />
      <VideoEmbedPanel open={showVideoEmbed} onClose={() => setShowVideoEmbed(false)} embeds={videoEmbed.embeds} onAdd={videoEmbed.addEmbed} onRemove={videoEmbed.removeEmbed} onInsertCode={(code) => { if (activeFile) upsertFile(activeFile.path, activeFile.content + '\n' + code); }} />
      <I18nPanel open={showI18n} onClose={() => setShowI18n(false)} strings={i18nGenerator.strings} locales={i18nGenerator.locales} onExtract={() => i18nGenerator.extractStrings(project.files)} onAddLocale={i18nGenerator.addLocale} onRemoveLocale={i18nGenerator.removeLocale} onUpdateTranslation={i18nGenerator.updateTranslation} onGenerateFiles={() => { const files = i18nGenerator.generateFiles(); files.forEach(f => upsertFile(f.path, f.content)); toast.success(`Generated ${files.length} i18n files`); }} />
      <EditHistoryTimeline isOpen={showEditHistory} onClose={() => setShowEditHistory(false)} versions={versions} onRestore={(id) => { restoreVersion(id); setShowEditHistory(false); }} />
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} files={project.files} onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }} onSwitchTab={setRightTab} onSwitchMode={setMode} onUndo={handleUndo} onRedo={handleRedo} onSave={handleSave} onClear={handleClear} onOpenTemplates={() => setShowTemplates(true)} onPublish={handlePublish} canUndo={canUndo} canRedo={canRedo} />
      <KeyboardShortcutsPanel open={showShortcuts} onOpenChange={setShowShortcuts} />
      <BillingPanel isOpen={showBilling} onClose={() => setShowBilling(false)} />
      <ProjectShareDialog isOpen={showShareDialog} onClose={() => setShowShareDialog(false)} projectName={project.name} collaborators={collaborators} onInvite={(email, role) => setCollaborators(prev => [...prev, { id: crypto.randomUUID(), email, role, avatarColor: ['#06b6d4','#8b5cf6','#f43f5e','#22c55e'][prev.length % 4], joinedAt: new Date() }])} onChangeRole={(id, role) => setCollaborators(prev => prev.map(c => c.id === id ? { ...c, role } : c))} onRemove={(id) => setCollaborators(prev => prev.filter(c => c.id !== id))} />
      <SEOEditor isOpen={showSEOEditor} onClose={() => setShowSEOEditor(false)} files={project.files} onUpdateFile={upsertFile} />
      <CustomDomainPanel isOpen={showDomainPanel} onClose={() => setShowDomainPanel(false)} previewUrl={previewSlug ? `https://${previewSlug}.apps.ultriumai.com` : hostedPreviewUrl} publishedUrl={publishedUrl} />
      <PublishPanel open={showPublishPanel} onClose={() => setShowPublishPanel(false)} publishedUrl={publishedUrl} previewUrl={previewSlug ? `https://${previewSlug}.apps.ultriumai.com` : hostedPreviewUrl} projectName={project.name} hasFiles={hasFiles} onPublish={handlePublish} files={project.files} deployHistory={persistedDeployHistory} onRollback={async (id) => { await rollbackToVersion(project.name, id); }} />
      <DiffReviewPanel isOpen={showDiffReview} onClose={() => setShowDiffReview(false)} changes={pendingDiffChanges} onApprove={() => { pendingDiffChanges.forEach(c => upsertFile(c.path, c.newContent)); setPendingDiffChanges([]); setShowDiffReview(false); toast.success('Changes applied'); }} onReject={() => { setPendingDiffChanges([]); setShowDiffReview(false); toast.info('Changes rejected'); }} onApproveFile={(path) => { const c = pendingDiffChanges.find(ch => ch.path === path); if (c) upsertFile(c.path, c.newContent); }} onRejectFile={() => {}} />
      <QuickFileSwitcher open={showQuickSwitcher} onOpenChange={setShowQuickSwitcher} files={project.files} onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }} />
      <BugReportModal open={showBugReport} onOpenChange={setShowBugReport} />
      <AIImageGenPanel open={showImageGen} onClose={() => setShowImageGen(false)} onInsertAsAsset={(name, url) => { setAssets(prev => [...prev, { id: crypto.randomUUID(), name, type: 'image' as const, dataUrl: url, size: 0, createdAt: new Date() } as any]); }} />
      <SecretsManagerPanel open={showSecretsManager} onClose={() => setShowSecretsManager(false)} onSecretsChange={(secrets) => setEnvVars(prev => { const secretKeys = new Set(secrets.map(s => s.key)); const kept = prev.filter(p => !secretKeys.has(p.key)); return [...kept, ...secrets]; })} />
      <EnhancedCommandPalette open={showEnhancedPalette} onOpenChange={setShowEnhancedPalette} files={project.files} actions={commandActions} onSelectFile={(path) => { handleSetActiveFile(path); setRightTab('code'); }} recentFiles={recentFiles} />
      <SnippetLibraryPanel open={showSnippetLibrary} onClose={() => setShowSnippetLibrary(false)} snippets={snippetLibrary.snippets} searchQuery={snippetLibrary.searchQuery} onSearchChange={snippetLibrary.setSearchQuery} onAdd={snippetLibrary.addSnippet} onRemove={snippetLibrary.removeSnippet} onInsert={(content) => { if (activeFile) { upsertFile(activeFile.path, activeFile.content + '\n' + content); } }} onExport={snippetLibrary.exportSnippets} onImport={snippetLibrary.importSnippets} />
      <SplitDiffPanel open={showSplitDiff} onClose={() => setShowSplitDiff(false)} diff={splitDiffEditor.activeDiff} />
      <CommentPanel open={showComments} onClose={() => setShowComments(false)} comments={commentSystem.comments} activeFile={activeFile?.path} onAdd={commentSystem.addComment} onResolve={commentSystem.resolveComment} onDelete={commentSystem.deleteComment} onNavigate={(file, line) => { setActiveFile(file); setRightTab('code'); }} unresolvedCount={commentSystem.unresolvedCount} />
      <TeamActivityPanel open={showTeamActivity} onClose={() => setShowTeamActivity(false)} activities={teamActivityFeed.activities} filter={teamActivityFeed.filter} onFilterChange={teamActivityFeed.setFilter} getActionIcon={teamActivityFeed.getActionIcon} getActionLabel={teamActivityFeed.getActionLabel} />
      <ApprovalPanel open={showApprovals} onClose={() => setShowApprovals(false)} requests={approvalWorkflow.requests} requireApproval={approvalWorkflow.requireApproval} onToggleRequire={approvalWorkflow.setRequireApproval} onApprove={approvalWorkflow.approve} onReject={approvalWorkflow.reject} onCancel={approvalWorkflow.cancelRequest} pendingCount={approvalWorkflow.pendingCount} />
      <ForkingPanel open={showForking} onClose={() => setShowForking(false)} forks={projectForking.forks} transfers={projectForking.transfers} projectName={project.name} projectId={currentProjectId || ''} fileCount={project.files.length} onFork={(includeHistory) => { projectForking.forkProject(currentProjectId || '', project.name, project.files, includeHistory); toast.success('Project forked!'); }} onTransfer={(email, reason) => { projectForking.transferProject(currentProjectId || '', project.name, email, reason); toast.success('Transfer initiated'); }} />
      <AnalyticsDashboardPanel open={showAnalyticsDashboard} onClose={() => setShowAnalyticsDashboard(false)} summary={builtInAnalytics.getSummary()} isTracking={builtInAnalytics.isTracking} onStartTracking={builtInAnalytics.startTracking} onStopTracking={builtInAnalytics.stopTracking} onGenerateScript={builtInAnalytics.generateTrackingScript} onInsertCode={(code) => { if (activeFile) upsertFile(activeFile.path, activeFile.content + '\n' + code); }} />
      <ErrorTrackingPanel open={showErrorTracking} onClose={() => setShowErrorTracking(false)} errors={errorTracking.errors} stats={errorTracking.getStats()} onResolve={errorTracking.resolveError} onDelete={errorTracking.deleteError} onInsertCode={(code) => { if (activeFile) upsertFile(activeFile.path, activeFile.content + '\n' + code); }} onGenerateBoundary={errorTracking.generateErrorBoundary} />
      <SessionReplayPanel open={showSessionReplay} onClose={() => setShowSessionReplay(false)} sessions={sessionReplay.sessions} isRecording={sessionReplay.isRecording} onStartRecording={sessionReplay.startRecording} onStopRecording={sessionReplay.stopRecording} onDeleteSession={sessionReplay.deleteSession} onInsertCode={(code) => { if (activeFile) upsertFile(activeFile.path, activeFile.content + '\n' + code); }} onGenerateScript={sessionReplay.generateReplayScript} />
      <ABTestingPanel open={showABTesting} onClose={() => setShowABTesting(false)} tests={abTesting.tests} onCreate={abTesting.createTest} onStart={abTesting.startTest} onPause={abTesting.pauseTest} onComplete={abTesting.completeTest} onDelete={abTesting.deleteTest} onGenerateCode={abTesting.generateABCode} onInsertCode={(code) => { if (activeFile) upsertFile(activeFile.path, activeFile.content + '\n' + code); }} />
      <AIUsagePanel open={showAIUsage} onClose={() => setShowAIUsage(false)} summary={aiUsageAnalytics.getSummary()} estimatedMonthlyCost={aiUsageAnalytics.getEstimatedMonthlyCost()} />
      <DependencyScannerPanel open={showDepScanner} onClose={() => setShowDepScanner(false)} latestScan={dependencyScanner.getLatestScan()} isScanning={dependencyScanner.isScanning} onScan={() => dependencyScanner.scanDependencies(installedPackages)} />
      <CSPGeneratorPanel open={showCSPGenerator} onClose={() => setShowCSPGenerator(false)} config={cspGenerator.config} onAnalyze={cspGenerator.analyzeProject} onToggleDirective={cspGenerator.toggleDirective} onAddSource={cspGenerator.addSource} onRemoveSource={cspGenerator.removeSource} onSetReportOnly={cspGenerator.setReportOnly} onGenerateCSP={cspGenerator.generateCSP} onGenerateMetaTag={cspGenerator.generateMetaTag} files={project.files} />
      <GDPRPanel open={showGDPR} onClose={() => setShowGDPR(false)} components={gdprCompliance.components} companyName={gdprCompliance.companyName} contactEmail={gdprCompliance.contactEmail} onSetCompanyName={gdprCompliance.setCompanyName} onSetContactEmail={gdprCompliance.setContactEmail} onGenerateAll={gdprCompliance.generateAll} onInsertCode={(code, name) => upsertFile(`src/components/${name}`, code)} />
      <RateLimiterPanel open={showRateLimiter} onClose={() => setShowRateLimiter(false)} rules={rateLimiter.rules} onAdd={rateLimiter.addRule} onUpdate={rateLimiter.updateRule} onRemove={rateLimiter.removeRule} onToggle={rateLimiter.toggleRule} onGenerateMiddleware={rateLimiter.generateMiddleware} onInsertCode={(code) => { if (activeFile) upsertFile(activeFile.path, activeFile.content + '\n' + code); }} />
      <SecretRotationPanel open={showSecretRotation} onClose={() => setShowSecretRotation(false)} secrets={secretRotation.secrets} onAdd={secretRotation.addSecret} onMarkRotated={secretRotation.markRotated} onRemove={secretRotation.removeSecret} expiredCount={secretRotation.getExpiredSecrets().length} warningCount={secretRotation.getWarningSecrets().length} />
      <div className="flex items-center gap-1 px-2 py-1 border-t border-white/[0.06] bg-[#09090b] shrink-0">
        <ProjectSettings
          supabaseConfig={supabaseConfig}
          githubConfig={githubConfig}
          stripeConfig={stripeConfig}
          vercelConfig={vercelConfig}
          serviceKeys={serviceKeys}
          envVars={envVars}
          projectName={project.name}
          projectSlug={previewSlug}
          open={showSettingsPanel}
          onOpenChange={setShowSettingsPanel}
          onSupabaseChange={setSupabaseConfig}
          onGithubChange={setGithubConfig}
          onStripeChange={setStripeConfig}
          onVercelChange={setVercelConfig}
          onServiceKeysChange={setServiceKeys}
          onEnvVarsChange={setEnvVars}
          onDeleteProject={() => {
            if (currentProjectId) deleteProject(currentProjectId);
            resetProject(); clearChat(); setStableHTML(null); toast.success('Project deleted'); setShowSettingsPanel(false);
          }}
          onResetProject={() => { resetProject(); setStableHTML(null); toast.success('Project reset'); setShowSettingsPanel(false); }}
        />
        {vercelConfig && <VercelDeployButton projectName={project.name} files={project.files} vercelToken={vercelConfig.token} />}
        {githubConfig && <GithubSyncButton projectName={project.name} files={project.files} githubToken={githubConfig.token} onPullFiles={handleGithubPullFiles} />}
        <SharePreview html={compiledHTML} projectName={project.name} shareUrl={hostedPreviewUrl} isUploading={isUploadingPreview} onInstantUpload={previewSlug ? () => uploadPreviewNow(previewSlug, compiledHTML) : undefined} />
        <ExportButton projectName={project.name} files={project.files} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} envVars={envVars} cdnPackages={cdnPackages} edgeFunctions={edgeFunctions} publishedUrl={publishedUrl} />
      </div>
      {pendingConflicts && (
        <FileConflictDialog open={!!pendingConflicts} conflicts={pendingConflicts} onResolve={handleConflictResolve} onCancel={() => setPendingConflicts(null)} />
      )}
    </TooltipProvider>
  );
}
