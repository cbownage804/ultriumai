import { useEffect } from 'react';
import { useAIAppBuilder } from '@/hooks/useAIAppBuilder';
import { useProjectFileSystem } from '@/hooks/useProjectFileSystem';
import { BuilderChatPanel } from './BuilderChatPanel';
import { BuilderPreviewPanel } from './BuilderPreviewPanel';
import { ProjectFileTree } from './ProjectFileTree';
import { FileTabBar } from './FileTabBar';
import { CodeViewer } from './CodeViewer';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code, FolderTree } from 'lucide-react';
import { useState } from 'react';

export function AIAppBuilderWorkspace() {
  const {
    messages, isGenerating, latestFiles,
    sendMessage, stopGenerating, clearChat,
  } = useAIAppBuilder();

  const {
    project, setFiles, upsertFile, deleteFile,
    setActiveFile, closeFile, resetProject,
    getCompiledHTML, activeFile,
  } = useProjectFileSystem();

  const [rightTab, setRightTab] = useState<'preview' | 'code'>('preview');

  // When AI generates new files, merge them into the project
  useEffect(() => {
    if (latestFiles.length > 0) {
      // If it's the first generation, set all files
      if (project.files.length === 0) {
        setFiles(latestFiles);
      } else {
        // Merge: update existing files, add new ones
        for (const file of latestFiles) {
          upsertFile(file.path, file.content);
        }
      }
    }
  }, [latestFiles]);

  const handleSend = (input: string) => {
    sendMessage(input, project.files);
  };

  const handleClear = () => {
    clearChat();
    resetProject();
  };

  const compiledHTML = getCompiledHTML();

  return (
    <div className="h-[calc(100vh-5rem)] w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Chat Panel */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
          <BuilderChatPanel
            messages={messages}
            isGenerating={isGenerating}
            fileCount={project.files.length}
            onSend={handleSend}
            onStop={stopGenerating}
            onClear={handleClear}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right side: File Tree + Preview/Code */}
        <ResizablePanel defaultSize={70} minSize={45}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* File Tree */}
            {project.files.length > 0 && (
              <>
                <ResizablePanel defaultSize={20} minSize={12} maxSize={30}>
                  <div className="h-full border-r border-border bg-background">
                    <div className="px-3 py-2 border-b border-border">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <FolderTree className="h-3 w-3" />
                        Files ({project.files.length})
                      </h3>
                    </div>
                    <ProjectFileTree
                      files={project.files}
                      activeFilePath={project.activeFilePath}
                      onSelectFile={setActiveFile}
                      onDeleteFile={deleteFile}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            {/* Preview / Code Panel */}
            <ResizablePanel defaultSize={project.files.length > 0 ? 80 : 100}>
              <div className="h-full flex flex-col">
                {/* Tab switcher */}
                {project.files.length > 0 && (
                  <div className="flex items-center border-b border-border bg-background">
                    <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as 'preview' | 'code')} className="w-full">
                      <TabsList className="h-9 bg-transparent border-0 p-0 rounded-none">
                        <TabsTrigger
                          value="preview"
                          className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </TabsTrigger>
                        <TabsTrigger
                          value="code"
                          className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                          <Code className="h-3 w-3 mr-1" />
                          Code
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  {rightTab === 'preview' || project.files.length === 0 ? (
                    <BuilderPreviewPanel html={compiledHTML} isGenerating={isGenerating} />
                  ) : (
                    <div className="h-full flex flex-col">
                      <FileTabBar
                        openPaths={project.openFilePaths}
                        activePath={project.activeFilePath}
                        onSelect={setActiveFile}
                        onClose={closeFile}
                      />
                      <div className="flex-1 overflow-hidden">
                        <CodeViewer file={activeFile} />
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
  );
}
