import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Users, Clock, Activity, Heart, Search, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

// Mock data — replace with real user_activity_feed queries
const mockUsers = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@company.com', lastLogin: '2026-02-08T14:32:00Z', sessions: 142, topProduct: 'AI Studio', healthScore: 92 },
  { id: '2', name: 'James Wilson', email: 'james@agency.io', lastLogin: '2026-02-08T09:15:00Z', sessions: 87, topProduct: 'Vanguard', healthScore: 78 },
  { id: '3', name: 'Maria Garcia', email: 'maria@tech.co', lastLogin: '2026-02-07T18:45:00Z', sessions: 56, topProduct: 'SafeSuite', healthScore: 65 },
  { id: '4', name: 'Alex Kim', email: 'alex@startup.dev', lastLogin: '2026-02-06T11:20:00Z', sessions: 23, topProduct: 'AI Studio', healthScore: 45 },
  { id: '5', name: 'Priya Patel', email: 'priya@enterprise.com', lastLogin: '2026-02-05T08:00:00Z', sessions: 12, topProduct: 'Vanguard', healthScore: 30 },
  { id: '6', name: 'Tom Baker', email: 'tom@msp.net', lastLogin: '2026-02-08T16:00:00Z', sessions: 210, topProduct: 'Vanguard', healthScore: 97 },
];

function getHealthColor(score: number) {
  if (score >= 80) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-destructive';
}

function getHealthLabel(score: number) {
  if (score >= 80) return 'Healthy';
  if (score >= 50) return 'At Risk';
  return 'Churning';
}

function getHealthBadge(score: number) {
  if (score >= 80) return 'default' as const;
  if (score >= 50) return 'secondary' as const;
  return 'destructive' as const;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function UserSessionInsights() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'sessions' | 'healthScore' | 'lastLogin'>('healthScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = mockUsers
    .filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mul = sortDir === 'desc' ? -1 : 1;
      if (sortBy === 'lastLogin') return mul * (new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime());
      return mul * ((a[sortBy] as number) - (b[sortBy] as number));
    });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const avgHealth = Math.round(mockUsers.reduce((s, u) => s + u.healthScore, 0) / mockUsers.length);
  const activeToday = mockUsers.filter(u => timeAgo(u.lastLogin).includes('h') || timeAgo(u.lastLogin) === 'Just now').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6" /> User Session Insights
        </h2>
        <p className="text-muted-foreground">Per-user engagement, session tracking, and account health</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Today</p>
              <p className="text-xl font-bold text-foreground">{activeToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Sessions / User</p>
              <p className="text-xl font-bold text-foreground">{Math.round(mockUsers.reduce((s, u) => s + u.sessions, 0) / mockUsers.length)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center`}>
              <Heart className={`h-5 w-5 ${getHealthColor(avgHealth)}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Health Score</p>
              <p className={`text-xl font-bold ${getHealthColor(avgHealth)}`}>{avgHealth}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">User Engagement</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => toggleSort('lastLogin')}>
                    Last Login <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => toggleSort('sessions')}>
                    Sessions <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Top Product</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => toggleSort('healthScore')}>
                    Health <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{timeAgo(user.lastLogin)}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{user.sessions}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{user.topProduct}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full">
                        <div className={`h-2 rounded-full ${user.healthScore >= 80 ? 'bg-green-500' : user.healthScore >= 50 ? 'bg-yellow-500' : 'bg-destructive'}`} style={{ width: `${user.healthScore}%` }} />
                      </div>
                      <Badge variant={getHealthBadge(user.healthScore)} className="text-[10px]">
                        {getHealthLabel(user.healthScore)}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserSessionInsights;
