/**
 * Phase 112: Snippet Library Panel
 */
import { useState } from 'react';
import { X, Plus, Search, Copy, Trash2, Download, Upload, Tag, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CodeSnippet } from '@/hooks/useSnippetLibrary';

interface SnippetLibraryPanelProps {
  open: boolean;
  onClose: () => void;
  snippets: CodeSnippet[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAdd: (snippet: Omit<CodeSnippet, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  onRemove: (id: string) => void;
  onInsert: (content: string) => void;
  onExport: () => string;
  onImport: (json: string) => void;
}

export function SnippetLibraryPanel({
  open, onClose, snippets, searchQuery, onSearchChange,
  onAdd, onRemove, onInsert, onExport, onImport,
}: SnippetLibraryPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  if (!open) return null;

  const handleAdd = () => {
    if (!newName || !newTrigger || !newContent) return;
    onAdd({
      name: newName,
      trigger: newTrigger.startsWith('/') ? newTrigger : `/${newTrigger}`,
      content: newContent,
      language: 'typescriptreact',
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      description: '',
    });
    setNewName(''); setNewTrigger(''); setNewContent(''); setNewTags('');
    setShowAdd(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-cyan-400/60" />
          <h3 className="text-sm font-medium text-white/80">Snippet Library</h3>
          <span className="text-[10px] text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded">{snippets.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowAdd(true)} className="p-1 text-white/30 hover:text-white/60"><Plus className="h-3.5 w-3.5" /></button>
          <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-2.5 py-1.5">
          <Search className="h-3 w-3 text-white/20" />
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search snippets..."
            className="flex-1 bg-transparent text-xs text-white/70 placeholder:text-white/20 outline-none"
          />
        </div>
      </div>

      {showAdd && (
        <div className="mx-3 mb-2 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06] space-y-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className="w-full bg-white/[0.04] rounded px-2 py-1 text-xs text-white/70 outline-none" />
          <input value={newTrigger} onChange={e => setNewTrigger(e.target.value)} placeholder="Trigger (e.g. /btn)" className="w-full bg-white/[0.04] rounded px-2 py-1 text-xs text-white/70 outline-none font-mono" />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Code content..." rows={4} className="w-full bg-white/[0.04] rounded px-2 py-1 text-xs text-white/70 outline-none font-mono resize-none" />
          <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Tags (comma separated)" className="w-full bg-white/[0.04] rounded px-2 py-1 text-xs text-white/70 outline-none" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 text-[10px] bg-cyan-500/20 text-cyan-300 py-1 rounded hover:bg-cyan-500/30">Add</button>
            <button onClick={() => setShowAdd(false)} className="flex-1 text-[10px] bg-white/[0.06] text-white/40 py-1 rounded hover:bg-white/[0.1]">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {snippets.map(snippet => (
          <div key={snippet.id} className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-lg p-2.5 border border-white/[0.04] transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-white/70">{snippet.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onInsert(snippet.content)} className="p-0.5 text-white/30 hover:text-cyan-400"><Copy className="h-3 w-3" /></button>
                <button onClick={() => onRemove(snippet.id)} className="p-0.5 text-white/30 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <code className="text-[10px] text-cyan-400/70 bg-cyan-500/10 px-1 py-0.5 rounded font-mono">{snippet.trigger}</code>
              {snippet.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] text-white/25 bg-white/[0.04] px-1 py-0.5 rounded">{tag}</span>
              ))}
            </div>
            <pre className="text-[10px] text-white/30 font-mono truncate leading-relaxed">{snippet.content.split('\n')[0]}</pre>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border-t border-white/[0.06]">
        <button onClick={() => { const json = onExport(); navigator.clipboard.writeText(json); }} className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50">
          <Download className="h-3 w-3" /> Export
        </button>
        <button onClick={() => { const json = prompt('Paste snippet JSON:'); if (json) onImport(json); }} className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50">
          <Upload className="h-3 w-3" /> Import
        </button>
      </div>
    </div>
  );
}
