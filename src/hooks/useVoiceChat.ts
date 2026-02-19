import { useState, useCallback, useRef } from 'react';

export interface VoicePeer {
  userId: string;
  email: string;
  isMuted: boolean;
  isSpeaking: boolean;
  volume: number;
}

export interface VoiceChannel {
  id: string;
  name: string;
  peers: VoicePeer[];
  isActive: boolean;
  createdAt: Date;
}

export function useVoiceChat() {
  const [channels, setChannels] = useState<VoiceChannel[]>([
    { id: 'general', name: 'General', peers: [], isActive: false, createdAt: new Date() },
    { id: 'design', name: 'Design Review', peers: [], isActive: false, createdAt: new Date() },
  ]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [isPTTActive, setIsPTTActive] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);

  const joinChannel = useCallback((channelId: string, userId: string, email: string) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id !== channelId) return ch;
      if (ch.peers.some(p => p.userId === userId)) return ch;
      return {
        ...ch,
        isActive: true,
        peers: [...ch.peers, { userId, email, isMuted: false, isSpeaking: false, volume: 100 }],
      };
    }));
    setActiveChannelId(channelId);
  }, []);

  const leaveChannel = useCallback(() => {
    if (!activeChannelId) return;
    setChannels(prev => prev.map(ch =>
      ch.id === activeChannelId
        ? { ...ch, peers: ch.peers.slice(0, -1), isActive: ch.peers.length > 1 }
        : ch
    ));
    setActiveChannelId(null);
  }, [activeChannelId]);

  const toggleMute = useCallback(() => setIsMuted(m => !m), []);
  const toggleDeafen = useCallback(() => setIsDeafened(d => !d), []);
  const togglePushToTalk = useCallback(() => setIsPushToTalk(p => !p), []);

  const setPeerVolume = useCallback((userId: string, volume: number) => {
    setChannels(prev => prev.map(ch => ({
      ...ch,
      peers: ch.peers.map(p => p.userId === userId ? { ...p, volume } : p),
    })));
  }, []);

  const createChannel = useCallback((name: string) => {
    const channel: VoiceChannel = {
      id: crypto.randomUUID(),
      name,
      peers: [],
      isActive: false,
      createdAt: new Date(),
    };
    setChannels(prev => [...prev, channel]);
    return channel;
  }, []);

  return {
    channels,
    activeChannelId,
    isMuted,
    isDeafened,
    isPushToTalk,
    isPTTActive,
    inputLevel,
    setIsPTTActive,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleDeafen,
    togglePushToTalk,
    setPeerVolume,
    createChannel,
  };
}
