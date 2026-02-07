import { useState, useEffect } from 'react';
import { Users, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CollaborativePresenceProps {
  projectId: string | null;
}

interface PresenceUser {
  userId: string;
  email: string;
  color: string;
  lastSeen: Date;
}

const PRESENCE_COLORS = [
  '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6',
];

export function CollaborativePresence({ projectId }: CollaborativePresenceProps) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase.channel(`project:${projectId}`);

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users: PresenceUser[] = [];
          const seen = new Set<string>();

          for (const key of Object.keys(state)) {
            for (const presence of state[key] as any[]) {
              if (!seen.has(presence.userId) && presence.userId !== user.id) {
                seen.add(presence.userId);
                users.push({
                  userId: presence.userId,
                  email: presence.email || 'Anonymous',
                  color: PRESENCE_COLORS[users.length % PRESENCE_COLORS.length],
                  lastSeen: new Date(),
                });
              }
            }
          }

          setOnlineUsers(users);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              userId: user.id,
              email: user.email,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-1.5">
        {onlineUsers.slice(0, 3).map(user => (
          <div
            key={user.userId}
            className="h-5 w-5 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-[8px] font-bold text-white"
            style={{ backgroundColor: user.color }}
            title={user.email}
          >
            {user.email[0]?.toUpperCase() || '?'}
          </div>
        ))}
        {onlineUsers.length > 3 && (
          <div className="h-5 w-5 rounded-full border-2 border-[#0a0a0f] bg-white/10 flex items-center justify-center text-[8px] text-white/60">
            +{onlineUsers.length - 3}
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 text-[9px] text-white/30">
        <Circle className="h-1.5 w-1.5 fill-emerald-400 text-emerald-400" />
        {onlineUsers.length} online
      </div>
    </div>
  );
}
