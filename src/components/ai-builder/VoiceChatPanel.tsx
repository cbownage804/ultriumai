import { X, Mic, MicOff, Volume2, VolumeX, PhoneOff, Plus, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VoiceChannel } from '@/hooks/useVoiceChat';
import { useState } from 'react';

interface VoiceChatPanelProps {
  channels: VoiceChannel[];
  activeChannelId: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isPushToTalk: boolean;
  onJoinChannel: (channelId: string) => void;
  onLeaveChannel: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onTogglePTT: () => void;
  onCreateChannel: (name: string) => void;
  onClose: () => void;
}

export function VoiceChatPanel({
  channels, activeChannelId, isMuted, isDeafened, isPushToTalk,
  onJoinChannel, onLeaveChannel, onToggleMute, onToggleDeafen,
  onTogglePTT, onCreateChannel, onClose,
}: VoiceChatPanelProps) {
  const [newName, setNewName] = useState('');

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] border-l border-white/[0.06]">
      <div className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-medium text-white/80">Voice Chat</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Channels */}
        {channels.map(ch => (
          <div key={ch.id} className={cn(
            "p-2 rounded-lg border transition-colors cursor-pointer",
            ch.id === activeChannelId
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
          )} onClick={() => ch.id !== activeChannelId && onJoinChannel(ch.id)}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-white/70 font-medium">{ch.name}</span>
              <span className="text-[9px] text-white/30">{ch.peers.length} connected</span>
            </div>
            {ch.peers.length > 0 && (
              <div className="space-y-1">
                {ch.peers.map(p => (
                  <div key={p.userId} className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-emerald-500/30 flex items-center justify-center">
                      {p.isMuted ? <MicOff className="h-2 w-2 text-red-400" /> : <Mic className="h-2 w-2 text-emerald-400" />}
                    </div>
                    <span className="text-[9px] text-white/50">{p.email}</span>
                    {p.isSpeaking && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Create Channel */}
        <div className="flex gap-1">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New channel..."
            className="flex-1 text-[10px] bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1 text-white/70 placeholder:text-white/20 outline-none"
          />
          <button
            onClick={() => { if (newName.trim()) { onCreateChannel(newName.trim()); setNewName(''); } }}
            className="p-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Controls */}
      {activeChannelId && (
        <div className="p-3 border-t border-white/[0.06] flex items-center justify-center gap-2">
          <button onClick={onToggleMute} className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
            isMuted ? "bg-red-500/30 text-red-300" : "bg-white/[0.06] text-white/50 hover:text-white/70"
          )}>
            {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onToggleDeafen} className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
            isDeafened ? "bg-red-500/30 text-red-300" : "bg-white/[0.06] text-white/50 hover:text-white/70"
          )}>
            {isDeafened ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onTogglePTT} className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-colors text-[8px] font-bold",
            isPushToTalk ? "bg-amber-500/30 text-amber-300" : "bg-white/[0.06] text-white/50"
          )}>
            PTT
          </button>
          <button onClick={onLeaveChannel} className="h-8 w-8 rounded-full flex items-center justify-center bg-red-500/30 text-red-300 hover:bg-red-500/50">
            <PhoneOff className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
