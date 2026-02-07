import { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  File, FileCode, FileText, Image, Folder, Trash2, Plus, Download, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface ProjectFileTreeProps {
  files: ProjectFile[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onCreateFile?: (path: string) => void;
  onRenameFile?: (oldPath: string, newPath: string) => void;
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

function downloadFile(file: ProjectFile) {
  const blob = new Blob([file.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.path.split('/').pop() || 'file';
  a.click();
  URL.revokeObjectURL(url);
}

export function ProjectFileTree({ files, activeFilePath, onSelectFile, onDeleteFile, onCreateFile, onRenameFile }: ProjectFileTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const tree = buildTree(files);

  const handleCreate = () => {
    const name = newFileName.trim();
    if (name && onCreateFile) {
      onCreateFile(name);
    }
    setNewFileName('');
    setIsCreating(false);
  };

  const handleRename = (oldPath: string) => {
    const val = renameValue.trim();
    if (val && onRenameFile && val !== oldPath.split('/').pop()) {
      const parts = oldPath.split('/');
      parts[parts.length - 1] = val;
      onRenameFile(oldPath, parts.join('/'));
    }
    setRenamingPath(null);
    setRenameValue('');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!onCreateFile) return;
    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) onCreateFile(file.name);
      };
      reader.readAsText(file);
    }
  }, [onCreateFile]);

  if (files.length === 0 && !isCreating) {
    return (
      <div
        className={cn("flex flex-col items-center justify-center h-full text-white/20 text-xs p-4 text-center", isDragOver && "bg-cyan-500/5 border-2 border-dashed border-cyan-500/20")}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <Folder className="h-6 w-6 mb-2 opacity-30" />
        <p>{isDragOver ? 'Drop files here' : 'No files yet'}</p>
      </div>
    );
  }

  return (
    <div
      className={cn("h-full bg-[#0a0a0f] border-r border-white/[0.06]", isDragOver && "ring-1 ring-inset ring-cyan-500/20")}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Explorer</h3>
        {onCreateFile && (
          <button
            onClick={() => setIsCreating(true)}
            className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors"
            title="New file"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>
      <ScrollArea className="h-[calc(100%-33px)]">
        <div className="p-1.5 space-y-0.5">
          {/* New file input */}
          {isCreating && (
            <div className="flex items-center gap-1.5 px-2 py-1">
              <File className="h-3.5 w-3.5 text-cyan-400/50 shrink-0" />
              <input
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') { setIsCreating(false); setNewFileName(''); }
                }}
                onBlur={handleCreate}
                placeholder="filename.html"
                className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/20 outline-none border-b border-cyan-500/30 font-mono py-0.5"
              />
            </div>
          )}

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
                const isRenaming = renamingPath === file.path;

                return (
                  <div
                    key={file.path}
                    className={cn(
                      'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-all group',
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-300 border-l-2 border-cyan-400'
                        : 'text-white/50 hover:text-white/70 hover:bg-white/[0.03] border-l-2 border-transparent'
                    )}
                  >
                    <button
                      onClick={() => onSelectFile(file.path)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    >
                      {getFileIcon(file.path)}
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(file.path);
                            if (e.key === 'Escape') { setRenamingPath(null); setRenameValue(''); }
                          }}
                          onBlur={() => handleRename(file.path)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-transparent text-xs text-white/80 outline-none border-b border-cyan-500/30 font-mono py-0"
                        />
                      ) : (
                        <span className="truncate flex-1 font-mono">{fileName}</span>
                      )}
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {onRenameFile && (
                        <button
                          className="h-5 w-5 flex items-center justify-center hover:bg-white/10 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingPath(file.path);
                            setRenameValue(fileName);
                          }}
                          title="Rename"
                        >
                          <Pencil className="h-2.5 w-2.5 text-white/40" />
                        </button>
                      )}
                      <button
                        className="h-5 w-5 flex items-center justify-center hover:bg-white/10 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file);
                        }}
                        title="Download"
                      >
                        <Download className="h-2.5 w-2.5 text-white/40" />
                      </button>
                      <button
                        className="h-5 w-5 flex items-center justify-center hover:bg-white/10 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(file.path);
                        }}
                      >
                        <Trash2 className="h-2.5 w-2.5 text-red-400/60" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
