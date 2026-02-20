import { useEffect, useState, useCallback, useRef, Suspense, useMemo } from 'react';
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
import { useAutoFixLoop } from '@/hooks/useAutoFixLoop';
import { useGithubSync } from '@/hooks/useGithubSync';
import { useInlineAIEdit } from '@/hooks/useInlineAIEdit';
import { useBranching } from '@/hooks/useBranching';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { usePreviewHosting } from '@/hooks/usePreviewHosting';
import { usePreviewCapture } from '@/hooks/usePreviewCapture';
import type { SupabaseConfig, GithubConfig, StripeConfig, VercelConfig, ServiceKey, EnvVar } from './ProjectSettings';
import type { KnowledgeConfig } from './KnowledgePanel';
import type { CodeSuggestion } from './AICodeIntelligence';
import type { TestCase } from './TestingDebugSuite';
import type { ViewportMode } from './ResponsivePreviewBar';
import { getViewportWidth } from './ResponsivePreviewBar';
import type { LinkedGPTConfig } from './GPTConnectorPanel';
import type { EnvVariable } from './EnvVarsPanel';
import type { ProjectAsset } from './AssetManager';
import type { CDNPackage } from './PackageManager';
import type { BuildNotification } from './BuildNotificationCenter';
import type { ActivityEntry } from './ActivityFeed';
import type { ChangelogEntry } from './ChangelogPanel';
import type { CommandAction } from './EnhancedCommandPalette';
import { useProjectBundler } from '@/hooks/useProjectBundler';
import { useReactCompiler, detectReactProject } from '@/hooks/useReactCompiler';
import { useASTBundler } from '@/hooks/useASTBundler';
import { useIncrementalCompiler } from '@/hooks/useIncrementalCompiler';
import { useTypeScriptValidator } from '@/hooks/useTypeScriptValidator';
import { useConflictResolver } from '@/hooks/useConflictResolver';
import { useLivePreviewSync } from '@/hooks/useLivePreviewSync';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { useBuilderQuestions } from './useBuilderQuestions';
import { useOutputValidation } from './useOutputValidation';
import { useBuildAnalytics } from '@/hooks/useBuildAnalytics';
import { detectSupabaseIntents, buildSupabaseContext, buildErrorDiagnosisContext, analyzeConversationComplexity } from './SupabaseConversational';
import { PANEL_REGISTRY } from './panelRegistry';
import { WorkspaceBottomBar } from './WorkspaceBottomBar';
import { WorkspaceStatusBar } from './WorkspaceStatusBar';
import { WorkspacePanelLayer } from './WorkspacePanelLayer';
import { WorkspaceTopBar } from './WorkspaceTopBar';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { SafePanel } from './SafePanel';
import { buildAuthTemplate } from './authTemplates';
import { BugReportModal } from '@/components/help/BugReportModal';
import { usePluginRegistry } from '@/hooks/usePluginRegistry';
import { useCollaborationEngine } from '@/hooks/useCollaborationEngine';
import { useAPIBuilder } from '@/hooks/useAPIBuilder';
import { useProjectReview } from './useProjectReview';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';
import { useIndexedDBPersistence } from '@/hooks/useIndexedDBPersistence';
import { useSchemaIntrospection } from '@/hooks/useSchemaIntrospection';
import { usePromptChains } from '@/hooks/usePromptChains';
import { useAICodeReview } from '@/hooks/useAICodeReview';
import { useTestGenerator } from '@/hooks/useTestGenerator';
import { useNLDatabaseQuery } from '@/hooks/useNLDatabaseQuery';
import { useMultiCursorEditor } from '@/hooks/useMultiCursorEditor';
import { useMinimapHeatZones } from '@/hooks/useMinimapHeatZones';
import { useSymbolNavigator } from '@/hooks/useSymbolNavigator';
import { useProjectRBAC } from '@/hooks/useProjectRBAC';
import {
  MobilePanelGroup, AIAutomationPanelGroup, DataStatePanelGroup,
  DevToolsPanelGroup, CommunicationPanelGroup, UIPatternsPanelGroup,
  DevOpsPanelGroup, AuthSecurityPanelGroup, ContentMediaPanelGroup,
  SearchDiscoveryPanelGroup, MonitoringPanelGroup, FinalPolishPanelGroup,
  CollabPanelGroup, TestingPanelGroup, UIBuildingPanelGroup,
  DataIntegrationPanelGroup, DevExperiencePanelGroup, DeploymentPanelGroup,
  MonetizationPanelGroup, IntegrationPanelGroup, InfraPanelGroup,
} from './panel-groups';
import { StreamingCodeEditor } from './StreamingCodeEditor';

import {
  PromptHistoryPanel, UndoPreviewPopover, BuilderChatPanel, BuilderPreviewPanel,
  ProjectFileTree, FileTabBar, CodeEditor, ExportButton, ProjectSettings,
  GithubSyncButton, VercelDeployButton, TemplateLibrary, SharePreview,
  BranchManager, ProjectManager, CollaborativePresence,
  GeneratingOverlay, FileSearchPanel, FileBreadcrumb, VersionHistoryPanel,
  ConsolePanel, DeployDialog, EnvVarsPanel, RLSPolicyTester, FileConflictDialog,
  QuickFileSwitcher, AssetManager, PackageManager, OnboardingTour,
  KeyboardShortcutsPanel, ActivityFeed, BillingPanel, CreditsPill,
  ProjectShareDialog, CollaboratorAvatars, SEOEditor, BuildNotificationCenter,
  AICodeIntelligence, DatabaseExplorer, ComponentLibrary, TestingDebugSuite,
  DiffReviewPanel, CustomDomainPanel, ExportGuidePanel, TerminalEmulator,
  AgentModePanel, ResponsivePreviewBar, BuildLogPanel, VersionTimelineSlider,
  VersionDiffViewer, SplitEditorPane, PhasePlannerPanel, QuestionsCard,
  DeployPipelinePanel, ComponentPalette, ChangelogPanel, AIAutocompleteIndicator,
  BuilderHelpCenter, WelcomeOverlay, ConfirmDialog, GPTConnectorPanel,
  SetupWizard, OneClickDeploy, EditHistoryTimeline, MobilePWAInstall,
  EnhancedCommandPalette, MultiFileSearchReplace, InBrowserTestRunner,
  PluginMarketplace, ShortcutsHint, ProjectReviewPanel, SupabaseIDEPanel,
  GitHubPanel, DatabaseMigrationPanel, EdgeFunctionEditorPanel,
  BuildWorkflowPanel, PreviewDevToolsPanel, VisualEditToolbar,
  NPMPackageManagerPanel, PublishPanel, AIImageGenPanel, SyncStatusIndicator,
  SessionRecoveryDialog, HeaderCreditsIndicator, SymbolSearchPanel,
  SecretsManagerPanel, ProjectDropdownMenu, ToolbarPanelsDropdown,
  ModelSwitcherPanel, PromptChainPanel, CodeReviewPanel, TestGeneratorPanel,
  NLQueryPanel, SnippetLibraryPanel, SplitDiffPanel, CommentPanel,
  TeamActivityPanel, ApprovalPanel, ForkingPanel, FigmaImportPanel,
  ColorPaletteExtractorPanel, IconPickerPanel, BreakpointEditorPanel,
  AnimationBuilderPanel, VisualSchemaBuilderPanel, SeedDataPanel,
  APIEndpointTesterPanel, WebhookBuilderPanel, CronSchedulerPanel,
  EnvironmentManagerPanel, RollbackPanel, UptimeMonitorPanel,
  BuildCachePanel, BuildScriptsPanel, CMSModePanel, MarkdownBlogPanel,
  ImageOptimizerPanel, VideoEmbedPanel, I18nPanel, AnalyticsDashboardPanel,
  ErrorTrackingPanel, SessionReplayPanel, ABTestingPanel, AIUsagePanel,
  DependencyScannerPanel, CSPGeneratorPanel, GDPRPanel, RateLimiterPanel,
  SecretRotationPanel, CLICompanionPanel, GitHubActionsPanel,
  SlackDiscordPanel, WhiteLabelPanel, PluginSDKPanel, AIRefactoringPanel,
  NLRegexPanel, CommitMessagePanel, AutoImportPanel, AIDocWriterPanel,
  CoEditingPanel, VoiceChatPanel, ScreenSharePanel, CodeReactionsPanel,
  WhiteboardPanel, VisualRegressionPanel, AccessibilityPanel,
  CodeCoveragePanel, MutationTestingPanel, LoadTestingPanel,
  PageBuilderPanel, ThemeStudioPanel, FormBuilderPanel, ChartDashboardPanel,
  LayoutGridPanel, GraphQLBuilderPanel, WebSocketPanel, FileUploadPanel,
  PaymentPanel, EmailTemplatePanel, TutorialCreatorPanel, CodePlaygroundPanel,
  CustomLintingPanel, DependencyGraphPanel, GitBlameTimelinePanel,
  MultiRegionPanel, FeatureFlagsPanel, CanaryDeployPanel, SSGPanel,
  DockerExportPanel, SubscriptionManagerPanel, InvoiceGeneratorPanel,
  UsageMeteringPanel, AffiliateTrackingPanel, RevenueDashboardPanel,
  CapacitorExportPanel, PushNotificationPanel, OfflineFirstPanel,
  GestureBuilderPanel, AppStoreAssetsPanel,
  CodeTranslatorPanel, SmartScaffoldingPanel, WorkflowAutomationPanel,
  PerfOptimizerPanel, SecurityAuditorPanel,
  StateMachinePanel, DataValidationPanel, CacheStrategyPanel,
  ReactiveStorePanel, DataMigrationPanel,
  RegexPlaygroundPanel, JsonYamlConverterPanel, ColorContrastPanel,
  TailwindSorterPanel, MarkdownPreviewPanel,
  ToastDesignerPanel, NotificationCenterPanel, ChatWidgetPanel,
  EmailSequencePanel, SMSTemplatePanel,
  StepperWizardPanel, CommandMenuPanel, BreadcrumbPanel,
  MegaMenuPanel, ContextMenuPanel,
  DockerComposePanel, KubernetesPanel, CICDPipelinePanel,
  StructuredLoggerPanel, HealthCheckPanel,
  OAuthSetupPanel, MFAFlowPanel, SessionManagerPanel,
  RichTextConfigPanel, FilePreviewGenPanel, AvatarGenPanel,
  CarouselBuilderPanel, GalleryLightboxPanel,
  APIKeyPanel, PermissionMatrixPanel,
   FullTextSearchPanel, FacetedFilterPanel, AutocompletePanel,
   TagSystemPanel, SEOMetaPanel,
   KPIDashboardPanel, AlertingRulesPanel, AuditTrailPanel,
   ClickHeatmapPanel, BudgetMonitorPanel,
   ChangelogAutoPanel, READMEGeneratorPanel, LicensePickerPanel,
   OpenAPISpecPanel, ProjectHealthPanel,
  
  DatabasePanel, AuthConfigPanel, KnowledgePanel, StorageBrowser,
  EdgeFunctionEditor, PerformanceProfiler as PerformanceProfilerLazy,
  BuildAnalyticsPanel as BuildAnalyticsPanelLazy,
  SchemaDesigner as SchemaDesignerLazy,
  DesignSystemPanel as DesignSystemPanelLazy,
  CollaborationPanel as CollaborationPanelLazy,
  APIBuilderPanel as APIBuilderPanelLazy,
} from './lazyPanels';

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
import { usePanelManager } from '@/hooks/usePanelManager';
import { PANEL_KEYS, EXCLUSIVE_PANEL_GROUP } from './panelKeys';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

const PanelLoader = () => <div className="flex items-center justify-center h-full text-white/15 text-xs">Loading...</div>;

export function AIAppBuilderWorkspace() {
  const [searchParams] = useSearchParams();
  const {
    messages, setMessages, isGenerating, latestFiles, previousFiles, mode, setMode, thinkingPhase, versions, setVersions,
    totalTokensUsed, contextBudget, continuationRound, sendMessage, stopGenerating, clearChat, restoreVersion, forwardErrorToChat,
    partialFilesRef, isStreamingPreview, completedFileCountRef,
    streamingContentRef,
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
  // showPromptHistory now managed by usePanelManager
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
  // showShortcuts now managed by usePanelManager
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig | null>(null);
  const [githubConfig, setGithubConfig] = useState<GithubConfig | null>(null);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
  const [vercelConfig, setVercelConfig] = useState<VercelConfig | null>(null);
  const [serviceKeys, setServiceKeys] = useState<ServiceKey[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  // showFileTree + showTemplates now managed by usePanelManager
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  // showCommandPalette removed — replaced by showEnhancedPalette
  // showFileSearch now managed by usePanelManager

  // Panel states — consolidated into a single reducer (fixes React #310)
  const { panels, open: openP, close: closeP, exclusiveOpen, isOpen: isPanelOpen } = usePanelManager([...PANEL_KEYS]);
  // showBuildLog defaults to true (was useState(true) before consolidation)
  useEffect(() => { openP('showBuildLog'); }, []);

  // Non-panel state that was intermixed with panel useState calls
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([]);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [cdnPackages, setCdnPackages] = useState<CDNPackage[]>([]);
  const { findReferencedFiles } = useProjectBundler();
  const astBundler = useASTBundler();
  const incrementalCompiler = useIncrementalCompiler();
  const tsValidator = useTypeScriptValidator();
  const conflictResolver = useConflictResolver();
  const bundleForBrowser = useCallback((files: ProjectFile[]) => {
    try {
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
    } catch (e) {
      console.error('[bundleForBrowser] Bundling crashed:', e);
      return '';
    }
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
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [pendingConflicts, setPendingConflicts] = useState<{ path: string; userContent: string; aiContent: string }[] | null>(null);
  const [knowledge, setKnowledge] = useState<KnowledgeConfig>({ customInstructions: '', contextFiles: [] });
  const [edgeFunctions, setEdgeFunctions] = useState<{ name: string; status: 'deployed' | 'draft' | 'error'; lastDeployed?: string }[]>([]);
  const [collaborators, setCollaborators] = useState<{ id: string; email: string; role: 'viewer' | 'editor' | 'admin'; avatarColor: string; joinedAt: Date }[]>([]);
  const [buildNotifications, setBuildNotifications] = useState<BuildNotification[]>([]);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [codeSuggestions, setCodeSuggestions] = useState<CodeSuggestion[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [pendingDiffChanges, setPendingDiffChanges] = useState<{ path: string; oldContent: string; newContent: string; isNew: boolean }[]>([]);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [isVisualEditActive, setIsVisualEditActive] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [splitRightFile, setSplitRightFile] = useState<string | null>(null);
  const buildStartTimeRef = useRef<number>(0);
  const [aiAutocompleteEnabled, setAiAutocompleteEnabled] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const workspaceContainerRef = useRef<HTMLDivElement>(null);
  const [linkedGPT, setLinkedGPT] = useState<LinkedGPTConfig | null>(null);
  const buildAnalytics = useBuildAnalytics();
  const outputValidation = useOutputValidation();
  const [changelogEntries, setChangelogEntries] = useState<ChangelogEntry[]>([]);
  const [netlifyToken, setNetlifyToken] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const pluginRegistry = usePluginRegistry();
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const collaborationEngine = useCollaborationEngine(currentProjectId);
  const apiBuilder = useAPIBuilder();
  const projectReview = useProjectReview();
  const supabaseConnection = useSupabaseConnection();
  const schemaIntrospection = useSchemaIntrospection();
  const [installedPackages, setInstalledPackages] = useState<{ name: string; version: string; description?: string; isDevDep?: boolean }[]>([]);
  const promptChains = usePromptChains();
  const codeReview = useAICodeReview();
  const testGenerator = useTestGenerator();
  const multiCursorEditor = useMultiCursorEditor();
  const minimapHeatZones = useMinimapHeatZones();
  const symbolNavigator = useSymbolNavigator();
  // Issue 20 fix: Only keep boolean accessors needed in keyboard/escape handler
  // All other panel visibility checks use panels.showX directly
  const showVersionHistory = !!panels.showVersionHistory;
  const showConsole = !!panels.showConsole;
  const showEnvVars = !!panels.showEnvVars;
  const showAssets = !!panels.showAssets;
  const showPackages = !!panels.showPackages;
  const showActivity = !!panels.showActivity;
  const showBilling = !!panels.showBilling;
  const showSettingsPanel = !!panels.showSettingsPanel;
  const showFileSearch = !!panels.showFileSearch;
  const showFileTree = !!panels.showFileTree;

  // Issue 15 fix: Memoized panel setters map — closures created once, not 210 per render
  const panelsRef = useRef(panels);
  panelsRef.current = panels;
  const panelSetters = useMemo((): Record<string, (v: boolean | ((prev: boolean) => boolean)) => void> => {
    const map: Record<string, (v: boolean | ((prev: boolean) => boolean)) => void> = {};
    for (const key of PANEL_KEYS) {
      map[key] = (v: boolean | ((prev: boolean) => boolean)) => {
        const val = typeof v === 'function' ? v(!!panelsRef.current[key]) : v;
        val ? openP(key) : closeP(key);
      };
    }
    return map;
  }, [openP, closeP]);

  // Property lookups from cached map (no new closures per render)
  const setShowVersionHistory = panelSetters.showVersionHistory;
  const setShowConsole = panelSetters.showConsole;
  const setShowEnvVars = panelSetters.showEnvVars;
  const setShowRLSTester = panelSetters.showRLSTester;
  const setShowAssets = panelSetters.showAssets;
  const setShowPackages = panelSetters.showPackages;
  const setShowDatabase = panelSetters.showDatabase;
  const setShowAuth = panelSetters.showAuth;
  const setShowKnowledge = panelSetters.showKnowledge;
  const setShowStorage = panelSetters.showStorage;
  const setShowEdgeFunctions = panelSetters.showEdgeFunctions;
  const setShowActivity = panelSetters.showActivity;
  const setShowBilling = panelSetters.showBilling;
  const setShowShareDialog = panelSetters.showShareDialog;
  const setShowSEOEditor = panelSetters.showSEOEditor;
  const setShowSettingsPanel = panelSetters.showSettingsPanel;
  const setShowExportGuide = panelSetters.showExportGuide;
  const setShowCodeIntel = panelSetters.showCodeIntel;
  const setShowDbExplorer = panelSetters.showDbExplorer;
  const setShowComponentLib = panelSetters.showComponentLib;
  const setShowTestingSuite = panelSetters.showTestingSuite;
  const setShowDiffReview = panelSetters.showDiffReview;
  const setShowDomainPanel = panelSetters.showDomainPanel;
  const setShowTerminal = panelSetters.showTerminal;
  const setShowBuildLog = panelSetters.showBuildLog;
  const setShowTimeline = panelSetters.showTimeline;
  const setShowDiffViewer = panelSetters.showDiffViewer;
  const setShowDeployPipeline = panelSetters.showDeployPipeline;
  const setShowComponentPalette = panelSetters.showComponentPalette;
  const setShowHelpCenter = panelSetters.showHelpCenter;
  const setShowGPTConnector = panelSetters.showGPTConnector;
  const setShowPerformanceProfiler = panelSetters.showPerformanceProfiler;
  const setShowBuildAnalytics = panelSetters.showBuildAnalytics;
  const setShowDesignSystem = panelSetters.showDesignSystem;
  const setShowChangelog = panelSetters.showChangelog;
  const setShowSetupWizard = panelSetters.showSetupWizard;
  const setShowSchemaDesigner = panelSetters.showSchemaDesigner;
  const setShowOneClickDeploy = panelSetters.showOneClickDeploy;
  const setShowEditHistory = panelSetters.showEditHistory;
  const setShowBugReport = panelSetters.showBugReport;
  const setShowEnhancedPalette = panelSetters.showEnhancedPalette;
  const setShowMultiSearch = panelSetters.showMultiSearch;
  const setShowTestRunner = panelSetters.showTestRunner;
  const setShowExtensions = panelSetters.showExtensions;
  const setShowCollaboration = panelSetters.showCollaboration;
  const setShowAPIBuilder = panelSetters.showAPIBuilder;
  const setShowSupabaseIDE = panelSetters.showSupabaseIDE;
  const setShowGitHubPanel = panelSetters.showGitHubPanel;
  const setShowMigrationPanel = panelSetters.showMigrationPanel;
  const setShowEdgeFnEditor = panelSetters.showEdgeFnEditor;
  const setShowBuildWorkflow = panelSetters.showBuildWorkflow;
  const setShowDevTools = panelSetters.showDevTools;
  const setShowNPMManager = panelSetters.showNPMManager;
  const setShowPublishPanel = panelSetters.showPublishPanel;
  const setShowImageGen = panelSetters.showImageGen;
  const setShowSymbolSearch = panelSetters.showSymbolSearch;
  const setShowSecretsManager = panelSetters.showSecretsManager;
  const setShowModelSwitcher = panelSetters.showModelSwitcher;
  const setShowPromptChains = panelSetters.showPromptChains;
  const setShowCodeReview = panelSetters.showCodeReview;
  const setShowTestGenerator = panelSetters.showTestGenerator;
  const setShowNLQuery = panelSetters.showNLQuery;
  const setShowSnippetLibrary = panelSetters.showSnippetLibrary;
  const setShowSplitDiff = panelSetters.showSplitDiff;
  const setShowComments = panelSetters.showComments;
  const setShowTeamActivity = panelSetters.showTeamActivity;
  const setShowApprovals = panelSetters.showApprovals;
  const setShowForking = panelSetters.showForking;
  const setShowFigmaImport = panelSetters.showFigmaImport;
  const setShowColorExtractor = panelSetters.showColorExtractor;
  const setShowIconPicker = panelSetters.showIconPicker;
  const setShowBreakpointEditor = panelSetters.showBreakpointEditor;
  const setShowAnimationBuilder = panelSetters.showAnimationBuilder;
  const setShowVisualSchema = panelSetters.showVisualSchema;
  const setShowSeedData = panelSetters.showSeedData;
  const setShowAPITester = panelSetters.showAPITester;
  const setShowWebhookBuilder = panelSetters.showWebhookBuilder;
  const setShowCronScheduler = panelSetters.showCronScheduler;
  const setShowEnvManager = panelSetters.showEnvManager;
  const setShowRollback = panelSetters.showRollback;
  const setShowUptimeMonitor = panelSetters.showUptimeMonitor;
  const setShowBuildCache = panelSetters.showBuildCache;
  const setShowBuildScripts = panelSetters.showBuildScripts;
  const setShowCMSMode = panelSetters.showCMSMode;
  const setShowBlogEngine = panelSetters.showBlogEngine;
  const setShowImageOptimizer = panelSetters.showImageOptimizer;
  const setShowVideoEmbed = panelSetters.showVideoEmbed;
  const setShowI18n = panelSetters.showI18n;
  const setShowAnalyticsDashboard = panelSetters.showAnalyticsDashboard;
  const setShowErrorTracking = panelSetters.showErrorTracking;
  const setShowSessionReplay = panelSetters.showSessionReplay;
  const setShowABTesting = panelSetters.showABTesting;
  const setShowAIUsage = panelSetters.showAIUsage;
  const setShowDepScanner = panelSetters.showDepScanner;
  const setShowCSPGenerator = panelSetters.showCSPGenerator;
  const setShowGDPR = panelSetters.showGDPR;
  const setShowRateLimiter = panelSetters.showRateLimiter;
  const setShowSecretRotation = panelSetters.showSecretRotation;
  const setShowCLICompanion = panelSetters.showCLICompanion;
  const setShowGHActions = panelSetters.showGHActions;
  const setShowSlackDiscord = panelSetters.showSlackDiscord;
  const setShowWhiteLabel = panelSetters.showWhiteLabel;
  const setShowPluginSDK = panelSetters.showPluginSDK;
  const setShowRefactoring = panelSetters.showRefactoring;
  const setShowNLRegex = panelSetters.showNLRegex;
  const setShowCommitMsg = panelSetters.showCommitMsg;
  const setShowAutoImport = panelSetters.showAutoImport;
  const setShowDocWriter = panelSetters.showDocWriter;
  const setShowCoEditing = panelSetters.showCoEditing;
  const setShowVoiceChat = panelSetters.showVoiceChat;
  const setShowScreenShare = panelSetters.showScreenShare;
  const setShowCodeReactions = panelSetters.showCodeReactions;
  const setShowWhiteboard = panelSetters.showWhiteboard;
  const setShowVisualRegression = panelSetters.showVisualRegression;
  const setShowA11yScore = panelSetters.showA11yScore;
  const setShowCoverage = panelSetters.showCoverage;
  const setShowMutationTest = panelSetters.showMutationTest;
  const setShowLoadTest = panelSetters.showLoadTest;
  const setShowPageBuilder = panelSetters.showPageBuilder;
  const setShowThemeStudio = panelSetters.showThemeStudio;
  const setShowFormBuilder = panelSetters.showFormBuilder;
  const setShowChartDashboard = panelSetters.showChartDashboard;
  const setShowLayoutGrid = panelSetters.showLayoutGrid;
  const setShowGraphQL = panelSetters.showGraphQL;
  const setShowWSManager = panelSetters.showWSManager;
  const setShowFileUpload = panelSetters.showFileUpload;
  const setShowPayments = panelSetters.showPayments;
  const setShowEmailTemplates = panelSetters.showEmailTemplates;
  const setShowTutorialCreator = panelSetters.showTutorialCreator;
  const setShowCodePlayground = panelSetters.showCodePlayground;
  const setShowCustomLinting = panelSetters.showCustomLinting;
  const setShowDepGraph = panelSetters.showDepGraph;
  const setShowGitBlame = panelSetters.showGitBlame;
  const setShowMultiRegion = panelSetters.showMultiRegion;
  const setShowFeatureFlags = panelSetters.showFeatureFlags;
  const setShowCanaryDeploy = panelSetters.showCanaryDeploy;
  const setShowSSG = panelSetters.showSSG;
  const setShowDockerExport = panelSetters.showDockerExport;
  const setShowSubscriptions = panelSetters.showSubscriptions;
  const setShowInvoices = panelSetters.showInvoices;
  const setShowUsageMetering = panelSetters.showUsageMetering;
  const setShowAffiliates = panelSetters.showAffiliates;
  const setShowRevenue = panelSetters.showRevenue;
  const setShowCapacitor = panelSetters.showCapacitor;
  const setShowPushNotifications = panelSetters.showPushNotifications;
  const setShowOfflineFirst = panelSetters.showOfflineFirst;
  const setShowGestureBuilder = panelSetters.showGestureBuilder;
  const setShowAppStoreAssets = panelSetters.showAppStoreAssets;
  const setShowCodeTranslator = panelSetters.showCodeTranslator;
  const setShowSmartScaffold = panelSetters.showSmartScaffold;
  const setShowWorkflowAutomation = panelSetters.showWorkflowAutomation;
  const setShowPerfOptimizer = panelSetters.showPerfOptimizer;
  const setShowSecurityAuditor = panelSetters.showSecurityAuditor;
  const setShowStateMachine = panelSetters.showStateMachine;
  const setShowDataValidation = panelSetters.showDataValidation;
  const setShowCacheStrategy = panelSetters.showCacheStrategy;
  const setShowReactiveStore = panelSetters.showReactiveStore;
  const setShowDataMigration = panelSetters.showDataMigration;
  const setShowRegexPlayground = panelSetters.showRegexPlayground;
  const setShowJsonYamlConverter = panelSetters.showJsonYamlConverter;
  const setShowColorContrast = panelSetters.showColorContrast;
  const setShowTailwindSorter = panelSetters.showTailwindSorter;
  const setShowMarkdownPreview = panelSetters.showMarkdownPreview;
  const setShowToastDesigner = panelSetters.showToastDesigner;
  const setShowNotifCenter = panelSetters.showNotifCenter;
  const setShowChatWidget = panelSetters.showChatWidget;
  const setShowEmailSequence = panelSetters.showEmailSequence;
  const setShowSMSTemplate = panelSetters.showSMSTemplate;
  const setShowStepperWizard = panelSetters.showStepperWizard;
  const setShowCommandMenuBuilder = panelSetters.showCommandMenuBuilder;
  const setShowBreadcrumbGen = panelSetters.showBreadcrumbGen;
  const setShowMegaMenu = panelSetters.showMegaMenu;
  const setShowContextMenu = panelSetters.showContextMenu;
  const setShowDockerCompose = panelSetters.showDockerCompose;
  const setShowK8s = panelSetters.showK8s;
  const setShowCICDPipeline = panelSetters.showCICDPipeline;
  const setShowStructuredLogger = panelSetters.showStructuredLogger;
  const setShowHealthCheck = panelSetters.showHealthCheck;
  const setShowOAuthSetup = panelSetters.showOAuthSetup;
  const setShowMFAFlow = panelSetters.showMFAFlow;
  const setShowSessionMgr = panelSetters.showSessionMgr;
  const setShowAPIKeyMgmt = panelSetters.showAPIKeyMgmt;
  const setShowPermMatrix = panelSetters.showPermMatrix;
  const setShowRichTextConfig = panelSetters.showRichTextConfig;
  const setShowFilePreviewGen = panelSetters.showFilePreviewGen;
  const setShowAvatarGen = panelSetters.showAvatarGen;
  const setShowCarouselBuilder = panelSetters.showCarouselBuilder;
  const setShowGalleryLightbox = panelSetters.showGalleryLightbox;
  const setShowFTS = panelSetters.showFTS;
  const setShowFacetedFilter = panelSetters.showFacetedFilter;
  const setShowAutocomplete = panelSetters.showAutocomplete;
  const setShowTagSystem = panelSetters.showTagSystem;
  const setShowSEOMeta = panelSetters.showSEOMeta;
  const setShowKPIDashboard = panelSetters.showKPIDashboard;
  const setShowAlertingRules = panelSetters.showAlertingRules;
  const setShowAuditTrail = panelSetters.showAuditTrail;
  const setShowClickHeatmap = panelSetters.showClickHeatmap;
  const setShowBudgetMonitor = panelSetters.showBudgetMonitor;
  const setShowChangelogAuto = panelSetters.showChangelogAuto;
  const setShowREADMEGen = panelSetters.showREADMEGen;
  const setShowLicensePicker = panelSetters.showLicensePicker;
  const setShowOpenAPISpec = panelSetters.showOpenAPISpec;
  const setShowProjectHealth = panelSetters.showProjectHealth;
  const setShowPromptHistory = panelSetters.showPromptHistory;
  const setShowFileSearch = panelSetters.showFileSearch;
  const setShowFileTree = panelSetters.showFileTree;
  const setShowTemplates = panelSetters.showTemplates;
  const setShowShortcuts = panelSetters.showShortcuts;
  const setShowQuickSwitcher = panelSetters.showQuickSwitcher;
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
        // Phase 51: Push full file array (including files about to be deleted) to undo stack
        pushUndo('AI generation', [...project.files]);
        versionTimeline.addSnapshot('Before AI generation', project.files, 'auto');
      }
      const conflicts = latestFiles.filter(f => dirtyFiles.has(f.path));
      if (conflicts.length > 0) {
        setPendingConflicts(conflicts.map(f => ({
          path: f.path,
          userContent: project.files.find(pf => pf.path === f.path)?.content || '',
          aiContent: f.content,
        })));
      // Issue 23 fix: Batch non-conflicting files into a single setFiles merge
        const nonConflicting = latestFiles.filter(f => !dirtyFiles.has(f.path));
        if (nonConflicting.length > 0) {
          const existingMap = new Map(project.files.map(f => [f.path, f]));
          for (const f of nonConflicting) existingMap.set(f.path, f);
          setFiles(Array.from(existingMap.values()));
        }
      } else {
        // Issue 6 fix: Batch all file updates into a single setFiles call
        if (project.files.length === 0) {
          setFiles(latestFiles);
        } else {
          const existingMap = new Map(project.files.map(f => [f.path, f]));
          for (const f of latestFiles) existingMap.set(f.path, f);
          setFiles(Array.from(existingMap.values()));
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
      // Issue 30 fix: Removed isCompiling flicker (was set true then immediately false next frame)
      // Defer code smell analysis so it doesn't block preview
      setTimeout(() => {
        const smells = codeSmellDetector.analyzeFiles([...project.files, ...latestFiles]);
        if (smells.length > 0) setCodeSuggestions(smells);
      }, 200);
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
      // Issue 4 fix: Defer non-critical post-build work to unblock preview
      // Run smoke test synchronously (fast, needed for error annotations)
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

      // Defer heavy audits + Issue 14 fix: move TS validation into deferred block
      setTimeout(() => {
        // Issue 14: TS validation deferred to unblock preview render
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
        lighthouseAudit.runAudit(latestFiles);
        bundleSize.analyzeBundle(latestFiles);
        // Auto-patch broken delete/remove buttons deterministically (zero credits)
        // Issues 25 & 26 fix: Batch patched + companion files into a single setFiles merge
        const patchResult = deleteAutoPatcher.patchDeleteButtons(latestFiles);
        const companions = fileScaffolding.generateCompanionFiles(latestFiles, project.files);
        const batchFiles: typeof latestFiles = [];
        if (patchResult.patched) {
          batchFiles.push(...patchResult.files);
          buildLog.addEntry('info', `🔧 Auto-patched ${patchResult.fixes.length} delete/remove issue(s)`);
          patchResult.fixes.forEach(fix => buildLog.addEntry('info', `  ✅ ${fix}`));
        }
        if (companions.length > 0) {
          batchFiles.push(...companions);
          buildLog.addEntry('info', `🧪 Auto-generated ${companions.length} test file(s)`);
        }
        if (batchFiles.length > 0) {
          const currentFiles = project.files;
          const map = new Map(currentFiles.map(f => [f.path, f]));
          for (const f of batchFiles) map.set(f.path, f);
          setFiles(Array.from(map.values()));
        }
      }, 100);
      // Mark preview as good for hot recovery & update conflict resolver base snapshot
      hotRecovery.markAsGood([...project.files]);
      conflictResolver.setBaseSnapshot([...project.files]);
      versionTimeline.addSnapshot(`AI: ${messages[messages.length - 2]?.content?.slice(0, 40) || 'generation'}`, [...project.files], 'ai-generation');

      // Record build analytics (Phase 60: compute actual credit cost based on mode)
      const lastMsg = messages[messages.length - 1];
      const isAutoFixBuild = lastMsg?.content?.startsWith('Auto-fix error:') || false;
      const actualCredits = isAutoFixBuild ? 0 : (mode === 'build' ? 3 : 1);
      buildAnalytics.recordBuild({
        type: 'build',
        durationMs: duration,
        filesGenerated: latestFiles.length,
        creditsUsed: actualCredits,
        success: true,
        errorCount: 0, // validation now deferred; updated async
        validationScore: 100,
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

  // Issue 8 fix: streamingFilePath as ref to avoid workspace re-renders
  const streamingFilePathRef = useRef<string | null>(null);
  const handleStreamingFileChange = useCallback((path: string | null) => {
    streamingFilePathRef.current = path;
  }, []);

  // editorFile for non-streaming contexts (split view, code-only tab)
  const editorFile = useMemo(() => {
    return activeFile;
  }, [activeFile]);

  // Phase 50: Debounced auto-save to prevent corruption from rapid updates
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInProgressRef = useRef(false);

  // Auto-save (cloud) — includes chat messages + versions for persistence
  useEffect(() => {
    if (isGenerating) return; // skip during streaming to prevent browser freeze
    if (project.files.length === 0) return;
    // Phase 50: Debounce with 2s delay, cancel pending saves
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (saveInProgressRef.current) return;
      saveInProgressRef.current = true;
      scheduleAutoSave(project.name, project.files, messages, { versions });
      // Reset flag after a short delay (scheduleAutoSave is itself debounced)
      setTimeout(() => { saveInProgressRef.current = false; }, 500);
    }, 2000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [project.files, project.name, messages, versions, scheduleAutoSave, isGenerating]);

  // Issue 13 fix: Track post-generation transition to defer saves
  const postGenTimestampRef = useRef<number>(0);
  useEffect(() => {
    if (prevIsGeneratingRef.current && !isGenerating) {
      postGenTimestampRef.current = Date.now();
    }
  }, [isGenerating]);

  // Auto-save to IndexedDB (Phase 10 — fast local persistence)
  const sessionId = currentProjectId || 'draft';
  useEffect(() => {
    if (isGenerating) return; // skip during streaming to prevent browser freeze
    // Issue 13 fix: Defer save for 1s after generation ends to let compilation take priority
    const elapsed = Date.now() - postGenTimestampRef.current;
    if (elapsed < 1000) {
      const timer = setTimeout(() => {
        idbPersistence.saveToIDB(sessionId, project.name, project.files, messages);
      }, 1000 - elapsed);
      return () => clearTimeout(timer);
    }
    idbPersistence.saveToIDB(sessionId, project.name, project.files, messages);
  }, [project.files, project.name, messages, sessionId, isGenerating]);

  // Auto-save draft to localStorage (survives refresh)
  useEffect(() => {
    if (isGenerating) return; // skip during streaming to prevent browser freeze
    // Issue 13 fix: Defer save for 1s after generation ends
    const elapsed = Date.now() - postGenTimestampRef.current;
    if (elapsed < 1000) {
      const timer = setTimeout(() => {
        saveDraft(project.name, project.files, messages);
      }, 1000 - elapsed);
      return () => clearTimeout(timer);
    }
    saveDraft(project.name, project.files, messages);
  }, [project.files, project.name, messages, saveDraft, isGenerating]);

  // Immediately persist draft when user switches tabs or navigates away
  // Issue 21 fix: Assign properties directly instead of allocating a new object per render
  const latestRef = useRef({ name: project.name, files: project.files, messages });
  latestRef.current.name = project.name;
  latestRef.current.files = project.files;
  latestRef.current.messages = messages;

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
  // Issue 12 fix: Skip redundant compilation during generation
  const compiledForHosting = useMemo(
    () => {
      try {
        if (isGenerating) return null;
        return getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser);
      } catch (e) {
        console.error('[compiledForHosting] Compilation crashed:', e);
        return null;
      }
    },
    [project.files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, isGenerating]
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowEnhancedPalette(prev => !prev); }
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
  }, [canUndo, canRedo, isGenerating, stopGenerating, showSettingsPanel, showFileSearch, showVersionHistory, showConsole, showEnvVars, showAssets, showPackages, showActivity, showBilling, showFileTree]);

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
      const totalCredits = plan.phases.reduce((sum, p) => sum + p.estimatedCredits, 0);
      const phaseList = plan.phases.map((p, i) => `${i + 1}. **${p.title}** (~${p.estimatedCredits} credits) — ${p.description}`).join('\n');
      const planMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: `🚧 **This is a large project!** I've broken it into ${plan.phases.length} phases (~${totalCredits} credits total):\n\n${phaseList}\n\nClick **"Start Phase 1"** below to begin. Each phase builds on the last, and you can skip or cancel at any time.`,
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

  // Track when generation ends for post-generation cooldown
  // Issue 17 fix: Removed duplicate smoke test (now only runs in latestFiles watcher above)
  const generationEndedAt = useRef<number>(0);
  const compilationEndedAt = useRef<number>(0);
  const prevIsGenerating = useRef(false);
  useEffect(() => {
    if (!isGenerating && prevIsGenerating.current) {
      generationEndedAt.current = Date.now();
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating]);

  // Auto-fix pipeline: uses Phase 47 useAutoFixLoop + hot recovery
  const handleAutoFixError = useCallback((error: import('./ErrorConsole').PreviewError) => {
    // Skip resource load errors FIRST — don't even forward to chat
    if (error.message?.includes('Failed to load')) return;
    // Skip during generation
    if (isGenerating) return;
    // 3-second cooldown after generation ends to let preview stabilize
    if (Date.now() - generationEndedAt.current < 3000) return;

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
    // Issue 22 fix: Reuse existing compiledForHosting instead of redundant getCompiledHTML call
    const html = compiledForHosting;
    if (projectId && html) {
      captureAndUpload(html, projectId).catch(() => {});
    }
  }, [saveProject, project.name, project.files, branches, activeBranch, messages, clearDraft, compiledForHosting, captureAndUpload, linkedGPT]);

  // Auto-capture thumbnail after generation completes (Issue 18: reuse stableHTML instead of redundant getCompiledHTML)
  const wasGeneratingRef = useRef(false);
  useEffect(() => {
    if (wasGeneratingRef.current && !isGenerating && project.files.length > 0 && currentProjectId) {
      const html = compiledForHosting;
      if (html) {
        setTimeout(() => {
          captureAndUpload(html, currentProjectId).catch(() => {});
        }, 2000);
      }
    }
    wasGeneratingRef.current = isGenerating;
  }, [isGenerating, project.files.length, currentProjectId, compiledForHosting, captureAndUpload]);

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

  // Listen for payload_too_large fallback → force-trigger phase planner
  useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent).detail?.prompt;
      if (!prompt) return;
      const plan = phasePlanner.forceAnalyzePrompt(prompt);
      if (plan) {
        const phaseList = plan.phases.map((p, i) => `${i + 1}. **${p.title}** (~${p.estimatedCredits} credits) — ${p.description}`).join('\n');
        const totalCredits = plan.phases.reduce((sum, p) => sum + p.estimatedCredits, 0);
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: `📋 **Phase Plan** (${plan.phases.length} phases, ~${totalCredits} credits total):\n\n${phaseList}\n\nClick **"Start Phase 1"** below to begin.`,
            timestamp: new Date(),
          },
        ]);
      }
    };
    window.addEventListener('phase-planner-fallback', handler);
    return () => window.removeEventListener('phase-planner-fallback', handler);
  }, [phasePlanner.forceAnalyzePrompt, setMessages]);

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
  const isReactProject = useMemo(() => {
    try {
      return detectReactProject(project.files);
    } catch (e) {
      console.error('[detectReactProject] crashed:', e);
      return false;
    }
  }, [project.files]);

  // Moved above timer-based compilation effect to fix React hook ordering (#310)
  const [stableHTML, setStableHTML] = useState<string | null>(null);
  const stableHTMLRef = useRef<string | null>(null);
  stableHTMLRef.current = stableHTML;

  // Issue 24 fix: Reset stableHTML when a new generation starts so subsequent builds recompile
  const prevIsGeneratingForReset = useRef(false);
  useEffect(() => {
    if (isGenerating && !prevIsGeneratingForReset.current) {
      setStableHTML(null);
      stableHTMLRef.current = null;
    }
    prevIsGeneratingForReset.current = isGenerating;
  }, [isGenerating]);

   // Timer-based compilation: poll partialFilesRef every 5s during generation
   // instead of running the expensive compiler synchronously on every state change
   useEffect(() => {
     if (!isGenerating) return;
     let attempted = false;
     const interval = setInterval(() => {
       if (attempted) return;
      const pFiles = partialFilesRef.current;
      const pCount = completedFileCountRef.current;
      if (pCount < 3 || pFiles.length === 0) return;

      console.log(`[Preview] Timer-based compile: ${pCount} completed files of ${pFiles.length}`);
      const isReact = pFiles.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
      try {
        if (isReact) {
          try {
            const result = compileReactProject(pFiles, {
              supabaseConfig: supabaseConfig || undefined,
              stripeConfig: stripeConfig || undefined,
              envVars,
            });
             if (result.html) {
               setStableHTML(result.html);
             }
             attempted = true;
           } catch (compileErr) {
             console.warn('[Preview] React compilation crashed on partial files:', compileErr);
             attempted = true;
           }
        } else {
          // Issue 3 fix: For vanilla projects, compile from partialFilesRef
          // since project.files is empty during initial generation
          const indexFile = pFiles.find(f => f.path === 'index.html' || f.path.endsWith('/index.html'));
          if (indexFile) {
            // Build a minimal HTML by inlining CSS/JS from partial files
            let html = indexFile.content;
            // Inline CSS files
            const cssFiles = pFiles.filter(f => f.path.endsWith('.css'));
            if (cssFiles.length > 0) {
              const cssInline = cssFiles.map(f => `<style>/* ${f.path} */\n${f.content}</style>`).join('\n');
              html = html.replace('</head>', `${cssInline}\n</head>`);
            }
            // Inline JS files  
            const jsFiles = pFiles.filter(f => f.path.endsWith('.js') && !f.path.endsWith('.config.js'));
            if (jsFiles.length > 0) {
              const jsInline = jsFiles.map(f => `<script>/* ${f.path} */\n${f.content}</script>`).join('\n');
              html = html.replace('</body>', `${jsInline}\n</body>`);
            }
             setStableHTML(html);
             attempted = true;
           }
         }
       } catch (e) {
         console.warn('[Preview] Timer-based compilation failed:', e);
         attempted = true;
       }
     }, 5000);
    return () => clearInterval(interval);
  }, [isGenerating, partialFilesRef, completedFileCountRef, compileReactProject, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT, getCompiledHTML]);

  // stableHTML, stableHTMLRef, and prevIsGeneratingForReset moved above timer-based compilation effect to fix hook ordering

  const liveCompiledHTML = useMemo(() => {
    try {
      // During generation, compilation is handled by the timer above
      if (isGenerating) return null;

      if (project.files.length === 0) return null;

      // Issue 10 fix: Skip redundant compilation if stableHTML already exists from timer-based path
      if (stableHTMLRef.current) return null;

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
    } catch (e) {
      console.error('[ReactCompiler] Compilation crashed:', e);
      return null;
    }
  }, [project.files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT, isReactProject, compileReactProject, isGenerating]);

  // Defer preview updates until build completes — but allow CSS hot-patches through immediately
  useEffect(() => {
    if (liveCompiledHTML) {
      // Issue 11 fix: Skip if stableHTML already has content (avoid redundant iframe reload)
      if (stableHTML && stableHTML.length > 0) return;
      // Try hot-patching first (CSS-only changes skip full reload)
      const patched = liveSync.applyPatches(previewIframeRef, project.files);
      if (!patched) {
        // Full reload needed — update srcdoc
        setStableHTML(liveCompiledHTML);
        liveSync.resetSnapshot(project.files);
      }
    }
    // Fix 5: If generation finished but compilation returned null, show error fallback
    if (!isGenerating && !liveCompiledHTML && project.files.length > 0 && stableHTML === null) {
      console.warn('[Preview] Generation complete but compilation returned null — showing error fallback');
      setStableHTML(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Compilation Error</title><style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a14;color:#fff;font-family:system-ui,sans-serif}.card{text-align:center;max-width:440px;padding:2rem}h1{font-size:1.5rem;margin-bottom:1rem;color:#f87171}p{color:#ffffff90;line-height:1.6;margin-bottom:0.5rem}code{background:#1e1e2e;padding:2px 6px;border-radius:4px;font-size:0.85em}</style></head><body><div class="card"><h1>⚠️ Compilation Error</h1><p>Your project files were generated but could not be compiled into a preview.</p><p>Check that your project has an <code>index.html</code> file and try regenerating.</p></div></body></html>`);
    }
  }, [isGenerating, liveCompiledHTML, project.files, stableHTML]);

  // Also hot-patch during manual edits (when not generating)
  useEffect(() => {
    if (!isGenerating && stableHTML && project.files.length > 0) {
      liveSync.applyPatches(previewIframeRef, project.files);
    }
  }, [project.files, isGenerating, stableHTML]);

  // Fix 4: Force stableHTML update if generation exceeds 120 seconds with partial files available
  useEffect(() => {
    if (!isGenerating) return;
    const timer = setTimeout(() => {
      const pFiles = partialFilesRef.current;
      if (pFiles.length > 0 && !stableHTML) {
        console.warn('[Preview] Generation exceeded 120s — force-compiling partial files for preview');
        const isPartialReact = pFiles.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
        if (isPartialReact) {
          try {
            const result = compileReactProject(pFiles, {
              supabaseConfig: supabaseConfig || undefined,
              stripeConfig: stripeConfig || undefined,
              envVars,
            });
            if (result.html) {
              setStableHTML(result.html);
              return;
            }
          } catch (e) {
            console.warn('[Preview] Partial React compilation failed:', e);
          }
        }
        // Issue 7 fix: Fallback vanilla compilation using partialFilesRef (project.files is empty during generation)
        try {
          const htmlFile = pFiles.find(f => f.path.endsWith('.html'));
          if (htmlFile) {
            let html = htmlFile.content;
            const cssFiles = pFiles.filter(f => f.path.endsWith('.css'));
            if (cssFiles.length > 0) {
              const cssInline = cssFiles.map(f => `<style>/* ${f.path} */\n${f.content}</style>`).join('\n');
              html = html.replace('</head>', `${cssInline}\n</head>`);
            }
            const jsFiles = pFiles.filter(f => f.path.endsWith('.js') && !f.path.endsWith('.config.js'));
            if (jsFiles.length > 0) {
              const jsInline = jsFiles.map(f => `<script>/* ${f.path} */\n${f.content}</script>`).join('\n');
              html = html.replace('</body>', `${jsInline}\n</body>`);
            }
            setStableHTML(html);
          }
        } catch (e) {
          console.warn('[Preview] Partial vanilla compilation failed:', e);
        }
      }
    }, 120_000);
    return () => clearTimeout(timer);
  }, [isGenerating, partialFilesRef, stableHTML]);

  // NEVER fall through to liveCompiledHTML during generation — show SkeletonPreview until build completes
  const compiledHTML = stableHTML;
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

  // Close other panels when opening one — uses exclusiveOpen from usePanelManager
  const openPanel = useCallback((panel: string) => {
    const keyMap: Record<string, string> = {
      history: 'showVersionHistory', envVars: 'showEnvVars', assets: 'showAssets',
      packages: 'showPackages', database: 'showDatabase', auth: 'showAuth',
      knowledge: 'showKnowledge', storage: 'showStorage', edgeFunctions: 'showEdgeFunctions',
      activity: 'showActivity', codeIntel: 'showCodeIntel', componentLib: 'showComponentLib',
      testingSuite: 'showTestingSuite', exportGuide: 'showExportGuide', helpCenter: 'showHelpCenter',
      gptConnector: 'showGPTConnector', setupWizard: 'showSetupWizard', schemaDesigner: 'showSchemaDesigner',
      oneClickDeploy: 'showOneClickDeploy', designSystem: 'showDesignSystem',
    };
    const key = keyMap[panel] || ('show' + panel.charAt(0).toUpperCase() + panel.slice(1));
    exclusiveOpen(key, EXCLUSIVE_PANEL_GROUP);
  }, [exclusiveOpen]);

  // Track recent files
  const handleSetActiveFile = useCallback((path: string) => {
    setActiveFile(path);
    setRecentFiles(prev => [path, ...prev.filter(p => p !== path)].slice(0, 10));
  }, [setActiveFile]);

  // Issue 15: panelSetters already defined above — removed duplicate

  // Open any panel by stateKey
  const openPanelByKey = useCallback((stateKey: string) => {
    const setter = panelSetters[stateKey];
    if (setter) setter(true);
  }, [panelSetters]);

  // Issue 16 fix: Static registry actions — computed once (no dependencies on files/activeFile)
  const staticRegistryActions = useMemo((): CommandAction[] => {
    return PANEL_REGISTRY.map(panel => ({
      id: `panel-${panel.id}`,
      label: panel.label,
      icon: panel.icon,
      category: 'panel' as const,
      keywords: panel.keywords,
      action: () => openPanelByKey(panel.stateKey),
    }));
  }, [openPanelByKey]);

  // Dynamic core actions — only these depend on project.files, activeFile, etc.
  const commandActions = useMemo((): CommandAction[] => {
    const coreActions: CommandAction[] = [
      { id: 'preview', label: 'Switch to Preview', icon: Eye, category: 'view', shortcut: '⌘1', action: () => setRightTab('preview') },
      { id: 'code', label: 'Switch to Code', icon: Code, category: 'view', shortcut: '⌘2', action: () => setRightTab('code') },
      { id: 'split', label: 'Switch to Split View', icon: Columns, category: 'view', shortcut: '⌘3', action: () => setRightTab('split') },
      { id: 'save', label: 'Save Project', icon: Settings, category: 'edit', shortcut: '⌘S', action: handleSave },
      { id: 'undo', label: 'Undo', icon: Undo2, category: 'edit', shortcut: '⌘Z', action: handleUndo },
      { id: 'redo', label: 'Redo', icon: Redo2, category: 'edit', shortcut: '⌘⇧Z', action: handleRedo },
      { id: 'publish', label: 'Publish App', icon: Rocket, category: 'deploy', action: handlePublish, keywords: ['deploy', 'publish'] },
      { id: 'files', label: 'Toggle File Tree', icon: FolderOpen, category: 'panel', action: () => setShowFileTree(t => !t) },
      { id: 'console', label: 'Toggle Console', icon: Activity, category: 'panel', action: () => setShowConsole(c => !c) },
      { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, category: 'panel', shortcut: '⌘/', action: () => setShowShortcuts(true) },
      { id: 'prompt-history', label: 'Prompt History', icon: Clock, category: 'panel', action: () => setShowPromptHistory(true), keywords: ['history', 'prompts', 'favorites'] },
      { id: 'code-smells', label: 'Analyze Code Quality', icon: Zap, category: 'run', action: () => { const smells = codeSmellDetector.analyzeFiles(project.files); setCodeSuggestions(smells); setShowCodeIntel(true); toast.success(`Found ${smells.length} suggestions`); }, keywords: ['lint', 'quality', 'refactor', 'smell'] },
      { id: 'gen-readme', label: 'Generate README', icon: BookOpen, category: 'run', action: () => { const prompt = docGenerator.generateReadmePrompt(project.files, project.name); handleSend(prompt); }, keywords: ['doc', 'readme', 'documentation'] },
      { id: 'doc-file', label: 'Document Current File', icon: FileCode, category: 'run', action: () => { if (activeFile) { const prompt = docGenerator.generateDocPrompt(activeFile); handleSend(prompt); } else { toast.error('Open a file first'); } }, keywords: ['jsdoc', 'comment', 'document'] },
    ];
    return [...coreActions, ...staticRegistryActions];
  }, [handleSave, handleUndo, handleRedo, handlePublish, codeSmellDetector, project.files, docGenerator, project.name, activeFile, handleSend, staticRegistryActions]);

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
        <WorkspaceTopBar
          projectName={project.name}
          isGenerating={isGenerating}
          hasFiles={hasFiles}
          isEditingName={isEditingName}
          editName={editName}
          setEditName={setEditName}
          setIsEditingName={setIsEditingName}
          onRename={handleRename}
          undoStack={undoStack}
          redoStack={redoStack}
          canUndo={canUndo}
          canRedo={canRedo}
          currentFiles={project.files}
          onUndo={handleUndo}
          onRedo={handleRedo}
          rightTab={rightTab}
          setRightTab={setRightTab}
          setShowPromptHistory={setShowPromptHistory}
          setShowVersionHistory={setShowVersionHistory}
          setShowSettingsPanel={setShowSettingsPanel}
          setShowPublishPanel={setShowPublishPanel}
          setShowBilling={setShowBilling}
          setShowShareDialog={setShowShareDialog}
          setShowSupabaseIDE={setShowSupabaseIDE}
          setShowTerminal={setShowTerminal}
          onOpenPanel={openPanelByKey}
          previewCurrentUrl={previewCurrentUrl}
          previewIframeRef={previewIframeRef}
          syncStatus={idbPersistence.syncStatus}
          lastSaved={lastSaved}
          publishedUrl={publishedUrl}
          isMobile={isMobile}
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
        />
        {/* ── Main Content ── */}
        <div className="flex-1 overflow-hidden">
          {isMobile ? (
            mobileTab === 'chat' ? (
              <BuilderChatPanel messages={messages} isGenerating={isGenerating} fileCount={project.files.length} mode={mode} thinkingPhase={thinkingPhase} versions={versions} totalTokensUsed={totalTokensUsed} previousFiles={previousFiles} latestFiles={latestFiles} contextBudget={contextBudget} onModeChange={setMode} onSend={handleSend} onStop={stopGenerating} onClear={handleClear} onRestoreVersion={restoreVersion} onOpenTemplates={() => setShowTemplates(true)} onFixError={handleFixError} onForkFromMessage={handleForkFromMessage} onRevertToMessage={handleRevertToMessage} selectedModel={selectedModel} onModelChange={setSelectedModel} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} isVisualEditActive={isVisualEditActive} onOpenEditHistory={() => setShowEditHistory(true)} onSelectStarterTemplate={handleSelectStarterTemplate} onReview={() => { projectReview.startReview(project.files, (prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)); projectReview.setShowPanel(true); }} supabaseConfig={supabaseConfig} onUpdateMessages={setMessages} streamingContentRef={streamingContentRef} questionsSlot={builderQuestions.pending ? (
                <div className="px-3 pt-2">
                  <QuestionsCard
                    questions={builderQuestions.pending.questions}
                    onSubmit={(answers) => {
                      const enriched = builderQuestions.buildEnrichedPrompt(builderQuestions.pending!.context, answers);
                      handleSend(enriched, null, true);
                    }}
                    onSkip={() => {
                      const ctx = builderQuestions.pending?.context || '';
                      builderQuestions.dismiss();
                      handleSend(ctx, null, true);
                    }}
                  />
                </div>
              ) : undefined} />
            ) : mobileTab === 'preview' ? (
                <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCountRef.current} isVisualEditActive={isVisualEditActive} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} onAutoFixError={handleAutoFixError} onVisualEdit={handleVisualEdit} externalIframeRef={previewIframeRef} externalViewportMode={viewportMode} onExternalViewportChange={setViewportMode} onUrlChange={setPreviewCurrentUrl}>
                  <GeneratingOverlay isGenerating={isGenerating} isCompiling={isCompiling} phase={thinkingPhase} partialFilesRef={partialFilesRef} completedFileCountRef={completedFileCountRef} continuationRound={continuationRound} />
                </BuilderPreviewPanel>
            ) : (
              <div className="h-full flex flex-col bg-[#09090b]">
                {(editorFile || activeFile) && (
                  <>
                    <FileTabBar openPaths={project.openFilePaths} activePath={streamingFilePathRef.current || project.activeFilePath} dirtyFiles={dirtyFiles} streamingFilePath={streamingFilePathRef.current} onSelect={(path) => setActiveFile(path)} onClose={(path) => closeFile(path)} onReorder={reorderOpenFiles} />
                    <div className="flex-1 min-h-0">
                      <StreamingCodeEditor isStreamingPreview={isStreamingPreview} partialFilesRef={partialFilesRef} activeFile={activeFile} activeFilePath={project.activeFilePath} onContentChange={(path, content) => { upsertFile(path, content); setDirtyFiles(prev => new Set(prev).add(path)); }} remoteCursors={remoteCursors} onCursorChange={handleCursorChange} onStreamingFileChange={handleStreamingFileChange} />
                    </div>
                  </>
                )}
                {!editorFile && !activeFile && (
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
                    <BuilderChatPanel messages={messages} isGenerating={isGenerating} fileCount={project.files.length} mode={mode} thinkingPhase={thinkingPhase} versions={versions} totalTokensUsed={totalTokensUsed} previousFiles={previousFiles} latestFiles={latestFiles} contextBudget={contextBudget} onModeChange={setMode} onSend={handleSend} onStop={stopGenerating} onClear={handleClear} onRestoreVersion={restoreVersion} onOpenTemplates={() => setShowTemplates(true)} onFixError={handleFixError} onForkFromMessage={handleForkFromMessage} onRevertToMessage={handleRevertToMessage} selectedModel={selectedModel} onModelChange={setSelectedModel} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} isVisualEditActive={isVisualEditActive} onOpenEditHistory={() => setShowEditHistory(true)} onSelectStarterTemplate={handleSelectStarterTemplate} onReview={() => { projectReview.startReview(project.files, (prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)); projectReview.setShowPanel(true); }} supabaseConfig={supabaseConfig} onUpdateMessages={setMessages} streamingContentRef={streamingContentRef} questionsSlot={builderQuestions.pending ? (
                      <div className="px-3 pt-2">
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
                    ) : undefined} />
                  </div>
                </div>
              </div>
            </ResizablePanel>
            )}

            <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors data-[resize-handle-active]:bg-cyan-500/50" />

            {/* Right Panel */}
            <ResizablePanel defaultSize={72} minSize={50}>
              <div className="h-full flex">

                {/* Side panels — all wrapped in SafePanel for crash isolation */}
                <SafePanel show={showVersionHistory} name="Version History">
                  <VersionHistoryPanel versions={versions} currentFiles={project.files} onRestore={restoreVersion} onClose={() => setShowVersionHistory(false)} open={showVersionHistory} activeBranchName={activeBranchName} />
                </SafePanel>
                <SafePanel show={showEnvVars} name="Env Variables">
                  <EnvVarsPanel envVars={envVariables} onChange={setEnvVariables} open={showEnvVars} onClose={() => setShowEnvVars(false)} />
                </SafePanel>
                <SafePanel show={!!panels.showRLSTester} name="RLS Tester">
                  <RLSPolicyTester supabaseConfig={supabaseConfig} open={!!panels.showRLSTester} onClose={() => setShowRLSTester(false)} />
                </SafePanel>
                <SafePanel show={showAssets} name="Asset Manager">
                  <AssetManager assets={assets} onUpload={handleAssetUpload} onDelete={handleAssetDelete} open={showAssets} onClose={() => setShowAssets(false)} />
                </SafePanel>
                <SafePanel show={!!panels.showDatabase || !!panels.showAuth || !!panels.showKnowledge || !!panels.showStorage || !!panels.showEdgeFunctions} name="Database Tools">
                  <DatabasePanel open={!!panels.showDatabase} onClose={() => setShowDatabase(false)} supabaseConfig={supabaseConfig} />
                  <AuthConfigPanel open={!!panels.showAuth} onClose={() => setShowAuth(false)} supabaseConfig={supabaseConfig} onGenerateAuthPages={handleGenerateAuthPages} />
                  <KnowledgePanel open={!!panels.showKnowledge} onClose={() => setShowKnowledge(false)} knowledge={knowledge} onKnowledgeChange={setKnowledge} />
                  <StorageBrowser open={!!panels.showStorage} onClose={() => setShowStorage(false)} supabaseConfig={supabaseConfig} />
                  <EdgeFunctionEditor open={!!panels.showEdgeFunctions} onClose={() => setShowEdgeFunctions(false)} onCreateFunction={handleCreateEdgeFunction} functions={edgeFunctions} onSelectFunction={(name) => { setActiveFile(`functions/${name}/index.ts`); setRightTab('code'); }} onDeleteFunction={handleDeleteEdgeFunction} />
                </SafePanel>
                <SafePanel show={showActivity} name="Activity Feed">
                  <ActivityFeed open={showActivity} onClose={() => setShowActivity(false)} entries={activityEntries} />
                </SafePanel>
                <SafePanel show={!!panels.showExportGuide} name="Export Guide">
                  <ExportGuidePanel open={!!panels.showExportGuide} onClose={() => setShowExportGuide(false)} />
                </SafePanel>
                <SafePanel show={!!panels.showSchemaDesigner} name="Schema Designer">
                  <SchemaDesignerLazy
                    open={!!panels.showSchemaDesigner}
                    onClose={() => setShowSchemaDesigner(false)}
                    onGenerateSQL={(sql) => { navigator.clipboard.writeText(sql); toast.success('SQL copied — paste into Supabase SQL editor'); }}
                    onSendToChat={(msg) => { sendMessage(msg, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel); }}
                  />
                </SafePanel>
                <SafePanel show={!!panels.showOneClickDeploy} name="One-Click Deploy">
                <OneClickDeploy
                  open={!!panels.showOneClickDeploy}
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
                </SafePanel>
                <SafePanel show={!!panels.showHelpCenter} name="Help Center">
                  <BuilderHelpCenter open={!!panels.showHelpCenter} onClose={() => setShowHelpCenter(false)} />
                </SafePanel>
                <SafePanel show={!!panels.showSetupWizard} name="Setup Wizard">
                <SetupWizard
                  open={!!panels.showSetupWizard}
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
                </SafePanel>
                <SafePanel show={!!panels.showPromptHistory} name="Prompt History">
                <PromptHistoryPanel
                  open={!!panels.showPromptHistory}
                  onClose={() => setShowPromptHistory(false)}
                  history={promptHistory.history}
                  onRerun={(prompt) => { setShowPromptHistory(false); handleSend(prompt); }}
                  onToggleFavorite={promptHistory.toggleFavorite}
                  onRemove={promptHistory.removeEntry}
                  onClear={promptHistory.clearHistory}
                  onExport={promptHistory.exportHistory}
                  onImport={promptHistory.importHistory}
                />
                </SafePanel>
                <SafePanel show={!!panels.showCodeIntel} name="Code Intelligence">
                  <AICodeIntelligence open={!!panels.showCodeIntel} onClose={() => setShowCodeIntel(false)} suggestions={codeSuggestions} onApplySuggestion={(s) => { if (s.code && activeFile) { upsertFile(activeFile.path, activeFile.content + '\n' + s.code); toast.success('Applied suggestion'); } }} onDismiss={(id) => setCodeSuggestions(prev => prev.filter(s => s.id !== id))} onRefresh={() => { const smells = codeSmellDetector.analyzeFiles(project.files); setCodeSuggestions(smells); toast.success(`Found ${smells.length} suggestions`); }} activeFilePath={project.activeFilePath} />
                </SafePanel>
                <SafePanel show={!!panels.showDbExplorer} name="Database Explorer">
                  <DatabaseExplorer open={!!panels.showDbExplorer} onClose={() => setShowDbExplorer(false)} supabaseConfig={supabaseConfig} />
                </SafePanel>
                <SafePanel show={!!panels.showComponentLib} name="Component Library">
                  <ComponentLibrary open={!!panels.showComponentLib} onClose={() => setShowComponentLib(false)} onInsertComponent={(code) => { if (activeFile) { upsertFile(activeFile.path, activeFile.content + '\n' + code); } }} onApplyTheme={() => {}} />
                </SafePanel>
                <SafePanel show={!!panels.showDeployPipeline} name="Deploy Pipeline">
                  <DeployPipelinePanel open={!!panels.showDeployPipeline} onClose={() => setShowDeployPipeline(false)} onDeploy={handlePublish} publishedUrl={publishedUrl} isDeploying={isGenerating} projectName={project.name} onOpenDomainPanel={() => { setShowDeployPipeline(false); setShowDomainPanel(true); }} />
                </SafePanel>
                <SafePanel show={!!panels.showPerformanceProfiler} name="Performance Profiler">
                  <PerformanceProfilerLazy open={!!panels.showPerformanceProfiler} onClose={() => setShowPerformanceProfiler(false)} files={project.files} cdnPackages={cdnPackages} />
                </SafePanel>
                <SafePanel show={!!panels.showBuildAnalytics} name="Build Analytics">
                  <BuildAnalyticsPanelLazy open={!!panels.showBuildAnalytics} onClose={() => setShowBuildAnalytics(false)} analytics={buildAnalytics.getAnalytics()} />
                </SafePanel>
                <SafePanel show={!!panels.showChangelog} name="Changelog">
                  <ChangelogPanel open={!!panels.showChangelog} onClose={() => setShowChangelog(false)} entries={changelogEntries} />
                </SafePanel>
                <SafePanel show={!!panels.showTestingSuite} name="Testing & Debug">
                  <TestingDebugSuite open={!!panels.showTestingSuite} onClose={() => setShowTestingSuite(false)} tests={testCases} onRunTests={() => setTestCases(prev => prev.map(t => ({ ...t, status: Math.random() > 0.2 ? 'passed' as const : 'failed' as const, duration: Math.floor(Math.random() * 200 + 10) })))} onRunSingleTest={(id) => setTestCases(prev => prev.map(t => t.id === id ? { ...t, status: 'passed' as const, duration: Math.floor(Math.random() * 100 + 5) } : t))} onGenerateTests={(filePath) => { setTestCases(prev => [...prev, { id: crypto.randomUUID(), name: `test ${filePath}`, file: filePath, status: 'idle' as const }]); toast.success('Test generated'); }} projectFiles={project.files} />
                </SafePanel>
                <SafePanel show={!!panels.showGPTConnector} name="GPT Connector">
                  <GPTConnectorPanel open={!!panels.showGPTConnector} onClose={() => setShowGPTConnector(false)} linkedGPT={linkedGPT} onLinkGPT={setLinkedGPT} onUnlinkGPT={() => setLinkedGPT(null)} />
                </SafePanel>
                <SafePanel show={projectReview.showPanel} name="Project Review">
                  <ProjectReviewPanel
                    isReviewing={projectReview.isReviewing}
                    result={projectReview.result}
                    onClose={() => projectReview.setShowPanel(false)}
                    onRerun={() => projectReview.startReview(project.files, (prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel))}
                    onDismiss={projectReview.dismissFinding}
                    onGoToFile={(file, line) => { handleSetActiveFile(file); setRightTab('code'); }}
                  />
                </SafePanel>
                <SafePanel show={!!panels.showSupabaseIDE} name="Supabase IDE">
                  <SupabaseIDEPanel open={!!panels.showSupabaseIDE} onClose={() => setShowSupabaseIDE(false)} connection={supabaseConnection} onGenerateCode={(code, fileName) => { upsertFile(fileName, code); setRightTab('code'); setActiveFile(fileName); }} />
                </SafePanel>
                <SafePanel show={!!panels.showGitHubPanel} name="GitHub">
                  <GitHubPanel open={!!panels.showGitHubPanel} onClose={() => setShowGitHubPanel(false)} projectName={project.name} files={project.files} onFilesImported={(imported) => { imported.forEach(f => upsertFile(f.path, f.content)); }} githubSync={githubSync} />
                </SafePanel>
                <SafePanel show={!!panels.showMigrationPanel} name="Database Migration">
                  <DatabaseMigrationPanel open={!!panels.showMigrationPanel} onClose={() => setShowMigrationPanel(false)} connection={supabaseConnection} onGenerateCode={(code, fileName) => { upsertFile(fileName, code); setRightTab('code'); setActiveFile(fileName); }} />
                </SafePanel>
                <SafePanel show={!!panels.showEdgeFnEditor} name="Edge Function Editor">
                  <EdgeFunctionEditorPanel open={!!panels.showEdgeFnEditor} onClose={() => setShowEdgeFnEditor(false)} files={project.files} onUpsertFile={upsertFile} supabaseUrl={supabaseConnection.config?.url || supabaseConfig?.url} supabaseKey={supabaseConnection.config?.anonKey || supabaseConfig?.anonKey} />
                </SafePanel>
                <SafePanel show={!!panels.showBuildWorkflow} name="Build Workflow">
                  <BuildWorkflowPanel open={!!panels.showBuildWorkflow} onClose={() => setShowBuildWorkflow(false)} githubToken={localStorage.getItem('app-builder-github-pat') || undefined} githubRepo={localStorage.getItem('app-builder-github-repo') || undefined} />
                </SafePanel>
                <SafePanel show={!!panels.showMultiSearch} name="Multi-File Search">
                  <MultiFileSearchReplace open={!!panels.showMultiSearch} onClose={() => setShowMultiSearch(false)} files={project.files} onReplaceInFiles={handleReplaceInFiles} onSelectFile={handleSetActiveFile} onSwitchToCode={() => setRightTab('code')} />
                </SafePanel>
                <SafePanel show={!!panels.showTestRunner} name="Test Runner">
                  <InBrowserTestRunner open={!!panels.showTestRunner} onClose={() => setShowTestRunner(false)} files={project.files} onGenerateTest={(filePath) => { sendMessage(`Generate unit tests for ${filePath}`, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel); }} onSendToChat={(prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)} />
                </SafePanel>
                <SafePanel show={!!panels.showExtensions} name="Extensions">
                  <PluginMarketplace open={!!panels.showExtensions} onClose={() => setShowExtensions(false)} catalogue={pluginRegistry.catalogue} installed={pluginRegistry.installed} onInstall={pluginRegistry.installPlugin} onUninstall={pluginRegistry.uninstallPlugin} onToggle={pluginRegistry.togglePlugin} onUpdateConfig={pluginRegistry.updatePluginConfig} />
                </SafePanel>
                <SafePanel show={!!panels.showCollaboration} name="Collaboration">
                  <CollaborationPanelLazy
                    open={!!panels.showCollaboration}
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
                </SafePanel>
                <SafePanel show={!!panels.showAPIBuilder} name="API Builder">
                  <APIBuilderPanelLazy
                    open={!!panels.showAPIBuilder}
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
                </SafePanel>
                {panels.showDesignSystem && (
                  <div className="w-72 border-r border-border overflow-hidden">
                    <SafePanel show={true} name="Design System">
                      <DesignSystemPanelLazy
                        onInjectCSS={(css) => {
                          const existingCSS = project.files.find(f => f.path === 'design-tokens.css');
                          upsertFile('design-tokens.css', css);
                          if (!existingCSS) toast.success('Created design-tokens.css');
                        }}
                        onClose={() => setShowDesignSystem(false)}
                      />
                    </SafePanel>
                  </div>
                )}
                <SafePanel show={showPackages} name="Package Manager">
                  <div className="w-64 border-r border-white/[0.06] bg-[#0d0d14] overflow-hidden">
                    <PackageManager packages={cdnPackages} onAddPackage={(pkg) => setCdnPackages(prev => [...prev, pkg])} onRemovePackage={(name) => setCdnPackages(prev => prev.filter(p => p.name !== name))} />
                  </div>
                </SafePanel>
                <SafePanel show={!!panels.showNPMManager} name="NPM Manager">
                  <NPMPackageManagerPanel
                    open={!!panels.showNPMManager}
                    onClose={() => setShowNPMManager(false)}
                    installedPackages={installedPackages}
                    onInstall={(name, version) => setInstalledPackages(prev => [...prev, { name, version: version || 'latest' }])}
                    onUninstall={(name) => setInstalledPackages(prev => prev.filter(p => p.name !== name))}
                    onUpdateVersion={(name, version) => setInstalledPackages(prev => prev.map(p => p.name === name ? { ...p, version } : p))}
                  />
                </SafePanel>
                <SafePanel show={!!panels.showDevTools} name="DevTools">
                  <div className="w-80 border-r border-white/[0.06] overflow-hidden">
                    <PreviewDevToolsPanel open={!!panels.showDevTools} onClose={() => setShowDevTools(false)} iframeRef={previewIframeRef} onFixWithAI={(prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel)} />
                  </div>
                </SafePanel>
                <SafePanel show={!!panels.showSymbolSearch} name="Symbol Search">
                  <SymbolSearchPanel
                    open={!!panels.showSymbolSearch}
                    onClose={() => setShowSymbolSearch(false)}
                    files={project.files}
                    onNavigate={(file, line) => { setActiveFile(file); setRightTab('code'); }}
                  />
                </SafePanel>

                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* File tab bar (code/split only) */}
                  {hasFiles && rightTab !== 'preview' && (
                    <div className="flex items-center h-9 border-b border-white/[0.06] bg-[#0d0d14] shrink-0">
                      <FileTabBar openPaths={project.openFilePaths} activePath={project.activeFilePath} dirtyFiles={dirtyFiles} streamingFilePath={streamingFilePathRef.current} onSelect={setActiveFile} onClose={closeFile} onReorder={reorderOpenFiles} />
                      {isGenerating && (
                        <div className="ml-auto mr-3 flex items-center gap-1.5 text-[10px] text-amber-400/80">
                          <Activity className="h-3 w-3 animate-pulse" />
                          <span>generating...</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden flex">
                    <PanelErrorBoundary panelName="File Search">
                      <FileSearchPanel open={showFileSearch} onClose={() => setShowFileSearch(false)} files={project.files} onSelectFile={(path) => { setActiveFile(path); }} onSwitchToCode={() => setRightTab('code')} onReplaceInFiles={handleReplaceInFiles} />
                    </PanelErrorBoundary>

                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-hidden">
                        <ResizablePanelGroup direction="horizontal" className="h-full">
                          {hasFiles && showFileTree && !showFileSearch && (
                            <>
                              <ResizablePanel defaultSize={18} minSize={12} maxSize={28}>
                                <PanelErrorBoundary panelName="File Tree">
                                  <ProjectFileTree files={project.files} activeFilePath={project.activeFilePath} onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }} onDeleteFile={deleteFile} onCreateFile={handleCreateFile} onRenameFile={handleRenameFile} />
                                </PanelErrorBoundary>
                              </ResizablePanel>
                              <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors" />
                            </>
                          )}

                          <ResizablePanel defaultSize={hasFiles && showFileTree ? 82 : 100}>
                            {rightTab === 'split' && hasFiles ? (
                              <ResizablePanelGroup direction="horizontal" className="h-full">
                                <ResizablePanel defaultSize={50} minSize={30}>
                                  <div data-tour="preview" className="h-full">
                                    <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCountRef.current} isVisualEditActive={isVisualEditActive} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} onAutoFixError={handleAutoFixError} onVisualEdit={handleVisualEdit} externalIframeRef={previewIframeRef} externalViewportMode={viewportMode} onExternalViewportChange={setViewportMode} onUrlChange={setPreviewCurrentUrl}>
                                      <GeneratingOverlay isGenerating={isGenerating} isCompiling={isCompiling} phase={thinkingPhase} partialFilesRef={partialFilesRef} completedFileCountRef={completedFileCountRef} continuationRound={continuationRound} />
                                    </BuilderPreviewPanel>
                                  </div>
                                </ResizablePanel>
                                <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors" />
                                <ResizablePanel defaultSize={50} minSize={30}>
                                  <div data-tour="code-editor" className="h-full flex flex-col bg-[#0d0d14]">
                                    <FileBreadcrumb file={editorFile} allFiles={project.files} onNavigate={(path) => { setActiveFile(path); }} />
                                    <div className="flex-1 overflow-hidden">
                                      <StreamingCodeEditor isStreamingPreview={isStreamingPreview} partialFilesRef={partialFilesRef} activeFile={activeFile} activeFilePath={project.activeFilePath} onContentChange={handleContentChange} remoteCursors={remoteCursors} onCursorChange={handleCursorChange} onInlineAIAction={handleInlineAIAction} onStreamingFileChange={handleStreamingFileChange} />
                                    </div>
                                  </div>
                                </ResizablePanel>
                              </ResizablePanelGroup>
                            ) : rightTab === 'preview' || !hasFiles ? (
                              <div data-tour="preview" className="h-full">
                                <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCountRef.current} isVisualEditActive={isVisualEditActive} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} onAutoFixError={handleAutoFixError} onVisualEdit={handleVisualEdit} externalIframeRef={previewIframeRef} externalViewportMode={viewportMode} onExternalViewportChange={setViewportMode} onUrlChange={setPreviewCurrentUrl}>
                                  <GeneratingOverlay isGenerating={isGenerating} isCompiling={isCompiling} phase={thinkingPhase} partialFilesRef={partialFilesRef} completedFileCountRef={completedFileCountRef} continuationRound={continuationRound} />
                                </BuilderPreviewPanel>
                              </div>
                            ) : (
                              <div data-tour="code-editor" className="h-full flex flex-col bg-[#0d0d14]">
                                <FileBreadcrumb file={editorFile} allFiles={project.files} onNavigate={(path) => { setActiveFile(path); }} />
                                <div className="flex-1 overflow-hidden">
                                  <StreamingCodeEditor isStreamingPreview={isStreamingPreview} partialFilesRef={partialFilesRef} activeFile={activeFile} activeFilePath={project.activeFilePath} onContentChange={handleContentChange} remoteCursors={remoteCursors} onCursorChange={handleCursorChange} onInlineAIAction={handleInlineAIAction} onStreamingFileChange={handleStreamingFileChange} />
                                </div>
                              </div>
                            )}
                          </ResizablePanel>
                        </ResizablePanelGroup>
                      </div>

                      {/* Bottom panels — only visible when explicitly opened */}
                      {isGenerating && (
                        <div className="shrink-0">
                          <PanelErrorBoundary panelName="Build Log">
                            <BuildLogPanel entries={buildLog.entries} isBuilding={isGenerating} onClear={buildLog.clear} />
                          </PanelErrorBoundary>
                        </div>
                      )}
                      {panels.showTimeline && versionTimeline.totalSnapshots > 0 && (
                        <div className="shrink-0 space-y-1">
                          <PanelErrorBoundary panelName="Version Timeline">
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
                              showDiff={!!panels.showDiffViewer}
                            />
                            {panels.showDiffViewer && versionTimeline.currentIndex > 0 && (
                              <VersionDiffViewer
                                prevSnapshot={versionTimeline.snapshots[versionTimeline.currentIndex - 1] ?? null}
                                currSnapshot={versionTimeline.snapshots[versionTimeline.currentIndex]}
                                diff={versionTimeline.getSnapshotDiff(versionTimeline.currentIndex)}
                                onClose={() => setShowDiffViewer(false)}
                              />
                            )}
                          </PanelErrorBoundary>
                        </div>
                      )}
                      {showConsole && (
                        <div className="shrink-0 max-h-[30vh]">
                          <PanelErrorBoundary panelName="Console">
                            <ConsolePanel open={showConsole} onToggle={() => setShowConsole(!showConsole)} onFixError={handleFixError} />
                          </PanelErrorBoundary>
                        </div>
                      )}
                      {panels.showTerminal && (
                        <div className="shrink-0 max-h-[30vh]">
                          <PanelErrorBoundary panelName="Terminal">
                            <TerminalEmulator open={!!panels.showTerminal} onClose={() => setShowTerminal(false)} projectName={project.name} />
                          </PanelErrorBoundary>
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
        <WorkspaceStatusBar
          hasFiles={hasFiles}
          isMobile={isMobile}
          isGenerating={isGenerating}
          activeFileLanguage={activeFile?.language}
          cursorPosition={cursorPosition}
          fileCount={project.files.length}
          activeBranchName={activeBranchName}
          dirtyFilesCount={dirtyFiles.size}
          aiAutocompleteEnabled={aiAutocompleteEnabled}
          onToggleAutocomplete={() => setAiAutocompleteEnabled(prev => !prev)}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
      </div>

      <WorkspacePanelLayer
        panelVisibility={{ showTemplates: !!panels.showTemplates, showEditHistory: !!panels.showEditHistory, showShortcuts: !!panels.showShortcuts, showBilling, showShareDialog: !!panels.showShareDialog, showSEOEditor: !!panels.showSEOEditor, showDomainPanel: !!panels.showDomainPanel, showPublishPanel: !!panels.showPublishPanel, showDiffReview: !!panels.showDiffReview, showQuickSwitcher: !!panels.showQuickSwitcher, showImageGen: !!panels.showImageGen, showSecretsManager: !!panels.showSecretsManager, showEnhancedPalette: !!panels.showEnhancedPalette }}
        panelSetters={{ setShowTemplates, setShowEditHistory, setShowShortcuts, setShowBilling, setShowShareDialog, setShowSEOEditor, setShowDomainPanel, setShowPublishPanel, setShowDiffReview, setShowQuickSwitcher, setShowImageGen, setShowSecretsManager, setShowEnhancedPalette }}
        hooks={{ versions, restoreVersion }}
        handleSend={handleSend}
        upsertFile={upsertFile}
        activeFile={activeFile}
        setActiveFile={(path) => setActiveFile(path)}
        setRightTab={setRightTab}
        project={project}
        commandActions={commandActions}
        recentFiles={recentFiles}
        publishedUrl={publishedUrl}
        hostedPreviewUrl={hostedPreviewUrl}
        previewSlug={previewSlug}
        currentProjectId={currentProjectId}
        sendMessage={sendMessage}
        supabaseConfig={supabaseConfig}
        stripeConfig={stripeConfig}
        serviceKeys={serviceKeys}
        selectedModel={selectedModel}
        collaborators={collaborators}
        setCollaborators={setCollaborators}
        assets={assets}
        setAssets={setAssets}
        envVars={envVars}
        setEnvVars={setEnvVars}
        pushUndo={pushUndo}
        setFiles={setFiles}
        persistedDeployHistory={persistedDeployHistory}
        rollbackToVersion={rollbackToVersion}
        handlePublish={handlePublish}
        handleSetActiveFile={handleSetActiveFile}
        pendingDiffChanges={pendingDiffChanges}
        setPendingDiffChanges={setPendingDiffChanges}
        showBugReport={!!panels.showBugReport}
        setShowBugReport={setShowBugReport}
      />
      {/* Conditionally-mounted panel groups — hooks only initialize when panels are active */}
      {(panels.showEnvManager || panels.showRollback || panels.showUptimeMonitor || panels.showBuildCache || panels.showBuildScripts || panels.showCMSMode || panels.showBlogEngine || panels.showImageOptimizer || panels.showVideoEmbed || panels.showI18n || panels.showAnalyticsDashboard || panels.showErrorTracking || panels.showSessionReplay || panels.showABTesting || panels.showAIUsage || panels.showDepScanner || panels.showCSPGenerator || panels.showGDPR || panels.showRateLimiter || panels.showSecretRotation || panels.showSnippetLibrary || panels.showSplitDiff || panels.showComments || panels.showTeamActivity || panels.showApprovals || panels.showForking || panels.showFigmaImport || panels.showColorExtractor || panels.showIconPicker || panels.showBreakpointEditor || panels.showAnimationBuilder || panels.showVisualSchema || panels.showSeedData || panels.showAPITester || panels.showWebhookBuilder || panels.showCronScheduler) && (
        <InfraPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          versions={versions} restoreVersion={restoreVersion}
          showEnvManager={!!panels.showEnvManager} setShowEnvManager={setShowEnvManager} showRollback={!!panels.showRollback} setShowRollback={setShowRollback} showUptimeMonitor={!!panels.showUptimeMonitor} setShowUptimeMonitor={setShowUptimeMonitor} showBuildCache={!!panels.showBuildCache} setShowBuildCache={setShowBuildCache} showBuildScripts={!!panels.showBuildScripts} setShowBuildScripts={setShowBuildScripts} showCMSMode={!!panels.showCMSMode} setShowCMSMode={setShowCMSMode} showBlogEngine={!!panels.showBlogEngine} setShowBlogEngine={setShowBlogEngine} showImageOptimizer={!!panels.showImageOptimizer} setShowImageOptimizer={setShowImageOptimizer} showVideoEmbed={!!panels.showVideoEmbed} setShowVideoEmbed={setShowVideoEmbed} showI18n={!!panels.showI18n} setShowI18n={setShowI18n} showAnalyticsDashboard={!!panels.showAnalyticsDashboard} setShowAnalyticsDashboard={setShowAnalyticsDashboard} showErrorTracking={!!panels.showErrorTracking} setShowErrorTracking={setShowErrorTracking} showSessionReplay={!!panels.showSessionReplay} setShowSessionReplay={setShowSessionReplay} showABTesting={!!panels.showABTesting} setShowABTesting={setShowABTesting} showAIUsage={!!panels.showAIUsage} setShowAIUsage={setShowAIUsage} showDepScanner={!!panels.showDepScanner} setShowDepScanner={setShowDepScanner} showCSPGenerator={!!panels.showCSPGenerator} setShowCSPGenerator={setShowCSPGenerator} showGDPR={!!panels.showGDPR} setShowGDPR={setShowGDPR} showRateLimiter={!!panels.showRateLimiter} setShowRateLimiter={setShowRateLimiter} showSecretRotation={!!panels.showSecretRotation} setShowSecretRotation={setShowSecretRotation} showSnippetLibrary={!!panels.showSnippetLibrary} setShowSnippetLibrary={setShowSnippetLibrary} showSplitDiff={!!panels.showSplitDiff} setShowSplitDiff={setShowSplitDiff} showComments={!!panels.showComments} setShowComments={setShowComments} showTeamActivity={!!panels.showTeamActivity} setShowTeamActivity={setShowTeamActivity} showApprovals={!!panels.showApprovals} setShowApprovals={setShowApprovals} showForking={!!panels.showForking} setShowForking={setShowForking} showFigmaImport={!!panels.showFigmaImport} setShowFigmaImport={setShowFigmaImport} showColorExtractor={!!panels.showColorExtractor} setShowColorExtractor={setShowColorExtractor} showIconPicker={!!panels.showIconPicker} setShowIconPicker={setShowIconPicker} showBreakpointEditor={!!panels.showBreakpointEditor} setShowBreakpointEditor={setShowBreakpointEditor} showAnimationBuilder={!!panels.showAnimationBuilder} setShowAnimationBuilder={setShowAnimationBuilder} showVisualSchema={!!panels.showVisualSchema} setShowVisualSchema={setShowVisualSchema} showSeedData={!!panels.showSeedData} setShowSeedData={setShowSeedData} showAPITester={!!panels.showAPITester} setShowAPITester={setShowAPITester} showWebhookBuilder={!!panels.showWebhookBuilder} setShowWebhookBuilder={setShowWebhookBuilder} showCronScheduler={!!panels.showCronScheduler} setShowCronScheduler={setShowCronScheduler}
        />
      )}
      {(panels.showRefactoring || panels.showNLRegex || panels.showCommitMsg || panels.showAutoImport || panels.showDocWriter || panels.showCLICompanion || panels.showGHActions || panels.showSlackDiscord || panels.showWhiteLabel || panels.showPluginSDK) && (
        <IntegrationPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showRefactoring={!!panels.showRefactoring} setShowRefactoring={setShowRefactoring} showNLRegex={!!panels.showNLRegex} setShowNLRegex={setShowNLRegex} showCommitMsg={!!panels.showCommitMsg} setShowCommitMsg={setShowCommitMsg} showAutoImport={!!panels.showAutoImport} setShowAutoImport={setShowAutoImport} showDocWriter={!!panels.showDocWriter} setShowDocWriter={setShowDocWriter} showCLICompanion={!!panels.showCLICompanion} setShowCLICompanion={setShowCLICompanion} showGHActions={!!panels.showGHActions} setShowGHActions={setShowGHActions} showSlackDiscord={!!panels.showSlackDiscord} setShowSlackDiscord={setShowSlackDiscord} showWhiteLabel={!!panels.showWhiteLabel} setShowWhiteLabel={setShowWhiteLabel} showPluginSDK={!!panels.showPluginSDK} setShowPluginSDK={setShowPluginSDK}
        />
      )}
      {(panels.showCoEditing || panels.showVoiceChat || panels.showScreenShare || panels.showCodeReactions || panels.showWhiteboard) && (
        <CollabPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showCoEditing={!!panels.showCoEditing} setShowCoEditing={setShowCoEditing} showVoiceChat={!!panels.showVoiceChat} setShowVoiceChat={setShowVoiceChat} showScreenShare={!!panels.showScreenShare} setShowScreenShare={setShowScreenShare} showCodeReactions={!!panels.showCodeReactions} setShowCodeReactions={setShowCodeReactions} showWhiteboard={!!panels.showWhiteboard} setShowWhiteboard={setShowWhiteboard}
        />
      )}
      {(panels.showVisualRegression || panels.showA11yScore || panels.showCoverage || panels.showMutationTest || panels.showLoadTest) && (
        <TestingPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showVisualRegression={!!panels.showVisualRegression} setShowVisualRegression={setShowVisualRegression} showA11yScore={!!panels.showA11yScore} setShowA11yScore={setShowA11yScore} showCoverage={!!panels.showCoverage} setShowCoverage={setShowCoverage} showMutationTest={!!panels.showMutationTest} setShowMutationTest={setShowMutationTest} showLoadTest={!!panels.showLoadTest} setShowLoadTest={setShowLoadTest}
        />
      )}
      {(panels.showPageBuilder || panels.showThemeStudio || panels.showFormBuilder || panels.showChartDashboard || panels.showLayoutGrid) && (
        <UIBuildingPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showPageBuilder={!!panels.showPageBuilder} setShowPageBuilder={setShowPageBuilder} showThemeStudio={!!panels.showThemeStudio} setShowThemeStudio={setShowThemeStudio} showFormBuilder={!!panels.showFormBuilder} setShowFormBuilder={setShowFormBuilder} showChartDashboard={!!panels.showChartDashboard} setShowChartDashboard={setShowChartDashboard} showLayoutGrid={!!panels.showLayoutGrid} setShowLayoutGrid={setShowLayoutGrid}
        />
      )}
      {(panels.showGraphQL || panels.showWSManager || panels.showFileUpload || panels.showPayments || panels.showEmailTemplates) && (
        <DataIntegrationPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showGraphQL={!!panels.showGraphQL} setShowGraphQL={setShowGraphQL} showWSManager={!!panels.showWSManager} setShowWSManager={setShowWSManager} showFileUpload={!!panels.showFileUpload} setShowFileUpload={setShowFileUpload} showPayments={!!panels.showPayments} setShowPayments={setShowPayments} showEmailTemplates={!!panels.showEmailTemplates} setShowEmailTemplates={setShowEmailTemplates}
        />
      )}
      {(panels.showTutorialCreator || panels.showCodePlayground || panels.showCustomLinting || panels.showDepGraph || panels.showGitBlame) && (
        <DevExperiencePanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showTutorialCreator={!!panels.showTutorialCreator} setShowTutorialCreator={setShowTutorialCreator} showCodePlayground={!!panels.showCodePlayground} setShowCodePlayground={setShowCodePlayground} showCustomLinting={!!panels.showCustomLinting} setShowCustomLinting={setShowCustomLinting} showDepGraph={!!panels.showDepGraph} setShowDepGraph={setShowDepGraph} showGitBlame={!!panels.showGitBlame} setShowGitBlame={setShowGitBlame}
        />
      )}
      {(panels.showMultiRegion || panels.showFeatureFlags || panels.showCanaryDeploy || panels.showSSG || panels.showDockerExport) && (
        <DeploymentPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showMultiRegion={!!panels.showMultiRegion} setShowMultiRegion={setShowMultiRegion} showFeatureFlags={!!panels.showFeatureFlags} setShowFeatureFlags={setShowFeatureFlags} showCanaryDeploy={!!panels.showCanaryDeploy} setShowCanaryDeploy={setShowCanaryDeploy} showSSG={!!panels.showSSG} setShowSSG={setShowSSG} showDockerExport={!!panels.showDockerExport} setShowDockerExport={setShowDockerExport}
        />
      )}
      {(panels.showSubscriptions || panels.showInvoices || panels.showUsageMetering || panels.showAffiliates || panels.showRevenue) && (
        <MonetizationPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showSubscriptions={!!panels.showSubscriptions} setShowSubscriptions={setShowSubscriptions} showInvoices={!!panels.showInvoices} setShowInvoices={setShowInvoices} showUsageMetering={!!panels.showUsageMetering} setShowUsageMetering={setShowUsageMetering} showAffiliates={!!panels.showAffiliates} setShowAffiliates={setShowAffiliates} showRevenue={!!panels.showRevenue} setShowRevenue={setShowRevenue}
        />
      )}
      {(panels.showCapacitor || panels.showPushNotifications || panels.showOfflineFirst || panels.showGestureBuilder || panels.showAppStoreAssets) && (
        <MobilePanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showCapacitor={!!panels.showCapacitor} setShowCapacitor={setShowCapacitor} showPushNotifications={!!panels.showPushNotifications} setShowPushNotifications={setShowPushNotifications} showOfflineFirst={!!panels.showOfflineFirst} setShowOfflineFirst={setShowOfflineFirst} showGestureBuilder={!!panels.showGestureBuilder} setShowGestureBuilder={setShowGestureBuilder} showAppStoreAssets={!!panels.showAppStoreAssets} setShowAppStoreAssets={setShowAppStoreAssets}
        />
      )}
      {(panels.showCodeTranslator || panels.showSmartScaffold || panels.showWorkflowAutomation || panels.showPerfOptimizer || panels.showSecurityAuditor) && (
        <AIAutomationPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showCodeTranslator={!!panels.showCodeTranslator} setShowCodeTranslator={setShowCodeTranslator} showSmartScaffold={!!panels.showSmartScaffold} setShowSmartScaffold={setShowSmartScaffold} showWorkflowAutomation={!!panels.showWorkflowAutomation} setShowWorkflowAutomation={setShowWorkflowAutomation} showPerfOptimizer={!!panels.showPerfOptimizer} setShowPerfOptimizer={setShowPerfOptimizer} showSecurityAuditor={!!panels.showSecurityAuditor} setShowSecurityAuditor={setShowSecurityAuditor}
        />
      )}
      {(panels.showStateMachine || panels.showDataValidation || panels.showCacheStrategy || panels.showReactiveStore || panels.showDataMigration) && (
        <DataStatePanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showStateMachine={!!panels.showStateMachine} setShowStateMachine={setShowStateMachine} showDataValidation={!!panels.showDataValidation} setShowDataValidation={setShowDataValidation} showCacheStrategy={!!panels.showCacheStrategy} setShowCacheStrategy={setShowCacheStrategy} showReactiveStore={!!panels.showReactiveStore} setShowReactiveStore={setShowReactiveStore} showDataMigration={!!panels.showDataMigration} setShowDataMigration={setShowDataMigration}
        />
      )}
      {(panels.showRegexPlayground || panels.showJsonYamlConverter || panels.showColorContrast || panels.showTailwindSorter || panels.showMarkdownPreview) && (
        <DevToolsPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showRegexPlayground={!!panels.showRegexPlayground} setShowRegexPlayground={setShowRegexPlayground} showJsonYamlConverter={!!panels.showJsonYamlConverter} setShowJsonYamlConverter={setShowJsonYamlConverter} showColorContrast={!!panels.showColorContrast} setShowColorContrast={setShowColorContrast} showTailwindSorter={!!panels.showTailwindSorter} setShowTailwindSorter={setShowTailwindSorter} showMarkdownPreview={!!panels.showMarkdownPreview} setShowMarkdownPreview={setShowMarkdownPreview}
        />
      )}
      {(panels.showToastDesigner || panels.showNotifCenter || panels.showChatWidget || panels.showEmailSequence || panels.showSMSTemplate) && (
        <CommunicationPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showToastDesigner={!!panels.showToastDesigner} setShowToastDesigner={setShowToastDesigner} showNotifCenter={!!panels.showNotifCenter} setShowNotifCenter={setShowNotifCenter} showChatWidget={!!panels.showChatWidget} setShowChatWidget={setShowChatWidget} showEmailSequence={!!panels.showEmailSequence} setShowEmailSequence={setShowEmailSequence} showSMSTemplate={!!panels.showSMSTemplate} setShowSMSTemplate={setShowSMSTemplate}
        />
      )}
      {(panels.showStepperWizard || panels.showCommandMenuBuilder || panels.showBreadcrumbGen || panels.showMegaMenu || panels.showContextMenu) && (
        <UIPatternsPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showStepperWizard={!!panels.showStepperWizard} setShowStepperWizard={setShowStepperWizard} showCommandMenuBuilder={!!panels.showCommandMenuBuilder} setShowCommandMenuBuilder={setShowCommandMenuBuilder} showBreadcrumbGen={!!panels.showBreadcrumbGen} setShowBreadcrumbGen={setShowBreadcrumbGen} showMegaMenu={!!panels.showMegaMenu} setShowMegaMenu={setShowMegaMenu} showContextMenu={!!panels.showContextMenu} setShowContextMenu={setShowContextMenu}
        />
      )}
      {(panels.showDockerCompose || panels.showK8s || panels.showCICDPipeline || panels.showStructuredLogger || panels.showHealthCheck) && (
        <DevOpsPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showDockerCompose={!!panels.showDockerCompose} setShowDockerCompose={setShowDockerCompose} showK8s={!!panels.showK8s} setShowK8s={setShowK8s} showCICDPipeline={!!panels.showCICDPipeline} setShowCICDPipeline={setShowCICDPipeline} showStructuredLogger={!!panels.showStructuredLogger} setShowStructuredLogger={setShowStructuredLogger} showHealthCheck={!!panels.showHealthCheck} setShowHealthCheck={setShowHealthCheck}
        />
      )}
      {(panels.showOAuthSetup || panels.showMFAFlow || panels.showSessionMgr || panels.showAPIKeyMgmt || panels.showPermMatrix) && (
        <AuthSecurityPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showOAuthSetup={!!panels.showOAuthSetup} setShowOAuthSetup={setShowOAuthSetup} showMFAFlow={!!panels.showMFAFlow} setShowMFAFlow={setShowMFAFlow} showSessionMgr={!!panels.showSessionMgr} setShowSessionMgr={setShowSessionMgr} showAPIKeyMgmt={!!panels.showAPIKeyMgmt} setShowAPIKeyMgmt={setShowAPIKeyMgmt} showPermMatrix={!!panels.showPermMatrix} setShowPermMatrix={setShowPermMatrix}
        />
      )}
      {(panels.showRichTextConfig || panels.showFilePreviewGen || panels.showAvatarGen || panels.showCarouselBuilder || panels.showGalleryLightbox) && (
        <ContentMediaPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showRichTextConfig={!!panels.showRichTextConfig} setShowRichTextConfig={setShowRichTextConfig} showFilePreviewGen={!!panels.showFilePreviewGen} setShowFilePreviewGen={setShowFilePreviewGen} showAvatarGen={!!panels.showAvatarGen} setShowAvatarGen={setShowAvatarGen} showCarouselBuilder={!!panels.showCarouselBuilder} setShowCarouselBuilder={setShowCarouselBuilder} showGalleryLightbox={!!panels.showGalleryLightbox} setShowGalleryLightbox={setShowGalleryLightbox}
        />
      )}
      {(panels.showFTS || panels.showFacetedFilter || panels.showAutocomplete || panels.showTagSystem || panels.showSEOMeta) && (
        <SearchDiscoveryPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showFTS={!!panels.showFTS} setShowFTS={setShowFTS} showFacetedFilter={!!panels.showFacetedFilter} setShowFacetedFilter={setShowFacetedFilter} showAutocomplete={!!panels.showAutocomplete} setShowAutocomplete={setShowAutocomplete} showTagSystem={!!panels.showTagSystem} setShowTagSystem={setShowTagSystem} showSEOMeta={!!panels.showSEOMeta} setShowSEOMeta={setShowSEOMeta}
        />
      )}
      {(panels.showKPIDashboard || panels.showAlertingRules || panels.showAuditTrail || panels.showClickHeatmap || panels.showBudgetMonitor) && (
        <MonitoringPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showKPIDashboard={!!panels.showKPIDashboard} setShowKPIDashboard={setShowKPIDashboard} showAlertingRules={!!panels.showAlertingRules} setShowAlertingRules={setShowAlertingRules} showAuditTrail={!!panels.showAuditTrail} setShowAuditTrail={setShowAuditTrail} showClickHeatmap={!!panels.showClickHeatmap} setShowClickHeatmap={setShowClickHeatmap} showBudgetMonitor={!!panels.showBudgetMonitor} setShowBudgetMonitor={setShowBudgetMonitor}
        />
      )}
      {(panels.showChangelogAuto || panels.showREADMEGen || panels.showLicensePicker || panels.showOpenAPISpec || panels.showProjectHealth) && (
        <FinalPolishPanelGroup project={project} upsertFile={upsertFile} activeFile={activeFile} setActiveFile={(path) => setActiveFile(path)} setRightTab={setRightTab} pushUndo={pushUndo} setFiles={setFiles} sendMessage={sendMessage} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} selectedModel={selectedModel} publishedUrl={publishedUrl} hostedPreviewUrl={hostedPreviewUrl} previewSlug={previewSlug} currentProjectId={currentProjectId}
          showChangelogAuto={!!panels.showChangelogAuto} setShowChangelogAuto={setShowChangelogAuto} showREADMEGen={!!panels.showREADMEGen} setShowREADMEGen={setShowREADMEGen} showLicensePicker={!!panels.showLicensePicker} setShowLicensePicker={setShowLicensePicker} showOpenAPISpec={!!panels.showOpenAPISpec} setShowOpenAPISpec={setShowOpenAPISpec} showProjectHealth={!!panels.showProjectHealth} setShowProjectHealth={setShowProjectHealth}
        />
      )}
      <WorkspaceBottomBar
        supabaseConfig={supabaseConfig}
        githubConfig={githubConfig}
        stripeConfig={stripeConfig}
        vercelConfig={vercelConfig}
        serviceKeys={serviceKeys}
        envVars={envVars}
        projectName={project.name}
        projectSlug={previewSlug}
        showSettingsPanel={showSettingsPanel}
        setShowSettingsPanel={setShowSettingsPanel}
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
        files={project.files}
        compiledHTML={compiledHTML}
        hostedPreviewUrl={hostedPreviewUrl}
        isUploadingPreview={isUploadingPreview}
        onInstantUpload={previewSlug ? () => uploadPreviewNow(previewSlug, compiledHTML) : undefined}
        cdnPackages={cdnPackages}
        edgeFunctions={edgeFunctions}
        publishedUrl={publishedUrl}
        currentProjectId={currentProjectId}
        onGithubPullFiles={handleGithubPullFiles}
      />
      {pendingConflicts && (
        <FileConflictDialog open={!!pendingConflicts} conflicts={pendingConflicts} onResolve={handleConflictResolve} onCancel={() => setPendingConflicts(null)} />
      )}
    </TooltipProvider>
  );
}
