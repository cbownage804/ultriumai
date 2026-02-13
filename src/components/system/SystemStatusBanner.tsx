import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, AlertCircle, Wrench, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { resilientQuery } from '@/lib/supabaseResilience';

interface StatusEntry {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'maintenance' | 'info';
  is_active: boolean;
}

const severityConfig = {
  critical: { icon: AlertCircle, className: 'bg-destructive/10 border-destructive/30 text-destructive' },
  warning: { icon: AlertTriangle, className: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
  maintenance: { icon: Wrench, className: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
  info: { icon: Info, className: 'bg-primary/10 border-primary/30 text-primary' },
};

export function SystemStatusBanner() {
  const [entries, setEntries] = useState<StatusEntry[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissed_status');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    // Fetch active admin announcements as status entries
    const fetchStatus = async () => {
      try {
        const now = new Date().toISOString();
        const data = await resilientQuery(
          supabase
            .from('admin_announcements')
            .select('id, title, message, severity, is_active, starts_at, expires_at')
            .eq('is_active', true)
            .lte('starts_at', now),
          [],
          'system-status-banner',
          5000 // 5s timeout — non-critical UI element
        );

        const active = (data || []).filter(a =>
          !a.expires_at || new Date(a.expires_at) > new Date()
        ).map(a => ({
          id: a.id,
          title: a.title,
          message: a.message,
          severity: (['critical', 'warning', 'maintenance'].includes(a.severity) ? a.severity : 'info') as StatusEntry['severity'],
          is_active: a.is_active ?? true,
        }));

        setEntries(active);
      } catch (err) {
        // Silently fail — banner is non-essential
      }
    };

    fetchStatus();

    // Real-time subscription
    const channel = supabase
      .channel('system-status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_announcements' }, () => { fetchStatus(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const dismiss = (id: string) => {
    const next = new Set([...dismissed, id]);
    setDismissed(next);
    localStorage.setItem('dismissed_status', JSON.stringify([...next]));
  };

  const visible = entries.filter(e => !dismissed.has(e.id));
  if (visible.length === 0) return null;

  return (
    <div className="w-full z-50">
      <AnimatePresence>
        {visible.map(entry => {
          const config = severityConfig[entry.severity];
          const Icon = config.icon;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`border-b px-4 py-3 ${config.className}`}
            >
              <div className="max-w-7xl mx-auto flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{entry.title}</span>
                  <span className="text-sm opacity-80 ml-2">{entry.message}</span>
                </div>
                <button onClick={() => dismiss(entry.id)} className="shrink-0 p-1 hover:opacity-70 transition-opacity">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
