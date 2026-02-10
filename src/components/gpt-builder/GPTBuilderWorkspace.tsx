import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGPTBuilderChat } from '@/hooks/useGPTBuilderChat';
import { useCustomGPTs } from '@/hooks/useCustomGPTs';
import { GPTBuilderChatPanel } from './GPTBuilderChatPanel';
import { GPTBuilderPreview } from './GPTBuilderPreview';
import { GPTBuilderConfigSidebar } from './GPTBuilderConfigSidebar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, RotateCcw, Settings2, Eye, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function GPTBuilderWorkspace() {
  const navigate = useNavigate();
  const { config, messages, isGenerating, sendMessage, updateConfig, resetConfig, stopGeneration } = useGPTBuilderChat();
  const { createGPT } = useCustomGPTs();
  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'config'>('chat');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const handleSave = async () => {
    if (!config.name || !config.system_prompt) {
      toast.error('Your GPT needs at least a name and system prompt before saving. Tell the AI what you want!');
      return;
    }
    setIsSaving(true);
    try {
      const result = await createGPT({
        name: config.name,
        description: config.description,
        system_prompt: config.system_prompt,
        avatar_url: config.avatar_url,
        starter_questions: config.starter_questions,
        preferred_model: config.preferred_model,
        enable_web_search: config.enable_web_search,
        theme_color: config.theme_color,
        placeholder_prompt: config.placeholder_prompt,
        category: config.category,
        features: config.features,
      });
      if (result) {
        toast.success(`${config.name} has been created!`);
        navigate('/dashboard/gpt');
      }
    } catch {
      toast.error('Failed to save GPT');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#09090b] text-white">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/ai-studio')}
            className="text-white/50 hover:text-white hover:bg-white/[0.06] h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: config.theme_color || '#6366f1' }}
            >
              {config.name?.[0]?.toUpperCase() || 'G'}
            </div>
            <span className="text-sm font-medium text-white/80 truncate max-w-[200px]">
              {config.name || 'New GPT'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mobile tab switcher */}
          <div className="flex items-center gap-0.5 md:hidden bg-white/[0.04] rounded-md p-0.5">
            {(['chat', 'preview', 'config'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'h-7 px-3 rounded text-xs font-medium transition-all',
                  activeTab === tab
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/60'
                )}
              >
                {tab === 'chat' && <MessageSquare className="h-3.5 w-3.5" />}
                {tab === 'preview' && <Eye className="h-3.5 w-3.5" />}
                {tab === 'config' && <Settings2 className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className={cn(
              'hidden md:flex text-white/50 hover:text-white hover:bg-white/[0.06] h-8 px-2',
              showConfig && 'bg-white/[0.06] text-white'
            )}
          >
            <Settings2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetConfig}
            className="text-white/50 hover:text-white hover:bg-white/[0.06] h-8 px-2"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !config.name}
            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Save GPT</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {/* Desktop: Resizable split pane */}
        <div className="hidden md:block h-full">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={45} minSize={30}>
              <GPTBuilderChatPanel
                messages={messages}
                isGenerating={isGenerating}
                onSend={sendMessage}
                onStop={stopGeneration}
                config={config}
              />
            </ResizablePanel>

            <ResizableHandle className="w-px bg-white/[0.06] hover:bg-primary/30 transition-colors" />

            <ResizablePanel defaultSize={showConfig ? 35 : 55} minSize={30}>
              <GPTBuilderPreview config={config} />
            </ResizablePanel>

            {showConfig && (
              <>
                <ResizableHandle className="w-px bg-white/[0.06] hover:bg-primary/30 transition-colors" />
                <ResizablePanel defaultSize={20} minSize={15}>
                  <GPTBuilderConfigSidebar config={config} onChange={updateConfig} />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        {/* Mobile: Tab-based */}
        <div className="md:hidden h-full">
          {activeTab === 'chat' && (
            <GPTBuilderChatPanel
              messages={messages}
              isGenerating={isGenerating}
              onSend={sendMessage}
              onStop={stopGeneration}
              config={config}
            />
          )}
          {activeTab === 'preview' && <GPTBuilderPreview config={config} />}
          {activeTab === 'config' && <GPTBuilderConfigSidebar config={config} onChange={updateConfig} />}
        </div>
      </div>
    </div>
  );
}
