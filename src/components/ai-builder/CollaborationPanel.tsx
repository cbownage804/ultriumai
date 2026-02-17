import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Users, X, Send, Eye, EyeOff, Lock, Unlock, UserPlus, Wifi, WifiOff,
  MessageSquare, FileCode, Circle, ChevronRight, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type {
  CollaboratorPresence, SessionMessage, CollaborationAwareness,
} from '@/hooks/useCollaborationEngine';

// ─── Types ───────────────────────────────────────────────────

interface CollaborationPanelProps {
  open: boolean;
  onClose: () => void;
  isConnected: boolean;
  participants: CollaboratorPresence[];
  messages: SessionMessage[];
  awareness: CollaborationAwareness;
  localUserId: string;
  followingUserId: string | null;
  onStartSession: (name: string, email: string) => void;
  onEndSession: () => void;
  onSendMessage: (content: string, type?: SessionMessage['type'], meta?: SessionMessage['metadata']) => void;
  onFollowUser: (userId: string | null) => void;
  onLockFile: (path: string) => void;
  onUnlockFile: (path: string) => void;
  onNavigateToFile?: (path: string) => void;
  onAddSimulated?: (name: string) => void;
}

type Tab = 'people' | 'chat' | 'activity';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-400',
  idle: 'bg-amber-400',
  away: 'bg-white/20',
};

// ─── Component ───────────────────────────────────────────────

export function CollaborationPanel({
  open, onClose, isConnected, participants, messages, awareness,
  localUserId, followingUserId,
  onStartSession, onEndSession, onSendMessage, onFollowUser,
  onLockFile, onUnlockFile, onNavigateToFile, onAddSimulated,
}: CollaborationPanelProps) {
  const [tab, setTab] = useState<Tab>('people');
  const [chatInput, setChatInput] = useState('');
  const [joinName, setJoinName] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  }, [chatInput, onSendMessage]);

  const handleJoin = useCallback(() => {
    if (!joinName.trim()) return;
    onStartSession(joinName.trim(), `${joinName.trim().toLowerCase().replace(/\s/g, '.')}@workspace.local`);
    toast.success('Session started');
  }, [joinName, onStartSession]);

  const otherParticipants = participants.filter(p => p.userId !== localUserId);
  const localUser = participants.find(p => p.userId === localUserId);

  if (!open) return null;

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-white/70">Collaboration</span>
          {isConnected && (
            <span className="flex items-center gap-1 text-[9px] text-emerald-400/60">
              <Radio className="h-2.5 w-2.5 animate-pulse" /> Live
            </span>
          )}
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Not connected state */}
      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <WifiOff className="h-8 w-8 text-white/[0.06] mb-3" />
          <h3 className="text-xs text-white/40 mb-1">Start Collaborating</h3>
          <p className="text-[10px] text-white/20 mb-4">Share your workspace in real-time with teammates.</p>
          <div className="w-full space-y-2">
            <Input
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              placeholder="Your display name"
              className="h-7 text-xs bg-white/5 border-white/10 text-white"
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <Button onClick={handleJoin} disabled={!joinName.trim()} size="sm" className="w-full h-7 text-[10px] bg-cyan-600 hover:bg-cyan-500">
              <Wifi className="h-3 w-3 mr-1" /> Start Session
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-1 px-2 py-1 border-b border-white/[0.06]">
            {(['people', 'chat', 'activity'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded capitalize",
                  tab === t ? "bg-white/10 text-white/70" : "text-white/30 hover:text-white/50"
                )}
              >
                {t}
                {t === 'chat' && messages.filter(m => m.type === 'chat').length > 0 && (
                  <span className="ml-1 text-[8px] text-cyan-400/60">
                    {messages.filter(m => m.type === 'chat').length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* People tab */}
          {tab === 'people' && (
            <div className="flex-1 overflow-y-auto">
              {/* Local user */}
              {localUser && (
                <div className="px-3 py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: localUser.avatarColor }}>
                        {localUser.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d0d14]", STATUS_COLORS[localUser.status])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-white/60 font-medium">{localUser.displayName}</span>
                      <span className="text-[9px] text-white/20 ml-1">(you)</span>
                      {localUser.activeFile && (
                        <p className="text-[9px] text-white/20 truncate font-mono">{localUser.activeFile}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Other participants */}
              {otherParticipants.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-[10px] text-white/20 mb-2">No other participants yet</p>
                  {onAddSimulated && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddSimulated('Alex')}
                      className="h-6 text-[9px] gap-1"
                    >
                      <UserPlus className="h-3 w-3" /> Add Demo User
                    </Button>
                  )}
                </div>
              ) : (
                otherParticipants.map(p => (
                  <div key={p.userId} className="px-3 py-2 hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: p.avatarColor }}>
                          {p.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d0d14]", STATUS_COLORS[p.status])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-white/60 font-medium">{p.displayName}</span>
                        <span className={cn("text-[9px] ml-1", p.status === 'active' ? 'text-emerald-400/50' : 'text-white/15')}>
                          {p.status}
                        </span>
                        {p.activeFile && (
                          <button
                            onClick={() => onNavigateToFile?.(p.activeFile!)}
                            className="flex items-center gap-0.5 text-[9px] text-cyan-400/40 hover:text-cyan-400/60 truncate font-mono"
                          >
                            <FileCode className="h-2.5 w-2.5 shrink-0" />
                            {p.activeFile}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => onFollowUser(followingUserId === p.userId ? null : p.userId)}
                        className={cn(
                          "h-5 w-5 rounded flex items-center justify-center transition-colors",
                          followingUserId === p.userId
                            ? "text-cyan-400 bg-cyan-400/10"
                            : "text-white/10 hover:text-white/30 opacity-0 group-hover:opacity-100"
                        )}
                        title={followingUserId === p.userId ? 'Stop following' : 'Follow cursor'}
                      >
                        {followingUserId === p.userId ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* File awareness */}
              {awareness.activeEditors.size > 0 && (
                <div className="mt-2 px-3 py-2 border-t border-white/[0.04]">
                  <h4 className="text-[9px] text-white/20 uppercase tracking-wider mb-1.5">Active Files</h4>
                  {Array.from(awareness.activeEditors.entries())
                    .filter(([, users]) => users.length > 0)
                    .map(([path, users]) => {
                      const isLocked = awareness.lockedFiles.has(path);
                      const lockOwner = awareness.lockedFiles.get(path);
                      return (
                        <div key={path} className="flex items-center gap-1.5 py-0.5">
                          {isLocked ? (
                            <Lock className="h-2.5 w-2.5 text-amber-400/50" />
                          ) : (
                            <FileCode className="h-2.5 w-2.5 text-white/15" />
                          )}
                          <span className="text-[9px] text-white/30 font-mono truncate flex-1">{path}</span>
                          <div className="flex -space-x-1">
                            {users.slice(0, 3).map(uid => {
                              const user = participants.find(p => p.userId === uid);
                              return user ? (
                                <div
                                  key={uid}
                                  className="h-3.5 w-3.5 rounded-full border border-[#0d0d14] flex items-center justify-center text-[6px] text-white font-bold"
                                  style={{ backgroundColor: user.avatarColor }}
                                  title={user.displayName}
                                >
                                  {user.displayName.charAt(0)}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Session controls */}
              <div className="px-3 py-2 border-t border-white/[0.04] mt-auto">
                <div className="flex items-center gap-1.5">
                  {onAddSimulated && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const names = ['Jordan', 'Sam', 'Casey', 'Riley', 'Morgan'];
                        onAddSimulated(names[Math.floor(Math.random() * names.length)]);
                      }}
                      className="flex-1 h-6 text-[9px] gap-1"
                    >
                      <UserPlus className="h-3 w-3" /> Add User
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEndSession}
                    className="flex-1 h-6 text-[9px] gap-1 text-red-400/60 border-red-400/20 hover:bg-red-400/10"
                  >
                    <WifiOff className="h-3 w-3" /> End
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Chat tab */}
          {tab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {messages.length === 0 && (
                  <p className="text-[10px] text-white/15 text-center py-4">No messages yet</p>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={cn(
                    "text-[10px]",
                    msg.type === 'system' ? "text-white/15 italic text-center py-0.5" : ""
                  )}>
                    {msg.type === 'system' ? (
                      <span>{msg.content}</span>
                    ) : (
                      <div className={cn(
                        "rounded-md px-2 py-1.5",
                        msg.userId === localUserId ? "bg-cyan-500/10 ml-4" : "bg-white/[0.03] mr-4"
                      )}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-medium text-white/50">{msg.displayName}</span>
                          <span className="text-[8px] text-white/15">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-white/40">{msg.content}</p>
                        {msg.metadata?.filePath && (
                          <button
                            onClick={() => onNavigateToFile?.(msg.metadata!.filePath!)}
                            className="flex items-center gap-0.5 mt-1 text-[9px] text-cyan-400/40 hover:text-cyan-400/60 font-mono"
                          >
                            <FileCode className="h-2.5 w-2.5" />
                            {msg.metadata.filePath}
                            {msg.metadata.lineNumber && `:${msg.metadata.lineNumber}`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              <div className="px-2 py-1.5 border-t border-white/[0.06]">
                <div className="flex items-center gap-1">
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="h-7 text-[10px] bg-white/5 border-white/10 text-white flex-1"
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                  />
                  <Button onClick={handleSend} disabled={!chatInput.trim()} size="sm" className="h-7 w-7 p-0 bg-cyan-600 hover:bg-cyan-500">
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Activity tab */}
          {tab === 'activity' && (
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {awareness.editHistory.length === 0 ? (
                <p className="text-[10px] text-white/15 text-center py-4">No edit activity yet</p>
              ) : (
                <div className="space-y-1">
                  {awareness.editHistory.slice(-30).reverse().map(op => {
                    const user = participants.find(p => p.userId === op.userId);
                    return (
                      <div key={op.id} className="flex items-start gap-1.5 text-[9px]">
                        <div
                          className="h-3.5 w-3.5 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-[6px] text-white font-bold"
                          style={{ backgroundColor: user?.avatarColor || '#666' }}
                        >
                          {user?.displayName.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-white/30">{user?.displayName || 'Unknown'}</span>
                          <span className="text-white/15 mx-1">{op.type}</span>
                          <span className="text-white/20 font-mono truncate">{op.filePath}</span>
                          <span className="text-white/10 ml-1">
                            {new Date(op.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
