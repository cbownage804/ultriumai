import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, X, Plus, Trash2, Send } from 'lucide-react';
import type { PushNotification, NotificationSegment } from '@/hooks/usePushNotificationDesigner';

interface PushNotificationPanelProps {
  notifications: PushNotification[];
  segments: NotificationSegment[];
  onAddNotification: (n: Omit<PushNotification, 'id'>) => void;
  onUpdateNotification: (id: string, partial: Partial<PushNotification>) => void;
  onRemoveNotification: (id: string) => void;
  onGenerateCode: () => string;
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

export function PushNotificationPanel({
  notifications, segments,
  onAddNotification, onUpdateNotification, onRemoveNotification,
  onGenerateCode, onInsertCode, onClose,
}: PushNotificationPanelProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('All Users');
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddNotification({
      title, body, segment,
      schedule: { type: scheduleType },
    });
    setTitle('');
    setBody('');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l border-border z-50 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Push Notifications</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/30">
            <Label className="text-xs text-muted-foreground">New Notification</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" className="h-8 text-xs" />
            <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Notification body" className="text-xs min-h-[60px]" />
            <div className="flex gap-2">
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {segments.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={scheduleType} onValueChange={v => setScheduleType(v as any)}>
                <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={handleAdd} className="w-full gap-1 text-xs">
              <Plus className="w-3 h-3" /> Add Notification
            </Button>
          </div>

          {notifications.map(n => (
            <div key={n.id} className="p-3 rounded-lg border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{n.title}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveNotification(n.id)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">{n.body}</p>
              <div className="flex gap-1">
                <Badge variant="outline" className="text-[10px]">{n.segment || 'All'}</Badge>
                <Badge variant="secondary" className="text-[10px]">{n.schedule?.type || 'immediate'}</Badge>
              </div>
            </div>
          ))}

          <Button size="sm" variant="outline" className="w-full gap-1 text-xs" onClick={() => onInsertCode(onGenerateCode())}>
            <Send className="w-3 h-3" /> Generate Push Integration Code
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
