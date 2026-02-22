import { type RefObject } from 'react';
import { Input } from '@/components/ui/input';
import type { UndoEntry } from '@/hooks/useUndoRedo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToolbarPanelsDropdown } from './lazyPanels';
import { SyncStatusIndicator, HeaderCreditsIndicator, ProjectDropdownMenu, UndoPreviewPopover } from './lazyPanels';
import {
  Eye, Code, Database, Search, History,
  Columns, Rocket, Terminal, Globe, Users, Zap, RefreshCw,
  MessageSquare, Clock, Cloud, ShieldCheck, Gauge, Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ultriumLogo from '/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface WorkspaceTopBarProps {
  projectName: string;
  isGenerating: boolean;
  hasFiles: boolean;
  isEditingName: boolean;
  editName: string;
  setEditName: (v: string) => void;
  setIsEditingName: (v: boolean) => void;
  onRename: () => void;
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
  canUndo: boolean;
  canRedo: boolean;
  currentFiles: ProjectFile[];
  onUndo: () => void;
  onRedo: () => void;
  rightTab: 'preview' | 'code' | 'split';
  setRightTab: (v: 'preview' | 'code' | 'split') => void;
  setShowPromptHistory: (v: boolean) => void;
  setShowVersionHistory: (v: boolean) => void;
  setShowSettingsPanel: (v: boolean) => void;
  setShowPublishPanel: (v: boolean) => void;
  setShowBilling: (v: boolean) => void;
  setShowShareDialog: (v: boolean) => void;
  setShowSupabaseIDE: (v: boolean) => void;
  setShowCloudView: (v: boolean) => void;
  setShowTerminal: (v: boolean) => void;
  setShowSecurityAuditor: (v: boolean) => void;
  setShowPerformanceProfiler: (v: boolean) => void;
  setShowDesignView: (v: boolean) => void;
  onOpenPanel: (key: string) => void;
  previewCurrentUrl: string;
  previewIframeRef: RefObject<HTMLIFrameElement | null>;
  syncStatus: string;
  lastSaved: Date | null;
  publishedUrl: string | null;
  isMobile: boolean;
  mobileTab: 'chat' | 'preview' | 'editor';
  setMobileTab: (v: 'chat' | 'preview' | 'editor') => void;
}

export function WorkspaceTopBar({
  projectName, isGenerating, hasFiles,
  isEditingName, editName, setEditName, setIsEditingName, onRename,
  undoStack, redoStack, canUndo, canRedo, currentFiles, onUndo, onRedo,
  rightTab, setRightTab,
  setShowPromptHistory, setShowVersionHistory,
  setShowSettingsPanel, setShowPublishPanel, setShowBilling, setShowShareDialog,
  setShowSupabaseIDE, setShowCloudView, setShowTerminal,
  setShowSecurityAuditor, setShowPerformanceProfiler, setShowDesignView,
  onOpenPanel,
  previewCurrentUrl, previewIframeRef,
  syncStatus, lastSaved,
  publishedUrl, isMobile, mobileTab, setMobileTab,
}: WorkspaceTopBarProps) {
  return (
    <>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-2 h-11 border-b border-white/[0.06] bg-[#0c0c0c] shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* LEFT: Logo + Project name dropdown */}
        <div className="flex items-center gap-2 min-w-0">
          <a href="/ai-studio" className="shrink-0 flex items-center justify-center h-8 w-8">
            <img src={ultriumLogo} alt="UltriumAI" className="h-8 w-8 rounded-md object-contain" />
          </a>

          {isEditingName ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={onRename}
              onKeyDown={(e) => e.key === 'Enter' && onRename()}
              className="h-7 w-48 text-sm bg-white/5 border-white/10 text-white"
              autoFocus
            />
          ) : (
            <ProjectDropdownMenu
              projectName={projectName}
              isGenerating={isGenerating}
              hasFiles={hasFiles}
              onRename={() => { setEditName(projectName); setIsEditingName(true); }}
              onOpenSettings={() => setShowSettingsPanel(true)}
              onPublish={() => setShowPublishPanel(true)}
              onOpenBilling={() => setShowBilling(true)}
              publishedUrl={publishedUrl}
            />
          )}

          {/* Undo/Redo with Smart Preview + History */}
          <div className="hidden md:flex items-center gap-0.5 ml-1">
            <UndoPreviewPopover
              undoStack={undoStack}
              redoStack={redoStack}
              canUndo={canUndo}
              canRedo={canRedo}
              currentFiles={currentFiles}
              onUndo={onUndo}
              onRedo={onRedo}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowPromptHistory(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  <Clock className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Prompt History</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowVersionHistory(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                  <History className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Version History</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setRightTab('split')} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", rightTab === 'split' ? "text-white/60 bg-white/5" : "text-white/30 hover:text-white/60 hover:bg-white/5")}>
                  <Columns className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Split View</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* CENTER: View tabs + tool icons */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setRightTab('preview')}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all border",
              rightTab === 'preview'
                ? "bg-violet-500/20 text-violet-300 border-violet-500/30 shadow-sm shadow-violet-500/10"
                : "text-white/50 border-transparent hover:text-violet-300/70 hover:bg-violet-500/[0.08]"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowCloudView(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                <Cloud className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Cloud</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowSupabaseIDE(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                <Database className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Supabase</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setRightTab('code')} className={cn("h-7 w-7 rounded-md flex items-center justify-center transition-colors", rightTab === 'code' ? "text-white/60 bg-white/5" : "text-white/30 hover:text-white/60 hover:bg-white/5")}>
                <Code className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Code Editor</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowTerminal(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                <Terminal className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Terminal</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowDesignView(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                <Palette className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Design</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowSecurityAuditor(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                <ShieldCheck className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Security</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowPerformanceProfiler(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
                <Gauge className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Speed</TooltipContent>
          </Tooltip>
          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="h-7 px-2 rounded-md flex items-center gap-1 text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors">
                <Search className="h-3 w-3" />
                <span className="text-[9px] font-mono text-white/20 bg-white/[0.04] px-1 py-0.5 rounded">⌘K</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Command Palette</TooltipContent>
          </Tooltip>
          <ToolbarPanelsDropdown onOpenPanel={onOpenPanel} />
        </div>

        {/* RIGHT: URL bar + actions */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/30 text-xs min-w-[180px]">
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono">{previewCurrentUrl}</span>
          </div>
          <div className="hidden md:flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="h-7 w-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                  <Zap className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Expand</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => { const iframe = previewIframeRef.current; if (iframe && iframe.srcdoc) { const s = iframe.srcdoc; iframe.srcdoc = ''; requestAnimationFrame(() => { iframe.srcdoc = s; }); } }} className="h-7 w-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Refresh</TooltipContent>
            </Tooltip>
          </div>
          <div className="h-5 w-px bg-white/[0.06] mx-0.5" />
          <SyncStatusIndicator status={syncStatus} lastSaved={lastSaved} />
          <HeaderCreditsIndicator onOpenBilling={() => setShowBilling(true)} />
          <div className="h-5 w-px bg-white/[0.06] mx-0.5" />
          <button
            onClick={() => setShowShareDialog(true)}
            className="h-6 px-2 rounded-md flex items-center gap-1 text-[11px] font-medium text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/[0.08] transition-colors"
          >
            <Users className="h-3 w-3" />
            Share
          </button>
          <button
            onClick={() => setShowPublishPanel(true)}
            className={cn(
              "h-6 px-2.5 rounded-md flex items-center gap-1 text-[11px] font-medium transition-colors",
              publishedUrl
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                : "bg-violet-500/15 text-violet-300/80 hover:text-violet-200 hover:bg-violet-500/25 border border-violet-500/20"
            )}
          >
            <Rocket className="h-3 w-3" />
            Publish
          </button>
        </div>
      </div>

      {/* Accent line */}
      <div className="h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 shrink-0" />

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
    </>
  );
}
