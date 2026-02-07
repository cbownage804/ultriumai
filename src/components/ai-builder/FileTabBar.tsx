import { X, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTabBarProps {
  openPaths: string[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

export function FileTabBar({ openPaths, activePath, onSelect, onClose }: FileTabBarProps) {
  if (openPaths.length === 0) return null;

  return (
    <div className="flex items-center border-b border-white/[0.06] bg-black/20 overflow-x-auto shrink-0">
      {openPaths.map(path => {
        const fileName = path.split('/').pop()!;
        const isActive = path === activePath;
        return (
          <button
            key={path}
            onClick={() => onSelect(path)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-[11px] whitespace-nowrap transition-all group relative font-mono',
              isActive
                ? 'text-white bg-[#0d0d14]'
                : 'text-white/30 hover:text-white/50 bg-black/20 hover:bg-white/[0.02]'
            )}
          >
            <FileCode className="h-3 w-3 shrink-0" />
            <span>{fileName}</span>
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
