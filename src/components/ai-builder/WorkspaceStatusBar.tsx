import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIAutocompleteIndicator } from './lazyPanels';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface WorkspaceStatusBarProps {
  hasFiles: boolean;
  isMobile: boolean;
  isGenerating: boolean;
  activeFileLanguage: string | undefined;
  cursorPosition: { line: number; column: number };
  fileCount: number;
  activeBranchName: string;
  dirtyFilesCount: number;
  aiAutocompleteEnabled: boolean;
  onToggleAutocomplete: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  buildCount?: number;
}

export function WorkspaceStatusBar({
  hasFiles, isMobile, isGenerating, activeFileLanguage, cursorPosition,
  fileCount, activeBranchName, dirtyFilesCount,
  aiAutocompleteEnabled, onToggleAutocomplete, isSaving, lastSaved,
  buildCount,
}: WorkspaceStatusBarProps) {
  if (!hasFiles || isMobile) return null;

  return (
    <div className="flex items-center h-6 px-3 border-t border-white/[0.06] bg-[#09090b] text-[10px] text-white/30 font-mono shrink-0 gap-3">
      <div className="flex items-center gap-1.5">
        <div className={cn(
          "h-1.5 w-1.5 rounded-full",
          isGenerating ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
        )} />
        <span>{isGenerating ? 'Building' : 'Ready'}</span>
      </div>
      <div className="h-3 w-px bg-white/[0.06]" />
      <span>{activeFileLanguage || 'plaintext'}</span>
      <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
      <div className="h-3 w-px bg-white/[0.06]" />
      <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
      <span className="text-cyan-400/50">{activeBranchName}</span>
      {dirtyFilesCount > 0 && (
        <span className="text-amber-400/60 flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-amber-400/60" />
          {dirtyFilesCount} unsaved
        </span>
      )}
      {buildCount !== undefined && buildCount > 0 && (
        <>
          <div className="h-3 w-px bg-white/[0.06]" />
          <span className="text-violet-400/50">{buildCount} build{buildCount !== 1 ? 's' : ''} today</span>
        </>
      )}
      <div className="flex-1" />
      <AIAutocompleteIndicator enabled={aiAutocompleteEnabled} onToggle={onToggleAutocomplete} />
      <div className="h-3 w-px bg-white/[0.06]" />
      <span>{isSaving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}</span>
    </div>
  );
}
