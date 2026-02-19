import { X, Search, Copy, Code } from 'lucide-react';
import type { IconEntry } from '@/hooks/useIconPicker';

interface IconPickerPanelProps {
  open: boolean;
  onClose: () => void;
  icons: IconEntry[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLibrary: 'all' | 'lucide' | 'heroicons' | 'phosphor';
  onLibraryChange: (lib: 'all' | 'lucide' | 'heroicons' | 'phosphor') => void;
  onInsert: (importStatement: string, jsx: string) => void;
  totalCount: number;
}

export function IconPickerPanel({ open, onClose, icons, searchQuery, onSearchChange, selectedLibrary, onLibraryChange, onInsert, totalCount }: IconPickerPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">Icon Picker</span>
            <span className="text-[10px] text-white/20">{totalCount} icons</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-4 py-2 border-b border-white/[0.06] space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search icons..."
              className="w-full h-8 pl-8 pr-3 bg-black/30 border border-white/[0.08] rounded-lg text-xs text-white/80 focus:outline-none focus:border-cyan-500/30"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'lucide'] as const).map(lib => (
              <button
                key={lib}
                onClick={() => onLibraryChange(lib)}
                className={`px-2 py-1 text-[10px] rounded ${selectedLibrary === lib ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/30 hover:text-white/50'}`}
              >
                {lib === 'all' ? 'All' : lib.charAt(0).toUpperCase() + lib.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-6 gap-1.5">
            {icons.slice(0, 120).map(icon => (
              <button
                key={icon.name}
                onClick={() => onInsert(icon.importStatement, icon.jsx)}
                title={`${icon.name}\n${icon.importStatement}`}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="h-6 w-6 flex items-center justify-center text-white/40 group-hover:text-white/80">
                  <span className="text-sm">{icon.name.charAt(0)}</span>
                </div>
                <span className="text-[9px] text-white/25 group-hover:text-white/50 truncate max-w-full">{icon.name}</span>
              </button>
            ))}
          </div>
          {icons.length === 0 && <p className="text-center text-xs text-white/20 py-8">No icons found</p>}
          {icons.length > 120 && <p className="text-center text-[10px] text-white/15 py-2">Showing 120 of {icons.length}</p>}
        </div>
      </div>
    </div>
  );
}
