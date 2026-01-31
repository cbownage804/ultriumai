import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, Mail, MessageSquare, Phone, Bell, Check, X, Clock, Filter, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PremiumCard } from '../ui';

interface NotificationLog {
  id: string;
  type: 'email' | 'sms' | 'slack' | 'teams' | 'push';
  recipient: string;
  subject: string;
  status: 'delivered' | 'failed' | 'pending' | 'bounced';
  timestamp: string;
  deliveredAt?: string;
  errorMessage?: string;
}

export const NotificationHistory = () => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  const logs: NotificationLog[] = [
    { id: '1', type: 'email', recipient: 'john@company.com', subject: 'Ticket #4521 Created', status: 'delivered', timestamp: '2 min ago', deliveredAt: '2 min ago' },
    { id: '2', type: 'slack', recipient: '#security-alerts', subject: 'Critical: Server Down', status: 'delivered', timestamp: '5 min ago', deliveredAt: '5 min ago' },
    { id: '3', type: 'sms', recipient: '+1 555-0123', subject: 'SLA Breach Warning', status: 'delivered', timestamp: '12 min ago', deliveredAt: '12 min ago' },
    { id: '4', type: 'email', recipient: 'team@company.com', subject: 'Weekly Report', status: 'pending', timestamp: '15 min ago' },
    { id: '5', type: 'teams', recipient: '#incidents', subject: 'P1 Incident Escalation', status: 'delivered', timestamp: '20 min ago', deliveredAt: '20 min ago' },
    { id: '6', type: 'email', recipient: 'invalid@test', subject: 'Test Notification', status: 'bounced', timestamp: '25 min ago', errorMessage: 'Invalid email address' },
    { id: '7', type: 'sms', recipient: '+1 555-0124', subject: 'Security Alert', status: 'failed', timestamp: '30 min ago', errorMessage: 'Phone number not reachable' },
    { id: '8', type: 'push', recipient: 'Mobile App', subject: 'New Assignment', status: 'delivered', timestamp: '35 min ago', deliveredAt: '35 min ago' },
    { id: '9', type: 'email', recipient: 'manager@company.com', subject: 'Escalation Notice', status: 'delivered', timestamp: '1 hour ago', deliveredAt: '1 hour ago' },
    { id: '10', type: 'slack', recipient: '#general', subject: 'System Maintenance', status: 'delivered', timestamp: '2 hours ago', deliveredAt: '2 hours ago' },
  ];

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

  const stats = [
    { label: 'Total Sent', value: '2,847', change: '+12%' },
    { label: 'Delivered', value: '2,801', change: '98.4%' },
    { label: 'Failed', value: '32', change: '-5%' },
    { label: 'Pending', value: '14', change: '' },
  ];

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.type !== filter && log.status !== filter) return false;
    if (search && !log.subject.toLowerCase().includes(search.toLowerCase()) && 
        !log.recipient.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
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
                  <Badge variant="outline" className={stat.change.startsWith('+') || stat.change.includes('%') ? 'text-green-400' : 'text-red-400'}>
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
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
              <SelectItem value="teams">Teams</SelectItem>
              <SelectItem value="push">Push</SelectItem>
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

          <Button variant="outline" size="icon" className="border-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="outline" className="border-white/10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </PremiumCard>

      {/* Logs Table */}
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
                    <div className={`p-2 rounded-lg w-fit ${getTypeColor(log.type)}`}>
                      {getTypeIcon(log.type)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{log.recipient}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{log.subject}</span>
                    {log.errorMessage && (
                      <p className="text-xs text-red-400 mt-1">{log.errorMessage}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge className={`${getStatusColor(log.status)} gap-1`}>
                      {getStatusIcon(log.status)}
                      {log.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </PremiumCard>
    </div>
  );
};
