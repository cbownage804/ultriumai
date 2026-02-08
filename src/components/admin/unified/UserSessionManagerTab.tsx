import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Monitor, Smartphone, LogOut, Search, Globe, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface UserSession {
  id: string;
  email: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  ip: string;
  location: string;
  startedAt: string;
  lastActive: string;
  status: 'active' | 'idle';
}

const MOCK_SESSIONS: UserSession[] = [
  { id: '1', email: 'admin@ultriumai.com', device: 'Chrome / Windows 11', deviceType: 'desktop', ip: '10.0.1.15', location: 'New York, US', startedAt: '2h ago', lastActive: '1 min ago', status: 'active' },
  { id: '2', email: 'tech@example.com', device: 'Safari / macOS', deviceType: 'desktop', ip: '192.168.2.40', location: 'London, UK', startedAt: '45 min ago', lastActive: '5 min ago', status: 'active' },
  { id: '3', email: 'user@client.com', device: 'Chrome / Android', deviceType: 'mobile', ip: '45.12.34.56', location: 'Toronto, CA', startedAt: '3h ago', lastActive: '20 min ago', status: 'idle' },
  { id: '4', email: 'support@ultriumai.com', device: 'Firefox / Ubuntu', deviceType: 'desktop', ip: '10.0.1.20', location: 'Austin, US', startedAt: '1h ago', lastActive: '10 min ago', status: 'active' },
  { id: '5', email: 'demo@ultriumai.com', device: 'Safari / iPad', deviceType: 'tablet', ip: '172.16.0.5', location: 'Sydney, AU', startedAt: '30 min ago', lastActive: '30 min ago', status: 'idle' },
];

const UserSessionManagerTab = () => {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [search, setSearch] = useState('');

  const filtered = sessions.filter(s => s.email.toLowerCase().includes(search.toLowerCase()) || s.ip.includes(search));

  const forceLogout = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success('Session terminated');
  };

  const forceLogoutAll = () => {
    setSessions([]);
    toast.success('All sessions terminated');
  };

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === 'mobile') return <Smartphone className="h-4 w-4 text-muted-foreground" />;
    return <Monitor className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> User Sessions</h2>
          <p className="text-muted-foreground">View active sessions and force logout users</p>
        </div>
        <Button variant="destructive" size="sm" onClick={forceLogoutAll} className="gap-2"><LogOut className="h-4 w-4" /> Logout All</Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by email or IP..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Badge variant="secondary">{filtered.length} sessions</Badge>
      </div>

      <div className="space-y-3">
        {filtered.map(session => (
          <Card key={session.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <DeviceIcon type={session.deviceType} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{session.email}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-muted-foreground">
                    <span>{session.device}</span>
                    <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{session.location}</span>
                    <span className="font-mono">{session.ip}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Started {session.startedAt}</span>
                    <span>Active {session.lastActive}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>{session.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => forceLogout(session.id)} className="gap-1.5"><LogOut className="h-3.5 w-3.5" /> End</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No active sessions</p>}
      </div>
    </div>
  );
};

export default UserSessionManagerTab;
