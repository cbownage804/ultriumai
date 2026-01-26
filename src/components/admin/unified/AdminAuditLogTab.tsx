import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  RefreshCw,
  FileText,
  Shield,
  User,
  Settings,
  Trash2,
  Edit,
  Eye,
  LogIn,
  AlertTriangle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: any;
  created_at: string;
  user_email?: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login: <LogIn className="h-4 w-4 text-green-500" />,
  logout: <LogIn className="h-4 w-4 text-muted-foreground" />,
  create: <Edit className="h-4 w-4 text-blue-500" />,
  update: <Edit className="h-4 w-4 text-amber-500" />,
  delete: <Trash2 className="h-4 w-4 text-red-500" />,
  view: <Eye className="h-4 w-4 text-muted-foreground" />,
  error: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

const ACTION_FILTERS = [
  { value: 'all', label: 'All Actions' },
  { value: 'login', label: 'Login' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
];

export const AdminAuditLogTab = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Get audit logs
      const { data: auditLogs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Get user emails for the logs
      const userIds = [...new Set((auditLogs || []).map(l => l.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', userIds);

      const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);

      const enrichedLogs: AuditLogEntry[] = (auditLogs || []).map(log => ({
        ...log,
        ip_address: String(log.ip_address || 'Unknown'),
        user_email: emailMap.get(log.user_id) || 'System'
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: "Error loading logs",
        description: "Could not load audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.ip_address).includes(searchTerm);
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const getActionIcon = (action: string) => {
    return ACTION_ICONS[action.toLowerCase()] || <Settings className="h-4 w-4 text-muted-foreground" />;
  };

  const getActionBadge = (action: string) => {
    const colorMap: Record<string, string> = {
      login: 'bg-green-500/10 text-green-500 border-green-500/30',
      logout: 'bg-muted text-muted-foreground',
      create: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      update: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      delete: 'bg-red-500/10 text-red-500 border-red-500/30',
      error: 'bg-red-500/10 text-red-500 border-red-500/30',
    };

    return (
      <Badge variant="outline" className={`text-xs ${colorMap[action.toLowerCase()] || ''}`}>
        {action}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <LogIn className="h-4 w-4 text-green-500" />
              Logins (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {logs.filter(l => 
                l.action === 'login' && 
                new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Edit className="h-4 w-4 text-amber-500" />
              Updates (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {logs.filter(l => 
                l.action === 'update' && 
                new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Errors (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {logs.filter(l => 
                l.action === 'error' && 
                new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Audit Log
              </CardTitle>
              <CardDescription>
                Complete activity log across all platform actions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadAuditLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_FILTERS.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.slice(0, 100).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {getActionIcon(log.action)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{log.user_email}</div>
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.resource_type || '—'}
                        {log.resource_id && (
                          <span className="text-xs ml-1 opacity-50">#{log.resource_id.slice(0, 8)}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {String(log.ip_address) || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span title={format(new Date(log.created_at), 'PPpp')}>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredLogs.length > 100 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 100 of {filteredLogs.length} entries
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
