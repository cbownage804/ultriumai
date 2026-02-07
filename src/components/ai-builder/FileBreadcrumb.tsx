import { useState, useRef, useEffect } from 'react';
import { FileCode, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface FileBreadcrumbProps {
  file: ProjectFile | null;
  allFiles?: ProjectFile[];
  onNavigate?: (path: string) => void;
}

export function FileBreadcrumb({ file, allFiles, onNavigate }: FileBreadcrumbProps) {
  const [openSegment, setOpenSegment] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenSegment(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!file) return null;

  const parts = file.path.split('/');

  const getSiblings = (segmentIndex: number) => {
    if (!allFiles || !onNavigate) return [];
    const prefix = parts.slice(0, segmentIndex).join('/');
    const isLast = segmentIndex === parts.length - 1;

    if (isLast) {
      // Show sibling files in same folder
      return allFiles
        .filter(f => {
          const fParts = f.path.split('/');
          const fPrefix = fParts.slice(0, segmentIndex).join('/');
          return fPrefix === prefix && fParts.length === parts.length;
        })
        .map(f => ({ name: f.path.split('/').pop()!, path: f.path }));
    } else {
      // Show sibling folders
      const seen = new Set<string>();
      return allFiles
        .filter(f => {
          const fParts = f.path.split('/');
          if (fParts.length <= segmentIndex) return false;
          const fPrefix = fParts.slice(0, segmentIndex).join('/');
          return fPrefix === prefix;
        })
        .map(f => f.path.split('/')[segmentIndex])
        .filter(name => {
          if (seen.has(name)) return false;
          seen.add(name);
          return true;
        })
        .map(name => ({ name, path: '' })); // Folders don't navigate directly
    }
  };

  return (
    <div ref={dropdownRef} className="flex items-center gap-1 px-3 h-7 bg-white/[0.02] border-b border-white/[0.04] shrink-0 overflow-hidden relative">
      <FileCode className="h-3 w-3 text-white/20 shrink-0" />
      {parts.map((part, i) => {
        const siblings = getSiblings(i);
        const isLast = i === parts.length - 1;
        const hasDropdown = allFiles && onNavigate && siblings.length > 1;

        return (
          <span key={i} className="flex items-center gap-1 shrink-0 relative">
            {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-white/10" />}
            <button
              onClick={() => hasDropdown ? setOpenSegment(openSegment === i ? null : i) : undefined}
              className={cn(
                "text-[10px] font-mono flex items-center gap-0.5 rounded px-0.5 -mx-0.5 transition-colors",
                isLast ? 'text-cyan-400/80' : 'text-white/25',
                hasDropdown && 'hover:bg-white/5 hover:text-white/50 cursor-pointer'
              )}
            >
              {part}
              {hasDropdown && <ChevronDown className="h-2 w-2 text-white/15" />}
            </button>
            {openSegment === i && hasDropdown && (
              <div className="absolute top-full left-0 mt-1 min-w-[140px] rounded-md border border-white/[0.08] bg-[#0d0d14] shadow-xl z-50 py-1 max-h-40 overflow-auto">
                {siblings.map(sibling => (
                  <button
                    key={sibling.name}
                    onClick={() => {
                      if (sibling.path && onNavigate) {
                        onNavigate(sibling.path);
                      }
                      setOpenSegment(null);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1 text-[10px] font-mono transition-colors",
                      sibling.name === part ? "text-cyan-400 bg-cyan-500/10" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    )}
                  >
                    {sibling.name}
                  </button>
                ))}
              </div>
            )}
          </span>
        );
      })}
    </div>
  );
}
