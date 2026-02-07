import { ScrollArea } from '@/components/ui/scroll-area';
import {
  File, FileCode, FileText, Image, Folder, Trash2,
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
    case 'html': case 'htm': return <FileCode className="h-3.5 w-3.5 text-orange-400/70" />;
    case 'css': case 'scss': return <FileCode className="h-3.5 w-3.5 text-blue-400/70" />;
    case 'js': case 'jsx': return <FileCode className="h-3.5 w-3.5 text-yellow-400/70" />;
    case 'ts': case 'tsx': return <FileCode className="h-3.5 w-3.5 text-blue-500/70" />;
    case 'json': return <FileText className="h-3.5 w-3.5 text-emerald-400/70" />;
    case 'md': return <FileText className="h-3.5 w-3.5 text-white/30" />;
    case 'svg': case 'png': case 'jpg': return <Image className="h-3.5 w-3.5 text-violet-400/70" />;
    default: return <File className="h-3.5 w-3.5 text-white/30" />;
  }
}

function buildTree(files: ProjectFile[]) {
  const dirs = new Map<string, ProjectFile[]>();
  for (const file of files) {
    const parts = file.path.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
    if (!dirs.has(dir)) dirs.set(dir, []);
    dirs.get(dir)!.push(file);
  }
  return dirs;
}

export function ProjectFileTree({ files, activeFilePath, onSelectFile, onDeleteFile }: ProjectFileTreeProps) {
  const tree = buildTree(files);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/20 text-xs p-4 text-center">
        <Folder className="h-6 w-6 mb-2 opacity-30" />
        <p>No files yet</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0a0a0f] border-r border-white/[0.06]">
      <div className="px-3 py-2 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Explorer</h3>
      </div>
      <ScrollArea className="h-[calc(100%-33px)]">
        <div className="p-1.5 space-y-0.5">
          {Array.from(tree.entries()).map(([dir, dirFiles]) => (
            <div key={dir}>
              {dir !== '.' && (
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-white/20 uppercase tracking-wider">
                  <Folder className="h-3 w-3" />
                  {dir}
                </div>
              )}
              {dirFiles.map(file => {
                const fileName = file.path.split('/').pop()!;
                const isActive = activeFilePath === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => onSelectFile(file.path)}
                    className={cn(
                      'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-all group',
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300 border-l-2 border-cyan-400'
                        : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03] border-l-2 border-transparent'
                    )}
                  >
                    {getFileIcon(file.path)}
                    <span className="truncate flex-1 text-left font-mono">{fileName}</span>
                    <button
                      className="h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded shrink-0 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.path);
                      }}
                    >
                      <Trash2 className="h-2.5 w-2.5 text-red-400/60" />
                    </button>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
