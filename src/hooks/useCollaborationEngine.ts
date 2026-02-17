import { useState, useCallback, useRef, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────

export interface CollaboratorPresence {
  userId: string;
  displayName: string;
  email: string;
  avatarColor: string;
  activeFile: string | null;
  cursorLine: number;
  cursorColumn: number;
  selection: { startLine: number; endLine: number } | null;
  lastSeen: number;
  status: 'active' | 'idle' | 'away';
  isFollowing: string | null; // userId they're following
}

export interface EditOperation {
  id: string;
  userId: string;
  filePath: string;
  type: 'insert' | 'delete' | 'replace';
  offset: number;
  length?: number;       // for delete/replace
  content?: string;       // for insert/replace
  timestamp: number;
  vectorClock: Record<string, number>;
}

export interface SessionMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'system' | 'code-link';
  metadata?: { filePath?: string; lineNumber?: number };
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  createdAt: number;
  participants: CollaboratorPresence[];
  isLive: boolean;
}

export interface CollaborationAwareness {
  activeEditors: Map<string, string[]>; // filePath -> userId[]
  lockedFiles: Map<string, string>;     // filePath -> userId (soft lock)
  editHistory: EditOperation[];
}

// ─── Constants ───────────────────────────────────────────────

const PRESENCE_INTERVAL = 3000;
const IDLE_TIMEOUT = 30000;
const AWAY_TIMEOUT = 120000;
const AVATAR_COLORS = [
  '#06b6d4', '#8b5cf6', '#f43f5e', '#22c55e',
  '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6',
  '#a855f7', '#ef4444', '#10b981', '#6366f1',
];

// ─── Operational Transform (simplified) ──────────────────────

function transformOffset(op: EditOperation, against: EditOperation): number {
  if (op.filePath !== against.filePath) return op.offset;
  if (against.timestamp >= op.timestamp) return op.offset;

  if (against.type === 'insert') {
    const insertLen = against.content?.length || 0;
    if (against.offset <= op.offset) return op.offset + insertLen;
  } else if (against.type === 'delete') {
    const delLen = against.length || 0;
    if (against.offset + delLen <= op.offset) return op.offset - delLen;
    if (against.offset <= op.offset) return against.offset;
  }
  return op.offset;
}

function applyOperation(content: string, op: EditOperation): string {
  const offset = Math.max(0, Math.min(op.offset, content.length));
  switch (op.type) {
    case 'insert':
      return content.slice(0, offset) + (op.content || '') + content.slice(offset);
    case 'delete': {
      const len = op.length || 0;
      return content.slice(0, offset) + content.slice(offset + len);
    }
    case 'replace': {
      const len = op.length || 0;
      return content.slice(0, offset) + (op.content || '') + content.slice(offset + len);
    }
    default:
      return content;
  }
}

// ─── Vector Clock ────────────────────────────────────────────

function incrementClock(clock: Record<string, number>, userId: string): Record<string, number> {
  return { ...clock, [userId]: (clock[userId] || 0) + 1 };
}

function isClockConcurrent(a: Record<string, number>, b: Record<string, number>): boolean {
  let aGt = false, bGt = false;
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of allKeys) {
    const av = a[key] || 0;
    const bv = b[key] || 0;
    if (av > bv) aGt = true;
    if (bv > av) bGt = true;
  }
  return aGt && bGt;
}

// ─── Hook ────────────────────────────────────────────────────

export function useCollaborationEngine(projectId: string | null) {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [participants, setParticipants] = useState<CollaboratorPresence[]>([]);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [awareness, setAwareness] = useState<CollaborationAwareness>({
    activeEditors: new Map(),
    lockedFiles: new Map(),
    editHistory: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);

  const vectorClockRef = useRef<Record<string, number>>({});
  const localUserIdRef = useRef(`user-${Math.random().toString(36).slice(2, 8)}`);
  const presenceTimerRef = useRef<NodeJS.Timeout>();

  /** Initialize a collaboration session */
  const startSession = useCallback((displayName: string, email: string) => {
    const userId = localUserIdRef.current;
    const color = AVATAR_COLORS[Math.abs(hashStr(userId)) % AVATAR_COLORS.length];

    const localPresence: CollaboratorPresence = {
      userId,
      displayName,
      email,
      avatarColor: color,
      activeFile: null,
      cursorLine: 1,
      cursorColumn: 1,
      selection: null,
      lastSeen: Date.now(),
      status: 'active',
      isFollowing: null,
    };

    const newSession: CollaborationSession = {
      id: `session-${Date.now()}`,
      projectId: projectId || 'local',
      createdAt: Date.now(),
      participants: [localPresence],
      isLive: true,
    };

    setSession(newSession);
    setParticipants([localPresence]);
    setIsConnected(true);

    // Start presence heartbeat
    presenceTimerRef.current = setInterval(() => {
      setParticipants(prev => prev.map(p => {
        if (p.userId === userId) return { ...p, lastSeen: Date.now() };
        const elapsed = Date.now() - p.lastSeen;
        const status: CollaboratorPresence['status'] =
          elapsed > AWAY_TIMEOUT ? 'away' : elapsed > IDLE_TIMEOUT ? 'idle' : 'active';
        return { ...p, status };
      }));
    }, PRESENCE_INTERVAL);

    return newSession;
  }, [projectId]);

  /** End the collaboration session */
  const endSession = useCallback(() => {
    if (presenceTimerRef.current) clearInterval(presenceTimerRef.current);
    setSession(null);
    setParticipants([]);
    setIsConnected(false);
    setMessages([]);
  }, []);

  /** Update local cursor/file presence */
  const updatePresence = useCallback((update: Partial<Pick<CollaboratorPresence, 'activeFile' | 'cursorLine' | 'cursorColumn' | 'selection'>>) => {
    const userId = localUserIdRef.current;
    setParticipants(prev => prev.map(p =>
      p.userId === userId ? { ...p, ...update, lastSeen: Date.now(), status: 'active' as const } : p
    ));

    // Update awareness map
    if (update.activeFile !== undefined) {
      setAwareness(prev => {
        const editors = new Map(prev.activeEditors);
        // Remove from all files
        for (const [path, users] of editors) {
          editors.set(path, users.filter(u => u !== userId));
        }
        // Add to current file
        if (update.activeFile) {
          const existing = editors.get(update.activeFile) || [];
          editors.set(update.activeFile, [...existing, userId]);
        }
        return { ...prev, activeEditors: editors };
      });
    }
  }, []);

  /** Create an edit operation */
  const createOperation = useCallback((
    filePath: string,
    type: EditOperation['type'],
    offset: number,
    content?: string,
    length?: number,
  ): EditOperation => {
    const userId = localUserIdRef.current;
    vectorClockRef.current = incrementClock(vectorClockRef.current, userId);

    return {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId,
      filePath,
      type,
      offset,
      content,
      length,
      timestamp: Date.now(),
      vectorClock: { ...vectorClockRef.current },
    };
  }, []);

  /** Apply a remote operation with OT */
  const applyRemoteOperation = useCallback((op: EditOperation, currentContent: string): string => {
    // Transform against pending local operations
    const localOps = awareness.editHistory.filter(
      o => o.userId === localUserIdRef.current && o.timestamp > op.timestamp
    );

    let transformedOp = { ...op };
    for (const localOp of localOps) {
      transformedOp = { ...transformedOp, offset: transformOffset(transformedOp, localOp) };
    }

    // Track in history
    setAwareness(prev => ({
      ...prev,
      editHistory: [...prev.editHistory.slice(-200), transformedOp],
    }));

    return applyOperation(currentContent, transformedOp);
  }, [awareness.editHistory]);

  /** Soft-lock a file */
  const lockFile = useCallback((filePath: string) => {
    setAwareness(prev => {
      const locks = new Map(prev.lockedFiles);
      if (!locks.has(filePath)) {
        locks.set(filePath, localUserIdRef.current);
      }
      return { ...prev, lockedFiles: locks };
    });
  }, []);

  /** Release a soft-lock */
  const unlockFile = useCallback((filePath: string) => {
    setAwareness(prev => {
      const locks = new Map(prev.lockedFiles);
      if (locks.get(filePath) === localUserIdRef.current) {
        locks.delete(filePath);
      }
      return { ...prev, lockedFiles: locks };
    });
  }, []);

  /** Send a chat message in the session */
  const sendMessage = useCallback((content: string, type: SessionMessage['type'] = 'chat', metadata?: SessionMessage['metadata']) => {
    const userId = localUserIdRef.current;
    const participant = participants.find(p => p.userId === userId);

    const msg: SessionMessage = {
      id: `msg-${Date.now()}`,
      userId,
      displayName: participant?.displayName || 'You',
      content,
      timestamp: Date.now(),
      type,
      metadata,
    };

    setMessages(prev => [...prev, msg]);
    return msg;
  }, [participants]);

  /** Follow another user's cursor */
  const followUser = useCallback((targetUserId: string | null) => {
    setFollowingUserId(targetUserId);
    setParticipants(prev => prev.map(p =>
      p.userId === localUserIdRef.current ? { ...p, isFollowing: targetUserId } : p
    ));
  }, []);

  /** Get the file a followed user is editing */
  const getFollowedFile = useCallback(() => {
    if (!followingUserId) return null;
    return participants.find(p => p.userId === followingUserId)?.activeFile || null;
  }, [followingUserId, participants]);

  /** Simulate adding a remote participant (for demo/testing) */
  const addSimulatedParticipant = useCallback((name: string) => {
    const userId = `sim-${Math.random().toString(36).slice(2, 8)}`;
    const color = AVATAR_COLORS[Math.abs(hashStr(userId)) % AVATAR_COLORS.length];

    const presence: CollaboratorPresence = {
      userId,
      displayName: name,
      email: `${name.toLowerCase().replace(/\s/g, '.')}@example.com`,
      avatarColor: color,
      activeFile: null,
      cursorLine: 1,
      cursorColumn: 1,
      selection: null,
      lastSeen: Date.now(),
      status: 'active',
      isFollowing: null,
    };

    setParticipants(prev => [...prev, presence]);
    sendMessage(`${name} joined the session`, 'system');
    return userId;
  }, [sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (presenceTimerRef.current) clearInterval(presenceTimerRef.current);
    };
  }, []);

  return {
    session,
    participants,
    messages,
    awareness,
    isConnected,
    followingUserId,
    localUserId: localUserIdRef.current,
    startSession,
    endSession,
    updatePresence,
    createOperation,
    applyRemoteOperation,
    lockFile,
    unlockFile,
    sendMessage,
    followUser,
    getFollowedFile,
    addSimulatedParticipant,
  };
}

// ─── Utility ─────────────────────────────────────────────────

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
