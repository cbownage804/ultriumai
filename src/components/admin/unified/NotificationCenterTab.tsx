import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, Check, Trash2, Filter, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'system' | 'security' | 'billing' | 'user';
  channel: 'email' | 'in-app' | 'push';
  read: boolean;
  timestamp: string;
}

const MOCK: Notification[] = [
  { id: '1', title: 'New user registered', body: 'admin@client.com signed up', type: 'user', channel: 'in-app', read: false, timestamp: '5 min ago' },
  { id: '2', title: 'Failed login attempt', body: '3 failed attempts from 45.33.32.156', type: 'security', channel: 'email', read: false, timestamp: '12 min ago' },
  { id: '3', title: 'Invoice paid', body: 'Client Corp paid $1,200', type: 'billing', channel: 'in-app', read: true, timestamp: '1h ago' },
  { id: '4', title: 'Agent offline', body: 'Device SRV-PROD-01 went offline', type: 'system', channel: 'push', read: true, timestamp: '2h ago' },
  { id: '5', title: 'Subscription expiring', body: 'Acme Inc subscription expires in 7 days', type: 'billing', channel: 'email', read: false, timestamp: '3h ago' },
];

const typeColors: Record<string, string> = {
  system: 'bg-blue-500/20 text-blue-500',
  security: 'bg-destructive/20 text-destructive',
  billing: 'bg-green-500/20 text-green-500',
  user: 'bg-purple-500/20 text-purple-500',
};

const channelIcons: Record<string, React.ReactNode> = {
  'email': <Mail className="h-3 w-3" />,
  'in-app': <MessageSquare className="h-3 w-3" />,
  'push': <Smartphone className="h-3 w-3" />,
};

const NotificationCenterTab = () => {
  const [notifications, setNotifications] = useState(MOCK);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.read) : notifications.filter(n => n.type === filter);

  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const remove = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6" /> Notification Center</h2>
          <p className="text-muted-foreground">Centralized admin notifications and delivery management</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5"><Check className="h-3.5 w-3.5" /> Mark all read</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'unread', 'system', 'security', 'billing', 'user'].map(f => (
          <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs">{f}</Button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(n => (
          <Card key={n.id} className={!n.read ? 'border-primary/30 bg-primary/5' : ''}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => markRead(n.id)} role="button">
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-xs ${typeColors[n.type]}`}>{n.type}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">{channelIcons[n.channel]} {n.channel}</span>
                    <span className="text-xs text-muted-foreground">{n.timestamp}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(n.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">No notifications</p>}
      </div>
    </div>
  );
};

export default NotificationCenterTab;
