import { useState, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  File, FileCode, FileText, Image, Folder, FolderOpen, Trash2, Plus, Download, Pencil,
  ChevronRight, ChevronDown, Search, X,
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
  /** Previous files snapshot for diff indicators */
  previousFiles?: ProjectFile[];
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
    case 'svg': case 'png': case 'jpg': case 'gif': case 'webp': return <Image className="h-3.5 w-3.5 text-violet-400/70" />;
    default: return <File className="h-3.5 w-3.5 text-white/30" />;
  }
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  file?: ProjectFile;
}

function buildNestedTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', isFolder: true, children: [] };
  
  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      
      if (isLast) {
        current.children.push({ name: part, path: file.path, isFolder: false, children: [], file });
      } else {
        let folder = current.children.find(c => c.isFolder && c.name === part);
        if (!folder) {
          folder = { name: part, path: parts.slice(0, i + 1).join('/'), isFolder: true, children: [] };
          current.children.push(folder);
        }
        current = folder;
      }
    }
  }
  
  // Sort: folders first, then alphabetical
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(n => ({ ...n, children: sortNodes(n.children) }));
  };
  
  return sortNodes(root.children);
}

function countFiles(node: TreeNode): number {
  if (!node.isFolder) return 1;
  return node.children.reduce((sum, c) => sum + countFiles(c), 0);
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

function TreeItem({ 
  node, depth, activeFilePath, expandedFolders, searchQuery,
  onSelectFile, onDeleteFile, onToggleFolder, renamingPath, renameValue,
  onStartRename, onRenameChange, onFinishRename, onCancelRename, onRenameFile, onDownload,
  fileStatus,
}: {
  node: TreeNode;
  depth: number;
  activeFilePath: string | null;
  expandedFolders: Set<string>;
  searchQuery: string;
  onSelectFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onToggleFolder: (path: string) => void;
  renamingPath: string | null;
  renameValue: string;
  onStartRename: (path: string, name: string) => void;
  onRenameChange: (val: string) => void;
  onFinishRename: (oldPath: string) => void;
  onCancelRename: () => void;
  onRenameFile?: (oldPath: string, newPath: string) => void;
  onDownload: (file: ProjectFile) => void;
  fileStatus?: Map<string, 'new' | 'modified'>;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeFilePath === node.path;
  const isRenaming = renamingPath === node.path;
  const fileCount = node.isFolder ? countFiles(node) : 0;

  if (node.isFolder) {
    return (
      <div>
        <button
          onClick={() => onToggleFolder(node.path)}
          className={cn(
            "flex items-center gap-1.5 w-full rounded-md text-[11px] transition-all group hover:bg-white/[0.03]",
            "text-white/40 hover:text-white/60"
          )}
          style={{ paddingLeft: `${depth * 12 + 6}px`, paddingRight: 6, paddingTop: 3, paddingBottom: 3 }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-white/20 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-white/20 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-cyan-400/50 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-white/25 shrink-0" />
          )}
          <span className="truncate font-medium">{node.name}</span>
          <span className="text-[9px] text-white/15 ml-auto shrink-0">{fileCount}</span>
        </button>
        {isExpanded && node.children.map(child => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            activeFilePath={activeFilePath}
            expandedFolders={expandedFolders}
            searchQuery={searchQuery}
            onSelectFile={onSelectFile}
            onDeleteFile={onDeleteFile}
            onToggleFolder={onToggleFolder}
            renamingPath={renamingPath}
            renameValue={renameValue}
            onStartRename={onStartRename}
            onRenameChange={onRenameChange}
            onFinishRename={onFinishRename}
            onCancelRename={onCancelRename}
            onRenameFile={onRenameFile}
            onDownload={onDownload}
            fileStatus={fileStatus}
          />
        ))}
      </div>
    );
  }

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const status = fileStatus?.get(node.path);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center gap-1.5 w-full rounded-md text-[11px] transition-all group',
          isActive
            ? 'bg-cyan-500/10 text-cyan-300'
            : 'text-white/45 hover:text-white/70 hover:bg-white/[0.03]'
        )}
        style={{ paddingLeft: `${depth * 12 + 20}px`, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}
        onContextMenu={handleContextMenu}
      >
        <button
          onClick={() => onSelectFile(node.path)}
          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
        >
          {getFileIcon(node.path)}
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onFinishRename(node.path);
                if (e.key === 'Escape') onCancelRename();
              }}
              onBlur={() => onFinishRename(node.path)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent text-[11px] text-white/80 outline-none border-b border-cyan-500/30 font-mono py-0"
            />
          ) : (
            <span className="truncate flex-1 font-mono">{node.name}</span>
          )}
          {status && (
            <div className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0 ml-1",
              status === 'new' ? "bg-emerald-400" : "bg-amber-400"
            )} title={status === 'new' ? 'New file' : 'Modified'} />
          )}
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {onRenameFile && (
            <button
              className="h-4 w-4 flex items-center justify-center hover:bg-white/10 rounded"
              onClick={(e) => { e.stopPropagation(); onStartRename(node.path, node.name); }}
              title="Rename"
            >
              <Pencil className="h-2.5 w-2.5 text-white/30" />
            </button>
          )}
          {node.file && (
            <button
              className="h-4 w-4 flex items-center justify-center hover:bg-white/10 rounded"
              onClick={(e) => { e.stopPropagation(); onDownload(node.file!); }}
              title="Download"
            >
              <Download className="h-2.5 w-2.5 text-white/30" />
            </button>
          )}
          <button
            className="h-4 w-4 flex items-center justify-center hover:bg-white/10 rounded"
            onClick={(e) => { e.stopPropagation(); onDeleteFile(node.path); }}
            title="Delete"
          >
            <Trash2 className="h-2.5 w-2.5 text-red-400/50" />
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowContextMenu(false)} />
          <div
            className="fixed z-50 bg-[#0d0d14] border border-white/[0.08] rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          >
            {onRenameFile && (
              <button onClick={() => { setShowContextMenu(false); onStartRename(node.path, node.name); }} className="w-full text-left px-3 py-1.5 text-[11px] text-white/60 hover:text-white/90 hover:bg-white/[0.04] flex items-center gap-2">
                <Pencil className="h-3 w-3" /> Rename
              </button>
            )}
            {node.file && (
              <button onClick={() => { setShowContextMenu(false); onDownload(node.file!); }} className="w-full text-left px-3 py-1.5 text-[11px] text-white/60 hover:text-white/90 hover:bg-white/[0.04] flex items-center gap-2">
                <Download className="h-3 w-3" /> Download
              </button>
            )}
            <button onClick={() => { setShowContextMenu(false); navigator.clipboard.writeText(node.path); }} className="w-full text-left px-3 py-1.5 text-[11px] text-white/60 hover:text-white/90 hover:bg-white/[0.04] flex items-center gap-2">
              <File className="h-3 w-3" /> Copy Path
            </button>
            <div className="h-px bg-white/[0.06] my-1" />
            <button onClick={() => { setShowContextMenu(false); onDeleteFile(node.path); }} className="w-full text-left px-3 py-1.5 text-[11px] text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.04] flex items-center gap-2">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ProjectFileTree({ files, activeFilePath, onSelectFile, onDeleteFile, onCreateFile, onRenameFile, previousFiles }: ProjectFileTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Auto-expand all folders on first render or when files change
  useMemo(() => {
    const folders = new Set<string>();
    for (const file of files) {
      const parts = file.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        folders.add(parts.slice(0, i).join('/'));
      }
    }
    setExpandedFolders(folders);
  }, [files.length]);

  const tree = useMemo(() => buildNestedTree(files), [files]);

  // Compute file diff status compared to previousFiles
  const fileStatus = useMemo(() => {
    if (!previousFiles || previousFiles.length === 0) return undefined;
    const statusMap = new Map<string, 'new' | 'modified'>();
    const prevMap = new Map(previousFiles.map(f => [f.path, f.content]));
    for (const f of files) {
      const prev = prevMap.get(f.path);
      if (prev === undefined) statusMap.set(f.path, 'new');
      else if (prev !== f.content) statusMap.set(f.path, 'modified');
    }
    return statusMap.size > 0 ? statusMap : undefined;
  }, [files, previousFiles]);

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree;
    const q = searchQuery.toLowerCase();
    const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce<TreeNode[]>((acc, node) => {
        if (!node.isFolder) {
          if (node.name.toLowerCase().includes(q)) acc.push(node);
        } else {
          const filtered = filterNodes(node.children);
          if (filtered.length > 0) acc.push({ ...node, children: filtered });
        }
        return acc;
      }, []);
    };
    return filterNodes(tree);
  }, [tree, searchQuery]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const handleCreate = () => {
    const name = newFileName.trim();
    if (name && onCreateFile) onCreateFile(name);
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
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-white/[0.06] flex items-center justify-between gap-1">
        <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest shrink-0">Explorer</span>
        <div className="flex items-center gap-0.5">
          <span className="text-[9px] text-white/15 font-mono">{files.length}</span>
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
      </div>

      {/* Search filter */}
      <div className="px-2 py-1.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.06] rounded-md px-2 h-6">
          <Search className="h-2.5 w-2.5 text-white/20 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files..."
            className="flex-1 bg-transparent text-[10px] text-white/60 placeholder:text-white/15 outline-none font-mono"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-white/20 hover:text-white/50">
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-68px)]">
        <div className="py-1">
          {/* New file input */}
          {isCreating && (
            <div className="flex items-center gap-1.5 px-3 py-1.5">
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
                className="flex-1 bg-transparent text-[11px] text-white/80 placeholder:text-white/20 outline-none border-b border-cyan-500/30 font-mono py-0.5"
              />
            </div>
          )}

          {filteredTree.map(node => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              activeFilePath={activeFilePath}
              expandedFolders={expandedFolders}
              searchQuery={searchQuery}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              onToggleFolder={toggleFolder}
              renamingPath={renamingPath}
              renameValue={renameValue}
              onStartRename={(path, name) => { setRenamingPath(path); setRenameValue(name); }}
              onRenameChange={setRenameValue}
              onFinishRename={handleRename}
              onCancelRename={() => { setRenamingPath(null); setRenameValue(''); }}
              onRenameFile={onRenameFile}
              onDownload={downloadFile}
              fileStatus={fileStatus}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
