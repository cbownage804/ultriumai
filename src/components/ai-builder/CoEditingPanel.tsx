import { X, Users, Wifi, WifiOff, GitMerge, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoEditingSession } from '@/hooks/useRealTimeCoEditing';

interface CoEditingPanelProps {
  sessions: CoEditingSession[];
  activeSessionId: string | null;
  isConnected: boolean;
  conflictCount: number;
  onStartSession: (filePath: string) => void;
  onJoinSession: (sessionId: string) => void;
  onEndSession: (sessionId: string) => void;
  onClose: () => void;
}

export function CoEditingPanel({
  sessions, activeSessionId, isConnected, conflictCount,
  onStartSession, onJoinSession, onEndSession, onClose,
}: CoEditingPanelProps) {
  const activeSessions = sessions.filter(s => s.status === 'active');

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] border-l border-white/[0.06]">
      <div className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-white/80">Co-Editing (CRDT)</span>
          {isConnected ? (
            <Wifi className="h-3 w-3 text-emerald-400" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-400" />
          )}
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Status */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-emerald-400" : "bg-red-400")} />
          <span className="text-[10px] text-white/50">{isConnected ? 'Connected' : 'Disconnected'}</span>
          {conflictCount > 0 && (
            <div className="ml-auto flex items-center gap-1 text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-[10px]">{conflictCount} resolved</span>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div>
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Active Sessions</div>
          {activeSessions.length === 0 ? (
            <div className="text-[10px] text-white/20 text-center py-4">No active sessions</div>
          ) : (
            <div className="space-y-2">
              {activeSessions.map(s => (
                <div key={s.id} className={cn(
                  "p-2 rounded-lg border transition-colors",
                  s.id === activeSessionId
                    ? "bg-cyan-500/10 border-cyan-500/30"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-white/70 font-mono truncate">{s.filePath}</span>
                    <span className="text-[9px] text-white/30">{s.operations.length} ops</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {s.participants.map(p => (
                      <div
                        key={p.userId}
                        className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.email?.[0]?.toUpperCase() || '?'}
                      </div>
                    ))}
                    <span className="text-[9px] text-white/30 ml-1">{s.participants.length} editing</span>
                  </div>
                  <div className="flex gap-1">
                    {s.id !== activeSessionId && (
                      <button
                        onClick={() => onJoinSession(s.id)}
                        className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                      >
                        Join
                      </button>
                    )}
                    <button
                      onClick={() => onEndSession(s.id)}
                      className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    >
                      End
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CRDT Info */}
        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-1">
            <GitMerge className="h-3 w-3 text-violet-400" />
            <span className="text-[10px] text-white/50 font-medium">CRDT Engine</span>
          </div>
          <p className="text-[9px] text-white/30 leading-relaxed">
            Conflict-free replicated data types ensure all edits merge automatically without conflicts.
            Vector clocks track causal ordering for consistent state.
          </p>
        </div>
      </div>
    </div>
  );
}
