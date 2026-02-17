import { useEffect, useState, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import { useAIAppBuilder } from '@/hooks/useAIAppBuilder';
import { useProjectFileSystem, type ProjectFile } from '@/hooks/useProjectFileSystem';
import { useAgentMode } from '@/hooks/useAgentMode';
import { useAutoErrorRecovery } from '@/hooks/useAutoErrorRecovery';
import type { RemoteCursor } from './CodeEditor';
import { supabase } from '@/integrations/supabase/client';
import { useUndoRedo } from '@/hooks/useUndoRedo';
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
import { FileConflictDialog } from './FileConflictDialog';
import { QuickFileSwitcher } from './QuickFileSwitcher';
import { AssetManager, type ProjectAsset } from './AssetManager';
import { PackageManager, type CDNPackage } from './PackageManager';
import { useProjectBundler } from '@/hooks/useProjectBundler';
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

import {
  Eye, Code, Pencil, Database, CreditCard, Key, Bot, MessageSquare,
  PanelLeftClose, PanelLeftOpen, Activity, Undo2, Redo2, Search,
  History, Variable, Image, Package, Columns, Keyboard, Rocket,
  Shield, Brain, FolderOpen, Zap, Clock, Globe, Users, BookOpen, Gauge,
  Settings, ChevronDown, ArrowLeft, Sparkles, Layers, Bug, Terminal, GitBranch as GitBranchIcon,
  Table2, ChevronsLeft, ChevronsRight, BarChart3, Puzzle, Play, Replace, Palette, Server, ClipboardCheck,
  Github, Hammer, FileCode,
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
    messages, setMessages, isGenerating, latestFiles, previousFiles, mode, setMode, thinkingPhase, versions,
    totalTokensUsed, sendMessage, stopGenerating, clearChat, restoreVersion, forwardErrorToChat,
    partialFiles, isStreamingPreview, completedFileCount,
  } = useAIAppBuilder();

  const {
    project, setFiles, upsertFile, deleteFile,
    setActiveFile, closeFile, resetProject, renameProject,
    reorderOpenFiles, getCompiledHTML, activeFile,
  } = useProjectFileSystem();

  const { canUndo, canRedo, pushUndo, undo, redo } = useUndoRedo();
  const {
    branches, activeBranch, activeBranchName,
    createBranch, switchBranch, mergeBranch, deleteBranch, updateBranchFiles,
  } = useBranching();
  const {
    savedProjects, currentProjectId, isSaving, isLoading, lastSaved,
    loadProjects, saveProject, loadProject, deleteProject, publishProject,
    scheduleAutoSave,
  } = useProjectPersistence();
  const {
    currentRun: agentRun,
    taskQueue: agentTaskQueue,
    notifications: agentNotifications,
    startAgentRun, cancelRun: cancelAgent,
    enqueueTask, cancelTask: cancelAgentTask,
    retryTask: retryAgentTask, clearCompleted: clearAgentCompleted,
    reorderQueue: reorderAgentQueue,
    executeAgentTask, getNextQueuedTask, isAnyRunning: isAgentRunning,
  } = useAgentMode();
  const autoRecovery = useAutoErrorRecovery();
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
  const { previewUrl: hostedPreviewUrl, isUploading: isUploadingPreview, uploadPreview, clearPreviewTimer } = usePreviewHosting();

  const [rightTab, setRightTab] = useState<'preview' | 'code' | 'split'>('preview');
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
  const [showSupabaseIDE, setShowSupabaseIDE] = useState(false);
  const [showGitHubPanel, setShowGitHubPanel] = useState(false);
  const [showMigrationPanel, setShowMigrationPanel] = useState(false);
  const [showEdgeFnEditor, setShowEdgeFnEditor] = useState(false);
  const [showBuildWorkflow, setShowBuildWorkflow] = useState(false);
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
    }
  }, [latestFiles]);

  // Auto-process agent queue: when no task is running and there's a queued task, start it
  useEffect(() => {
    if (isAgentRunning) return;
    const next = getNextQueuedTask();
    if (!next) return;
    const extraArgs = [supabaseConfig, stripeConfig, serviceKeys, null, selectedModel, knowledge.customInstructions || undefined];
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

  // Hot-reload
  useEffect(() => {
    if (isStreamingPreview && partialFiles.length > 0) {
      for (const file of partialFiles) upsertFile(file.path, file.content);
    }
  }, [partialFiles, isStreamingPreview]);

  // Auto-save (cloud) — includes chat messages for persistence
  useEffect(() => {
    if (project.files.length > 0) scheduleAutoSave(project.name, project.files, messages);
  }, [project.files, project.name, messages, scheduleAutoSave]);

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
      }
    })();
  }, [initialProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore draft on mount (only if no project param and not explicitly new)
  const isNewProject = searchParams.get('new') === 'true';
  useEffect(() => {
    if (initialProjectId || isNewProject) return; // skip draft restore when loading a specific project or starting fresh
    if (project.files.length > 0 || messages.length > 0) return;
    const draft = loadDraft();
    if (draft && (draft.files.length > 0 || draft.messages.length > 0)) {
      setFiles(draft.files);
      renameProject(draft.name);
      if (draft.messages.length > 0) {
        setMessages(draft.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
      // Silent restore — no toast so it feels seamless when returning to the tab
    }
  }, []); // intentionally run once on mount

  // Clear draft when starting a new project
  useEffect(() => {
    if (isNewProject) {
      clearDraft();
    }
  }, [isNewProject]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-upload preview to Supabase Storage for live hosting
  const compiledForHosting = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser);
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
      if (e.key === 'Escape') {
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
  }, [project.files, canUndo, canRedo, showSettingsPanel, showFileSearch, showVersionHistory, showConsole, showEnvVars, showAssets, showPackages, showActivity, showBilling, showFileTree]);

  const handleSend = (input: string, imageDataUrls?: string[] | null) => {
    // Questions: intercept large prompts and ask clarifying questions first
    const pendingQ = builderQuestions.analyzeForQuestions(input);
    if (pendingQ) {
      // Show the user's message and a system message explaining the questions
      setMessages(prev => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content: input, timestamp: new Date() },
        { id: crypto.randomUUID(), role: 'assistant', content: '🤔 Before I start, I have a few questions to make sure I build exactly what you want:', timestamp: new Date() },
      ]);
      return;
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

    const knowledgeCtx = [
      knowledge.customInstructions || '',
      knowledge.contextFiles.length > 0 ? '\n\nContext files:\n' + knowledge.contextFiles.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n') : '',
      supabaseContext,
      selfReview.buildSelfReviewInstruction(),
      promptMemory.buildMemoryContext(),
    ].filter(Boolean).join('\n') || undefined;
    
    const fullInput = contextPrefix + contextHint + input;

    // Build log tracking
    buildStartTimeRef.current = Date.now();
    buildLog.logBuildStart(input);

    // Agent mode: enqueue task and let the auto-process useEffect handle execution
    if (mode === 'build') {
      enqueueTask(input);
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

  // Auto-fix pipeline: automatically attempt to fix preview errors (with hot recovery)
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
    if (isGenerating || fixAttemptCount >= MAX_FIX_ATTEMPTS) return;
    autoRecovery.attemptRecovery(error, project.files, (prompt) => {
      const enrichedPrompt = buildErrorDiagnosisContext(
        { message: error.message, source: error.source, line: error.line },
        project.files,
        undefined,
        getLastAIResponse(),
      ) + '\n\n' + prompt;
      sendMessage(enrichedPrompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel, undefined, true);
    });
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
    const prompt = `Generate authentication pages for my app with the following providers: ${providers.join(', ')}. Include login, signup, and password reset pages. Use the connected Supabase auth.`;
    sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel);
  }, [sendMessage, project.files, supabaseConfig, stripeConfig, serviceKeys, selectedModel]);

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

      if (property === 'text') {
        // Use the AI to apply text changes by sending as an edit request
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
    const extraSettings: Record<string, any> = {};
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
      if (loaded.settings?.linkedGPT) {
        setLinkedGPT(loaded.settings.linkedGPT);
      } else {
        setLinkedGPT(null);
      }
      toast.success(`Loaded "${loaded.name}"`);
    }
  }, [loadProject, setFiles, renameProject, setMessages]);

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

  const liveCompiledHTML = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT);
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
  ], [handleSave, handleUndo, handleRedo, handlePublish, openPanel]);

  // ─── Left sidebar icon bar items ───
  const sidebarIcons = [
    // ── Data & Auth ──
    { id: 'database', icon: Database, label: 'Database', tooltip: 'Browse and manage your database tables and records', show: !!supabaseConfig, active: showDatabase || showDbExplorer, group: 'data', color: 'text-emerald-400', activeBg: 'bg-emerald-500/10' },
    { id: 'supabaseIDE' as any, icon: Server, label: 'Supabase IDE', tooltip: 'Full Supabase IDE — schema browser, query runner, auth & storage', show: true, active: showSupabaseIDE, group: 'data', color: 'text-emerald-300', activeBg: 'bg-emerald-500/10' },
    { id: 'auth', icon: Shield, label: 'Auth', tooltip: 'Configure user authentication and login settings', show: !!supabaseConfig, active: showAuth, group: 'data', color: 'text-blue-400', activeBg: 'bg-blue-500/10' },
    { id: 'storage', icon: FolderOpen, label: 'Storage', tooltip: 'Upload and manage files like images and documents', show: !!supabaseConfig, active: showStorage, group: 'data', color: 'text-amber-400', activeBg: 'bg-amber-500/10' },
    { id: 'edgeFunctions', icon: Zap, label: 'Edge Functions', tooltip: 'Create serverless backend functions that run on the edge', show: true, active: showEdgeFunctions, group: 'data', color: 'text-yellow-400', activeBg: 'bg-yellow-500/10' },
    { id: 'migrationPanel' as any, icon: FileCode, label: 'Migrations', tooltip: 'Write and apply database migrations with a full SQL editor', show: true, active: showMigrationPanel, group: 'data', color: 'text-cyan-400', activeBg: 'bg-cyan-500/10' },
    { id: 'edgeFnEditor' as any, icon: Terminal, label: 'Edge Editor', tooltip: 'Write, edit and test edge functions with live deploy', show: true, active: showEdgeFnEditor, group: 'data', color: 'text-yellow-300', activeBg: 'bg-yellow-500/10' },
    // ── DevOps ──
    { id: 'githubPanel' as any, icon: Github, label: 'GitHub', tooltip: 'Full GitHub integration — push, pull, branches, PRs', show: true, active: showGitHubPanel, group: 'devops', color: 'text-white/70', activeBg: 'bg-white/10' },
    { id: 'buildWorkflow' as any, icon: Hammer, label: 'Build Workflows', tooltip: 'Trigger GitHub Actions, download EXE/MSI artifacts', show: true, active: showBuildWorkflow, group: 'devops', color: 'text-orange-400', activeBg: 'bg-orange-500/10' },
    // ── AI & Intelligence ──
    { id: 'knowledge', icon: Brain, label: 'Knowledge', tooltip: 'Add custom instructions and context files to guide the AI', show: true, active: showKnowledge, group: 'ai', color: 'text-violet-400', activeBg: 'bg-violet-500/10' },
    { id: 'codeIntel', icon: Sparkles, label: 'Code Intelligence', tooltip: 'AI-powered code suggestions and refactoring tips', show: true, active: showCodeIntel, group: 'ai', color: 'text-fuchsia-400', activeBg: 'bg-fuchsia-500/10' },
    { id: 'componentLib', icon: Layers, label: 'Components', tooltip: 'Browse and insert pre-built UI components', show: true, active: showComponentLib, group: 'ai', color: 'text-indigo-400', activeBg: 'bg-indigo-500/10' },
    { id: 'gptConnector', icon: Bot, label: 'GPT Chat Widget', tooltip: 'Embed your custom GPT as a chat widget in your app', show: true, active: showGPTConnector, group: 'ai', color: 'text-teal-400', activeBg: 'bg-teal-500/10' },
    { id: 'designSystem' as any, icon: Palette, label: 'Design System', tooltip: 'Generate brand-aware design tokens, themes, and color palettes', show: true, active: showDesignSystem, group: 'ai', color: 'text-rose-400', activeBg: 'bg-rose-500/10' },
    // ── Project ──
    { id: 'testingSuite', icon: Bug, label: 'Testing & Debug', tooltip: 'Run tests and debug your application', show: true, active: showTestingSuite, group: 'project', color: 'text-red-400', activeBg: 'bg-red-500/10' },
    { id: 'review' as any, icon: ClipboardCheck, label: 'Review Project', tooltip: 'AI-powered review of your entire project for errors and best practices', show: true, active: projectReview.showPanel, group: 'project', color: 'text-lime-400', activeBg: 'bg-lime-500/10' },
    { id: 'envVars', icon: Variable, label: 'Env Variables', tooltip: 'Manage secret keys and environment variables', show: true, active: showEnvVars, group: 'project', color: 'text-orange-400', activeBg: 'bg-orange-500/10' },
    { id: 'assets', icon: Image, label: 'Assets', tooltip: 'Upload and manage images, icons, and media files', show: true, active: showAssets, group: 'project', color: 'text-pink-400', activeBg: 'bg-pink-500/10' },
    { id: 'packages', icon: Package, label: 'Packages', tooltip: 'Add third-party libraries and CDN packages', show: true, active: showPackages, group: 'project', color: 'text-sky-400', activeBg: 'bg-sky-500/10' },
    { id: 'history', icon: History, label: 'Version History', tooltip: 'View and restore previous versions of your project', show: true, active: showVersionHistory, group: 'project', color: 'text-slate-400', activeBg: 'bg-slate-500/10' },
    { id: 'activity', icon: Clock, label: 'Activity', tooltip: 'See a log of all recent changes and actions', show: true, active: showActivity, group: 'project', color: 'text-zinc-400', activeBg: 'bg-zinc-500/10' },
    { id: 'exportGuide', icon: Rocket, label: 'Export & Deploy', tooltip: 'Step-by-step guide to export or deploy your app', show: true, active: showExportGuide, group: 'project', color: 'text-cyan-400', activeBg: 'bg-cyan-500/10' },
    { id: 'oneClickDeploy' as any, icon: Globe, label: 'One-Click Deploy', tooltip: 'Deploy to Vercel or Netlify with one click', show: true, active: showOneClickDeploy, group: 'project', color: 'text-emerald-400', activeBg: 'bg-emerald-500/10' },
    { id: 'helpCenter' as any, icon: BookOpen, label: 'Help Center', tooltip: 'Documentation, tutorials, and getting started guides', show: true, active: showHelpCenter, group: 'project', color: 'text-blue-300', activeBg: 'bg-blue-500/10' },
    { id: 'setupWizard' as any, icon: Sparkles, label: 'Setup Guide', tooltip: 'Guided setup for Supabase, Stripe, and integrations', show: true, active: showSetupWizard, group: 'project', color: 'text-violet-300', activeBg: 'bg-violet-500/10' },
  ] as const;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full w-full flex flex-col bg-[#09090b] overflow-hidden relative">
      <WelcomeOverlay onQuickStart={(prompt) => handleSend(prompt)} />
      <OnboardingTour />
      <ShortcutsHint />
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
        <div className="flex items-center justify-between px-2 h-12 border-b border-white/[0.06] bg-[#09090b] shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          {/* LEFT: Back + Project name */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/ai-studio')} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Back to AI Studio</TooltipContent>
            </Tooltip>

            <div className="h-4 w-px bg-white/[0.06]" />

            <div className="flex items-center gap-1.5 min-w-0">
              <div className={cn(
                "h-2 w-2 rounded-full shrink-0 transition-colors",
                isGenerating ? "bg-amber-400 animate-pulse" : hasFiles ? "bg-emerald-400" : "bg-white/20"
              )} />
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
                <button
                  onClick={() => { setEditName(project.name); setIsEditingName(true); }}
                  className="flex items-center gap-1 text-sm font-medium text-white/80 hover:text-white transition-colors truncate max-w-[200px]"
                >
                  {project.name}
                  <ChevronDown className="h-3 w-3 text-white/30 shrink-0" />
                </button>
              )}
            </div>

            <BranchManager
              branches={branches}
              activeBranch={activeBranch}
              activeBranchName={activeBranchName}
              onCreateBranch={handleCreateBranch}
              onSwitchBranch={handleSwitchBranch}
              onMergeBranch={handleMergeBranch}
              onDeleteBranch={deleteBranch}
            />

            {hasFiles && (
              <div className="hidden md:flex items-center gap-0.5 ml-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleUndo} disabled={!canUndo} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", canUndo ? "text-white/30 hover:text-white/60 hover:bg-white/5" : "text-white/10")}>
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Undo (⌘Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleRedo} disabled={!canRedo} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", canRedo ? "text-white/30 hover:text-white/60 hover:bg-white/5" : "text-white/10")}>
                      <Redo2 className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Redo (⌘⇧Z)</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* CENTER: View tabs + device picker */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.07] shadow-inner shadow-black/20">
              <button
                onClick={() => setRightTab('preview')}
                className={cn("flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md transition-all font-medium", rightTab === 'preview' ? "bg-gradient-to-r from-white/[0.12] to-white/[0.08] text-white shadow-sm shadow-black/20" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]")}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
              <button
                onClick={() => setRightTab('code')}
                className={cn("flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md transition-all font-medium", rightTab === 'code' ? "bg-gradient-to-r from-white/[0.12] to-white/[0.08] text-white shadow-sm shadow-black/20" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]")}
              >
                <Code className="h-3.5 w-3.5" />
                Code
              </button>
              <button
                onClick={() => setRightTab('split')}
                className={cn("flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md transition-all font-medium", rightTab === 'split' ? "bg-gradient-to-r from-white/[0.12] to-white/[0.08] text-white shadow-sm shadow-black/20" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]")}
              >
                <Columns className="h-3.5 w-3.5" />
                Split
              </button>
            </div>
            <ResponsivePreviewBar active={viewportMode} onChange={setViewportMode} />
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-1">
            <CollaboratorAvatars collaborators={collaborators} onClick={() => setShowShareDialog(true)} />
            <CollaborativePresence projectId={currentProjectId} />
            <CreditsPill onClick={() => setShowBilling(true)} />

            <BuildNotificationCenter
              notifications={buildNotifications}
              onMarkRead={(id) => setBuildNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
              onClear={() => setBuildNotifications([])}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowShareDialog(true)} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  <Users className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Share</TooltipContent>
            </Tooltip>

            <div className="h-5 w-px bg-white/[0.06] mx-0.5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowDeployPipeline(!showDeployPipeline)} className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-colors", showDeployPipeline ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}>
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Deploy Settings</TooltipContent>
            </Tooltip>

            <DeployDialog
              onPublish={handlePublish}
              publishedUrl={publishedUrl}
              hasFiles={hasFiles}
              previewSlug={previewSlug || undefined}
              projectName={project.name}
              files={project.files}
              supabaseConfig={supabaseConfig}
              stripeConfig={stripeConfig}
              serviceKeys={serviceKeys}
              envVars={envVars}
              cdnPackages={cdnPackages}
              edgeFunctions={edgeFunctions}
            />

            <ProjectManager
              savedProjects={savedProjects}
              currentProjectId={currentProjectId}
              isSaving={isSaving}
              isLoading={isLoading}
              lastSaved={lastSaved}
              isPublished={!!publishedUrl}
              publishedUrl={publishedUrl}
              onSave={handleSave}
              onLoad={handleLoadProject}
              onDelete={deleteProject}
              onPublish={handlePublish}
              onLoadProjects={loadProjects}
              onRemix={handleRemix}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowSettingsPanel(true)} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  <Settings className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Settings</TooltipContent>
            </Tooltip>
          </div>
        </div>

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
              <BuilderChatPanel messages={messages} isGenerating={isGenerating} fileCount={project.files.length} mode={mode} thinkingPhase={thinkingPhase} versions={versions} totalTokensUsed={totalTokensUsed} previousFiles={previousFiles} latestFiles={latestFiles} onModeChange={setMode} onSend={handleSend} onStop={stopGenerating} onClear={handleClear} onRestoreVersion={restoreVersion} onOpenTemplates={() => setShowTemplates(true)} onFixError={handleFixError} onForkFromMessage={handleForkFromMessage} onRevertToMessage={handleRevertToMessage} selectedModel={selectedModel} onModelChange={setSelectedModel} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} isVisualEditActive={isVisualEditActive} onOpenEditHistory={() => setShowEditHistory(true)} onSelectStarterTemplate={handleSelectStarterTemplate} />
            ) : mobileTab === 'preview' ? (
                <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount} isVisualEditActive={isVisualEditActive} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} onAutoFixError={handleAutoFixError} onVisualEdit={handleVisualEdit} externalIframeRef={previewIframeRef} externalViewportMode={viewportMode} onExternalViewportChange={setViewportMode}>
                  <GeneratingOverlay isGenerating={isGenerating} phase={thinkingPhase} partialFiles={partialFiles} completedFileCount={completedFileCount} />
                </BuilderPreviewPanel>
            ) : (
              <div className="h-full flex flex-col bg-[#09090b]">
                {activeFile && (
                  <>
                    <FileTabBar openPaths={project.openFilePaths} activePath={project.activeFilePath} dirtyFiles={dirtyFiles} onSelect={(path) => setActiveFile(path)} onClose={(path) => closeFile(path)} onReorder={reorderOpenFiles} />
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
                <AgentModePanel run={agentRun} taskQueue={agentTaskQueue} onCancel={cancelAgent} onCancelTask={cancelAgentTask} onRetryTask={retryAgentTask} onClearCompleted={clearAgentCompleted} onReorderQueue={reorderAgentQueue} />
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
                {builderQuestions.pending && (
                  <QuestionsCard
                    questions={builderQuestions.pending.questions}
                    onSubmit={(answers) => {
                      const enriched = builderQuestions.buildEnrichedPrompt(builderQuestions.pending!.context, answers);
                      // Now run through phase planner with the enriched prompt
                      const plan = phasePlanner.analyzePrompt(enriched);
                      if (plan) {
                        const phaseList = plan.phases.map((p, i) => `${i + 1}. **${p.title}** — ${p.description}`).join('\n');
                        setMessages(prev => [...prev, {
                          id: crypto.randomUUID(), role: 'assistant' as const,
                          content: `✅ Got it! I've broken this into ${plan.phases.length} phases:\n\n${phaseList}\n\nClick **"Start Phase 1"** below to begin.`,
                          timestamp: new Date(),
                        }]);
                      } else {
                        handleSend(enriched);
                      }
                    }}
                    onSkip={() => {
                      const ctx = builderQuestions.pending?.context || '';
                      builderQuestions.dismiss();
                      // Skip questions, go straight to phase planner
                      const plan = phasePlanner.analyzePrompt(ctx);
                      if (plan) {
                        const phaseList = plan.phases.map((p, i) => `${i + 1}. **${p.title}** — ${p.description}`).join('\n');
                        setMessages(prev => [...prev, {
                          id: crypto.randomUUID(), role: 'assistant' as const,
                          content: `🚧 **This is a large project!** I've broken it into ${plan.phases.length} phases:\n\n${phaseList}\n\nClick **"Start Phase 1"** below to begin.`,
                          timestamp: new Date(),
                        }]);
                      } else {
                        handleSend(ctx);
                      }
                    }}
                  />
                )}
                <div className="flex-1 overflow-hidden">
                  <BuilderChatPanel messages={messages} isGenerating={isGenerating} fileCount={project.files.length} mode={mode} thinkingPhase={thinkingPhase} versions={versions} totalTokensUsed={totalTokensUsed} previousFiles={previousFiles} latestFiles={latestFiles} onModeChange={setMode} onSend={handleSend} onStop={stopGenerating} onClear={handleClear} onRestoreVersion={restoreVersion} onOpenTemplates={() => setShowTemplates(true)} onFixError={handleFixError} onForkFromMessage={handleForkFromMessage} onRevertToMessage={handleRevertToMessage} selectedModel={selectedModel} onModelChange={setSelectedModel} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} isVisualEditActive={isVisualEditActive} onOpenEditHistory={() => setShowEditHistory(true)} onSelectStarterTemplate={handleSelectStarterTemplate} />
                </div>
              </div>
            </ResizablePanel>
            )}

            <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors data-[resize-handle-active]:bg-cyan-500/50" />

            {/* Right Panel */}
            <ResizablePanel defaultSize={72} minSize={50}>
              <div className="h-full flex">
                {/* Expandable labeled sidebar */}
                <div className={cn(
                  "border-r border-white/[0.06] bg-gradient-to-b from-[#09090b] via-[#0a0a12] to-[#09090b] hidden md:flex flex-col shrink-0 transition-all duration-200 overflow-y-auto overflow-x-hidden",
                  sidebarExpanded ? "w-44" : "w-10"
                )}>
                  {/* Collapse/Expand toggle */}
                  <div className={cn("flex items-center shrink-0 h-8 border-b border-white/[0.04]", sidebarExpanded ? "justify-end px-2" : "justify-center")}>
                    <button
                      onClick={() => setSidebarExpanded(!sidebarExpanded)}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors"
                      title={sidebarExpanded ? 'Collapse' : 'Expand'}
                    >
                      {sidebarExpanded ? <ChevronsLeft className="h-3.5 w-3.5" /> : <ChevronsRight className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className={cn("flex flex-col gap-0.5 py-1.5", sidebarExpanded ? "px-1.5" : "items-center px-0")}>
                    {/* Explorer section */}
                    {sidebarExpanded && <span className="text-[9px] font-semibold uppercase tracking-wider text-white/20 px-2 pt-1 pb-0.5">Explorer</span>}
                    {[
                      { icon: FolderOpen, label: 'Files', tooltip: 'Browse and manage your project files', active: showFileTree, onClick: () => setShowFileTree(!showFileTree), color: 'text-amber-400' },
                      { icon: Search, label: 'Search', tooltip: 'Search across all files in your project', active: showFileSearch, onClick: () => setShowFileSearch(!showFileSearch), color: 'text-sky-400' },
                    ].map(item => (
                      <Tooltip key={item.label} delayDuration={sidebarExpanded ? 999999 : 300}>
                        <TooltipTrigger asChild>
                          <button onClick={item.onClick} className={cn(
                            "rounded-md flex items-center gap-2 transition-all text-left",
                            sidebarExpanded ? "h-7 px-2 w-full" : "h-7 w-7 justify-center",
                            item.active ? `${item.color} bg-white/[0.06]` : `${item.color}/40 hover:${item.color}/70 hover:bg-white/[0.03]`
                          )}>
                            <item.icon className="h-3.5 w-3.5 shrink-0" />
                            {sidebarExpanded && <span className="text-[11px] truncate">{item.label}</span>}
                          </button>
                        </TooltipTrigger>
                        {!sidebarExpanded && <TooltipContent side="right" className="text-xs max-w-[200px]">{item.tooltip}</TooltipContent>}
                      </Tooltip>
                    ))}

                    <div className={cn("bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-1", sidebarExpanded ? "h-px mx-1" : "h-px w-5 mx-auto")} />

                    {/* Main sidebar icons grouped */}
                    {(() => {
                      const groups = [
                        { key: 'data', label: 'Data & Auth', color: 'text-emerald-400/70' },
                        { key: 'devops', label: 'DevOps', color: 'text-orange-400/70' },
                        { key: 'ai', label: 'AI & Tools', color: 'text-fuchsia-400/70' },
                        { key: 'project', label: 'Project', color: 'text-sky-400/70' },
                      ];
                      const visibleItems = sidebarIcons.filter(i => i.show);
                      return groups.map(group => {
                        const groupItems = visibleItems.filter(i => i.group === group.key);
                        if (groupItems.length === 0) return null;
                        return (
                          <div key={group.key}>
                            {sidebarExpanded && <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 pt-3 pb-1 block", group.color)}>{group.label}</span>}
                            {!sidebarExpanded && <div className="h-px w-5 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-1 mx-auto" />}
                            {groupItems.map(item => (
                              <Tooltip key={item.id} delayDuration={sidebarExpanded ? 999999 : 300}>
                                <TooltipTrigger asChild>
                                  <motion.button
                                    whileHover={{ scale: sidebarExpanded ? 1 : 1.12 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                     onClick={() => {
                                       if (item.id === 'review') {
                                         if (projectReview.showPanel) {
                                           projectReview.setShowPanel(false);
                                         } else {
                                           projectReview.startReview(project.files, (prompt) => sendMessage(prompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel));
                                         }
                                       } else if (item.id === 'supabaseIDE') {
                                         setShowSupabaseIDE(!showSupabaseIDE);
                                       } else if (item.id === 'githubPanel') {
                                         setShowGitHubPanel(!showGitHubPanel);
                                       } else if (item.id === 'migrationPanel') {
                                         setShowMigrationPanel(!showMigrationPanel);
                                       } else if (item.id === 'edgeFnEditor') {
                                         setShowEdgeFnEditor(!showEdgeFnEditor);
                                       } else if (item.id === 'buildWorkflow') {
                                         setShowBuildWorkflow(!showBuildWorkflow);
                                       } else {
                                         openPanel(item.id as any);
                                       }
                                     }}
                                    className={cn(
                                      "rounded-md flex items-center gap-2 transition-all text-left",
                                      sidebarExpanded ? "h-7 px-2 w-full" : "h-7 w-7 justify-center",
                                      item.color,
                                      item.active
                                        ? `${item.activeBg} border border-white/[0.08]`
                                        : "hover:bg-white/[0.03]"
                                    )}
                                  >
                                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                                    {sidebarExpanded && <span className="text-[11px] truncate">{item.label}</span>}
                                  </motion.button>
                                </TooltipTrigger>
                                {!sidebarExpanded && <TooltipContent side="right" className="text-xs max-w-[220px]">
                                  <p className="font-medium">{item.label}</p>
                                  <p className="text-white/60 mt-0.5">{item.tooltip}</p>
                                </TooltipContent>}
                              </Tooltip>
                            ))}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Bottom tools */}
                  <div className={cn("mt-auto flex flex-col gap-0.5 py-1.5 border-t border-white/[0.04]", sidebarExpanded ? "px-1.5" : "items-center px-0")}>
                    {sidebarExpanded && <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70 px-2 pt-1 pb-1 block">Tools</span>}
                    {[
                      { icon: Gauge, label: 'Performance', tooltip: 'Analyze bundle size and code complexity', active: showPerformanceProfiler, onClick: () => setShowPerformanceProfiler(!showPerformanceProfiler), color: 'text-emerald-400', activeColor: 'text-emerald-400 bg-emerald-500/10' },
                      { icon: BarChart3, label: 'Analytics', tooltip: 'Build analytics and credit usage', active: showBuildAnalytics, onClick: () => setShowBuildAnalytics(!showBuildAnalytics), color: 'text-amber-400', activeColor: 'text-amber-400 bg-amber-500/10' },
                      { icon: History, label: 'Changelog', tooltip: 'See a timeline of changes made this session', active: showChangelog, onClick: () => setShowChangelog(!showChangelog), color: 'text-blue-400' },
                      { icon: GitBranchIcon, label: 'Timeline', tooltip: 'Visual timeline of all project versions', active: showTimeline, onClick: () => setShowTimeline(!showTimeline), color: 'text-violet-400' },
                      { icon: Terminal, label: 'Terminal', tooltip: 'Open a command-line terminal', active: showTerminal, onClick: () => setShowTerminal(!showTerminal), color: 'text-green-400' },
                      { icon: Globe, label: 'Domains', tooltip: 'Connect a custom domain to your app', active: false, onClick: () => setShowDomainPanel(true), color: 'text-cyan-400' },
                      { icon: Activity, label: 'Console', tooltip: 'View runtime logs and error output', active: showConsole, onClick: () => setShowConsole(!showConsole), color: 'text-amber-400' },
                      { icon: Keyboard, label: 'Shortcuts', tooltip: 'View all keyboard shortcuts', active: false, onClick: () => setShowShortcuts(true), color: 'text-slate-400' },
                      { icon: Bug, label: 'Report Bug', tooltip: 'Report an issue with the builder', active: false, onClick: () => setShowBugReport(true), color: 'text-red-400', hoverColor: 'hover:text-red-400/70 hover:bg-red-500/10' },
                      { icon: Puzzle, label: 'Extensions', tooltip: 'Browse and install extensions', active: showExtensions, onClick: () => setShowExtensions(!showExtensions), color: 'text-violet-400', activeColor: 'text-violet-400 bg-violet-500/10' },
                      { icon: Play, label: 'Test Runner', tooltip: 'Auto-detect and run tests', active: showTestRunner, onClick: () => setShowTestRunner(!showTestRunner), color: 'text-green-400', activeColor: 'text-green-400 bg-green-500/10' },
                      { icon: Replace, label: 'Search & Replace', tooltip: 'Multi-file search and replace', active: showMultiSearch, onClick: () => setShowMultiSearch(!showMultiSearch), color: 'text-sky-400', activeColor: 'text-sky-400 bg-sky-500/10' },
                      { icon: Users, label: 'Collaborate', tooltip: 'Real-time collaboration with teammates', active: showCollaboration, onClick: () => setShowCollaboration(!showCollaboration), color: 'text-cyan-400', activeColor: 'text-cyan-400 bg-cyan-500/10' },
                      { icon: Server, label: 'API Builder', tooltip: 'Design API endpoints with mock server', active: showAPIBuilder, onClick: () => setShowAPIBuilder(!showAPIBuilder), color: 'text-orange-400', activeColor: 'text-orange-400 bg-orange-500/10' },
                    ].map(item => (
                      <Tooltip key={item.label} delayDuration={sidebarExpanded ? 999999 : 300}>
                        <TooltipTrigger asChild>
                          <button onClick={item.onClick} className={cn(
                            "rounded-md flex items-center gap-2 transition-all text-left",
                            sidebarExpanded ? "h-7 px-2 w-full" : "h-7 w-7 justify-center",
                            item.color,
                            item.active ? `${item.activeColor || 'bg-white/[0.06]'} border border-white/[0.08]` : 'hover:bg-white/[0.03]',
                            item.hoverColor || ''
                          )}>
                            <item.icon className="h-3.5 w-3.5 shrink-0" />
                            {sidebarExpanded && <span className="text-[11px] truncate">{item.label}</span>}
                          </button>
                        </TooltipTrigger>
                        {!sidebarExpanded && <TooltipContent side="right" className="text-xs max-w-[200px]">{item.tooltip}</TooltipContent>}
                      </Tooltip>
                    ))}
                  </div>
                </div>

                {/* Side panels */}
                <VersionHistoryPanel versions={versions} currentFiles={project.files} onRestore={restoreVersion} onClose={() => setShowVersionHistory(false)} open={showVersionHistory} activeBranchName={activeBranchName} />
                <EnvVarsPanel envVars={envVariables} onChange={setEnvVariables} open={showEnvVars} onClose={() => setShowEnvVars(false)} />
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
                <AICodeIntelligence open={showCodeIntel} onClose={() => setShowCodeIntel(false)} suggestions={codeSuggestions} onApplySuggestion={(s) => { if (s.code && activeFile) { upsertFile(activeFile.path, activeFile.content + '\n' + s.code); toast.success('Applied suggestion'); } }} onDismiss={(id) => setCodeSuggestions(prev => prev.filter(s => s.id !== id))} onRefresh={() => toast.success('Refreshed suggestions')} activeFilePath={project.activeFilePath} />
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
                <GitHubPanel open={showGitHubPanel} onClose={() => setShowGitHubPanel(false)} projectName={project.name} files={project.files} onFilesImported={(imported) => { imported.forEach(f => upsertFile(f.path, f.content)); }} />
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

                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* File tab bar (code/split only) */}
                  {hasFiles && rightTab !== 'preview' && (
                    <div className="flex items-center h-9 border-b border-white/[0.06] bg-[#0d0d14] shrink-0">
                      <FileTabBar openPaths={project.openFilePaths} activePath={project.activeFilePath} dirtyFiles={dirtyFiles} onSelect={setActiveFile} onClose={closeFile} onReorder={reorderOpenFiles} />
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
                                    <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount} isVisualEditActive={isVisualEditActive} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} onAutoFixError={handleAutoFixError} onVisualEdit={handleVisualEdit} externalIframeRef={previewIframeRef} externalViewportMode={viewportMode} onExternalViewportChange={setViewportMode}>
                                      <GeneratingOverlay isGenerating={isGenerating} phase={thinkingPhase} partialFiles={partialFiles} completedFileCount={completedFileCount} />
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
                                <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount} isVisualEditActive={isVisualEditActive} onToggleVisualEdit={() => setIsVisualEditActive(prev => !prev)} onAutoFixError={handleAutoFixError} onVisualEdit={handleVisualEdit} externalIframeRef={previewIframeRef} externalViewportMode={viewportMode} onExternalViewportChange={setViewportMode}>
                                  <GeneratingOverlay isGenerating={isGenerating} phase={thinkingPhase} partialFiles={partialFiles} completedFileCount={completedFileCount} />
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
      <EditHistoryTimeline isOpen={showEditHistory} onClose={() => setShowEditHistory(false)} versions={versions} onRestore={(id) => { restoreVersion(id); setShowEditHistory(false); }} />
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} files={project.files} onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }} onSwitchTab={setRightTab} onSwitchMode={setMode} onUndo={handleUndo} onRedo={handleRedo} onSave={handleSave} onClear={handleClear} onOpenTemplates={() => setShowTemplates(true)} onPublish={handlePublish} canUndo={canUndo} canRedo={canRedo} />
      <KeyboardShortcutsPanel open={showShortcuts} onOpenChange={setShowShortcuts} />
      <BillingPanel isOpen={showBilling} onClose={() => setShowBilling(false)} />
      <ProjectShareDialog isOpen={showShareDialog} onClose={() => setShowShareDialog(false)} projectName={project.name} collaborators={collaborators} onInvite={(email, role) => setCollaborators(prev => [...prev, { id: crypto.randomUUID(), email, role, avatarColor: ['#06b6d4','#8b5cf6','#f43f5e','#22c55e'][prev.length % 4], joinedAt: new Date() }])} onChangeRole={(id, role) => setCollaborators(prev => prev.map(c => c.id === id ? { ...c, role } : c))} onRemove={(id) => setCollaborators(prev => prev.filter(c => c.id !== id))} />
      <SEOEditor isOpen={showSEOEditor} onClose={() => setShowSEOEditor(false)} files={project.files} onUpdateFile={upsertFile} />
      <CustomDomainPanel isOpen={showDomainPanel} onClose={() => setShowDomainPanel(false)} previewUrl={previewSlug ? `https://${previewSlug}.apps.ultriumai.com` : hostedPreviewUrl} />
      <DiffReviewPanel isOpen={showDiffReview} onClose={() => setShowDiffReview(false)} changes={pendingDiffChanges} onApprove={() => { pendingDiffChanges.forEach(c => upsertFile(c.path, c.newContent)); setPendingDiffChanges([]); setShowDiffReview(false); toast.success('Changes applied'); }} onReject={() => { setPendingDiffChanges([]); setShowDiffReview(false); toast.info('Changes rejected'); }} onApproveFile={(path) => { const c = pendingDiffChanges.find(ch => ch.path === path); if (c) upsertFile(c.path, c.newContent); }} onRejectFile={() => {}} />
      <QuickFileSwitcher open={showQuickSwitcher} onOpenChange={setShowQuickSwitcher} files={project.files} onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }} />
      <BugReportModal open={showBugReport} onOpenChange={setShowBugReport} />
      <EnhancedCommandPalette open={showEnhancedPalette} onOpenChange={setShowEnhancedPalette} files={project.files} actions={commandActions} onSelectFile={(path) => { handleSetActiveFile(path); setRightTab('code'); }} recentFiles={recentFiles} />
      <div className="flex items-center gap-1 px-2 py-1 border-t border-white/[0.06] bg-[#09090b] shrink-0">
        <ProjectSettings
          supabaseConfig={supabaseConfig}
          githubConfig={githubConfig}
          stripeConfig={stripeConfig}
          vercelConfig={vercelConfig}
          serviceKeys={serviceKeys}
          envVars={envVars}
          projectName={project.name}
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
        <SharePreview html={compiledHTML} projectName={project.name} />
        <ExportButton projectName={project.name} files={project.files} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} envVars={envVars} cdnPackages={cdnPackages} edgeFunctions={edgeFunctions} publishedUrl={publishedUrl} />
      </div>
      {pendingConflicts && (
        <FileConflictDialog open={!!pendingConflicts} conflicts={pendingConflicts} onResolve={handleConflictResolve} onCancel={() => setPendingConflicts(null)} />
      )}
    </TooltipProvider>
  );
}
