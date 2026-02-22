import { type RefObject } from 'react';
import { Input } from '@/components/ui/input';
import type { UndoEntry } from '@/hooks/useUndoRedo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SyncStatusIndicator, ProjectDropdownMenu, UndoPreviewPopover } from './lazyPanels';
import {
  Eye, Code, Rocket, MessageSquare, Users, ListTodo,
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
  hasPlan?: boolean;
  onTogglePlan?: () => void;
}

export function WorkspaceTopBar({
  projectName, isGenerating, hasFiles,
  isEditingName, editName, setEditName, setIsEditingName, onRename,
  undoStack, redoStack, canUndo, canRedo, currentFiles, onUndo, onRedo,
  rightTab, setRightTab,
  setShowSettingsPanel, setShowPublishPanel, setShowBilling, setShowShareDialog,
  syncStatus, lastSaved,
  publishedUrl, isMobile, mobileTab, setMobileTab,
  hasPlan, onTogglePlan,
}: WorkspaceTopBarProps) {
  return (
    <>
      {/* Top Bar — Lovable-style clean layout */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-white/[0.06] bg-[#0c0c0c] shrink-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        {/* LEFT: Logo + Project name + Undo/Redo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <a href="/ai-studio" className="shrink-0 flex items-center justify-center h-7 w-7">
            <img src={ultriumLogo} alt="UltriumAI" className="h-7 w-7 rounded-md object-contain" />
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

          {/* Undo/Redo — compact */}
          <div className="hidden md:flex items-center">
            <UndoPreviewPopover
              undoStack={undoStack}
              redoStack={redoStack}
              canUndo={canUndo}
              canRedo={canRedo}
              currentFiles={currentFiles}
              onUndo={onUndo}
              onRedo={onRedo}
            />
          </div>
        </div>

        {/* CENTER: Preview / Code toggle — Lovable-style pill */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setRightTab('preview')}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md font-medium transition-all",
                rightTab === 'preview'
                  ? "bg-white/[0.08] text-white/90 shadow-sm"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
            <button
              onClick={() => setRightTab('code')}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md font-medium transition-all",
                rightTab === 'code'
                  ? "bg-white/[0.08] text-white/90 shadow-sm"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              <Code className="h-3.5 w-3.5" />
              Code
            </button>
          </div>
          {hasPlan && (
            <button
              onClick={onTogglePlan}
              className="ml-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-500/[0.08] border border-cyan-500/20 transition-all"
            >
              <ListTodo className="h-3.5 w-3.5" />
              Plan
            </button>
          )}
        </div>

        {/* RIGHT: Sync status + Share + Publish */}
        <div className="flex items-center gap-2">
          <SyncStatusIndicator status={syncStatus} lastSaved={lastSaved} />
          <button
            onClick={() => setShowShareDialog(true)}
            className="hidden md:flex h-7 px-2.5 rounded-md items-center gap-1.5 text-xs font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            Share
          </button>
          <button
            onClick={() => setShowPublishPanel(true)}
            className="h-7 px-3 rounded-md flex items-center gap-1.5 text-xs font-medium bg-white text-black hover:bg-white/90 transition-colors"
          >
            <Rocket className="h-3 w-3" />
            Publish
          </button>
        </div>
      </div>

      {/* Mobile tab switcher */}
      {isMobile && (
        <div className="flex items-center h-11 border-b border-white/[0.06] bg-black/30 shrink-0 md:hidden">
          <button onClick={() => setMobileTab('chat')} className={cn("flex-1 h-full min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors", mobileTab === 'chat' ? "text-white border-b-2 border-white" : "text-white/40")}>
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </button>
          <button onClick={() => setMobileTab('preview' as any)} className={cn("flex-1 h-full min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors", mobileTab === ('preview' as any) ? "text-white border-b-2 border-white" : "text-white/40")}>
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button onClick={() => setMobileTab('editor')} className={cn("flex-1 h-full min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-medium transition-colors", mobileTab === 'editor' ? "text-white border-b-2 border-white" : "text-white/40")}>
            <Code className="h-3.5 w-3.5" />
            Code
          </button>
        </div>
      )}
    </>
  );
}
