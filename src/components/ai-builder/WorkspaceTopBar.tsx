import { useState, useCallback, type RefObject } from 'react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToolbarPanelsDropdown } from './lazyPanels';
import { SyncStatusIndicator, HeaderCreditsIndicator, ProjectDropdownMenu } from './lazyPanels';
import {
  Eye, Code, Pencil, Database, Undo2, Redo2, Search, History,
  Columns, Rocket, Terminal, Globe, Users, Zap, RefreshCw, ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import ultriumLogo from '/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png';

interface WorkspaceTopBarProps {
  projectName: string;
  isEditingName: boolean;
  editName: string;
  setEditName: (v: string) => void;
  setIsEditingName: (v: boolean) => void;
  onRename: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  rightTab: 'preview' | 'code' | 'split';
  setRightTab: (v: 'preview' | 'code' | 'split') => void;
  showCommandPalette: boolean;
  setShowCommandPalette: (v: boolean) => void;
  setShowTimeline: (v: (prev: boolean) => boolean) => void;
  setShowVersionHistory: (v: boolean) => void;
  onOpenPanel: (key: string) => void;
  setShowSupabaseIDE: (v: boolean) => void;
  setShowTerminal: (v: boolean) => void;
  previewCurrentUrl: string;
  previewIframeRef: RefObject<HTMLIFrameElement | null>;
  syncStatus: string;
  lastSaved: Date | null;
  setShowBilling: (v: boolean) => void;
  setShowShareDialog: (v: boolean) => void;
  setShowPublishPanel: (v: boolean) => void;
  publishedUrl: string | null;
  isMobile: boolean;
  mobileTab: 'chat' | 'preview' | 'editor';
  setMobileTab: (v: 'chat' | 'preview' | 'editor') => void;
  showBugReport: boolean;
  setShowBugReport: (v: boolean) => void;
  onSave: () => void;
  onClear: () => void;
  savedProjects: any[];
  loadProjects: () => void;
  onLoadProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  hasFiles: boolean;
}

export function WorkspaceTopBar({
  projectName, isEditingName, editName, setEditName, setIsEditingName, onRename,
  canUndo, canRedo, onUndo, onRedo,
  rightTab, setRightTab,
  showCommandPalette, setShowCommandPalette,
  setShowTimeline, setShowVersionHistory,
  onOpenPanel, setShowSupabaseIDE, setShowTerminal,
  previewCurrentUrl, previewIframeRef,
  syncStatus, lastSaved,
  setShowBilling, setShowShareDialog, setShowPublishPanel,
  publishedUrl, isMobile, mobileTab, setMobileTab,
  showBugReport, setShowBugReport,
  onSave, onClear, savedProjects, loadProjects, onLoadProject, onDeleteProject,
  hasFiles,
}: WorkspaceTopBarProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Top Bar */}
      <div className="flex items-center h-11 px-2 border-b border-white/[0.06] bg-[#09090b] shrink-0 gap-2">
        {/* LEFT: Logo + Project name + undo/redo */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <button onClick={() => navigate('/hub')} className="flex items-center gap-1.5 px-1 group" title="Back to Hub">
            <ArrowLeft className="h-3 w-3 text-white/30 group-hover:text-white/60 transition-colors" />
            <img src={ultriumLogo} alt="Ultrium" className="h-5 w-5 object-contain" />
          </button>

          {/* Project dropdown menu */}
          <ProjectDropdownMenu
            projectName={projectName}
            isEditingName={isEditingName}
            editName={editName}
            onEditNameChange={setEditName}
            onStartEditing={() => { setEditName(projectName); setIsEditingName(true); }}
            onFinishEditing={onRename}
            onCancelEditing={() => setIsEditingName(false)}
            onSave={onSave}
            onClear={onClear}
            showBugReport={showBugReport}
            onToggleBugReport={() => setShowBugReport(!showBugReport)}
            savedProjects={savedProjects}
            onLoadProjects={loadProjects}
            onLoadProject={onLoadProject}
            onDeleteProject={onDeleteProject}
          />

          {/* Undo/Redo + Search */}
          <div className="flex items-center gap-0.5 ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onUndo} disabled={!canUndo} className="h-7 w-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 disabled:opacity-20 transition-colors">
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Undo ⌘Z</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onRedo} disabled={!canRedo} className="h-7 w-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 disabled:opacity-20 transition-colors">
                  <Redo2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Redo ⌘⇧Z</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowCommandPalette(true)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors">
                  <Search className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Command Palette ⌘K</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowTimeline(prev => !prev)} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
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
          <div className="h-4 w-px bg-white/[0.08] mx-0.5" />
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

      {/* Orange accent line under header */}
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
