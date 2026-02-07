import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useAIAppBuilder } from '@/hooks/useAIAppBuilder';
import { useProjectFileSystem } from '@/hooks/useProjectFileSystem';
import { useAgentMode } from '@/hooks/useAgentMode';
import { useAutoErrorRecovery } from '@/hooks/useAutoErrorRecovery';
import type { RemoteCursor } from './CodeEditor';
import { supabase } from '@/integrations/supabase/client';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useBranching } from '@/hooks/useBranching';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { usePreviewHosting } from '@/hooks/usePreviewHosting';
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
import { VisualEditClickOverlay } from './VisualEditClickOverlay';
import {
  Eye, Code, Pencil, Database, CreditCard, Key,
  PanelLeftClose, PanelLeftOpen, Activity, Undo2, Redo2, Search,
  History, Variable, Image, Package, Columns, Keyboard,
  Shield, Brain, FolderOpen, Zap, Clock, Globe, Users, BookOpen,
  Settings, ChevronDown, ArrowLeft, Sparkles, Layers, Bug, Terminal, GitBranch as GitBranchIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Lazy load heavy panels
const DatabasePanel = lazy(() => import('./DatabasePanel').then(m => ({ default: m.DatabasePanel })));
const AuthConfigPanel = lazy(() => import('./AuthConfigPanel').then(m => ({ default: m.AuthConfigPanel })));
const KnowledgePanel = lazy(() => import('./KnowledgePanel').then(m => ({ default: m.KnowledgePanel })));
const StorageBrowser = lazy(() => import('./StorageBrowser').then(m => ({ default: m.StorageBrowser })));
const EdgeFunctionEditor = lazy(() => import('./EdgeFunctionEditor').then(m => ({ default: m.EdgeFunctionEditor })));

const PanelLoader = () => <div className="flex items-center justify-center h-full text-white/15 text-xs">Loading...</div>;

export function AIAppBuilderWorkspace() {
  const navigate = useNavigate();
  const {
    messages, setMessages, isGenerating, latestFiles, previousFiles, mode, setMode, thinkingPhase, versions,
    totalTokensUsed, sendMessage, stopGenerating, clearChat, restoreVersion,
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
    startAgentRun, cancelRun: cancelAgent,
    simulateAgentExecution,
  } = useAgentMode();
  const autoRecovery = useAutoErrorRecovery();
  const { saveDraft, loadDraft, clearDraft, hasDraft } = useDraftPersistence();
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
  const [showFileTree, setShowFileTree] = useState(true);
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
  const { findReferencedFiles, bundleForBrowser } = useProjectBundler();
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const channelRef = useRef<any>(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({ line: 1, column: 1 });
  const prevIsGeneratingRef = useRef(isGenerating);
  const [fixAttemptCount, setFixAttemptCount] = useState(0);
  const [lastFixError, setLastFixError] = useState<string | null>(null);
  const MAX_FIX_ATTEMPTS = 3;
  const [selectedModel, setSelectedModel] = useState('flash');
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
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

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
    }
  }, [latestFiles]);

  // AI completion notification
  useEffect(() => {
    if (prevIsGeneratingRef.current && !isGenerating && latestFiles.length > 0) {
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
    }
    prevIsGeneratingRef.current = isGenerating;
  }, [isGenerating, latestFiles.length]);

  // Hot-reload
  useEffect(() => {
    if (isStreamingPreview && partialFiles.length > 0) {
      for (const file of partialFiles) upsertFile(file.path, file.content);
    }
  }, [partialFiles, isStreamingPreview]);

  // Auto-save (cloud)
  useEffect(() => {
    if (project.files.length > 0) scheduleAutoSave(project.name, project.files);
  }, [project.files, project.name, scheduleAutoSave]);

  // Auto-save draft to localStorage (survives refresh)
  useEffect(() => {
    saveDraft(project.name, project.files, messages);
  }, [project.files, project.name, messages, saveDraft]);

  // Restore draft on mount
  useEffect(() => {
    if (project.files.length > 0 || messages.length > 0) return; // already has content
    const draft = loadDraft();
    if (draft && (draft.files.length > 0 || draft.messages.length > 0)) {
      setFiles(draft.files);
      renameProject(draft.name);
      if (draft.messages.length > 0) {
        setMessages(draft.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
      toast.success('Restored your unsaved draft', { description: `Saved ${new Date(draft.savedAt).toLocaleTimeString()}` });
    }
  }, []); // intentionally run once on mount

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
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [project.files, canUndo, canRedo]);

  const handleSend = (input: string, imageDataUrl?: string | null) => {
    const contextPrefix = activeFile && rightTab === 'code' ? `[Currently viewing: ${activeFile.path}]\n` : '';
    const referencedFiles = findReferencedFiles(input, project.files);
    const contextHint = referencedFiles.length > 0 ? `[Auto-detected relevant files: ${referencedFiles.map(f => f.path).join(', ')}]\n` : '';
    const knowledgeCtx = knowledge.customInstructions
      ? `Custom instructions: ${knowledge.customInstructions}${knowledge.contextFiles.length > 0 ? '\n\nContext files:\n' + knowledge.contextFiles.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n') : ''}`
      : undefined;
    const fullInput = contextPrefix + contextHint + input;

    // Agent mode: wrap in plan-execute-verify loop
    if (mode === 'build') {
      const run = startAgentRun(input);
      simulateAgentExecution(run, sendMessage, project.files, [supabaseConfig, stripeConfig, serviceKeys, imageDataUrl, selectedModel, knowledgeCtx]);
    } else {
      sendMessage(fullInput, project.files, supabaseConfig, stripeConfig, serviceKeys, imageDataUrl, selectedModel, knowledgeCtx);
    }
    autoRecovery.resetRecovery();
  };

  const handleFixError = (errorPrompt: string) => {
    sendMessage(errorPrompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel);
  };

  const handleSmartFixError = useCallback((error: import('./ErrorConsole').PreviewError, context: string) => {
    const isSameError = lastFixError === error.message;
    const newCount = isSameError ? fixAttemptCount + 1 : 1;
    setFixAttemptCount(newCount);
    setLastFixError(error.message);
    if (newCount > MAX_FIX_ATTEMPTS) { toast.error('Unable to auto-fix — try describing the issue differently.'); return; }
    const retryContext = newCount > 1 ? `\n\nThis is attempt ${newCount}/${MAX_FIX_ATTEMPTS}. Previous fix attempts did not resolve the issue. Please try a different approach.` : '';
    sendMessage(`Fix this error in my app. Here is the full context:\n\n${context}${retryContext}\n\nPlease fix the code and return the corrected file(s).`, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel);
  }, [sendMessage, project.files, supabaseConfig, stripeConfig, serviceKeys, selectedModel, fixAttemptCount, lastFixError]);

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

  const handleClear = () => { clearChat(); resetProject(); };

  const handleRename = () => {
    if (editName.trim()) renameProject(editName.trim());
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

  const handleSave = useCallback(async () => {
    await saveProject(project.name, project.files, branches, activeBranch, messages);
    setDirtyFiles(new Set());
    clearDraft();
    toast.success('Project saved');
  }, [saveProject, project.name, project.files, branches, activeBranch, messages, clearDraft]);

  const handleLoadProject = useCallback(async (projectId: string) => {
    const loaded = await loadProject(projectId);
    if (loaded) {
      setFiles(loaded.files as any[]);
      renameProject(loaded.name);
      if (loaded.published_url) setPublishedUrl(loaded.published_url);
      if (loaded.settings?.chatMessages) {
        setMessages(loaded.settings.chatMessages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
      toast.success(`Loaded "${loaded.name}"`);
    }
  }, [loadProject, setFiles, renameProject, setMessages]);

  const handlePublish = useCallback(async () => {
    const compiledHTML = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser);
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

  const compiledHTML = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser);
  const hasFiles = project.files.length > 0;

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'editor'>('chat');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close other panels when opening one
  const openPanel = (panel: 'history' | 'envVars' | 'assets' | 'packages' | 'database' | 'auth' | 'knowledge' | 'storage' | 'edgeFunctions' | 'activity' | 'codeIntel' | 'componentLib' | 'testingSuite' | 'exportGuide') => {
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
  };

  // ─── Left sidebar icon bar items ───
  const sidebarIcons = [
    { id: 'database', icon: Database, label: 'Database', show: !!supabaseConfig, active: showDatabase || showDbExplorer },
    { id: 'auth', icon: Shield, label: 'Auth', show: !!supabaseConfig, active: showAuth },
    { id: 'storage', icon: FolderOpen, label: 'Storage', show: !!supabaseConfig, active: showStorage },
    { id: 'edgeFunctions', icon: Zap, label: 'Edge Functions', show: true, active: showEdgeFunctions },
    { id: 'knowledge', icon: Brain, label: 'Knowledge', show: true, active: showKnowledge },
    { id: 'codeIntel', icon: Sparkles, label: 'Code Intelligence', show: true, active: showCodeIntel },
    { id: 'componentLib', icon: Layers, label: 'Components', show: true, active: showComponentLib },
    { id: 'testingSuite', icon: Bug, label: 'Testing & Debug', show: true, active: showTestingSuite },
    { id: 'envVars', icon: Variable, label: 'Env Variables', show: true, active: showEnvVars },
    { id: 'assets', icon: Image, label: 'Assets', show: true, active: showAssets },
    { id: 'packages', icon: Package, label: 'Packages', show: true, active: showPackages },
    { id: 'history', icon: History, label: 'Version History', show: true, active: showVersionHistory },
    { id: 'activity', icon: Clock, label: 'Activity', show: true, active: showActivity },
    { id: 'exportGuide', icon: BookOpen, label: 'Export & Deploy Guide', show: true, active: showExportGuide },
  ] as const;

  return (
    <TooltipProvider delayDuration={300}>
      <OnboardingTour />
      <div className="h-screen w-full flex flex-col bg-[#09090b]">
        {/* ── Top Bar — Lovable-style ── */}
        <div className="flex items-center justify-between px-2 h-12 border-b border-white/[0.06] bg-[#09090b] shrink-0">
          {/* LEFT: Back + Project name */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate('/hub')} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Back to Hub</TooltipContent>
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

          {/* CENTER: View tabs */}
          <div className="hidden md:flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setRightTab('preview')}
              className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all font-medium", rightTab === 'preview' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
            <button
              onClick={() => setRightTab('code')}
              className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all font-medium", rightTab === 'code' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}
            >
              <Code className="h-3.5 w-3.5" />
              Code
            </button>
            <button
              onClick={() => setRightTab('split')}
              className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all font-medium", rightTab === 'split' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}
            >
              <Columns className="h-3.5 w-3.5" />
              Split
            </button>
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

            <DeployDialog
              onPublish={handlePublish}
              publishedUrl={publishedUrl}
              hasFiles={hasFiles}
              previewSlug={previewSlug || undefined}
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
          <div className="flex items-center h-10 border-b border-white/[0.06] bg-black/30 shrink-0 md:hidden">
            <button onClick={() => setMobileTab('chat')} className={cn("flex-1 h-full text-xs font-medium transition-colors", mobileTab === 'chat' ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/40")}>Chat</button>
            <button onClick={() => setMobileTab('editor')} className={cn("flex-1 h-full text-xs font-medium transition-colors", mobileTab === 'editor' ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/40")}>Editor</button>
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-hidden">
          {isMobile ? (
            mobileTab === 'chat' ? (
              <BuilderChatPanel messages={messages} isGenerating={isGenerating} fileCount={project.files.length} mode={mode} thinkingPhase={thinkingPhase} versions={versions} totalTokensUsed={totalTokensUsed} previousFiles={previousFiles} latestFiles={latestFiles} onModeChange={setMode} onSend={handleSend} onStop={stopGenerating} onClear={handleClear} onRestoreVersion={restoreVersion} onOpenTemplates={() => setShowTemplates(true)} onFixError={handleFixError} onForkFromMessage={handleForkFromMessage} onRevertToMessage={handleRevertToMessage} selectedModel={selectedModel} onModelChange={setSelectedModel} />
            ) : (
              <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount}>
                <GeneratingOverlay isGenerating={isGenerating} phase={thinkingPhase} partialFiles={partialFiles} completedFileCount={completedFileCount} />
              </BuilderPreviewPanel>
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
                <AgentModePanel run={agentRun} onCancel={cancelAgent} />
                <div className="flex-1 overflow-hidden">
                  <BuilderChatPanel messages={messages} isGenerating={isGenerating} fileCount={project.files.length} mode={mode} thinkingPhase={thinkingPhase} versions={versions} totalTokensUsed={totalTokensUsed} previousFiles={previousFiles} latestFiles={latestFiles} onModeChange={setMode} onSend={handleSend} onStop={stopGenerating} onClear={handleClear} onRestoreVersion={restoreVersion} onOpenTemplates={() => setShowTemplates(true)} onFixError={handleFixError} onForkFromMessage={handleForkFromMessage} onRevertToMessage={handleRevertToMessage} selectedModel={selectedModel} onModelChange={setSelectedModel} />
                </div>
              </div>
            </ResizablePanel>
            )}

            <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors data-[resize-handle-active]:bg-cyan-500/50" />

            {/* Right Panel */}
            <ResizablePanel defaultSize={72} minSize={50}>
              <div className="h-full flex">
                {/* Lovable-style left icon sidebar */}
                <div className="w-10 border-r border-white/[0.06] bg-[#09090b] flex flex-col items-center py-2 gap-0.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => setShowFileTree(!showFileTree)} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-all", showFileTree ? "text-white/80 bg-white/[0.06]" : "text-white/20 hover:text-white/45 hover:bg-white/[0.03]")}>
                        <FolderOpen className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">Files</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => setShowFileSearch(!showFileSearch)} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-all", showFileSearch ? "text-white/80 bg-white/[0.06]" : "text-white/20 hover:text-white/45 hover:bg-white/[0.03]")}>
                        <Search className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">Search (⌘⇧F)</TooltipContent>
                  </Tooltip>

                  <div className="h-px w-4 bg-white/[0.06] my-1.5" />

                  {sidebarIcons.filter(i => i.show).map(item => (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => openPanel(item.id as any)}
                          className={cn(
                            "h-7 w-7 rounded-md flex items-center justify-center transition-all",
                            item.active
                              ? "text-cyan-400 bg-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.15)]"
                              : "text-white/20 hover:text-white/45 hover:bg-white/[0.03]"
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                    </Tooltip>
                  ))}

                  <div className="mt-auto flex flex-col items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => setShowTerminal(!showTerminal)} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-all", showTerminal ? "text-white/80 bg-white/[0.06]" : "text-white/20 hover:text-white/45 hover:bg-white/[0.03]")}>
                          <Terminal className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">Terminal</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => setShowDomainPanel(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/45 hover:bg-white/[0.03] transition-all">
                          <Globe className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">Domains</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => setShowConsole(!showConsole)} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-all", showConsole ? "text-white/80 bg-white/[0.06]" : "text-white/20 hover:text-white/45 hover:bg-white/[0.03]")}>
                          <Activity className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">Console</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={() => setShowShortcuts(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/20 hover:text-white/45 hover:bg-white/[0.03] transition-all">
                          <Keyboard className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">Shortcuts (⌘/)</TooltipContent>
                    </Tooltip>
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
                <AICodeIntelligence open={showCodeIntel} onClose={() => setShowCodeIntel(false)} suggestions={codeSuggestions} onApplySuggestion={(s) => { if (s.code && activeFile) { upsertFile(activeFile.path, activeFile.content + '\n' + s.code); toast.success('Applied suggestion'); } }} onDismiss={(id) => setCodeSuggestions(prev => prev.filter(s => s.id !== id))} onRefresh={() => toast.success('Refreshed suggestions')} activeFilePath={project.activeFilePath} />
                <DatabaseExplorer open={showDbExplorer} onClose={() => setShowDbExplorer(false)} supabaseConfig={supabaseConfig} />
                <ComponentLibrary open={showComponentLib} onClose={() => setShowComponentLib(false)} onInsertComponent={(code) => { if (activeFile) { upsertFile(activeFile.path, activeFile.content + '\n' + code); } }} onApplyTheme={() => {}} />
                <TestingDebugSuite open={showTestingSuite} onClose={() => setShowTestingSuite(false)} tests={testCases} onRunTests={() => setTestCases(prev => prev.map(t => ({ ...t, status: Math.random() > 0.2 ? 'passed' as const : 'failed' as const, duration: Math.floor(Math.random() * 200 + 10) })))} onRunSingleTest={(id) => setTestCases(prev => prev.map(t => t.id === id ? { ...t, status: 'passed' as const, duration: Math.floor(Math.random() * 100 + 5) } : t))} onGenerateTests={(filePath) => { setTestCases(prev => [...prev, { id: crypto.randomUUID(), name: `test ${filePath}`, file: filePath, status: 'idle' as const }]); toast.success('Test generated'); }} projectFiles={project.files} />
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
                                    <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount}>
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
                                <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount}>
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

                      {/* Console Panel */}
                      <ConsolePanel open={showConsole} onToggle={() => setShowConsole(!showConsole)} onFixError={handleFixError} />
                      {/* Terminal */}
                      <TerminalEmulator open={showTerminal} onClose={() => setShowTerminal(false)} projectName={project.name} />
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
            <span className="text-white/15">{rightTab === 'preview' ? 'Preview' : rightTab === 'code' ? 'Editor' : 'Split'}</span>
            <div className="h-3 w-px bg-white/[0.06]" />
            <span>{isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}</span>
          </div>
        )}
      </div>

      <TemplateLibrary isOpen={showTemplates} onClose={() => setShowTemplates(false)} onSelectTemplate={(prompt) => handleSend(prompt)} />
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} files={project.files} onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }} onSwitchTab={setRightTab} onSwitchMode={setMode} onUndo={handleUndo} onRedo={handleRedo} onSave={handleSave} onClear={handleClear} onOpenTemplates={() => setShowTemplates(true)} onPublish={handlePublish} canUndo={canUndo} canRedo={canRedo} />
      <KeyboardShortcutsPanel open={showShortcuts} onOpenChange={setShowShortcuts} />
      <BillingPanel isOpen={showBilling} onClose={() => setShowBilling(false)} />
      <ProjectShareDialog isOpen={showShareDialog} onClose={() => setShowShareDialog(false)} projectName={project.name} collaborators={collaborators} onInvite={(email, role) => setCollaborators(prev => [...prev, { id: crypto.randomUUID(), email, role, avatarColor: ['#06b6d4','#8b5cf6','#f43f5e','#22c55e'][prev.length % 4], joinedAt: new Date() }])} onChangeRole={(id, role) => setCollaborators(prev => prev.map(c => c.id === id ? { ...c, role } : c))} onRemove={(id) => setCollaborators(prev => prev.filter(c => c.id !== id))} />
      <SEOEditor isOpen={showSEOEditor} onClose={() => setShowSEOEditor(false)} files={project.files} onUpdateFile={upsertFile} />
      <CustomDomainPanel isOpen={showDomainPanel} onClose={() => setShowDomainPanel(false)} previewUrl={previewSlug ? `https://${previewSlug}.ultriumai.app` : hostedPreviewUrl} />
      <DiffReviewPanel isOpen={showDiffReview} onClose={() => setShowDiffReview(false)} changes={pendingDiffChanges} onApprove={() => { pendingDiffChanges.forEach(c => upsertFile(c.path, c.newContent)); setPendingDiffChanges([]); setShowDiffReview(false); toast.success('Changes applied'); }} onReject={() => { setPendingDiffChanges([]); setShowDiffReview(false); toast.info('Changes rejected'); }} onApproveFile={(path) => { const c = pendingDiffChanges.find(ch => ch.path === path); if (c) upsertFile(c.path, c.newContent); }} onRejectFile={() => {}} />
      <QuickFileSwitcher open={showQuickSwitcher} onOpenChange={setShowQuickSwitcher} files={project.files} onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }} />
      <ProjectSettings
        supabaseConfig={supabaseConfig}
        githubConfig={githubConfig}
        stripeConfig={stripeConfig}
        vercelConfig={vercelConfig}
        serviceKeys={serviceKeys}
        envVars={envVars}
        projectName={project.name}
        onSupabaseChange={setSupabaseConfig}
        onGithubChange={setGithubConfig}
        onStripeChange={setStripeConfig}
        onVercelChange={setVercelConfig}
        onServiceKeysChange={setServiceKeys}
        onEnvVarsChange={setEnvVars}
        onDeleteProject={() => { resetProject(); clearChat(); toast.success('Project deleted'); setShowSettingsPanel(false); }}
        onResetProject={() => { resetProject(); toast.success('Project reset'); setShowSettingsPanel(false); }}
      />
      {vercelConfig && <VercelDeployButton projectName={project.name} files={project.files} vercelToken={vercelConfig.token} />}
      {githubConfig && <GithubSyncButton projectName={project.name} files={project.files} githubToken={githubConfig.token} onPullFiles={handleGithubPullFiles} />}
      <SharePreview html={compiledHTML} projectName={project.name} />
      <ExportButton projectName={project.name} files={project.files} supabaseConfig={supabaseConfig} stripeConfig={stripeConfig} serviceKeys={serviceKeys} envVars={envVars} cdnPackages={cdnPackages} edgeFunctions={edgeFunctions} />
      {pendingConflicts && (
        <FileConflictDialog open={!!pendingConflicts} conflicts={pendingConflicts} onResolve={handleConflictResolve} onCancel={() => setPendingConflicts(null)} />
      )}
    </TooltipProvider>
  );
}
