import { X, Plus, Trash2, Wifi, Send, Code } from 'lucide-react';
import type { WSChannel, WSMessage } from '@/hooks/useWebSocketManager';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface WebSocketPanelProps {
  open: boolean;
  onClose: () => void;
  channels: WSChannel[];
  messages: WSMessage[];
  activeChannel: WSChannel | null;
  onSetActiveChannel: (id: string) => void;
  onCreateChannel: (name: string, path: string) => void;
  onUpdateChannel: (id: string, update: Partial<WSChannel>) => void;
  onRemoveChannel: (id: string) => void;
  onAddEvent: (channelId: string, event: string) => void;
  onRemoveEvent: (channelId: string, event: string) => void;
  onSimulateMessage: (channelId: string, event: string, payload: string) => void;
  onClearMessages: () => void;
  onGenerateServer: (channelId: string) => string;
  onGenerateClient: (channelId: string) => string;
  onInsertCode: (code: string) => void;
}

export function WebSocketPanel({ open, onClose, channels, messages, activeChannel, onSetActiveChannel, onCreateChannel, onUpdateChannel, onRemoveChannel, onAddEvent, onRemoveEvent, onSimulateMessage, onClearMessages, onGenerateServer, onGenerateClient, onInsertCode }: WebSocketPanelProps) {
  const [testEvent, setTestEvent] = useState('message');
  const [testPayload, setTestPayload] = useState('{"text": "hello"}');

  if (!open) return null;

  const channelMessages = activeChannel ? messages.filter(m => m.channelId === activeChannel.id) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[800px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">WebSocket Manager</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-44 border-r border-white/[0.06] p-2 overflow-y-auto space-y-1">
            <button onClick={() => onCreateChannel('New Channel', '')} className="w-full flex items-center gap-1 px-2 py-1.5 text-[11px] text-cyan-400 hover:bg-cyan-500/10 rounded">
              <Plus className="h-3 w-3" /> New Channel
            </button>
            {channels.map(ch => (
              <button key={ch.id} onClick={() => onSetActiveChannel(ch.id)} className={cn("w-full text-left px-3 py-1.5 text-[11px] rounded", activeChannel?.id === ch.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-white/40 hover:bg-white/5')}>
                <div className="flex items-center gap-1">
                  <div className={cn("h-1.5 w-1.5 rounded-full", ch.isActive ? 'bg-emerald-400' : 'bg-white/20')} />
                  <span className="truncate">{ch.name}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
            {activeChannel ? (
              <>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input value={activeChannel.name} onChange={e => onUpdateChannel(activeChannel.id, { name: e.target.value })} className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70" placeholder="Channel name" />
                    <input value={activeChannel.path} onChange={e => onUpdateChannel(activeChannel.id, { path: e.target.value })} className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70 font-mono" placeholder="/ws/path" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {activeChannel.eventTypes.map(ev => (
                      <span key={ev} className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded text-[10px]">
                        {ev}
                        <button onClick={() => onRemoveEvent(activeChannel.id, ev)} className="text-white/20 hover:text-red-400">×</button>
                      </span>
                    ))}
                    <button onClick={() => { const ev = prompt('Event name'); if (ev) onAddEvent(activeChannel.id, ev); }} className="px-2 py-0.5 text-[10px] text-white/20 hover:text-white/40 border border-dashed border-white/10 rounded">+ event</button>
                  </div>
                </div>

                {/* Test area */}
                <div className="bg-black/30 rounded-lg border border-white/[0.06] p-2 space-y-2">
                  <span className="text-[10px] text-white/30">Simulate Message</span>
                  <div className="flex gap-2">
                    <input value={testEvent} onChange={e => setTestEvent(e.target.value)} className="w-28 h-7 px-2 bg-black/40 border border-white/[0.06] rounded text-[10px] text-white/60 font-mono" placeholder="event" />
                    <input value={testPayload} onChange={e => setTestPayload(e.target.value)} className="flex-1 h-7 px-2 bg-black/40 border border-white/[0.06] rounded text-[10px] text-white/60 font-mono" placeholder='{"key":"val"}' />
                    <button onClick={() => onSimulateMessage(activeChannel.id, testEvent, testPayload)} className="px-3 h-7 bg-cyan-500/20 text-cyan-300 rounded text-[10px] hover:bg-cyan-500/30"><Send className="h-3 w-3" /></button>
                  </div>
                </div>

                {/* Messages log */}
                <div className="flex-1 overflow-y-auto space-y-1">
                  {channelMessages.length === 0 && <p className="text-[10px] text-white/15 text-center py-4">No messages yet</p>}
                  {channelMessages.slice(0, 30).map(msg => (
                    <div key={msg.id} className={cn("flex items-start gap-2 px-2 py-1 rounded text-[10px] font-mono", msg.direction === 'inbound' ? 'bg-cyan-500/5' : 'bg-emerald-500/5')}>
                      <span className={cn("shrink-0 font-bold", msg.direction === 'inbound' ? 'text-cyan-400' : 'text-emerald-400')}>
                        {msg.direction === 'inbound' ? '↓' : '↑'}
                      </span>
                      <span className="text-white/40">{msg.event}</span>
                      <span className="text-white/20 truncate flex-1">{msg.payload}</span>
                      <span className="text-white/10 shrink-0">{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>

                {/* Generate */}
                <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
                  <button onClick={() => onInsertCode(onGenerateServer(activeChannel.id))} className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 text-cyan-300 rounded text-[11px] hover:bg-cyan-500/30">
                    <Code className="h-3 w-3" /> Server Code
                  </button>
                  <button onClick={() => onInsertCode(onGenerateClient(activeChannel.id))} className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded text-[11px] hover:bg-violet-500/30">
                    <Code className="h-3 w-3" /> Client Hook
                  </button>
                  <button onClick={onClearMessages} className="ml-auto text-[10px] text-white/20 hover:text-white/40">Clear log</button>
                </div>
              </>
            ) : (
              <p className="text-xs text-white/20 text-center py-8">Create a channel to get started</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
