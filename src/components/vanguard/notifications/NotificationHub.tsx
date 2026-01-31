import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, MessageSquare, Phone, GitBranch, History, Settings } from 'lucide-react';
import { PremiumCard, SectionHeader } from '../ui';
import { EmailTemplates } from './EmailTemplates';
import { WebhookConfig } from './WebhookConfig';
import { SMSAlerts } from './SMSAlerts';
import { EscalationRules } from './EscalationRules';
import { NotificationHistory } from './NotificationHistory';
import { NotificationPreferences } from './NotificationPreferences';

export const NotificationHub = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { label: 'Sent Today', value: '247', icon: Mail, color: 'text-cyan-400' },
    { label: 'Webhooks Active', value: '8', icon: MessageSquare, color: 'text-green-400' },
    { label: 'SMS Credits', value: '1,250', icon: Phone, color: 'text-purple-400' },
    { label: 'Escalations', value: '12', icon: GitBranch, color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
          <Bell className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notification Center</h1>
          <p className="text-sm text-muted-foreground">Manage email templates, webhooks, SMS alerts, and escalation rules</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PremiumCard variant="glass" className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1 flex-wrap h-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Bell className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Mail className="h-4 w-4 mr-2" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <MessageSquare className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="sms" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Phone className="h-4 w-4 mr-2" />
            SMS Alerts
          </TabsTrigger>
          <TabsTrigger value="escalation" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <GitBranch className="h-4 w-4 mr-2" />
            Escalation
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <NotificationOverview />
        </TabsContent>

        <TabsContent value="email">
          <EmailTemplates />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookConfig />
        </TabsContent>

        <TabsContent value="sms">
          <SMSAlerts />
        </TabsContent>

        <TabsContent value="escalation">
          <EscalationRules />
        </TabsContent>

        <TabsContent value="history">
          <NotificationHistory />
        </TabsContent>

        <TabsContent value="preferences">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const NotificationOverview = () => {
  const recentNotifications = [
    { id: 1, type: 'email', subject: 'Critical Alert: Server Down', recipient: 'ops@company.com', status: 'delivered', time: '2 min ago' },
    { id: 2, type: 'slack', subject: 'New Ticket #4521', recipient: '#support', status: 'delivered', time: '5 min ago' },
    { id: 3, type: 'sms', subject: 'SLA Breach Warning', recipient: '+1 555-0123', status: 'delivered', time: '12 min ago' },
    { id: 4, type: 'email', subject: 'Weekly Report', recipient: 'team@company.com', status: 'pending', time: '15 min ago' },
    { id: 5, type: 'teams', subject: 'Escalation: P1 Incident', recipient: '#incidents', status: 'delivered', time: '20 min ago' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4 text-cyan-400" />;
      case 'slack': return <MessageSquare className="h-4 w-4 text-purple-400" />;
      case 'sms': return <Phone className="h-4 w-4 text-green-400" />;
      case 'teams': return <MessageSquare className="h-4 w-4 text-blue-400" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PremiumCard variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
          <div className="space-y-3">
            {recentNotifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="p-2 rounded-lg bg-white/5">
                  {getTypeIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{notif.subject}</p>
                  <p className="text-xs text-muted-foreground">{notif.recipient}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    notif.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {notif.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </PremiumCard>

      <PremiumCard variant="glass">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Channel Health</h3>
          <div className="space-y-4">
            {[
              { name: 'Email (SMTP)', status: 'healthy', uptime: '99.9%' },
              { name: 'Slack Integration', status: 'healthy', uptime: '100%' },
              { name: 'Microsoft Teams', status: 'healthy', uptime: '99.8%' },
              { name: 'SMS (Twilio)', status: 'warning', uptime: '98.5%' },
              { name: 'Push Notifications', status: 'healthy', uptime: '99.7%' },
            ].map((channel) => (
              <div key={channel.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    channel.status === 'healthy' ? 'bg-green-400' : 
                    channel.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm">{channel.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{channel.uptime} uptime</span>
              </div>
            ))}
          </div>
        </div>
      </PremiumCard>
    </div>
  );
};
