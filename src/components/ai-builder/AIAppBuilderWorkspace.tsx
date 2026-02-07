import { useEffect } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Code, FolderTree, Pencil, Database, CreditCard } from 'lucide-react';
import { useState } from 'react';

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

  return (
    <div className="h-[calc(100vh-5rem)] w-full flex flex-col">
      {hasFiles && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleRename} onKeyDown={(e) => e.key === 'Enter' && handleRename()} className="h-7 w-48 text-sm" autoFocus />
            ) : (
              <button onClick={() => { setEditName(project.name); setIsEditingName(true); }} className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors group">
                {project.name}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 text-muted-foreground" />
              </button>
            )}
            <Badge variant="outline" className="text-[10px]">
              {project.files.length} file{project.files.length !== 1 ? 's' : ''}
            </Badge>
            {supabaseConfig && <Badge variant="secondary" className="text-[10px] gap-1"><Database className="h-2.5 w-2.5" />Supabase</Badge>}
            {stripeConfig && <Badge variant="secondary" className="text-[10px] gap-1"><CreditCard className="h-2.5 w-2.5" />Stripe</Badge>}
            {serviceKeys.length > 0 && <Badge variant="secondary" className="text-[10px]">{serviceKeys.length} API{serviceKeys.length !== 1 ? 's' : ''}</Badge>}
          </div>
          <div className="flex items-center gap-1.5">
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
      )}

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
            <BuilderChatPanel messages={messages} isGenerating={isGenerating} fileCount={project.files.length} onSend={handleSend} onStop={stopGenerating} onClear={handleClear} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70} minSize={45}>
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {hasFiles && (
                <>
                  <ResizablePanel defaultSize={20} minSize={12} maxSize={30}>
                    <div className="h-full border-r border-border bg-background">
                      <div className="px-3 py-2 border-b border-border">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><FolderTree className="h-3 w-3" />Files</h3>
                      </div>
                      <ProjectFileTree files={project.files} activeFilePath={project.activeFilePath} onSelectFile={(path) => { setActiveFile(path); setRightTab('code'); }} onDeleteFile={deleteFile} />
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />
                </>
              )}
              <ResizablePanel defaultSize={hasFiles ? 80 : 100}>
                <div className="h-full flex flex-col">
                  {hasFiles && (
                    <div className="flex items-center border-b border-border bg-background">
                      <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as 'preview' | 'code')} className="w-full">
                        <TabsList className="h-9 bg-transparent border-0 p-0 rounded-none">
                          <TabsTrigger value="preview" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"><Eye className="h-3 w-3 mr-1" />Preview</TabsTrigger>
                          <TabsTrigger value="code" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"><Code className="h-3 w-3 mr-1" />Code</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    {rightTab === 'preview' || !hasFiles ? (
                      <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} />
                    ) : (
                      <div className="h-full flex flex-col">
                        <FileTabBar openPaths={project.openFilePaths} activePath={project.activeFilePath} onSelect={setActiveFile} onClose={closeFile} />
                        <div className="flex-1 overflow-hidden">
                          <CodeEditor file={activeFile} onContentChange={upsertFile} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
