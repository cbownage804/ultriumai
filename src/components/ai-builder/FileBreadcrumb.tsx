import { FileCode, ChevronRight } from 'lucide-react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface FileBreadcrumbProps {
  file: ProjectFile | null;
}

/**
 * Shows breadcrumb path for the currently active file (e.g. src / components / Button.tsx)
 */
export function FileBreadcrumb({ file }: FileBreadcrumbProps) {
  if (!file) return null;

  const parts = file.path.split('/');

  return (
    <div className="flex items-center gap-1 px-3 h-7 bg-white/[0.02] border-b border-white/[0.04] shrink-0 overflow-hidden">
      <FileCode className="h-3 w-3 text-white/20 shrink-0" />
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-white/10" />}
          <span className={`text-[10px] font-mono ${i === parts.length - 1 ? 'text-cyan-400/80' : 'text-white/25'}`}>
            {part}
          </span>
        </span>
      ))}
    </div>
  );
}
