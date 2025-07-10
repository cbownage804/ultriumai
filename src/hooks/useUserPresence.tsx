import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPresence {
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  current_page?: string;
  metadata: any;
  updated_at: string;
}

export const useUserPresence = () => {
  const [userPresence, setUserPresence] = useState<UserPresence[]>([]);
  const [currentUserStatus, setCurrentUserStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('offline');

  // Update user presence
  const updatePresence = useCallback(async (
    status: 'online' | 'away' | 'busy' | 'offline',
    currentPage?: string,
    metadata?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          last_seen: new Date().toISOString(),
          current_page: currentPage,
          metadata: metadata || {}
        });

      if (error) throw error;
      setCurrentUserStatus(status);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, []);

  // Set user as online when component mounts
  useEffect(() => {
    updatePresence('online', window.location.pathname);

    // Set up heartbeat to keep user online
    const heartbeatInterval = setInterval(() => {
      if (currentUserStatus === 'online') {
        updatePresence('online', window.location.pathname);
      }
    }, 30000); // Update every 30 seconds

    // Set user as offline when tab becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence('away');
      } else {
        updatePresence('online', window.location.pathname);
      }
    };

    // Set user as offline before page unload
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('offline');
    };
  }, [updatePresence, currentUserStatus]);

  // Subscribe to presence changes
  useEffect(() => {
    const loadPresence = async () => {
      try {
        const { data, error } = await supabase
          .from('user_presence')
          .select('*')
          .neq('status', 'offline');

        if (error) throw error;
        setUserPresence((data || []).map(p => ({
          ...p,
          status: p.status as 'online' | 'away' | 'busy' | 'offline'
        })));
      } catch (error) {
        console.error('Error loading presence:', error);
      }
    };

    loadPresence();

    const presenceChannel = supabase
      .channel('user_presence_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedPresence = payload.new as UserPresence;
            setUserPresence(prev => {
              const filtered = prev.filter(p => p.user_id !== updatedPresence.user_id);
              if (updatedPresence.status === 'offline') {
                return filtered;
              }
              return [...filtered, updatedPresence];
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedPresence = payload.old as UserPresence;
            setUserPresence(prev => prev.filter(p => p.user_id !== deletedPresence.user_id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  return {
    userPresence,
    currentUserStatus,
    updatePresence,
    onlineUsers: userPresence.filter(p => p.status === 'online'),
    awayUsers: userPresence.filter(p => p.status === 'away'),
    busyUsers: userPresence.filter(p => p.status === 'busy')
  };
};
