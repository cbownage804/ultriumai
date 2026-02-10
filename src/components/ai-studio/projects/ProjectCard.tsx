import { cn } from '@/lib/utils';
import {
  Clock, Code2, Globe, MoreHorizontal, FolderOpen, Pencil, Copy,
  ExternalLink, Trash2, Bot, Star, FileCode, CheckSquare, Square,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface UnifiedItem {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  type: 'app' | 'gpt';
  thumbnail_url?: string | null;
  is_published?: boolean;
  published_url?: string | null;
  files?: any[];
  pinned?: boolean;
}

interface ProjectCardProps {
  item: UnifiedItem;
  isRenaming: boolean;
  renameValue: string;
  onRenameChange: (val: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onOpen: () => void;
  onStartRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  formatTimeAgo: (ts: string) => string;
  getFileCount: (files: any) => number;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export function ProjectCard({
  item, isRenaming, renameValue, onRenameChange, onRenameSubmit, onRenameCancel,
  onOpen, onStartRename, onDuplicate, onDelete, onTogglePin, formatTimeAgo,
  getFileCount, selectionMode, isSelected, onToggleSelect,
}: ProjectCardProps) {
  const fileCount = item.type === 'app' ? getFileCount(item.files) : 0;
  const status = item.is_published ? 'deployed' : 'draft';

  return (
    <div
      onClick={() => selectionMode ? onToggleSelect() : onOpen()}
      className={cn(
        "group relative h-[260px] rounded-xl border bg-card/50 cursor-pointer transition-all overflow-hidden",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          className="absolute top-2 right-2 z-20 h-6 w-6 rounded flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border/50"
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : (
            <Square className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      )}

      {/* Pin button */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        className={cn(
          "absolute top-2 right-2 z-10 h-6 w-6 rounded flex items-center justify-center transition-all",
          selectionMode && "hidden",
          item.pinned
            ? "text-amber-400"
            : "text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-amber-400"
        )}
      >
        <Star className={cn("h-3.5 w-3.5", item.pinned && "fill-current")} />
      </button>

      {/* Preview thumbnail */}
      <div className="h-[180px] overflow-hidden relative">
        {item.thumbnail_url ? (
          <img
            src={item.thumbnail_url}
            alt={`${item.name} preview`}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center",
            item.type === 'app'
              ? "bg-gradient-to-br from-card via-muted/30 to-card"
              : "bg-gradient-to-br from-primary/10 to-muted/10"
          )}>
            {item.type === 'app' ? (
              <Code2 className="h-8 w-8 text-muted-foreground/20" />
            ) : (
              <Bot className="h-8 w-8 text-muted-foreground/20" />
            )}
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <Badge className={cn(
            "text-[10px] border-0",
            item.type === 'app' ? "bg-violet-500/80" : "bg-primary/80"
          )}>
            {item.type === 'app' ? 'App' : 'GPT'}
          </Badge>
          {status === 'deployed' && (
            <Badge className="text-[10px] border-0 bg-emerald-500/80">
              <Globe className="h-2.5 w-2.5 mr-0.5" /> Live
            </Badge>
          )}
        </div>
      </div>

      {/* Info footer */}
      <div className="p-2.5 flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <input
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onBlur={onRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSubmit();
                if (e.key === 'Escape') onRenameCancel();
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium bg-transparent border-b border-primary/50 outline-none w-full text-foreground"
              autoFocus
            />
          ) : (
            <h3 className="text-xs font-medium truncate group-hover:text-primary transition-colors">
              {item.name || (item.type === 'app' ? 'Untitled Project' : 'Untitled GPT')}
            </h3>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {formatTimeAgo(item.updated_at)}
            </span>
            {item.type === 'app' && fileCount > 0 && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <FileCode className="h-2.5 w-2.5" />
                {fileCount}
              </span>
            )}
          </div>
        </div>

        {!selectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-all">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(); }}>
                <FolderOpen className="h-4 w-4 mr-2" /> Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onStartRename(); }}>
                <Pencil className="h-4 w-4 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(); }}>
                <Star className={cn("h-4 w-4 mr-2", item.pinned && "fill-current text-amber-400")} />
                {item.pinned ? 'Unpin' : 'Pin to top'}
              </DropdownMenuItem>
              {item.type === 'app' && item.published_url && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(item.published_url!, '_blank'); }}>
                  <ExternalLink className="h-4 w-4 mr-2" /> View live
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
