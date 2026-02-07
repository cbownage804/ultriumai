import { useEffect, useState } from 'react';
import { useAIAppBuilder } from '@/hooks/useAIAppBuilder';
import { useProjectFileSystem } from '@/hooks/useProjectFileSystem';
import { BuilderChatPanel } from './BuilderChatPanel';
import { BuilderPreviewPanel } from './BuilderPreviewPanel';
import { ProjectFileTree } from './ProjectFileTree';
import { FileTabBar } from './FileTabBar';
import { CodeEditor } from './CodeEditor';
import { ExportButton } from './ExportButton';
import { ProjectSettings, type SupabaseConfig, type GithubConfig, type StripeConfig, type VercelConfig, type ServiceKey, type EnvVar } from './ProjectSettings';
import { GithubPushButton } from './GithubPushButton';
import { VercelDeployButton } from './VercelDeployButton';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Eye, Code, Pencil, Database, CreditCard, Key,
  PanelLeftClose, PanelLeftOpen, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIAppBuilderWorkspace() {
  const {
    messages, isGenerating, latestFiles,
    sendMessage, stopGenerating, clearChat,
  } = useAIAppBuilder();

  const {
    project, setFiles, upsertFile, deleteFile,
    setActiveFile, closeFile, resetProject, renameProject,
    getCompiledHTML, activeFile,
  } = useProjectFileSystem();

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

  useEffect(() => {
    if (latestFiles.length > 0) {
      if (project.files.length === 0) {
        setFiles(latestFiles);
      } else {
        for (const file of latestFiles) {
          upsertFile(file.path, file.content);
        }
      }
    }
  }, [latestFiles]);

  const handleSend = (input: string) => {
    sendMessage(input, project.files, supabaseConfig, stripeConfig, serviceKeys);
  };

  const handleClear = () => {
    clearChat();
    resetProject();
  };

  const handleRename = () => {
    if (editName.trim()) renameProject(editName.trim());
    setIsEditingName(false);
  };

  const compiledHTML = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys);
  const hasFiles = project.files.length > 0;

  const connectedServices = [
    supabaseConfig && 'Supabase',
    stripeConfig && 'Stripe',
    ...serviceKeys.map(sk => sk.serviceId),
  ].filter(Boolean);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-[calc(100vh-5rem)] w-full flex flex-col bg-[#0a0a0f]">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-3 h-11 border-b border-white/[0.06] bg-black/40 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Status indicator */}
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

            {/* Connected service pills */}
            {connectedServices.length > 0 && (
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
          </div>

          <div className="flex items-center gap-1">
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
                onSend={handleSend}
                onStop={stopGenerating}
                onClear={handleClear}
              />
            </ResizablePanel>

            <ResizableHandle className="w-px bg-white/[0.06] hover:bg-cyan-500/30 transition-colors data-[resize-handle-active]:bg-cyan-500/50" />

            {/* Right Panel: File Tree + Preview/Code */}
            <ResizablePanel defaultSize={72} minSize={50}>
              <div className="h-full flex flex-col">
                {/* Panel tab bar */}
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
                        rightTab === 'preview'
                          ? "text-white"
                          : "text-white/40 hover:text-white/70"
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
                        rightTab === 'code'
                          ? "text-white"
                          : "text-white/40 hover:text-white/70"
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

                {/* Content area */}
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
                        <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} />
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
    </TooltipProvider>
  );
}
