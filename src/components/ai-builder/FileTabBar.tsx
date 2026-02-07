import { useState, useRef, useCallback } from 'react';
import { X, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTabBarProps {
  openPaths: string[];
  activePath: string | null;
  dirtyFiles?: Set<string>;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  onReorder?: (paths: string[]) => void;
}

export function FileTabBar({ openPaths, activePath, dirtyFiles, onSelect, onClose, onReorder }: FileTabBarProps) {
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
    <div className="flex items-center border-b border-white/[0.06] bg-black/20 overflow-x-auto shrink-0">
      {openPaths.map((path, index) => {
        const fileName = path.split('/').pop()!;
        const isActive = path === activePath;
        const isDirty = dirtyFiles?.has(path);
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
              'flex items-center gap-1.5 px-3 py-2 text-[11px] whitespace-nowrap transition-all group relative font-mono cursor-grab active:cursor-grabbing',
              isActive
                ? 'text-white bg-[#0d0d14]'
                : 'text-white/30 hover:text-white/50 bg-black/20 hover:bg-white/[0.02]',
              dragOverIndex === index && 'border-l-2 border-cyan-400'
            )}
          >
            <FileCode className="h-3 w-3 shrink-0" />
            <span>{fileName}</span>
            {isDirty && (
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
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-violet-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
