import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  File, FileCode, FileText, Image, Folder, Trash2, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface ProjectFileTreeProps {
  files: ProjectFile[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
}

function getFileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'html': case 'htm': return <FileCode className="h-3.5 w-3.5 text-orange-400" />;
    case 'css': case 'scss': return <FileCode className="h-3.5 w-3.5 text-blue-400" />;
    case 'js': case 'jsx': return <FileCode className="h-3.5 w-3.5 text-yellow-400" />;
    case 'ts': case 'tsx': return <FileCode className="h-3.5 w-3.5 text-blue-500" />;
    case 'json': return <FileText className="h-3.5 w-3.5 text-green-400" />;
    case 'md': return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'svg': case 'png': case 'jpg': return <Image className="h-3.5 w-3.5 text-purple-400" />;
    default: return <File className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

/** Group files by directory for tree display */
function buildTree(files: ProjectFile[]) {
  const dirs = new Map<string, ProjectFile[]>();

  for (const file of files) {
    const parts = file.path.split('/');
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/');
      if (!dirs.has(dir)) dirs.set(dir, []);
      dirs.get(dir)!.push(file);
    } else {
      if (!dirs.has('.')) dirs.set('.', []);
      dirs.get('.')!.push(file);
    }
  }

  return dirs;
}

export function ProjectFileTree({
  files,
  activeFilePath,
  onSelectFile,
  onDeleteFile,
}: ProjectFileTreeProps) {
  const tree = buildTree(files);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm p-4 text-center">
        <Folder className="h-8 w-8 mb-2 opacity-30" />
        <p>No files yet</p>
        <p className="text-xs mt-1">Start building in the chat</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {Array.from(tree.entries()).map(([dir, dirFiles]) => (
          <div key={dir}>
            {dir !== '.' && (
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Folder className="h-3 w-3" />
                {dir}
              </div>
            )}
            {dirFiles.map(file => {
              const fileName = file.path.split('/').pop()!;
              return (
                <button
                  key={file.path}
                  onClick={() => onSelectFile(file.path)}
                  className={cn(
                    'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors group',
                    activeFilePath === file.path
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/50 text-foreground/80'
                  )}
                >
                  {getFileIcon(file.path)}
                  <span className="truncate flex-1 text-left">{fileName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.path);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
