import { X, Monitor, MonitorOff, Pencil, Circle, Square, Type, ArrowUpRight, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScreenShareSession, ScreenAnnotation } from '@/hooks/useScreenShare';

interface ScreenSharePanelProps {
  sessions: ScreenShareSession[];
  activeSessionId: string | null;
  isSharing: boolean;
  isViewing: boolean;
  selectedTool: ScreenAnnotation['type'];
  annotationColor: string;
  onStartSharing: () => void;
  onStopSharing: () => void;
  onJoinViewing: (sessionId: string) => void;
  onSetTool: (tool: ScreenAnnotation['type']) => void;
  onSetColor: (color: string) => void;
  onClearAnnotations: () => void;
  onClose: () => void;
}

const COLORS = ['#f43f5e', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#ffffff'];

export function ScreenSharePanel({
  sessions, activeSessionId, isSharing, isViewing, selectedTool, annotationColor,
  onStartSharing, onStopSharing, onJoinViewing, onSetTool, onSetColor,
  onClearAnnotations, onClose,
}: ScreenSharePanelProps) {
  const activeSessions = sessions.filter(s => s.isActive);
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const tools: { tool: ScreenAnnotation['type']; icon: any; label: string }[] = [
    { tool: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
    { tool: 'rectangle', icon: Square, label: 'Rectangle' },
    { tool: 'circle', icon: Circle, label: 'Circle' },
    { tool: 'text', icon: Type, label: 'Text' },
    { tool: 'freehand', icon: Pencil, label: 'Draw' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] border-l border-white/[0.06]">
      <div className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-medium text-white/80">Screen Share</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Share/Stop */}
        <button
          onClick={isSharing ? onStopSharing : onStartSharing}
          className={cn(
            "w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors",
            isSharing
              ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
              : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30"
          )}
        >
          {isSharing ? <MonitorOff className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}
          {isSharing ? 'Stop Sharing' : 'Share Preview'}
        </button>

        {/* Active Shares */}
        {activeSessions.filter(s => s.hostUserId !== 'self').length > 0 && (
          <div>
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Available Shares</div>
            {activeSessions.map(s => (
              <div key={s.id} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] mb-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/60">{s.hostEmail}'s screen</span>
                  <button
                    onClick={() => onJoinViewing(s.id)}
                    className="text-[9px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300"
                  >
                    Watch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Annotation Tools */}
        {(isSharing || isViewing) && (
          <>
            <div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Annotation Tools</div>
              <div className="flex gap-1 flex-wrap">
                {tools.map(t => (
                  <button
                    key={t.tool}
                    onClick={() => onSetTool(t.tool)}
                    className={cn(
                      "h-7 w-7 rounded flex items-center justify-center transition-colors",
                      selectedTool === t.tool ? "bg-blue-500/30 text-blue-300" : "bg-white/[0.04] text-white/40 hover:text-white/60"
                    )}
                    title={t.label}
                  >
                    <t.icon className="h-3 w-3" />
                  </button>
                ))}
                <button
                  onClick={onClearAnnotations}
                  className="h-7 w-7 rounded flex items-center justify-center bg-white/[0.04] text-white/40 hover:text-red-400"
                  title="Clear All"
                >
                  <Eraser className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Colors */}
            <div className="flex gap-1.5">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => onSetColor(c)}
                  className={cn("h-5 w-5 rounded-full border-2 transition-colors", annotationColor === c ? "border-white/60" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Stats */}
            {activeSession && (
              <div className="text-[9px] text-white/30 space-y-0.5">
                <div>Viewers: {activeSession.viewers.length}</div>
                <div>Annotations: {activeSession.annotations.length}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
