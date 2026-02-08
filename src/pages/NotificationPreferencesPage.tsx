import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, Mail, Smartphone, Shield, Zap, FileText, AlertTriangle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationChannel {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NotificationCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  channels: Record<string, boolean>;
}

const CHANNELS: NotificationChannel[] = [
  { id: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { id: 'push', label: 'Push', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'in_app', label: 'In-App', icon: <Bell className="h-4 w-4" /> },
];

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  {
    id: 'security_alerts',
    label: 'Security Alerts',
    description: 'Threat detections, breach alerts, and vulnerability findings',
    icon: <Shield className="h-5 w-5 text-destructive" />,
    channels: { email: true, push: true, in_app: true },
  },
  {
    id: 'system_updates',
    label: 'System Updates',
    description: 'Platform updates, maintenance windows, and new features',
    icon: <Zap className="h-5 w-5 text-primary" />,
    channels: { email: true, push: false, in_app: true },
  },
  {
    id: 'ticket_activity',
    label: 'Ticket Activity',
    description: 'New tickets, replies, status changes, and SLA warnings',
    icon: <FileText className="h-5 w-5 text-blue-500" />,
    channels: { email: true, push: true, in_app: true },
  },
  {
    id: 'ai_activity',
    label: 'AI & Agent Activity',
    description: 'GPT responses, agent run completions, and credit alerts',
    icon: <Zap className="h-5 w-5 text-violet-500" />,
    channels: { email: false, push: false, in_app: true },
  },
  {
    id: 'billing',
    label: 'Billing & Usage',
    description: 'Invoices, payment confirmations, and usage warnings',
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    channels: { email: true, push: false, in_app: true },
  },
];

const STORAGE_KEY = 'notification-preferences';

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState<NotificationCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [globalPause, setGlobalPause] = useState(false);

  const toggleChannel = (categoryId: string, channelId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, channels: { ...cat.channels, [channelId]: !cat.channels[channelId] } }
          : cat
      )
    );
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    toast({ title: 'Preferences saved', description: 'Your notification preferences have been updated.' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hub')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Notification Preferences</h1>
            <p className="text-sm text-muted-foreground">Control how and when you receive notifications</p>
          </div>
        </div>

        {/* Global pause */}
        <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Pause all notifications</p>
                <p className="text-xs text-muted-foreground">Temporarily silence everything</p>
              </div>
            </div>
            <Switch checked={globalPause} onCheckedChange={setGlobalPause} />
          </CardContent>
        </Card>

        {/* Category cards */}
        <div className="space-y-4">
          {categories.map(cat => (
            <Card key={cat.id} className={globalPause ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {cat.icon}
                  <div>
                    <CardTitle className="text-sm">{cat.label}</CardTitle>
                    <CardDescription className="text-xs">{cat.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  {CHANNELS.map(channel => (
                    <label key={channel.id} className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        checked={cat.channels[channel.id] ?? false}
                        onCheckedChange={() => toggleChannel(cat.id, channel.id)}
                        className="scale-90"
                      />
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {channel.icon}
                        {channel.label}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Save */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
