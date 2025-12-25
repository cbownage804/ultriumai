import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Search, Filter, AlertTriangle, Activity, Clock, Server, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}

export const SIEMDashboard = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0
  });

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, levelFilter, sourceFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      // Aggregate logs from multiple sources
      const [securityEvents, auditLogs, incidentLogs] = await Promise.all([
        supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('security_incidents').select('*').order('created_at', { ascending: false }).limit(100)
      ]);

      const allLogs: LogEntry[] = [];

      // Transform security events
      securityEvents.data?.forEach(event => {
        allLogs.push({
          id: event.id,
          timestamp: event.created_at,
          source: 'security_events',
          level: event.severity || 'info',
          message: event.title || event.description,
          metadata: { raw_data: event.raw_data }
        });
      });

      // Transform audit logs
      auditLogs.data?.forEach(log => {
        allLogs.push({
          id: log.id,
          timestamp: log.created_at,
          source: 'audit_logs',
          level: 'info',
          message: log.action,
          metadata: log.details as Record<string, any>
        });
      });

      // Transform incidents
      incidentLogs.data?.forEach(incident => {
        allLogs.push({
          id: incident.id,
          timestamp: incident.created_at,
          source: 'incidents',
          level: incident.severity || 'warning',
          message: incident.title,
          metadata: { description: incident.description }
        });
      });

      // Sort by timestamp
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(allLogs);

      // Calculate stats
      setStats({
        total: allLogs.length,
        errors: allLogs.filter(l => l.level === 'critical' || l.level === 'high').length,
        warnings: allLogs.filter(l => l.level === 'medium' || l.level === 'warning').length,
        info: allLogs.filter(l => l.level === 'low' || l.level === 'info').length
      });
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.source.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(log => log.source === sourceFilter);
    }

    setFilteredLogs(filtered);
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      warning: 'bg-yellow-500',
      low: 'bg-blue-500',
      info: 'bg-gray-500'
    };
    return <Badge className={colors[level] || 'bg-muted'}>{level}</Badge>;
  };

  const sources = [...new Set(logs.map(l => l.source))];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Critical/High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.warnings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.info}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                SIEM Log Viewer
              </CardTitle>
              <CardDescription>
                Centralized security event monitoring and correlation
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Server className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No logs found</p>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-3 bg-muted/50 rounded-lg font-mono text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        {getLevelBadge(log.level)}
                        <Badge variant="outline">{log.source}</Badge>
                      </div>
                      <p className="text-foreground break-words">{log.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
