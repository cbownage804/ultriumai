/**
 * Dashboard Stats Component
 * Shows ticket counts, response times, and recent activity
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Ticket, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

interface TicketStats {
  total: number;
  open: number;
  resolved: number;
  avgResponseTime: number | null;
}

export function DashboardStats() {
  const { session } = usePortalSession();
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    resolved: 0,
    avgResponseTime: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('portal-ticket-api', {
        body: {},
        headers: {
          'x-portal-session': session.sessionToken
        }
      });

      if (error) throw error;
      
      const tickets = data.tickets || [];
      const total = tickets.length;
      const open = tickets.filter((t: any) => 
        ['open', 'in_progress', 'pending'].includes(t.status)
      ).length;
      const resolved = tickets.filter((t: any) => 
        ['resolved', 'closed'].includes(t.status)
      ).length;

      setStats({
        total,
        open,
        resolved,
        avgResponseTime: null // Would need first_response tracking
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Tickets',
      value: stats.total,
      icon: Ticket,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-500/10'
    },
    {
      label: 'Open Tickets',
      value: stats.open,
      icon: AlertTriangle,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Resolution Rate',
      value: stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '—',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-500/10'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="bg-black/40 border-white/10 animate-pulse">
            <CardContent className="p-4">
              <div className="h-12 w-12 rounded-lg bg-white/10 mb-3" />
              <div className="h-4 w-16 bg-white/10 rounded mb-2" />
              <div className="h-6 w-10 bg-white/10 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-colors">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-5 w-5 bg-gradient-to-r ${stat.color} bg-clip-text`} style={{ color: 'inherit' }} />
              </div>
              <p className="text-xs text-white/50 uppercase tracking-wide mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-white">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
