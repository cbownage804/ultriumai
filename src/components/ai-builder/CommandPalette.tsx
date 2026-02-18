import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import {
  FileCode, Eye, Code, Settings, Trash2, Save, Upload, GitBranch, Undo2, Redo2,
  MessageCircle, Hammer, LayoutGrid, Search, Sparkles, RefreshCw, Download,
} from 'lucide-react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: ProjectFile[];
  onSelectFile: (path: string) => void;
  onSwitchTab: (tab: 'preview' | 'code') => void;
  onSwitchMode: (mode: 'build' | 'discuss') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onClear?: () => void;
  onOpenTemplates?: () => void;
  onOpenSettings?: () => void;
  onExport?: () => void;
  onPublish?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function CommandPalette({
  open, onOpenChange, files, onSelectFile, onSwitchTab, onSwitchMode,
  onUndo, onRedo, onSave, onClear, onOpenTemplates, onOpenSettings,
  onExport, onPublish, canUndo, canRedo,
}: CommandPaletteProps) {

  const runAndClose = useCallback((fn?: () => void) => {
    fn?.();
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <Search className="h-4 w-4 text-white/30" />
        <CommandInput
          placeholder="Search files, actions, settings..."
          className="text-sm text-white placeholder:text-white/30 bg-transparent border-none outline-none flex-1"
        />
        <kbd className="text-[10px] text-white/20 bg-white/[0.06] border border-white/[0.08] rounded px-1.5 py-0.5 font-mono">ESC</kbd>
      </div>
      <CommandList className="max-h-80 overflow-auto px-2 pb-2">
        <CommandEmpty className="py-6 text-center text-sm text-white/30">
          No results found.
        </CommandEmpty>

        {files.length > 0 && (
          <CommandGroup heading="Files" className="text-[10px] text-white/25 uppercase tracking-wider">
            {files.slice(0, 10).map(f => (
              <CommandItem
                key={f.path}
                value={`file:${f.path}`}
                onSelect={() => { onSelectFile(f.path); onSwitchTab('code'); onOpenChange(false); }}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white"
              >
                <FileCode className="h-3.5 w-3.5 text-cyan-400/60 shrink-0" />
                <span className="font-mono text-xs truncate">{f.path}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="my-1 bg-white/[0.06]" />

        <CommandGroup heading="View" className="text-[10px] text-white/25 uppercase tracking-wider">
          <CommandItem onSelect={() => runAndClose(() => onSwitchTab('preview'))} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
            <Eye className="h-3.5 w-3.5 text-white/40" /> Show Preview
          </CommandItem>
          <CommandItem onSelect={() => runAndClose(() => onSwitchTab('code'))} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
            <Code className="h-3.5 w-3.5 text-white/40" /> Show Code Editor
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1 bg-white/[0.06]" />

        <CommandGroup heading="Mode" className="text-[10px] text-white/25 uppercase tracking-wider">
          <CommandItem onSelect={() => runAndClose(() => onSwitchMode('build'))} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
            <Hammer className="h-3.5 w-3.5 text-violet-400/60" /> Switch to Build Mode
          </CommandItem>
          <CommandItem onSelect={() => runAndClose(() => onSwitchMode('discuss'))} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
            <MessageCircle className="h-3.5 w-3.5 text-cyan-400/60" /> Switch to Discuss Mode
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1 bg-white/[0.06]" />

        <CommandGroup heading="Actions" className="text-[10px] text-white/25 uppercase tracking-wider">
          {onSave && (
            <CommandItem onSelect={() => runAndClose(onSave)} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
              <Save className="h-3.5 w-3.5 text-white/40" /> Save Project
              <kbd className="ml-auto text-[10px] text-white/20 bg-white/[0.06] border border-white/[0.08] rounded px-1 font-mono">⌘S</kbd>
            </CommandItem>
          )}
          {onUndo && (
            <CommandItem disabled={!canUndo} onSelect={() => runAndClose(onUndo)} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
              <Undo2 className="h-3.5 w-3.5 text-white/40" /> Undo
              <kbd className="ml-auto text-[10px] text-white/20 bg-white/[0.06] border border-white/[0.08] rounded px-1 font-mono">⌘Z</kbd>
            </CommandItem>
          )}
          {onRedo && (
            <CommandItem disabled={!canRedo} onSelect={() => runAndClose(onRedo)} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
              <Redo2 className="h-3.5 w-3.5 text-white/40" /> Redo
              <kbd className="ml-auto text-[10px] text-white/20 bg-white/[0.06] border border-white/[0.08] rounded px-1 font-mono">⌘⇧Z</kbd>
            </CommandItem>
          )}
          {onOpenTemplates && (
            <CommandItem onSelect={() => runAndClose(onOpenTemplates)} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
              <LayoutGrid className="h-3.5 w-3.5 text-white/40" /> Browse Templates
            </CommandItem>
          )}
          {onExport && (
            <CommandItem onSelect={() => runAndClose(onExport)} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
              <Download className="h-3.5 w-3.5 text-white/40" /> Export Project
            </CommandItem>
          )}
          {onPublish && (
            <CommandItem onSelect={() => runAndClose(onPublish)} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-white/[0.06] aria-selected:text-white">
              <Upload className="h-3.5 w-3.5 text-emerald-400/60" /> Publish to Live URL
            </CommandItem>
          )}
          {onClear && (
            <CommandItem onSelect={() => runAndClose(onClear)} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer rounded-lg px-2.5 py-2 aria-selected:bg-red-500/10 aria-selected:text-red-300">
              <Trash2 className="h-3.5 w-3.5 text-red-400/60" /> Clear Chat & Reset
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
