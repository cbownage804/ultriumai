import { Button } from '@/components/ui/button';
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
    <div className="flex items-center border-b border-border bg-background overflow-x-auto">
      {openPaths.map(path => {
        const fileName = path.split('/').pop()!;
        const isActive = path === activePath;
        return (
          <button
            key={path}
            onClick={() => onSelect(path)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs border-r border-border whitespace-nowrap transition-colors group',
              isActive
                ? 'bg-background text-foreground border-b-2 border-b-primary'
                : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <FileCode className="h-3 w-3 shrink-0" />
            <span>{fileName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(path);
              }}
              className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </button>
        );
      })}
    </div>
  );
}
