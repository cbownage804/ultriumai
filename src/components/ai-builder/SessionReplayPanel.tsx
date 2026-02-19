import { X, Video, Play, Trash2 } from 'lucide-react';
import type { Session } from '@/hooks/useSessionReplay';

interface Props {
  open: boolean;
  onClose: () => void;
  sessions: Session[];
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDeleteSession: (id: string) => void;
  onInsertCode: (code: string) => void;
  onGenerateScript: () => string;
}

export function SessionReplayPanel({ open, onClose, sessions, isRecording, onStartRecording, onStopRecording, onDeleteSession, onInsertCode, onGenerateScript }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Video className="h-4 w-4 text-violet-400" /><span className="text-sm font-medium text-white">Session Replay</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={isRecording ? onStopRecording : onStartRecording} className={`px-3 py-1.5 text-xs rounded-lg ${isRecording ? 'bg-red-500/20 text-red-300' : 'bg-violet-500/20 text-violet-300'}`}>
              {isRecording ? '⏹ Stop Recording' : '⏺ Start Recording'}
            </button>
            <button onClick={() => onInsertCode(onGenerateScript())} className="px-3 py-1.5 text-xs bg-white/[0.06] text-white/60 rounded-lg hover:bg-white/[0.1]">
              Insert Replay Script
            </button>
          </div>

          <div className="text-xs text-white/40">{sessions.length} sessions recorded</div>

          {sessions.map(s => (
            <div key={s.id} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/70">{s.startedAt.toLocaleString()}</div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-white/30">
                    <span>{s.duration}s</span>
                    <span>{s.events.length} events</span>
                    <span>{s.pages.length} pages</span>
                    <span>{s.device}</span>
                    <span>{s.screenSize}</span>
                  </div>
                </div>
                <button onClick={() => onDeleteSession(s.id)} className="p-1 text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          ))}

          {sessions.length === 0 && <div className="text-center text-white/20 text-xs py-8">No sessions recorded yet</div>}
        </div>
      </div>
    </div>
  );
}
