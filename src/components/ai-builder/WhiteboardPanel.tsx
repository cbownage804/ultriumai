import { X, PenTool, Square, Circle, Type, ArrowUpRight, Minus, StickyNote, MousePointer, Trash2, Plus, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WhiteboardState, WhiteboardTool } from '@/hooks/useCollaborativeWhiteboard';

interface WhiteboardPanelProps {
  boards: WhiteboardState[];
  activeBoardId: string | null;
  selectedTool: WhiteboardTool;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  onSetActiveBoardId: (id: string | null) => void;
  onSetSelectedTool: (tool: WhiteboardTool) => void;
  onSetStrokeColor: (color: string) => void;
  onSetStrokeWidth: (width: number) => void;
  onSetFillColor: (color: string) => void;
  onCreateBoard: (name: string) => void;
  onClearBoard: (id: string) => void;
  onDeleteBoard: (id: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onClose: () => void;
}

const TOOLS: { tool: WhiteboardTool; icon: any; label: string }[] = [
  { tool: 'select', icon: MousePointer, label: 'Select' },
  { tool: 'rectangle', icon: Square, label: 'Rectangle' },
  { tool: 'circle', icon: Circle, label: 'Circle' },
  { tool: 'line', icon: Minus, label: 'Line' },
  { tool: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { tool: 'text', icon: Type, label: 'Text' },
  { tool: 'freehand', icon: PenTool, label: 'Draw' },
  { tool: 'sticky', icon: StickyNote, label: 'Sticky Note' },
];

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#ffffff', '#000000'];

export function WhiteboardPanel({
  boards, activeBoardId, selectedTool, strokeColor, strokeWidth, fillColor,
  onSetActiveBoardId, onSetSelectedTool, onSetStrokeColor, onSetStrokeWidth,
  onSetFillColor, onCreateBoard, onClearBoard, onDeleteBoard, onZoomIn, onZoomOut, onClose,
}: WhiteboardPanelProps) {
  const activeBoard = boards.find(b => b.id === activeBoardId);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] border-l border-white/[0.06]">
      <div className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <PenTool className="h-3.5 w-3.5 text-pink-400" />
          <span className="text-xs font-medium text-white/80">Whiteboard</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Boards List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/30 uppercase tracking-wider">Boards</span>
            <button
              onClick={() => onCreateBoard(`Board ${boards.length + 1}`)}
              className="p-0.5 rounded text-white/30 hover:text-white/60"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          {boards.map(b => (
            <div
              key={b.id}
              className={cn(
                "flex items-center justify-between p-1.5 rounded cursor-pointer mb-0.5 transition-colors",
                b.id === activeBoardId ? "bg-pink-500/10 text-pink-300" : "text-white/40 hover:bg-white/[0.04]"
              )}
              onClick={() => onSetActiveBoardId(b.id)}
            >
              <span className="text-[10px]">{b.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-[8px] text-white/20">{b.elements.length}</span>
                <button
                  onClick={e => { e.stopPropagation(); onDeleteBoard(b.id); }}
                  className="text-white/20 hover:text-red-400"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {activeBoard && (
          <>
            {/* Tools */}
            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Tools</div>
              <div className="grid grid-cols-4 gap-1">
                {TOOLS.map(t => (
                  <button
                    key={t.tool}
                    onClick={() => onSetSelectedTool(t.tool)}
                    className={cn(
                      "h-8 rounded flex flex-col items-center justify-center gap-0.5 transition-colors",
                      selectedTool === t.tool
                        ? "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                        : "bg-white/[0.03] text-white/40 hover:text-white/60 border border-transparent"
                    )}
                    title={t.label}
                  >
                    <t.icon className="h-3 w-3" />
                    <span className="text-[7px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">Stroke</div>
              <div className="flex gap-1 mb-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => onSetStrokeColor(c)}
                    className={cn("h-5 w-5 rounded-full border-2", strokeColor === c ? "border-white/60" : "border-transparent")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/30">Width</span>
                <input
                  type="range" min="1" max="8" value={strokeWidth}
                  onChange={e => onSetStrokeWidth(Number(e.target.value))}
                  className="flex-1 h-1 accent-pink-400"
                />
                <span className="text-[9px] text-white/40 w-4">{strokeWidth}</span>
              </div>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-2">
              <button onClick={onZoomOut} className="p-1 rounded bg-white/[0.04] text-white/40 hover:text-white/60">
                <ZoomOut className="h-3 w-3" />
              </button>
              <span className="text-[10px] text-white/40">{Math.round(activeBoard.zoom * 100)}%</span>
              <button onClick={onZoomIn} className="p-1 rounded bg-white/[0.04] text-white/40 hover:text-white/60">
                <ZoomIn className="h-3 w-3" />
              </button>
              <button
                onClick={() => onClearBoard(activeBoard.id)}
                className="ml-auto text-[9px] px-2 py-0.5 rounded bg-red-500/15 text-red-300/70 hover:bg-red-500/25"
              >
                Clear All
              </button>
            </div>

            {/* Canvas placeholder */}
            <div className="aspect-video rounded-lg bg-white/[0.02] border border-white/[0.06] border-dashed flex items-center justify-center">
              <span className="text-[10px] text-white/20">Canvas — {activeBoard.elements.length} elements</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
