import { useAIAppBuilder } from '@/hooks/useAIAppBuilder';
import { BuilderChatPanel } from './BuilderChatPanel';
import { BuilderPreviewPanel } from './BuilderPreviewPanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export function AIAppBuilderWorkspace() {
  const { messages, isGenerating, currentHTML, sendMessage, stopGenerating, clearChat } =
    useAIAppBuilder();

  return (
    <div className="h-[calc(100vh-5rem)] w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Chat Panel */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <BuilderChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onSend={sendMessage}
            onStop={stopGenerating}
            onClear={clearChat}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Preview Panel */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <BuilderPreviewPanel html={currentHTML} isGenerating={isGenerating} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
