import { useState } from 'react';
import { 
  Bot, Shield, Monitor, Headphones, FileText, Lock, AlertTriangle,
  Zap, Users, Settings, ArrowRight, Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ActivityItem {
  id: string;
  type: 'ticket' | 'security' | 'ai' | 'device' | 'user' | 'vault' | 'scan' | 'compliance';
  title: string;
  description: string;
  timestamp: Date;
  product: string;
  productColor: string;
}

const ICON_MAP: Record<ActivityItem['type'], React.ComponentType<{ className?: string }>> = {
  ticket: Headphones,
  security: Shield,
  ai: Bot,
  device: Monitor,
  user: Users,
  vault: Lock,
  scan: AlertTriangle,
  compliance: FileText,
};

// Demo data — in production, replace with Supabase realtime subscription
const DEMO_ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'ticket', title: 'Ticket #4821 resolved', description: 'VPN connectivity issue for Acme Corp', timestamp: new Date(Date.now() - 5 * 60000), product: 'Vanguard', productColor: 'text-cyan-500' },
  { id: '2', type: 'security', title: 'Sentinel alert cleared', description: 'Suspicious OAuth grant revoked — Dropbox', timestamp: new Date(Date.now() - 12 * 60000), product: 'Vanguard', productColor: 'text-cyan-500' },
  { id: '3', type: 'ai', title: 'GPT "Sales Bot" updated', description: 'Knowledge base retrained with 42 new docs', timestamp: new Date(Date.now() - 25 * 60000), product: 'AI Studio', productColor: 'text-primary' },
  { id: '4', type: 'vault', title: 'Password rotated', description: 'AWS root credentials auto-rotated', timestamp: new Date(Date.now() - 45 * 60000), product: 'SafePass', productColor: 'text-amber-500' },
  { id: '5', type: 'device', title: 'Agent deployed', description: 'DESKTOP-WK92 joined Horizon fleet', timestamp: new Date(Date.now() - 60 * 60000), product: 'Vanguard', productColor: 'text-cyan-500' },
  { id: '6', type: 'scan', title: 'Vulnerability scan complete', description: '3 critical findings on 192.168.1.0/24', timestamp: new Date(Date.now() - 90 * 60000), product: 'Vanguard', productColor: 'text-cyan-500' },
  { id: '7', type: 'compliance', title: 'CIS benchmark passed', description: 'Windows Server 2022 — 94% compliant', timestamp: new Date(Date.now() - 120 * 60000), product: 'Vanguard', productColor: 'text-cyan-500' },
  { id: '8', type: 'ai', title: 'Workflow triggered', description: '"Lead Qualifier" processed 12 new entries', timestamp: new Date(Date.now() - 150 * 60000), product: 'AI Studio', productColor: 'text-primary' },
  { id: '9', type: 'user', title: 'New user signed up', description: 'jane.doe@example.com — SafeSuite Free', timestamp: new Date(Date.now() - 180 * 60000), product: 'Platform', productColor: 'text-emerald-500' },
  { id: '10', type: 'ticket', title: 'SLA warning', description: 'Ticket #4818 approaching 4hr response deadline', timestamp: new Date(Date.now() - 200 * 60000), product: 'Vanguard', productColor: 'text-cyan-500' },
];

type FilterType = 'all' | 'ticket' | 'security' | 'ai' | 'device' | 'vault';

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ticket', label: 'Tickets' },
  { value: 'security', label: 'Security' },
  { value: 'ai', label: 'AI' },
  { value: 'device', label: 'Devices' },
  { value: 'vault', label: 'Vault' },
];

export function ActivityFeedWidget() {
  const [filter, setFilter] = useState<FilterType>('all');
  
  const activities = filter === 'all' 
    ? DEMO_ACTIVITIES 
    : DEMO_ACTIVITIES.filter(a => a.type === filter);

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Activity Feed</h3>
        </div>
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <Button
              key={f.value}
              variant="ghost"
              size="sm"
              onClick={() => setFilter(f.value)}
              className={`h-6 px-2 text-[10px] font-medium ${
                filter === f.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
              }`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <ScrollArea className="h-[380px]">
        <div className="p-2 space-y-0.5">
          {activities.map(activity => {
            const Icon = ICON_MAP[activity.type] || Zap;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group cursor-pointer"
              >
                <div className="mt-0.5 h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${activity.productColor} border-current/20 flex-shrink-0`}>
                      {activity.product}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(activity.timestamp, { addSuffix: false })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
