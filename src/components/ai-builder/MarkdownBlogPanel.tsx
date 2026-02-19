import { X, BookOpen, Plus, Trash2 } from 'lucide-react';
import type { BlogPost } from '@/hooks/useMarkdownBlog';

interface Props {
  open: boolean;
  onClose: () => void;
  posts: BlogPost[];
  onGenerate: () => void;
  onRemovePost: (slug: string) => void;
  onInsertFiles: (files: { path: string; content: string; language: string }[]) => void;
}

export function MarkdownBlogPanel({ open, onClose, posts, onGenerate, onRemovePost, onInsertFiles }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-400" /><span className="text-sm font-medium text-white">Markdown Blog Engine</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-white/40">Generate a complete blog system with markdown posts, tag pages, and RSS feed.</p>
          <button onClick={onGenerate} className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 flex items-center gap-1.5">
            <Plus className="h-3 w-3" /> Generate Blog System
          </button>
          {posts.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] text-white/25 uppercase tracking-wider">Posts ({posts.length})</div>
              {posts.map(p => (
                <div key={p.slug} className="flex items-center justify-between p-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <div>
                    <div className="text-xs text-white/70">{p.title}</div>
                    <div className="text-[10px] text-white/30">{p.date} · {p.tags.join(', ')}</div>
                  </div>
                  <button onClick={() => onRemovePost(p.slug)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
