/**
 * Announcement Banner Component
 * MSP-controlled banner for outages, maintenance, or news
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, AlertCircle, Wrench, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  client_id: string;
  title: string;
  content: string;
  priority: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
}

interface AnnouncementBannerProps {
  clientId?: string;
}

export function AnnouncementBanner({ clientId }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const dismissed = localStorage.getItem('dismissed_announcements');
    if (dismissed) {
      setDismissedIds(new Set(JSON.parse(dismissed)));
    }
    
    fetchAnnouncements();
  }, [clientId]);

  const fetchAnnouncements = async () => {
    try {
      const now = new Date().toISOString();
      
      let query = supabase
        .from('client_portal_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .order('priority', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter out expired announcements
      const active = (data || []).filter(a => 
        !a.expires_at || new Date(a.expires_at) > new Date()
      );
      
      setAnnouncements(active);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const dismissAnnouncement = (id: string) => {
    const newDismissed = new Set([...dismissedIds, id]);
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify([...newDismissed]));
  };

  const getIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'maintenance': return <Wrench className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'maintenance':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      default:
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
    }
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedIds.has(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      <AnimatePresence>
        {visibleAnnouncements.map(announcement => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-lg border p-4 ${getStyles(announcement.priority)}`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">
                {getIcon(announcement.priority)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium mb-1">{announcement.title}</h4>
                <p className="text-sm opacity-80">{announcement.content}</p>
              </div>
              <button
                onClick={() => dismissAnnouncement(announcement.id)}
                className="shrink-0 p-1 hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
