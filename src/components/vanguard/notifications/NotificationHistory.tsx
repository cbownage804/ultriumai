import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Mail, MessageSquare, Phone, Bell, Check, X, Clock, Filter, Download, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumCard } from '../ui';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface NotificationLog {
  id: string;
  notification_type: string;
  recipient: string;
  subject: string | null;
  status: string;
  error_message: string | null;
  delivered_at: string | null;
  metadata: Json;
  created_at: string;
}

export const NotificationHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    if (user) loadLogs();
  }, [user, dateRange]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const daysAgo = parseInt(dateRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data || []) as NotificationLog[]);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      toast({ title: 'Error loading notification history', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'slack': return <MessageSquare className="h-4 w-4" />;
      case 'teams': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-cyan-400 bg-cyan-500/20';
      case 'sms': return 'text-green-400 bg-green-500/20';
      case 'slack': return 'text-purple-400 bg-purple-500/20';
      case 'teams': return 'text-blue-400 bg-blue-500/20';
      case 'push': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <Check className="h-3 w-3 text-green-400" />;
      case 'failed': return <X className="h-3 w-3 text-red-400" />;
      case 'bounced': return <X className="h-3 w-3 text-orange-400" />;
      case 'pending': return <Clock className="h-3 w-3 text-yellow-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'bounced': return 'bg-orange-500/20 text-orange-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.notification_type !== filter && log.status !== filter) return false;
    if (search && !log.subject?.toLowerCase().includes(search.toLowerCase()) && 
        !log.recipient.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: logs.length,
    delivered: logs.filter(l => l.status === 'delivered').length,
    failed: logs.filter(l => l.status === 'failed').length,
    pending: logs.filter(l => l.status === 'pending').length,
  };

  const exportLogs = () => {
    const csv = [
      ['Type', 'Recipient', 'Subject', 'Status', 'Error', 'Time'].join(','),
      ...filteredLogs.map(log => [
        log.notification_type,
        log.recipient,
        `"${log.subject || ''}"`,
        log.status,
        `"${log.error_message || ''}"`,
        new Date(log.created_at).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ title: 'Logs exported' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: stats.total, change: '' },
          { label: 'Delivered', value: stats.delivered, change: stats.total > 0 ? `${((stats.delivered / stats.total) * 100).toFixed(1)}%` : '0%' },
          { label: 'Failed', value: stats.failed, change: '' },
          { label: 'Pending', value: stats.pending, change: '' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PremiumCard variant="glass" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                {stat.change && (
                  <Badge variant="outline" className="text-green-400">
                    {stat.change}
                  </Badge>
                )}
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <PremiumCard variant="glass" className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by recipient or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
              <SelectItem value="teams">Teams</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px] bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" className="border-white/10" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="border-white/10" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </PremiumCard>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <PremiumCard variant="glass" className="p-8 text-center">
          <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="text-lg font-medium mb-2">No notification logs</h4>
          <p className="text-sm text-muted-foreground">Notifications will appear here once sent</p>
        </PremiumCard>
      ) : (
        <PremiumCard variant="glass" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Recipient</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Subject</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className={`p-2 rounded-lg w-fit ${getTypeColor(log.notification_type)}`}>
                        {getTypeIcon(log.notification_type)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{log.recipient}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm">{log.subject || '-'}</span>
                      {log.error_message && (
                        <p className="text-xs text-red-400 mt-1">{log.error_message}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge className={`${getStatusColor(log.status)} gap-1`}>
                        {getStatusIcon(log.status)}
                        {log.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{formatTime(log.created_at)}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumCard>
      )}
    </div>
  );
};
