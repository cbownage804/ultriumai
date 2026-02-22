import { useState, useCallback, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  File, FileCode, FileText, Image, Folder, FolderOpen,
  ChevronRight, ChevronDown,
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
  previousFiles?: ProjectFile[];
}

function getFileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'html': case 'htm':
    case 'css': case 'scss':
    case 'js': case 'jsx':
    case 'ts': case 'tsx':
    case 'json':
      return <FileCode className="h-3.5 w-3.5 text-white/40" />;
    case 'svg': case 'png': case 'jpg': case 'gif': case 'webp':
      return <Image className="h-3.5 w-3.5 text-white/40" />;
    case 'md':
      return <FileText className="h-3.5 w-3.5 text-white/40" />;
    default: return <File className="h-3.5 w-3.5 text-white/40" />;
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

function TreeItem({ 
  node, depth, activeFilePath, expandedFolders,
  onSelectFile, onToggleFolder,
}: {
  node: TreeNode;
  depth: number;
  activeFilePath: string | null;
  expandedFolders: Set<string>;
  onSelectFile: (path: string) => void;
  onToggleFolder: (path: string) => void;
}) {
  const isExpanded = expandedFolders.has(node.path);
  const isActive = activeFilePath === node.path;
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
            onSelectFile={onSelectFile}
            onToggleFolder={onToggleFolder}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 w-full rounded-md text-[11px] transition-all cursor-pointer',
        isActive
          ? 'bg-cyan-500/10 text-cyan-300'
          : 'text-white/45 hover:text-white/70 hover:bg-white/[0.03]'
      )}
      style={{ paddingLeft: `${depth * 12 + 20}px`, paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}
      onClick={() => onSelectFile(node.path)}
    >
      {getFileIcon(node.path)}
      <span className="truncate flex-1 font-mono">{node.name}</span>
    </div>
  );
}

export function ProjectFileTree({ files, activeFilePath, onSelectFile }: ProjectFileTreeProps) {
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

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

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
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-white/[0.06] flex items-center justify-between gap-1">
        <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest shrink-0">Explorer</span>
        <span className="text-[9px] text-white/15 font-mono">{files.length}</span>
      </div>

      <ScrollArea className="h-[calc(100%-32px)]">
        <div className="py-1">
          {tree.map(node => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              activeFilePath={activeFilePath}
              expandedFolders={expandedFolders}
              onSelectFile={onSelectFile}
              onToggleFolder={toggleFolder}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
