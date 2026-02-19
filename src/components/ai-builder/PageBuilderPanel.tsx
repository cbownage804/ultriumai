import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, ArrowUp, ArrowDown, Trash2, Code, Layers } from 'lucide-react';
import type { PageBlock } from '@/hooks/usePageBuilder';

interface Props {
  pages: { id: string; name: string; blocks: PageBlock[] }[];
  activePage: { id: string; name: string; blocks: PageBlock[] } | null;
  blockTypes: { type: PageBlock['type']; label: string }[];
  onCreatePage: (name: string) => void;
  onSetActivePage: (id: string) => void;
  onAddBlock: (pageId: string, type: PageBlock['type']) => void;
  onRemoveBlock: (pageId: string, blockId: string) => void;
  onMoveBlock: (pageId: string, blockId: string, dir: 'up' | 'down') => void;
  onUpdateProp: (pageId: string, blockId: string, key: string, value: string) => void;
  onGenerateCode: (pageId: string) => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function PageBuilderPanel({ pages, activePage, blockTypes, onCreatePage, onSetActivePage, onAddBlock, onRemoveBlock, onMoveBlock, onUpdateProp, onGenerateCode, onInsertCode, onClose }: Props) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-white">Page Builder</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Page selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 uppercase tracking-wider">Pages</span>
              <button onClick={() => onCreatePage(`Page ${pages.length + 1}`)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><Plus className="h-3 w-3" /> New</button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {pages.map(p => (
                <button key={p.id} onClick={() => onSetActivePage(p.id)} className={`text-xs px-2 py-1 rounded ${activePage?.id === p.id ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-white/50 hover:text-white/80'}`}>{p.name}</button>
              ))}
            </div>
          </div>

          {activePage && (
            <>
              {/* Add block */}
              <div className="space-y-2">
                <span className="text-xs text-white/50 uppercase tracking-wider">Add Block</span>
                <div className="grid grid-cols-3 gap-1">
                  {blockTypes.map(bt => (
                    <button key={bt.type} onClick={() => onAddBlock(activePage.id, bt.type)} className="text-[10px] px-2 py-1.5 bg-white/5 rounded hover:bg-white/10 text-white/60 hover:text-white/90 truncate">{bt.label}</button>
                  ))}
                </div>
              </div>

              {/* Block list */}
              <div className="space-y-2">
                <span className="text-xs text-white/50 uppercase tracking-wider">Blocks ({activePage.blocks.length})</span>
                {activePage.blocks.map((block, idx) => (
                  <div key={block.id} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80">{block.label}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onMoveBlock(activePage.id, block.id, 'up')} disabled={idx === 0} className="text-white/30 hover:text-white/60 disabled:opacity-20"><ArrowUp className="h-3 w-3" /></button>
                        <button onClick={() => onMoveBlock(activePage.id, block.id, 'down')} disabled={idx === activePage.blocks.length - 1} className="text-white/30 hover:text-white/60 disabled:opacity-20"><ArrowDown className="h-3 w-3" /></button>
                        <button onClick={() => onRemoveBlock(activePage.id, block.id)} className="text-red-400/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                    {Object.entries(block.props).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/40 w-16 shrink-0 truncate">{key}</span>
                        <input value={val} onChange={e => onUpdateProp(activePage.id, block.id, key, e.target.value)} className="flex-1 text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Generate */}
              <button onClick={() => { const code = onGenerateCode(activePage.id); onInsertCode(code); }} className="w-full flex items-center justify-center gap-2 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-xs font-medium hover:bg-violet-500/30">
                <Code className="h-3.5 w-3.5" /> Generate Code
              </button>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
