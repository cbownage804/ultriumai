import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useAIAppBuilder } from '@/hooks/useAIAppBuilder';
import { useProjectFileSystem } from '@/hooks/useProjectFileSystem';
import type { RemoteCursor } from './CodeEditor';
import { supabase } from '@/integrations/supabase/client';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useBranching } from '@/hooks/useBranching';
import { useProjectPersistence } from '@/hooks/useProjectPersistence';
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
import {
  Eye, Code, Pencil, Database, CreditCard, Key,
  PanelLeftClose, PanelLeftOpen, Activity, Undo2, Redo2, Search,
  History, Variable, Image, Package, Columns, Keyboard,
  Shield, Brain, FolderOpen, Zap, Clock, Globe, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Lazy load heavy panels
const DatabasePanel = lazy(() => import('./DatabasePanel').then(m => ({ default: m.DatabasePanel })));
const AuthConfigPanel = lazy(() => import('./AuthConfigPanel').then(m => ({ default: m.AuthConfigPanel })));
const KnowledgePanel = lazy(() => import('./KnowledgePanel').then(m => ({ default: m.KnowledgePanel })));
const StorageBrowser = lazy(() => import('./StorageBrowser').then(m => ({ default: m.StorageBrowser })));
const EdgeFunctionEditor = lazy(() => import('./EdgeFunctionEditor').then(m => ({ default: m.EdgeFunctionEditor })));

const PanelLoader = () => <div className="flex items-center justify-center h-full text-white/15 text-xs">Loading...</div>;

export function AIAppBuilderWorkspace() {
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

  // New panel states
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
  const [collaborators, setCollaborators] = useState<{ id: string; email: string; role: 'viewer' | 'editor' | 'admin'; avatarColor: string; joinedAt: Date }[]>([]);
  const [buildNotifications, setBuildNotifications] = useState<BuildNotification[]>([]);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);

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
        // Merge: panel vars take priority, keep settings vars that aren't overridden
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
      // Check for conflicts with dirty files
      const conflicts = latestFiles.filter(f => dirtyFiles.has(f.path));
      if (conflicts.length > 0) {
        setPendingConflicts(conflicts.map(f => ({
          path: f.path,
          userContent: project.files.find(pf => pf.path === f.path)?.content || '',
          aiContent: f.content,
        })));
        // Apply non-conflicting files immediately
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
      // Reset fix attempts on successful generation
      setFixAttemptCount(0);
      setLastFixError(null);
    }
  }, [latestFiles]);

  // AI completion toast + notification
  useEffect(() => {
    if (prevIsGeneratingRef.current && !isGenerating && latestFiles.length > 0) {
      toast.success(`Generated ${latestFiles.length} file${latestFiles.length > 1 ? 's' : ''}`, {
        action: {
          label: 'View',
          onClick: () => setRightTab('preview'),
        },
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

  // Hot-reload: sync partial files during streaming
  useEffect(() => {
    if (isStreamingPreview && partialFiles.length > 0) {
      for (const file of partialFiles) {
        upsertFile(file.path, file.content);
      }
    }
  }, [partialFiles, isStreamingPreview]);

  // Auto-save on file changes
  useEffect(() => {
    if (project.files.length > 0) {
      scheduleAutoSave(project.name, project.files);
    }
  }, [project.files, project.name, scheduleAutoSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setShowQuickSwitcher(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        setShowFileSearch(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [project.files, canUndo, canRedo]);

  const handleSend = (input: string, imageDataUrl?: string | null) => {
    const contextPrefix = activeFile && rightTab === 'code'
      ? `[Currently viewing: ${activeFile.path}]\n`
      : '';
    const referencedFiles = findReferencedFiles(input, project.files);
    const contextHint = referencedFiles.length > 0
      ? `[Auto-detected relevant files: ${referencedFiles.map(f => f.path).join(', ')}]\n`
      : '';
    // Build knowledge context
    const knowledgeCtx = knowledge.customInstructions
      ? `Custom instructions: ${knowledge.customInstructions}${knowledge.contextFiles.length > 0 ? '\n\nContext files:\n' + knowledge.contextFiles.map(f => `--- ${f.name} ---\n${f.content}`).join('\n\n') : ''}`
      : undefined;
    sendMessage(contextPrefix + contextHint + input, project.files, supabaseConfig, stripeConfig, serviceKeys, imageDataUrl, selectedModel, knowledgeCtx);
  };

  const handleFixError = (errorPrompt: string) => {
    sendMessage(errorPrompt, project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel);
  };

  const handleSmartFixError = useCallback((error: import('./ErrorConsole').PreviewError, context: string) => {
    const isSameError = lastFixError === error.message;
    const newCount = isSameError ? fixAttemptCount + 1 : 1;
    setFixAttemptCount(newCount);
    setLastFixError(error.message);

    if (newCount > MAX_FIX_ATTEMPTS) {
      toast.error('Unable to auto-fix — try describing the issue differently.');
      return;
    }

    const retryContext = newCount > 1 ? `\n\nThis is attempt ${newCount}/${MAX_FIX_ATTEMPTS}. Previous fix attempts did not resolve the issue. Please try a different approach.` : '';
    sendMessage(
      `Fix this error in my app. Here is the full context:\n\n${context}${retryContext}\n\nPlease fix the code and return the corrected file(s).`,
      project.files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel
    );
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
    const template = `// Deno edge function: ${name}\nimport { serve } from "https://deno.land/std@0.168.0/http/server.ts";\n\nserve(async (req) => {\n  return new Response(JSON.stringify({ message: "Hello from ${name}" }), {\n    headers: { "Content-Type": "application/json" },\n  });\n});`;
    upsertFile(`functions/${name}/index.ts`, template);
    setEdgeFunctions(prev => [...prev, { name, status: 'draft' }]);
  }, [upsertFile]);

  // Generate preview slug from project name
  useEffect(() => {
    if (project.name && !previewSlug) {
      const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
      if (slug) setPreviewSlug(slug);
    }
  }, [project.name]);

  const handleConflictResolve = useCallback((resolutions: Record<string, 'mine' | 'ai'>) => {
    if (!pendingConflicts) return;
    for (const conflict of pendingConflicts) {
      if (resolutions[conflict.path] === 'ai') {
        upsertFile(conflict.path, conflict.aiContent);
      }
    }
    setPendingConflicts(null);
    setDirtyFiles(prev => {
      const next = new Set(prev);
      pendingConflicts.forEach(c => { if (resolutions[c.path] === 'ai') next.delete(c.path); });
      return next;
    });
  }, [pendingConflicts, upsertFile]);

  // Track dirty files on manual edits
  const handleContentChange = useCallback((path: string, content: string) => {
    upsertFile(path, content);
    setDirtyFiles(prev => new Set(prev).add(path));
  }, [upsertFile]);

  const handleAIEditRequest = useCallback((selector: string, elementContext: string, prompt: string) => {
    sendMessage(
      `The user selected an element in the preview and wants you to edit it.\n\nElement selector: ${selector}\nElement HTML:\n${elementContext}\n\nUser request: "${prompt}"\n\nPlease update the relevant file(s) to apply this change.`,
      project.files, supabaseConfig, stripeConfig, serviceKeys
    );
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
    const regex = isRegex
      ? new RegExp(query, caseSensitive ? 'g' : 'gi')
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
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
    toast.success('Project saved');
  }, [saveProject, project.name, project.files, branches, activeBranch, messages]);

  const handleLoadProject = useCallback(async (projectId: string) => {
    const loaded = await loadProject(projectId);
    if (loaded) {
      setFiles(loaded.files as any[]);
      renameProject(loaded.name);
      if (loaded.published_url) setPublishedUrl(loaded.published_url);
      // Restore chat messages if saved
      if (loaded.settings?.chatMessages) {
        setMessages(loaded.settings.chatMessages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
      toast.success(`Loaded "${loaded.name}"`);
    }
  }, [loadProject, setFiles, renameProject, setMessages]);

  const handlePublish = useCallback(async () => {
    const compiledHTML = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser);
    if (!compiledHTML) { toast.error('Nothing to publish'); return; }
    const url = await publishProject(project.name, compiledHTML);
    if (url) { setPublishedUrl(url); toast.success('Published successfully!'); }
  }, [publishProject, project.name, getCompiledHTML, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser]);

  const handleRemix = useCallback(async (projectId: string) => {
    const loaded = await loadProject(projectId);
    if (loaded) {
      setFiles(loaded.files as any[]);
      renameProject(`Remix of ${loaded.name}`);
      toast.success(`Remixed "${loaded.name}" — save to create your own copy`);
    }
  }, [loadProject, setFiles, renameProject]);

  const handleAssetUpload = useCallback((asset: ProjectAsset) => {
    setAssets(prev => [...prev, asset]);
  }, []);

  const handleAssetDelete = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    toast.success('Asset deleted');
  }, []);

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
  const openPanel = (panel: 'history' | 'envVars' | 'assets' | 'packages' | 'database' | 'auth' | 'knowledge' | 'storage' | 'edgeFunctions' | 'activity') => {
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
  };

  return (
    <TooltipProvider delayDuration={300}>
      <OnboardingTour />
      <div className="h-[calc(100vh-5rem)] w-full flex flex-col bg-[#0a0a0f]">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-3 h-11 border-b border-white/[0.06] bg-black/40 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full transition-colors",
                isGenerating ? "bg-amber-400 animate-pulse" : hasFiles ? "bg-emerald-400" : "bg-white/20"
              )} />
              {isEditingName ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  className="h-6 w-44 text-xs bg-white/5 border-white/10 text-white"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => { setEditName(project.name); setIsEditingName(true); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors group"
                >
                  {project.name}
                  <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60" />
                </button>
              )}
            </div>

            {hasFiles && (
              <span className="text-[10px] text-white/30 font-mono">
                {project.files.length} file{project.files.length !== 1 ? 's' : ''}
              </span>
            )}

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
              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", canUndo ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/10")}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Undo (⌘Z)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", canRedo ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/10")}
                    >
                      <Redo2 className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Redo (⌘⇧Z)</TooltipContent>
                </Tooltip>
              </div>
            )}

            {(supabaseConfig || stripeConfig || serviceKeys.length > 0) && (
              <div className="hidden md:flex items-center gap-1 ml-1">
                {supabaseConfig && (
                  <Badge className="h-5 text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
                    <Database className="h-2.5 w-2.5 mr-0.5" />DB
                  </Badge>
                )}
                {stripeConfig && (
                  <Badge className="h-5 text-[9px] bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20">
                    <CreditCard className="h-2.5 w-2.5 mr-0.5" />Pay
                  </Badge>
                )}
                {serviceKeys.length > 0 && (
                  <Badge className="h-5 text-[9px] bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20">
                    <Key className="h-2.5 w-2.5 mr-0.5" />{serviceKeys.length} API{serviceKeys.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}

            <CollaboratorAvatars collaborators={collaborators} onClick={() => setShowShareDialog(true)} />
            <CollaborativePresence projectId={currentProjectId} />
            <CreditsPill onClick={() => setShowBilling(true)} />
          </div>

          <div className="flex items-center gap-1">
            <BuildNotificationCenter
              notifications={buildNotifications}
              onMarkRead={(id) => setBuildNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
              onClear={() => setBuildNotifications([])}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowSEOEditor(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  <Globe className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">SEO Editor</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowShareDialog(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  <Users className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Share</TooltipContent>
            </Tooltip>
            {/* Panel toggle buttons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openPanel('history')}
                  className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showVersionHistory ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                >
                  <History className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Version History</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openPanel('envVars')}
                  className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showEnvVars ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                >
                  <Variable className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Env Variables</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openPanel('assets')}
                  className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showAssets ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                >
                  <Image className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Assets</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openPanel('packages')}
                  className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showPackages ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                >
                  <Package className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Packages</TooltipContent>
            </Tooltip>

            {supabaseConfig && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => openPanel('database')}
                      className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showDatabase ? "text-emerald-400 bg-emerald-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                    >
                      <Database className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Database</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => openPanel('auth')}
                      className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showAuth ? "text-violet-400 bg-violet-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Auth</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => openPanel('storage')}
                      className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showStorage ? "text-blue-400 bg-blue-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Storage</TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openPanel('edgeFunctions')}
                  className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showEdgeFunctions ? "text-yellow-400 bg-yellow-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                >
                  <Zap className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Edge Functions</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openPanel('knowledge')}
                  className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showKnowledge ? "text-amber-400 bg-amber-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                >
                  <Brain className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Knowledge</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openPanel('activity')}
                  className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", showActivity ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5")}
                >
                  <Clock className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Activity</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Shortcuts (⌘/)</TooltipContent>
            </Tooltip>

            <div className="h-4 w-px bg-white/[0.06] mx-1" />

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
            <ProjectSettings
              supabaseConfig={supabaseConfig}
              githubConfig={githubConfig}
              stripeConfig={stripeConfig}
              vercelConfig={vercelConfig}
              serviceKeys={serviceKeys}
              envVars={envVars}
              onSupabaseChange={setSupabaseConfig}
              onGithubChange={setGithubConfig}
              onStripeChange={setStripeConfig}
              onVercelChange={setVercelConfig}
              onServiceKeysChange={setServiceKeys}
              onEnvVarsChange={setEnvVars}
            />
            {vercelConfig && <VercelDeployButton projectName={project.name} files={project.files} vercelToken={vercelConfig.token} />}
            {githubConfig && <GithubSyncButton projectName={project.name} files={project.files} githubToken={githubConfig.token} onPullFiles={(files) => { pushUndo('GitHub pull', project.files); setFiles(files); }} />}
            <SharePreview html={compiledHTML} projectName={project.name} />
            <ExportButton projectName={project.name} files={project.files} />
          </div>
        </div>

        {/* Mobile tab switcher */}
        {isMobile && (
          <div className="flex items-center h-10 border-b border-white/[0.06] bg-black/30 shrink-0 md:hidden">
            <button
              onClick={() => setMobileTab('chat')}
              className={cn("flex-1 h-full text-xs font-medium transition-colors", mobileTab === 'chat' ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/40")}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileTab('editor')}
              className={cn("flex-1 h-full text-xs font-medium transition-colors", mobileTab === 'editor' ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/40")}
            >
              Editor
            </button>
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-hidden">
          {isMobile ? (
            mobileTab === 'chat' ? (
              <BuilderChatPanel
                messages={messages}
                isGenerating={isGenerating}
                fileCount={project.files.length}
                mode={mode}
                thinkingPhase={thinkingPhase}
                versions={versions}
                totalTokensUsed={totalTokensUsed}
                previousFiles={previousFiles}
                latestFiles={latestFiles}
                onModeChange={setMode}
                onSend={handleSend}
                onStop={stopGenerating}
                onClear={handleClear}
                onRestoreVersion={restoreVersion}
                onOpenTemplates={() => setShowTemplates(true)}
                onFixError={handleFixError}
                onForkFromMessage={handleForkFromMessage}
                onRevertToMessage={handleRevertToMessage}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            ) : (
              <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} onSmartFixError={handleSmartFixError} onAIEditRequest={handleAIEditRequest} isProcessingAIEdit={isGenerating} projectFiles={project.files} isStreamingPreview={isStreamingPreview} completedFileCount={completedFileCount}>
                <GeneratingOverlay isGenerating={isGenerating} phase={thinkingPhase} partialFiles={partialFiles} completedFileCount={completedFileCount} />
              </BuilderPreviewPanel>
            )
          ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Chat Panel - Collapsible */}
            {isChatCollapsed ? (
              <div className="w-10 border-r border-white/[0.06] bg-[#0a0a0f] flex flex-col items-center pt-3 shrink-0">
                <button
                  onClick={() => setIsChatCollapsed(false)}
                  className="h-8 w-8 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                  title="Expand chat"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </div>
            ) : (
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
              <div className="h-full relative">
                <button
                  onClick={() => setIsChatCollapsed(true)}
                  className="absolute top-2 right-2 z-10 h-6 w-6 rounded-md flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors"
                  title="Collapse chat"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
                <BuilderChatPanel
                  messages={messages}
                  isGenerating={isGenerating}
                  fileCount={project.files.length}
                  mode={mode}
                  thinkingPhase={thinkingPhase}
                  versions={versions}
                  totalTokensUsed={totalTokensUsed}
                  previousFiles={previousFiles}
                  latestFiles={latestFiles}
                  onModeChange={setMode}
                  onSend={handleSend}
                  onStop={stopGenerating}
                  onClear={handleClear}
                  onRestoreVersion={restoreVersion}
                  onOpenTemplates={() => setShowTemplates(true)}
                  onFixError={handleFixError}
                  onForkFromMessage={handleForkFromMessage}
                  onRevertToMessage={handleRevertToMessage}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
              </div>
            </ResizablePanel>
            )}

            <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors data-[resize-handle-active]:bg-cyan-500/50" />

            {/* Right Panel */}
            <ResizablePanel defaultSize={72} minSize={50}>
              <div className="h-full flex">
                {/* Side panels */}
                <VersionHistoryPanel
                  versions={versions}
                  currentFiles={project.files}
                  onRestore={restoreVersion}
                  onClose={() => setShowVersionHistory(false)}
                  open={showVersionHistory}
                />
                <EnvVarsPanel
                  envVars={envVariables}
                  onChange={setEnvVariables}
                  open={showEnvVars}
                  onClose={() => setShowEnvVars(false)}
                />
                <AssetManager
                  assets={assets}
                  onUpload={handleAssetUpload}
                  onDelete={handleAssetDelete}
                  open={showAssets}
                  onClose={() => setShowAssets(false)}
                />
                <Suspense fallback={<PanelLoader />}>
                  <DatabasePanel open={showDatabase} onClose={() => setShowDatabase(false)} supabaseConfig={supabaseConfig} />
                  <AuthConfigPanel open={showAuth} onClose={() => setShowAuth(false)} supabaseConfig={supabaseConfig} onGenerateAuthPages={handleGenerateAuthPages} />
                  <KnowledgePanel open={showKnowledge} onClose={() => setShowKnowledge(false)} knowledge={knowledge} onKnowledgeChange={setKnowledge} />
                  <StorageBrowser open={showStorage} onClose={() => setShowStorage(false)} supabaseConfig={supabaseConfig} />
                  <EdgeFunctionEditor open={showEdgeFunctions} onClose={() => setShowEdgeFunctions(false)} onCreateFunction={handleCreateEdgeFunction} functions={edgeFunctions} onSelectFunction={(name) => { setActiveFile(`functions/${name}/index.ts`); setRightTab('code'); }} />
                </Suspense>
                <ActivityFeed open={showActivity} onClose={() => setShowActivity(false)} entries={activityEntries} />
                {showPackages && (
                  <div className="w-64 border-r border-white/[0.06] bg-[#0d0d14] overflow-hidden">
                    <PackageManager
                      packages={cdnPackages}
                      onAddPackage={(pkg) => setCdnPackages(prev => [...prev, pkg])}
                      onRemovePackage={(name) => setCdnPackages(prev => prev.filter(p => p.name !== name))}
                    />
                  </div>
                )}

                <div className="flex-1 flex flex-col overflow-hidden">
                  {hasFiles && (
                    <div className="flex items-center h-9 border-b border-white/[0.06] bg-black/20 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setShowFileTree(!showFileTree)}
                            className="h-9 w-9 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
                          >
                            {showFileTree ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {showFileTree ? 'Hide files' : 'Show files'}
                        </TooltipContent>
                      </Tooltip>

                      <div className="h-4 w-px bg-white/[0.06] mx-0.5" />

                      <button
                        onClick={() => setRightTab('preview')}
                        className={cn(
                          "h-9 px-3 flex items-center gap-1.5 text-xs transition-all relative",
                          rightTab === 'preview' ? "text-white" : "text-white/40 hover:text-white/70"
                        )}
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                        {rightTab === 'preview' && (
                          <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full" />
                        )}
                      </button>
                      <button
                        onClick={() => setRightTab('code')}
                        className={cn(
                          "h-9 px-3 flex items-center gap-1.5 text-xs transition-all relative",
                          rightTab === 'code' ? "text-white" : "text-white/40 hover:text-white/70"
                        )}
                      >
                        <Code className="h-3 w-3" />
                        Code
                        {rightTab === 'code' && (
                          <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full" />
                        )}
                      </button>
                      <button
                        onClick={() => setRightTab('split')}
                        className={cn(
                          "h-9 px-3 flex items-center gap-1.5 text-xs transition-all relative",
                          rightTab === 'split' ? "text-white" : "text-white/40 hover:text-white/70"
                        )}
                      >
                        <Columns className="h-3 w-3" />
                        Split
                        {rightTab === 'split' && (
                          <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full" />
                        )}
                      </button>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setShowFileSearch(!showFileSearch)}
                            className={cn(
                              "h-9 px-2.5 flex items-center gap-1 text-xs transition-all",
                              showFileSearch ? "text-cyan-400" : "text-white/30 hover:text-white/60"
                            )}
                          >
                            <Search className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Search files (⌘⇧F)</TooltipContent>
                      </Tooltip>

                      {isGenerating && (
                        <div className="ml-auto mr-3 flex items-center gap-1.5 text-[10px] text-amber-400/80">
                          <Activity className="h-3 w-3 animate-pulse" />
                          <span>generating...</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden flex">
                    <FileSearchPanel
                      open={showFileSearch}
                      onClose={() => setShowFileSearch(false)}
                      files={project.files}
                      onSelectFile={(path) => { setActiveFile(path); }}
                      onSwitchToCode={() => setRightTab('code')}
                      onReplaceInFiles={handleReplaceInFiles}
                    />

                    <div className="flex-1 overflow-hidden flex flex-col">
                      <div className="flex-1 overflow-hidden">
                        <ResizablePanelGroup direction="horizontal" className="h-full">
                          {hasFiles && showFileTree && !showFileSearch && (
                            <>
                              <ResizablePanel defaultSize={18} minSize={12} maxSize={28}>
                                <ProjectFileTree
                                  files={project.files}
                                  activeFilePath={project.activeFilePath}
                                  onSelectFile={(path) => { setActiveFile(path); if (rightTab === 'preview') setRightTab('code'); }}
                                  onDeleteFile={deleteFile}
                                  onCreateFile={handleCreateFile}
                                  onRenameFile={handleRenameFile}
                                />
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
                                    <FileTabBar openPaths={project.openFilePaths} activePath={project.activeFilePath} dirtyFiles={dirtyFiles} onSelect={setActiveFile} onClose={closeFile} onReorder={reorderOpenFiles} />
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
                                <FileTabBar
                                  openPaths={project.openFilePaths}
                                  activePath={project.activeFilePath}
                                  dirtyFiles={dirtyFiles}
                                  onSelect={setActiveFile}
                                  onClose={closeFile}
                                  onReorder={reorderOpenFiles}
                                />
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
                      <ConsolePanel
                        open={showConsole}
                        onToggle={() => setShowConsole(!showConsole)}
                        onFixError={handleFixError}
                      />
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
          <div className="flex items-center h-5 px-3 border-t border-white/[0.06] bg-black/40 text-[10px] text-white/30 font-mono shrink-0 gap-4">
            <span>{activeFile?.language || 'plaintext'}</span>
            <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
            <span>{project.files.length} file{project.files.length !== 1 ? 's' : ''}</span>
            <span>{activeBranchName}</span>
            {dirtyFiles.size > 0 && (
              <span className="text-amber-400/60">{dirtyFiles.size} unsaved</span>
            )}
            <span className="ml-auto">{isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}</span>
          </div>
        )}
      </div>

      <TemplateLibrary
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={(prompt) => handleSend(prompt)}
      />

      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        files={project.files}
        onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }}
        onSwitchTab={setRightTab}
        onSwitchMode={setMode}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onClear={handleClear}
        onOpenTemplates={() => setShowTemplates(true)}
        onPublish={handlePublish}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <KeyboardShortcutsPanel open={showShortcuts} onOpenChange={setShowShortcuts} />
      <BillingPanel isOpen={showBilling} onClose={() => setShowBilling(false)} />
      <ProjectShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        projectName={project.name}
        collaborators={collaborators}
        onInvite={(email, role) => setCollaborators(prev => [...prev, { id: crypto.randomUUID(), email, role, avatarColor: ['#06b6d4','#8b5cf6','#f43f5e','#22c55e'][prev.length % 4], joinedAt: new Date() }])}
        onChangeRole={(id, role) => setCollaborators(prev => prev.map(c => c.id === id ? { ...c, role } : c))}
        onRemove={(id) => setCollaborators(prev => prev.filter(c => c.id !== id))}
      />
      <SEOEditor isOpen={showSEOEditor} onClose={() => setShowSEOEditor(false)} files={project.files} onUpdateFile={upsertFile} />
      <QuickFileSwitcher
        open={showQuickSwitcher}
        onOpenChange={setShowQuickSwitcher}
        files={project.files}
        onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }}
      />
      {pendingConflicts && (
        <FileConflictDialog
          open={!!pendingConflicts}
          conflicts={pendingConflicts}
          onResolve={handleConflictResolve}
          onCancel={() => setPendingConflicts(null)}
        />
      )}
    </TooltipProvider>
  );
}
