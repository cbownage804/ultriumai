import { useEffect, useState, useCallback } from 'react';
import { useAIAppBuilder } from '@/hooks/useAIAppBuilder';
import { useProjectFileSystem } from '@/hooks/useProjectFileSystem';
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
import { GithubPushButton } from './GithubPushButton';
import { VercelDeployButton } from './VercelDeployButton';
import { TemplateLibrary } from './TemplateLibrary';
import { SharePreview } from './SharePreview';
import { BranchManager } from './BranchManager';
import { ProjectManager } from './ProjectManager';
import { CollaborativePresence } from './CollaborativePresence';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Eye, Code, Pencil, Database, CreditCard, Key,
  PanelLeftClose, PanelLeftOpen, Activity, Undo2, Redo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function AIAppBuilderWorkspace() {
  const {
    messages, isGenerating, latestFiles, previousFiles, mode, setMode, thinkingPhase, versions,
    totalTokensUsed, sendMessage, stopGenerating, clearChat, restoreVersion,
  } = useAIAppBuilder();

  const {
    project, setFiles, upsertFile, deleteFile,
    setActiveFile, closeFile, resetProject, renameProject,
    getCompiledHTML, activeFile,
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

  const [rightTab, setRightTab] = useState<'preview' | 'code'>('preview');
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

  // Sync latest files from AI
  useEffect(() => {
    if (latestFiles.length > 0) {
      // Push undo before applying
      if (project.files.length > 0) {
        pushUndo('AI generation', project.files);
      }
      if (project.files.length === 0) {
        setFiles(latestFiles);
      } else {
        for (const file of latestFiles) {
          upsertFile(file.path, file.content);
        }
      }
      updateBranchFiles(latestFiles);
    }
  }, [latestFiles]);

  // Auto-save on file changes
  useEffect(() => {
    if (project.files.length > 0) {
      scheduleAutoSave(project.name, project.files);
    }
  }, [project.files, project.name, scheduleAutoSave]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [project.files, canUndo, canRedo]);

  const handleSend = (input: string, imageDataUrl?: string | null) => {
    sendMessage(input, project.files, supabaseConfig, stripeConfig, serviceKeys, imageDataUrl);
  };

  const handleFixError = (errorPrompt: string) => {
    sendMessage(errorPrompt, project.files, supabaseConfig, stripeConfig, serviceKeys);
  };

  const handleClear = () => {
    clearChat();
    resetProject();
  };

  const handleRename = () => {
    if (editName.trim()) renameProject(editName.trim());
    setIsEditingName(false);
  };

  const handleUndo = useCallback(() => {
    const restored = undo(project.files);
    if (restored) {
      setFiles(restored);
      toast.success('Undone');
    }
  }, [undo, project.files, setFiles]);

  const handleRedo = useCallback(() => {
    const restored = redo(project.files);
    if (restored) {
      setFiles(restored);
      toast.success('Redone');
    }
  }, [redo, project.files, setFiles]);

  const handleCreateBranch = useCallback((name: string) => {
    createBranch(name, project.files);
    toast.success(`Branch "${name}" created`);
  }, [createBranch, project.files]);

  const handleSwitchBranch = useCallback((branchId: string) => {
    const files = switchBranch(branchId, project.files);
    if (files && files.length > 0) {
      pushUndo('Branch switch', project.files);
      setFiles(files);
    }
    toast.success('Switched branch');
  }, [switchBranch, project.files, pushUndo, setFiles]);

  const handleMergeBranch = useCallback((branchId: string) => {
    pushUndo('Before merge', project.files);
    const merged = mergeBranch(branchId, project.files);
    setFiles(merged);
    toast.success('Branch merged');
  }, [mergeBranch, project.files, pushUndo, setFiles]);

  const handleSave = useCallback(async () => {
    await saveProject(project.name, project.files, branches, activeBranch);
    toast.success('Project saved');
  }, [saveProject, project.name, project.files, branches, activeBranch]);

  const handleLoadProject = useCallback(async (projectId: string) => {
    const loaded = await loadProject(projectId);
    if (loaded) {
      setFiles(loaded.files as any[]);
      renameProject(loaded.name);
      if (loaded.published_url) setPublishedUrl(loaded.published_url);
      toast.success(`Loaded "${loaded.name}"`);
    }
  }, [loadProject, setFiles, renameProject]);

  const handlePublish = useCallback(async () => {
    const compiledHTML = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys);
    if (!compiledHTML) {
      toast.error('Nothing to publish');
      return;
    }
    const url = await publishProject(project.name, compiledHTML);
    if (url) {
      setPublishedUrl(url);
      toast.success('Published successfully!');
    }
  }, [publishProject, project.name, getCompiledHTML, supabaseConfig, stripeConfig, envVars, serviceKeys]);

  const compiledHTML = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys);
  const hasFiles = project.files.length > 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-[calc(100vh-5rem)] w-full flex flex-col bg-[#0a0a0f]">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-3 h-11 border-b border-white/[0.06] bg-black/40 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Status + Name */}
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

            {/* Branch manager */}
            <BranchManager
              branches={branches}
              activeBranch={activeBranch}
              activeBranchName={activeBranchName}
              onCreateBranch={handleCreateBranch}
              onSwitchBranch={handleSwitchBranch}
              onMergeBranch={handleMergeBranch}
              onDeleteBranch={deleteBranch}
            />

            {/* Undo/Redo */}
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

            {/* Connected service pills */}
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

            {/* Collaborative presence */}
            <CollaborativePresence projectId={currentProjectId} />
          </div>

          <div className="flex items-center gap-1">
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
            {githubConfig && <GithubPushButton projectName={project.name} files={project.files} githubToken={githubConfig.token} />}
            <SharePreview html={compiledHTML} projectName={project.name} />
            <ExportButton projectName={project.name} files={project.files} />
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Chat Panel */}
            <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
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
              />
            </ResizablePanel>

            <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors data-[resize-handle-active]:bg-cyan-500/50" />

            {/* Right Panel */}
            <ResizablePanel defaultSize={72} minSize={50}>
              <div className="h-full flex flex-col">
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

                    {isGenerating && (
                      <div className="ml-auto mr-3 flex items-center gap-1.5 text-[10px] text-amber-400/80">
                        <Activity className="h-3 w-3 animate-pulse" />
                        <span>generating...</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  <ResizablePanelGroup direction="horizontal" className="h-full">
                    {hasFiles && showFileTree && (
                      <>
                        <ResizablePanel defaultSize={18} minSize={12} maxSize={28}>
                          <ProjectFileTree
                            files={project.files}
                            activeFilePath={project.activeFilePath}
                            onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }}
                            onDeleteFile={deleteFile}
                          />
                        </ResizablePanel>
                        <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors" />
                      </>
                    )}

                    <ResizablePanel defaultSize={hasFiles && showFileTree ? 82 : 100}>
                      {rightTab === 'preview' || !hasFiles ? (
                        <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} onFixError={handleFixError} />
                      ) : (
                        <div className="h-full flex flex-col bg-[#0d0d14]">
                          <FileTabBar
                            openPaths={project.openFilePaths}
                            activePath={project.activeFilePath}
                            onSelect={setActiveFile}
                            onClose={closeFile}
                          />
                          <div className="flex-1 overflow-hidden">
                            <CodeEditor file={activeFile} onContentChange={upsertFile} />
                          </div>
                        </div>
                      )}
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      <TemplateLibrary
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={(prompt) => handleSend(prompt)}
      />
    </TooltipProvider>
  );
}
