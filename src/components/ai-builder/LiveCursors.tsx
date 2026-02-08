import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CursorPosition {
  userId: string;
  email: string;
  color: string;
  x: number;
  y: number;
  lastSeen: number;
}

interface LiveCursorsProps {
  projectId: string | null;
  containerRef: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
}

const CURSOR_COLORS = [
  '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#ec4899',
];

export function LiveCursors({ projectId, containerRef, enabled = true }: LiveCursorsProps) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string>('');
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!projectId || !enabled) return;

    const channel = supabase.channel(`live-cursors:${projectId}`);
    channelRef.current = channel;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userIdRef.current = user.id;

      channel
        .on('broadcast', { event: 'cursor-move' }, ({ payload }: any) => {
          if (!payload || payload.userId === user.id) return;
          setCursors(prev => {
            const next = new Map(prev);
            next.set(payload.userId, {
              ...payload,
              lastSeen: Date.now(),
            });
            return next;
          });
        })
        .subscribe();
    };

    setup();

    // Cleanup stale cursors every 3 seconds
    const cleanup = setInterval(() => {
      setCursors(prev => {
        const now = Date.now();
        const next = new Map(prev);
        for (const [id, cursor] of next) {
          if (now - cursor.lastSeen > 5000) next.delete(id);
        }
        return next.size !== prev.size ? next : prev;
      });
    }, 3000);

    return () => {
      clearInterval(cleanup);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [projectId, enabled]);

  // Broadcast own cursor position
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!channelRef.current || !containerRef.current || !userIdRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Throttle to ~20fps
    if (animationRef.current) return;
    animationRef.current = requestAnimationFrame(() => {
      animationRef.current = null;
      channelRef.current?.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: {
          userId: userIdRef.current,
          email: '',
          color: CURSOR_COLORS[userIdRef.current.charCodeAt(0) % CURSOR_COLORS.length],
          x, y,
        },
      });
    });
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;
    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, [containerRef, handleMouseMove, enabled]);

  if (!enabled || cursors.size === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {Array.from(cursors.values()).map(cursor => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
          }}
        >
          {/* Cursor arrow */}
          <svg
            width="16"
            height="20"
            viewBox="0 0 16 20"
            fill="none"
            className="drop-shadow-lg"
          >
            <path
              d="M0 0L16 12H6L0 20V0Z"
              fill={cursor.color}
            />
            <path
              d="M0 0L16 12H6L0 20V0Z"
              stroke="white"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
          </svg>
          {/* Name label */}
          {cursor.email && (
            <div
              className="absolute left-4 top-4 px-1.5 py-0.5 rounded text-[9px] font-medium text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.email.split('@')[0]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
