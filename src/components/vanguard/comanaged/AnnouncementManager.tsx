import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Megaphone,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Pin,
  AlertTriangle,
  Info,
  Wrench,
  Zap,
  Users,
  Building2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: 'info' | 'maintenance' | 'outage' | 'update' | 'urgent';
  priority: 'low' | 'normal' | 'high' | 'critical';
  target_audience: 'all' | 'internal_it' | 'end_users' | 'msp_only';
  organization_name?: string;
  starts_at: string;
  expires_at?: string;
  is_pinned: boolean;
  is_published: boolean;
  read_count: number;
}

export function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Scheduled Maintenance - Email Server',
      content: 'We will be performing maintenance on the email server this Saturday from 2 AM to 6 AM EST. Brief interruptions may occur.',
      announcement_type: 'maintenance',
      priority: 'high',
      target_audience: 'all',
      organization_name: 'All Organizations',
      starts_at: '2024-01-20T02:00:00',
      expires_at: '2024-01-20T06:00:00',
      is_pinned: true,
      is_published: true,
      read_count: 145,
    },
    {
      id: '2',
      title: 'VPN Service Outage - Resolved',
      content: 'The VPN connectivity issues reported earlier have been resolved. All services are now operating normally.',
      announcement_type: 'outage',
      priority: 'critical',
      target_audience: 'all',
      organization_name: 'Acme Corp',
      starts_at: '2024-01-18T10:00:00',
      is_pinned: false,
      is_published: true,
      read_count: 89,
    },
    {
      id: '3',
      title: 'Internal: New Escalation Procedures',
      content: 'Updated escalation procedures are now in effect. Please review the new runbook before your next shift.',
      announcement_type: 'update',
      priority: 'normal',
      target_audience: 'internal_it',
      organization_name: 'Acme Corp',
      starts_at: '2024-01-17T09:00:00',
      is_pinned: false,
      is_published: true,
      read_count: 12,
    },
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    announcement_type: 'info' as const,
    priority: 'normal' as const,
    target_audience: 'all' as const,
    is_pinned: false,
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'outage': return <AlertTriangle className="h-4 w-4" />;
      case 'urgent': return <Zap className="h-4 w-4" />;
      case 'update': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'outage': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'urgent': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'update': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'internal_it': return <Building2 className="h-3 w-3" />;
      case 'end_users': return <Users className="h-3 w-3" />;
      case 'msp_only': return <Eye className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const handleCreate = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Title and content are required');
      return;
    }

    const announcement: Announcement = {
      id: Date.now().toString(),
      ...newAnnouncement,
      starts_at: new Date().toISOString(),
      is_published: true,
      read_count: 0,
    };

    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({
      title: '',
      content: '',
      announcement_type: 'info',
      priority: 'normal',
      target_audience: 'all',
      is_pinned: false,
    });
    setIsCreateOpen(false);
    toast.success('Announcement published');
  };

  const handleDelete = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast.success('Announcement deleted');
  };

  const handleTogglePin = (id: string) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, is_pinned: !a.is_pinned } : a
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Announcements
          </h2>
          <p className="text-muted-foreground">
            Broadcast maintenance windows, outages, and updates to clients
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>
                Broadcast a message to clients and internal teams
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  placeholder="Scheduled Maintenance - Server Update"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  placeholder="Provide details about the announcement..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newAnnouncement.announcement_type}
                    onValueChange={(v: any) => setNewAnnouncement({ ...newAnnouncement, announcement_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="outage">Outage</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newAnnouncement.priority}
                    onValueChange={(v: any) => setNewAnnouncement({ ...newAnnouncement, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select
                  value={newAnnouncement.target_audience}
                  onValueChange={(v: any) => setNewAnnouncement({ ...newAnnouncement, target_audience: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="internal_it">Internal IT Only</SelectItem>
                    <SelectItem value="end_users">End Users Only</SelectItem>
                    <SelectItem value="msp_only">MSP Staff Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Pin to top</Label>
                <Switch
                  checked={newAnnouncement.is_pinned}
                  onCheckedChange={(checked) => setNewAnnouncement({ ...newAnnouncement, is_pinned: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{announcements.length}</p>
              <p className="text-sm text-muted-foreground">Total Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">
                {announcements.filter(a => a.announcement_type === 'maintenance').length}
              </p>
              <p className="text-sm text-muted-foreground">Maintenance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">
                {announcements.filter(a => a.announcement_type === 'outage').length}
              </p>
              <p className="text-sm text-muted-foreground">Outages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {announcements.reduce((sum, a) => sum + a.read_count, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Reads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements
          .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
          .map((announcement) => (
          <Card key={announcement.id} className={announcement.is_pinned ? 'border-primary/50' : ''}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTypeColor(announcement.announcement_type)}`}>
                  {getTypeIcon(announcement.announcement_type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {announcement.is_pinned && (
                          <Pin className="h-4 w-4 text-primary" />
                        )}
                        <h3 className="font-semibold">{announcement.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className={getTypeColor(announcement.announcement_type)}>
                          {announcement.announcement_type}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getAudienceIcon(announcement.target_audience)}
                          {announcement.target_audience.replace('_', ' ')}
                        </Badge>
                        <span>•</span>
                        <span>{announcement.organization_name}</span>
                        <span>•</span>
                        <span>{new Date(announcement.starts_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getPriorityColor(announcement.priority)}`} />
                      <span className="text-sm text-muted-foreground">{announcement.read_count} reads</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTogglePin(announcement.id)}>
                            <Pin className="h-4 w-4 mr-2" />
                            {announcement.is_pinned ? 'Unpin' : 'Pin to top'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(announcement.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
