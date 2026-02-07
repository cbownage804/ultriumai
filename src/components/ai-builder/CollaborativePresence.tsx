import { useState, useEffect } from 'react';
import { Users, Circle, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CollaborativePresenceProps {
  projectId: string | null;
}

interface PresenceUser {
  userId: string;
  email: string;
  color: string;
  lastSeen: Date;
  activeFile?: string;
  isEditing?: boolean;
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
                  activeFile: presence.activeFile,
                  isEditing: presence.isEditing,
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
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {onlineUsers.slice(0, 4).map(user => (
          <Tooltip key={user.userId}>
            <TooltipTrigger asChild>
              <div
                className="h-6 w-6 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-[9px] font-bold text-white relative cursor-default"
                style={{ backgroundColor: user.color }}
              >
                {user.email[0]?.toUpperCase() || '?'}
                {user.isEditing && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#0a0a0f] flex items-center justify-center">
                    <MousePointer2 className="h-1.5 w-1.5" style={{ color: user.color }} />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0a0a0f] bg-emerald-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <div className="font-medium">{user.email}</div>
              {user.activeFile && (
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MousePointer2 className="h-2.5 w-2.5" />
                  {user.activeFile.split('/').pop()}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
        {onlineUsers.length > 4 && (
          <div className="h-6 w-6 rounded-full border-2 border-[#0a0a0f] bg-white/10 flex items-center justify-center text-[9px] text-white/60 font-medium">
            +{onlineUsers.length - 4}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 text-[9px] text-white/30">
        <Circle className="h-1.5 w-1.5 fill-emerald-400 text-emerald-400" />
        <span>{onlineUsers.length} online</span>
      </div>
    </div>
  );
}
