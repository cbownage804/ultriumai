import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Edit, Trash2, TestTube, Slack, Globe, Zap, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Webhook {
  id: string;
  name: string;
  webhook_type: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  success_count: number;
  failure_count: number;
  created_at: string;
}

export const WebhookConfig = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadWebhooks();
  }, [user]);

  const loadWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error: any) {
      console.error('Error loading webhooks:', error);
      toast({ title: 'Error loading webhooks', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleTest = async (webhook: Webhook) => {
    setTesting(webhook.id);
    try {
      // Send a test payload to the webhook URL
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '🧪 Test notification from Vanguard',
          type: 'test',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        await supabase
          .from('webhook_configs')
          .update({ 
            success_count: webhook.success_count + 1,
            last_triggered_at: new Date().toISOString()
          })
          .eq('id', webhook.id);

        setWebhooks(prev => prev.map(w => 
          w.id === webhook.id 
            ? { ...w, success_count: w.success_count + 1, last_triggered_at: new Date().toISOString() }
            : w
        ));
        toast({ title: 'Webhook test successful', description: 'Message delivered' });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      await supabase
        .from('webhook_configs')
        .update({ failure_count: webhook.failure_count + 1 })
        .eq('id', webhook.id);

      setWebhooks(prev => prev.map(w => 
        w.id === webhook.id ? { ...w, failure_count: w.failure_count + 1 } : w
      ));
      toast({ title: 'Webhook test failed', description: error.message, variant: 'destructive' });
    } finally {
      setTesting(null);
    }
  };

  const handleToggle = async (webhook: Webhook) => {
    try {
      const { error } = await supabase
        .from('webhook_configs')
        .update({ is_active: !webhook.is_active })
        .eq('id', webhook.id);

      if (error) throw error;
      setWebhooks(prev => prev.map(w => 
        w.id === webhook.id ? { ...w, is_active: !w.is_active } : w
      ));
    } catch (error) {
      toast({ title: 'Error updating webhook', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhook_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setWebhooks(prev => prev.filter(w => w.id !== id));
      toast({ title: 'Webhook deleted' });
    } catch (error) {
      toast({ title: 'Error deleting webhook', variant: 'destructive' });
    }
  };

  const handleSave = async (webhookData: Partial<Webhook>) => {
    if (!user) return;
    try {
      if (editingWebhook) {
        const { error } = await supabase
          .from('webhook_configs')
          .update(webhookData)
          .eq('id', editingWebhook.id);

        if (error) throw error;
        setWebhooks(prev => prev.map(w => 
          w.id === editingWebhook.id ? { ...w, ...webhookData } : w
        ));
        toast({ title: 'Webhook updated' });
      } else {
        const { data, error } = await supabase
          .from('webhook_configs')
          .insert([{ 
            name: webhookData.name!,
            url: webhookData.url!,
            webhook_type: webhookData.webhook_type,
            events: webhookData.events,
            user_id: user.id 
          }])
          .select()
          .single();

        if (error) throw error;
        setWebhooks(prev => [data as Webhook, ...prev]);
        toast({ title: 'Webhook created' });
      }
      setIsCreateOpen(false);
      setEditingWebhook(null);
    } catch (error: any) {
      toast({ title: 'Error saving webhook', variant: 'destructive' });
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhook Integrations</h3>
          <p className="text-sm text-muted-foreground">Connect to Slack, Teams, Discord, and custom endpoints</p>
        </div>
        <Dialog open={isCreateOpen || !!editingWebhook} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingWebhook(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-[hsl(var(--vanguard-card))] border-white/10">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'Add Webhook Integration'}</DialogTitle>
            </DialogHeader>
            <WebhookEditor 
              webhook={editingWebhook}
              onSave={handleSave}
              onCancel={() => {
                setIsCreateOpen(false);
                setEditingWebhook(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Connect */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Slack', type: 'slack', icon: Slack, color: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400' },
          { name: 'MS Teams', type: 'teams', icon: MessageSquare, color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' },
          { name: 'Discord', type: 'discord', icon: MessageSquare, color: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400' },
          { name: 'Custom', type: 'custom', icon: Zap, color: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400' },
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
      {webhooks.length === 0 ? (
        <PremiumCard variant="glass" className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="text-lg font-medium mb-2">No webhooks configured</h4>
          <p className="text-sm text-muted-foreground mb-4">Connect your first webhook to start receiving notifications</p>
        </PremiumCard>
      ) : (
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
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${getTypeColor(webhook.webhook_type)}`}>
                    {getTypeIcon(webhook.webhook_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{webhook.name}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {webhook.webhook_type}
                      </Badge>
                      {!webhook.is_active && (
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
                      <span>Last triggered: {formatTime(webhook.last_triggered_at)}</span>
                      <span className={
                        webhook.success_count + webhook.failure_count === 0 ? 'text-muted-foreground' :
                        (webhook.success_count / (webhook.success_count + webhook.failure_count)) >= 0.99 ? 'text-green-400' : 
                        (webhook.success_count / (webhook.success_count + webhook.failure_count)) >= 0.95 ? 'text-yellow-400' : 'text-red-400'
                      }>
                        {webhook.success_count + webhook.failure_count === 0 
                          ? 'No deliveries yet'
                          : `${((webhook.success_count / (webhook.success_count + webhook.failure_count)) * 100).toFixed(1)}% success`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() => handleToggle(webhook)}
                    />
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleTest(webhook)}
                      disabled={testing === webhook.id}
                    >
                      {testing === webhook.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setEditingWebhook(webhook)}
                    >
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
      )}
    </div>
  );
};

interface WebhookEditorProps {
  webhook?: Webhook | null;
  onSave: (data: Partial<Webhook>) => void;
  onCancel: () => void;
}

const WebhookEditor = ({ webhook, onSave, onCancel }: WebhookEditorProps) => {
  const [name, setName] = useState(webhook?.name || '');
  const [webhookType, setWebhookType] = useState(webhook?.webhook_type || 'custom');
  const [url, setUrl] = useState(webhook?.url || '');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook?.events || []);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSubmit = async () => {
    if (!name || !url) return;
    setIsSaving(true);
    await onSave({ 
      name, 
      webhook_type: webhookType, 
      url, 
      events: selectedEvents 
    });
    setIsSaving(false);
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
        <Select value={webhookType} onValueChange={setWebhookType}>
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
        <Button variant="outline" className="border-white/10" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="bg-gradient-to-r from-cyan-500 to-blue-500"
          disabled={isSaving || !name || !url}
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {webhook ? 'Update Webhook' : 'Save Webhook'}
        </Button>
      </div>
    </div>
  );
};
