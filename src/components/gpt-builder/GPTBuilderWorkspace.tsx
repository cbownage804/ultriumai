import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGPTBuilderChat } from '@/hooks/useGPTBuilderChat';
import { useCustomGPTs } from '@/hooks/useCustomGPTs';
import { GPTBuilderChatPanel } from './GPTBuilderChatPanel';
import { GPTBuilderPreview, GPTBuilderPreviewHandle } from './GPTBuilderPreview';
import { GPTBuilderConfigSidebar } from './GPTBuilderConfigSidebar';
import { GPTBuilderKnowledgePanel } from './GPTBuilderKnowledgePanel';
import { GPTBuilderActionsPanel } from './GPTBuilderActionsPanel';
import { GPTBuilderEmbedPanel } from './GPTBuilderEmbedPanel';
import { GPTBuilderAnalyticsPanel } from './GPTBuilderAnalyticsPanel';
import { GPTExportImportPanel } from './GPTExportImportPanel';
import { GPTTemplatePickerModal } from './GPTTemplatePickerModal';
import { GPTConfigIndicators } from './GPTConfigIndicators';
import { useGPTPreviewCapture } from '@/hooks/useGPTPreviewCapture';
import { GPTReviewPanel } from './GPTReviewPanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowLeft, Save, RotateCcw, Settings2, Eye, MessageSquare, Loader2,
  BookOpen, Zap, Code2, Layers, FileJson, Copy, BarChart3, ClipboardCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { GPTBuilderOnboardingTour } from './GPTBuilderOnboardingTour';

type SidePanel = 'config' | 'knowledge' | 'actions' | 'embed' | 'export' | 'analytics' | null;

interface GPTBuilderWorkspaceProps {
  editGptId?: string;
  templateId?: string;
}

export function GPTBuilderWorkspace({ editGptId, templateId }: GPTBuilderWorkspaceProps) {
  const navigate = useNavigate();
  const { config, messages, isGenerating, isLoading, savedGptId, setSavedGptId, sendMessage, updateConfig, resetConfig, stopGeneration } = useGPTBuilderChat(editGptId, templateId);
  const { createGPT, updateGPT } = useCustomGPTs();
  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'config'>('chat');
  const [isSaving, setIsSaving] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const previewRef = useRef<GPTBuilderPreviewHandle>(null);
  const { captureGPTThumbnail } = useGPTPreviewCapture();

  const isEditMode = !!savedGptId;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        if (sidePanel) { setSidePanel(null); return; }
        if (showTemplatePicker) { setShowTemplatePicker(false); return; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidePanel, showTemplatePicker]);

  const handleApplyTemplate = useCallback((tplId: string) => {
    // Navigate to apply template via URL, which triggers the useEffect in useGPTBuilderChat
    navigate(`/ai-studio/gpt-builder?template=${tplId}`, { replace: true });
    window.location.reload();
  }, [navigate]);

  const togglePanel = (panel: SidePanel) => {
    setSidePanel(prev => prev === panel ? null : panel);
  };

  const handleSave = async () => {
    if (!config.name || !config.system_prompt) {
      toast.error('Your GPT needs at least a name and system prompt before saving. Tell the AI what you want!');
      return;
    }
    setIsSaving(true);
    try {
      const gptData = {
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
        integration_settings: { widget_theme: config.widget_theme } as any,
      };

      if (isEditMode && savedGptId) {
        const result = await updateGPT(savedGptId, gptData);
        if (result) {
          toast.success(`${config.name} has been updated!`);
          // Capture thumbnail after save
          setTimeout(() => {
            const el = previewRef.current?.getPreviewElement();
            captureGPTThumbnail(el, savedGptId).catch(() => {});
          }, 500);
        }
      } else {
        const result = await createGPT(gptData);
        if (result) {
          setSavedGptId(result.id);
          toast.success(`${config.name} has been created!`);
          window.history.replaceState(null, '', `/ai-studio/gpt-builder/${result.id}`);
          // Capture thumbnail after creation
          setTimeout(() => {
            const el = previewRef.current?.getPreviewElement();
            captureGPTThumbnail(el, result.id).catch(() => {});
          }, 500);
        }
      }
    } catch {
      toast.error('Failed to save GPT');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = useCallback(async () => {
    if (!config.name) { toast.error('Configure your GPT first'); return; }
    const dupData = {
      name: `${config.name} (Copy)`,
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
      integration_settings: { widget_theme: config.widget_theme } as any,
    };
    try {
      const result = await createGPT(dupData);
      if (result) {
        toast.success(`Duplicated as "${dupData.name}"`);
        navigate(`/ai-studio/gpt-builder/${result.id}`);
      }
    } catch {
      toast.error('Failed to duplicate');
    }
  }, [config, createGPT, navigate]);

  const sidePanelButtons = [
    { id: 'config' as const, icon: Settings2, label: 'Config' },
    { id: 'knowledge' as const, icon: BookOpen, label: 'Knowledge' },
    { id: 'actions' as const, icon: Zap, label: 'Actions' },
    { id: 'embed' as const, icon: Code2, label: 'Embed' },
    { id: 'analytics' as const, icon: BarChart3, label: 'Analytics' },
    { id: 'export' as const, icon: FileJson, label: 'Export/Import' },
  ];

  const renderSidePanel = () => {
    switch (sidePanel) {
      case 'config':
        return <GPTBuilderConfigSidebar config={config} onChange={updateConfig} />;
      case 'knowledge':
        return <GPTBuilderKnowledgePanel config={config} onChange={updateConfig} onClose={() => setSidePanel(null)} />;
      case 'actions':
        return <GPTBuilderActionsPanel config={config} onChange={updateConfig} onClose={() => setSidePanel(null)} />;
      case 'embed':
        return <GPTBuilderEmbedPanel config={config} onChange={updateConfig} onClose={() => setSidePanel(null)} gptId={savedGptId || undefined} />;
      case 'analytics':
        return <GPTBuilderAnalyticsPanel config={config} onClose={() => setSidePanel(null)} gptId={savedGptId || undefined} />;
      case 'export':
        return <GPTExportImportPanel config={config} onChange={updateConfig} onClose={() => setSidePanel(null)} onDuplicate={handleDuplicate} gptId={savedGptId || undefined} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#09090b]">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full flex flex-col bg-[#09090b] text-white">
        <GPTBuilderOnboardingTour />
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
              {isEditMode && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40">Editing</span>
              )}
            </div>
            <div className="hidden lg:block ml-2">
              <GPTConfigIndicators config={config} />
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
                    activeTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                  )}
                >
                  {tab === 'chat' && <MessageSquare className="h-3.5 w-3.5" />}
                  {tab === 'preview' && <Eye className="h-3.5 w-3.5" />}
                  {tab === 'config' && <Settings2 className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>

            {/* Desktop panel toggles */}
            <div className="hidden md:flex items-center gap-0.5" data-tour="gpt-config-bar">
              {sidePanelButtons.map(btn => (
                <Tooltip key={btn.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePanel(btn.id)}
                      className={cn(
                        'text-white/50 hover:text-white hover:bg-white/[0.06] h-8 px-2',
                        sidePanel === btn.id && 'bg-white/[0.06] text-white'
                      )}
                    >
                      <btn.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">{btn.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="hidden md:block h-4 w-px bg-white/10 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReview(true)}
                  className="text-white/50 hover:text-white hover:bg-white/[0.06] h-8 px-2"
                >
                  <ClipboardCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Review GPT</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplatePicker(true)}
                  className="text-white/50 hover:text-white hover:bg-white/[0.06] h-8 px-2"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Templates</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetConfig}
                  className="text-white/50 hover:text-white hover:bg-white/[0.06] h-8 px-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Reset</TooltipContent>
            </Tooltip>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !config.name}
              className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              data-tour="gpt-save"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isEditMode ? 'Update GPT' : 'Save GPT'}</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          {/* Desktop: Resizable split pane */}
          <div className="hidden md:block h-full">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={sidePanel ? 40 : 45} minSize={30}>
                <div data-tour="gpt-chat" className="h-full">
                <GPTBuilderChatPanel
                  messages={messages}
                  isGenerating={isGenerating}
                  onSend={sendMessage}
                  onStop={stopGeneration}
                  config={config}
                />
                </div>
              </ResizablePanel>

              <ResizableHandle className="w-px bg-white/[0.06] hover:bg-primary/30 transition-colors" />

              <ResizablePanel defaultSize={sidePanel ? 35 : 55} minSize={25}>
                <div data-tour="gpt-preview" className="h-full">
                <GPTBuilderPreview ref={previewRef} config={config} />
                </div>
              </ResizablePanel>

              {sidePanel && (
                <>
                  <ResizableHandle className="w-px bg-white/[0.06] hover:bg-primary/30 transition-colors" />
                  <ResizablePanel defaultSize={25} minSize={18}>
                    {renderSidePanel()}
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
            {activeTab === 'preview' && <GPTBuilderPreview ref={previewRef} config={config} />}
            {activeTab === 'config' && <GPTBuilderConfigSidebar config={config} onChange={updateConfig} />}
          </div>
        </div>

        {/* Template Picker Modal */}
        <GPTTemplatePickerModal
          open={showTemplatePicker}
          onOpenChange={setShowTemplatePicker}
          onSelect={handleApplyTemplate}
        />
        <GPTReviewPanel open={showReview} onClose={() => setShowReview(false)} config={config} />
      </div>
    </TooltipProvider>
  );
}
