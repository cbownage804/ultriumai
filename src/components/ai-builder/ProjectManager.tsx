import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Save, FolderOpen, Trash2, Globe, Loader2, Check, Clock,
  X, FileText, ChevronRight, Copy, GitFork,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SavedProject } from '@/hooks/useProjectPersistence';

interface ProjectManagerProps {
  savedProjects: SavedProject[];
  currentProjectId: string | null;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  isPublished: boolean;
  publishedUrl: string | null;
  onSave: () => void;
  onLoad: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onPublish: () => void;
  onLoadProjects: () => void;
  onRemix?: (projectId: string) => void;
}

export function ProjectManager({
  savedProjects, currentProjectId, isSaving, isLoading, lastSaved,
  isPublished, publishedUrl,
  onSave, onLoad, onDelete, onPublish, onLoadProjects, onRemix,
}: ProjectManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'publish'>('save');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) onLoadProjects();
  }, [isOpen, onLoadProjects]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 h-7 px-2 rounded-md text-[11px] transition-colors border border-white/[0.06]",
          isSaving ? "text-amber-400" : lastSaved ? "text-emerald-400/60 hover:text-emerald-400" : "text-white/40 hover:text-white/70 hover:bg-white/5"
        )}
      >
        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        <span>{isSaving ? 'Saving...' : lastSaved ? 'Saved' : 'Save'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-72 rounded-lg border border-white/[0.08] bg-[#0d0d14] shadow-xl shadow-black/50 z-50 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            {(['save', 'load', 'publish'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2 text-[11px] font-medium transition-colors capitalize",
                  activeTab === tab ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/30 hover:text-white/60"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-3">
            {activeTab === 'save' && (
              <div className="space-y-3">
                <button
                  onClick={() => { onSave(); }}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors text-xs font-medium disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {currentProjectId ? 'Save Changes' : 'Save Project'}
                </button>
                {lastSaved && (
                  <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                    <Clock className="h-3 w-3" />
                    Last saved {lastSaved.toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'load' && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full h-7 px-2.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-[11px] text-white/70 placeholder:text-white/20 outline-none focus:border-cyan-500/30"
                  onChange={(e) => {
                    const search = e.target.value.toLowerCase();
                    // Filter is handled inline below
                    (e.target as any).dataset.search = search;
                  }}
                  ref={(el) => { if (el) (el as any).dataset.search = ''; }}
                />
                <div className="space-y-1 max-h-48 overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                  </div>
                ) : savedProjects.length === 0 ? (
                  <div className="text-center py-6 text-xs text-white/30">No saved projects</div>
                ) : (
                  savedProjects.filter(p => {
                    const searchEl = document.querySelector('[data-search]') as HTMLElement;
                    const search = searchEl?.dataset?.search || '';
                    return !search || p.name.toLowerCase().includes(search);
                  }).map(project => (
                    <div
                      key={project.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-md group cursor-pointer transition-colors",
                        project.id === currentProjectId
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "text-white/60 hover:bg-white/5"
                      )}
                      onClick={() => { onLoad(project.id); setIsOpen(false); }}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium truncate">{project.name}</div>
                        <div className="text-[9px] text-white/25 flex items-center gap-1.5">
                          <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                          {project.files && <span>· {(project.files as any[]).length} files</span>}
                        </div>
                      </div>
                      {project.is_published && <Globe className="h-3 w-3 text-emerald-400 shrink-0" />}
                      {onRemix && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemix(project.id); toast.success('Project remixed!'); }}
                          className="hidden group-hover:flex h-5 w-5 rounded items-center justify-center text-white/30 hover:text-violet-400 hover:bg-violet-500/10"
                          title="Remix (fork)"
                        >
                          <GitFork className="h-2.5 w-2.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                        className="hidden group-hover:flex h-5 w-5 rounded items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              </div>
            )}

            {activeTab === 'publish' && (
              <div className="space-y-3">
                <button
                  onClick={() => { onPublish(); }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {isPublished ? 'Update Published App' : 'Publish to Live URL'}
                </button>
                {publishedUrl && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-white/30">Live at:</div>
                    <a
                      href={publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline font-mono break-all"
                    >
                      {publishedUrl}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
