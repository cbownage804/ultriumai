import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Edit, Trash2, TestTube, Check, X, Slack, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PremiumCard } from '../ui';
import { useToast } from '@/hooks/use-toast';

interface Webhook {
  id: string;
  name: string;
  type: 'slack' | 'teams' | 'discord' | 'custom';
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered: string;
  successRate: number;
}

export const WebhookConfig = () => {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    { id: '1', name: 'Slack - #security-alerts', type: 'slack', url: 'https://hooks.slack.com/...', events: ['critical_alert', 'incident_created'], isActive: true, lastTriggered: '5 min ago', successRate: 99.8 },
    { id: '2', name: 'Teams - IT Ops', type: 'teams', url: 'https://outlook.office.com/webhook/...', events: ['ticket_created', 'sla_breach'], isActive: true, lastTriggered: '15 min ago', successRate: 100 },
    { id: '3', name: 'Discord - Dev Team', type: 'discord', url: 'https://discord.com/api/webhooks/...', events: ['deployment', 'error'], isActive: false, lastTriggered: '2 days ago', successRate: 95.5 },
    { id: '4', name: 'Custom - PagerDuty', type: 'custom', url: 'https://events.pagerduty.com/...', events: ['critical_alert', 'incident_escalated'], isActive: true, lastTriggered: '1 hour ago', successRate: 99.2 },
  ]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'slack': return <Slack className="h-5 w-5" />;
      case 'teams': return <MessageSquare className="h-5 w-5" />;
      case 'discord': return <MessageSquare className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'slack': return 'from-purple-500/20 to-pink-500/20 text-purple-400';
      case 'teams': return 'from-blue-500/20 to-indigo-500/20 text-blue-400';
      case 'discord': return 'from-indigo-500/20 to-purple-500/20 text-indigo-400';
      default: return 'from-cyan-500/20 to-blue-500/20 text-cyan-400';
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTesting(null);
    toast({ title: 'Webhook test successful', description: 'Message delivered successfully' });
  };

  const handleToggle = (id: string) => {
    setWebhooks(prev => prev.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ));
  };

  const handleDelete = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
    toast({ title: 'Webhook deleted', variant: 'destructive' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhook Integrations</h3>
          <p className="text-sm text-muted-foreground">Connect to Slack, Teams, Discord, and custom endpoints</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-[hsl(var(--vanguard-card))] border-white/10">
            <DialogHeader>
              <DialogTitle>Add Webhook Integration</DialogTitle>
            </DialogHeader>
            <WebhookEditor onSave={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Connect */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Slack', icon: Slack, color: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' },
          { name: 'MS Teams', icon: MessageSquare, color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' },
          { name: 'Discord', icon: MessageSquare, color: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400' },
          { name: 'Custom', icon: Zap, color: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400' },
        ].map((platform) => (
          <Button
            key={platform.name}
            variant="outline"
            className={`h-auto py-4 flex-col gap-2 border-white/10 ${platform.color} transition-colors`}
            onClick={() => setIsCreateOpen(true)}
          >
            <platform.icon className="h-6 w-6" />
            <span>Connect {platform.name}</span>
          </Button>
        ))}
      </div>

      {/* Webhook List */}
      <div className="grid gap-4">
        {webhooks.map((webhook, index) => (
          <motion.div
            key={webhook.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PremiumCard variant="glass" className="p-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${getTypeColor(webhook.type)}`}>
                  {getTypeIcon(webhook.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{webhook.name}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {webhook.type}
                    </Badge>
                    {!webhook.isActive && (
                      <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                        Paused
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {webhook.events.map(event => (
                      <Badge key={event} variant="secondary" className="text-xs bg-white/5">
                        {event.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Last triggered: {webhook.lastTriggered}</span>
                    <span className={webhook.successRate >= 99 ? 'text-green-400' : webhook.successRate >= 95 ? 'text-yellow-400' : 'text-red-400'}>
                      {webhook.successRate}% success
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhook.isActive}
                    onCheckedChange={() => handleToggle(webhook.id)}
                  />
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleTest(webhook.id)}
                    disabled={testing === webhook.id}
                  >
                    {testing === webhook.id ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <TestTube className="h-4 w-4" />
                      </motion.div>
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </PremiumCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const WebhookEditor = ({ onSave }: { onSave: () => void }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const eventOptions = [
    { id: 'ticket_created', label: 'Ticket Created' },
    { id: 'ticket_updated', label: 'Ticket Updated' },
    { id: 'ticket_resolved', label: 'Ticket Resolved' },
    { id: 'sla_breach', label: 'SLA Breach' },
    { id: 'critical_alert', label: 'Critical Alert' },
    { id: 'incident_created', label: 'Incident Created' },
    { id: 'incident_escalated', label: 'Incident Escalated' },
    { id: 'deployment', label: 'Deployment' },
  ];

  const handleSave = () => {
    toast({ title: 'Webhook saved successfully' });
    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Webhook Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Slack - #security-alerts"
          className="bg-white/5 border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label>Platform Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="bg-white/5 border-white/10">
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="slack">Slack</SelectItem>
            <SelectItem value="teams">Microsoft Teams</SelectItem>
            <SelectItem value="discord">Discord</SelectItem>
            <SelectItem value="custom">Custom Webhook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Webhook URL</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://hooks.slack.com/services/..."
          className="bg-white/5 border-white/10"
        />
      </div>

      <div className="space-y-2">
        <Label>Trigger Events</Label>
        <div className="grid grid-cols-2 gap-2">
          {eventOptions.map((event) => (
            <div key={event.id} className="flex items-center space-x-2">
              <Checkbox
                id={event.id}
                checked={selectedEvents.includes(event.id)}
                onCheckedChange={(checked) => {
                  setSelectedEvents(prev => 
                    checked 
                      ? [...prev, event.id]
                      : prev.filter(e => e !== event.id)
                  );
                }}
              />
              <label htmlFor={event.id} className="text-sm cursor-pointer">
                {event.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" className="border-white/10">
          <TestTube className="h-4 w-4 mr-2" />
          Test
        </Button>
        <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-500">
          Save Webhook
        </Button>
      </div>
    </div>
  );
};
