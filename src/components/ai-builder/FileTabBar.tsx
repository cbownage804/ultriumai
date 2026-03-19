import { useState, useRef, useCallback } from 'react';
import { X, FileCode, FileText, Image, File, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FileTabBarProps {
  openPaths: string[];
  activePath: string | null;
  dirtyFiles?: Set<string>;
  /** Path of the file currently being streamed by the AI */
  streamingFilePath?: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  onReorder?: (paths: string[]) => void;
  /** Per-file undo — check if a file has undo history */
  hasFileHistory?: (path: string) => boolean;
  /** Per-file undo — revert a single file */
  onUndoFile?: (path: string) => void;
}

function getTabIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'html': case 'htm': return <FileCode className="h-3 w-3 text-orange-400/60" />;
    case 'css': case 'scss': return <FileCode className="h-3 w-3 text-blue-400/60" />;
    case 'js': case 'jsx': return <FileCode className="h-3 w-3 text-yellow-400/60" />;
    case 'ts': case 'tsx': return <FileCode className="h-3 w-3 text-blue-500/60" />;
    case 'json': return <FileText className="h-3 w-3 text-emerald-400/60" />;
    case 'md': return <FileText className="h-3 w-3 text-white/25" />;
    case 'svg': case 'png': case 'jpg': case 'gif': return <Image className="h-3 w-3 text-violet-400/60" />;
    default: return <File className="h-3 w-3 text-white/25" />;
  }
}

export function FileTabBar({ openPaths, activePath, dirtyFiles, streamingFilePath, onSelect, onClose, onReorder, hasFileHistory, onUndoFile }: FileTabBarProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === dropIndex) return;
    const reordered = [...openPaths];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    onReorder?.(reordered);
    dragIndexRef.current = null;
  }, [openPaths, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }, []);

  if (openPaths.length === 0) return null;

  return (
    <div className="flex items-center overflow-x-auto scrollbar-none shrink-0">
      {openPaths.map((path, index) => {
        const fileName = path.split('/').pop()!;
        const isActive = path === activePath;
        const isDirty = dirtyFiles?.has(path);
        const isStreamingThis = streamingFilePath === path;
        return (
          <button
            key={path}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(path)}
            className={cn(
              'flex items-center gap-1.5 px-3 h-9 text-[11px] whitespace-nowrap transition-all group relative font-mono cursor-grab active:cursor-grabbing border-r border-white/[0.04]',
              isActive
                ? 'text-white/90 bg-[#0d0d14]'
                : 'text-white/30 hover:text-white/50 bg-[#08080c] hover:bg-white/[0.02]',
              dragOverIndex === index && 'border-l-2 border-cyan-400'
            )}
          >
            {getTabIcon(path)}
            <span>{fileName}</span>
            {isStreamingThis && (
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            )}
            {isDirty && !isStreamingThis && (
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(path);
              }}
              className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </button>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
