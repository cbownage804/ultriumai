import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, Search, Filter, Download, Clock, User,
  Monitor, Terminal, FileEdit, Shield, Settings,
  Eye, AlertTriangle, RefreshCw, Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivityLogs } from '@/hooks/useHorizon';

interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  actionType: 'view' | 'create' | 'update' | 'delete' | 'execute' | 'login' | 'logout';
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  tenantId?: string;
  tenantName?: string;
  severity: 'info' | 'warning' | 'critical';
}

export const TechnicianActivityLogs: React.FC = () => {
  const { logs: dbLogs, isLoading, logActivity, refetch } = useActivityLogs();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('24h');

  // Map DB logs to UI format
  const activityLogs: ActivityLog[] = dbLogs.map(log => ({
    id: log.id,
    timestamp: log.created_at,
    userId: log.user_id,
    userName: 'Technician', // Would come from a join
    userEmail: '',
    action: log.action_type,
    actionType: (log.action_type.toLowerCase().includes('delete') ? 'delete' :
                 log.action_type.toLowerCase().includes('create') ? 'create' :
                 log.action_type.toLowerCase().includes('update') ? 'update' :
                 log.action_type.toLowerCase().includes('execute') ? 'execute' :
                 log.action_type.toLowerCase().includes('login') ? 'login' : 'view') as ActivityLog['actionType'],
    resourceType: log.resource_type,
    resourceId: log.resource_id || undefined,
    resourceName: log.resource_name || undefined,
    details: JSON.stringify(log.details || {}),
    ipAddress: log.ip_address || '',
    userAgent: '',
    tenantId: log.tenant_id || undefined,
    severity: 'info' as const
  }));

  const technicians = [...new Set(activityLogs.map(l => l.userName))];

  const getActionIcon = (actionType: ActivityLog['actionType']) => {
    const icons: Record<string, React.ReactNode> = {
      view: <Eye className="h-4 w-4" />,
      create: <FileEdit className="h-4 w-4" />,
      update: <RefreshCw className="h-4 w-4" />,
      delete: <AlertTriangle className="h-4 w-4" />,
      execute: <Terminal className="h-4 w-4" />,
      login: <User className="h-4 w-4" />,
      logout: <User className="h-4 w-4" />
    };
    return icons[actionType] || <Activity className="h-4 w-4" />;
  };

  const getSeverityBadge = (severity: ActivityLog['severity']) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-500/10 text-blue-500',
      warning: 'bg-yellow-500/10 text-yellow-500',
      critical: 'bg-red-500/10 text-red-500'
    };
    return <Badge className={colors[severity]}>{severity}</Badge>;
  };

  const getActionTypeBadge = (actionType: ActivityLog['actionType']) => {
    const colors: Record<string, string> = {
      view: 'bg-gray-500/10 text-gray-500',
      create: 'bg-green-500/10 text-green-500',
      update: 'bg-blue-500/10 text-blue-500',
      delete: 'bg-red-500/10 text-red-500',
      execute: 'bg-purple-500/10 text-purple-500',
      login: 'bg-green-500/10 text-green-500',
      logout: 'bg-gray-500/10 text-gray-500'
    };
    return <Badge className={colors[actionType]}>{actionType}</Badge>;
  };

  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;
    const matchesTechnician = technicianFilter === 'all' || log.userName === technicianFilter;
    return matchesSearch && matchesAction && matchesTechnician;
  });

  const actionStats = {
    total: activityLogs.length,
    execute: activityLogs.filter(l => l.actionType === 'execute').length,
    delete: activityLogs.filter(l => l.actionType === 'delete').length,
    critical: activityLogs.filter(l => l.severity === 'critical').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Technician Activity Logs
          </h2>
          <p className="text-muted-foreground">Track all technician actions for compliance</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Actions</p>
                <p className="text-2xl font-bold">{actionStats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Executions</p>
                <p className="text-2xl font-bold text-purple-500">{actionStats.execute}</p>
              </div>
              <Terminal className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deletions</p>
                <p className="text-2xl font-bold text-red-500">{actionStats.delete}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Events</p>
                <p className="text-2xl font-bold text-red-500">{actionStats.critical}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Timeline</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                <SelectTrigger className="w-40">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="execute">Execute</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-8 w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        log.severity === 'critical' ? 'bg-red-500/10' :
                        log.severity === 'warning' ? 'bg-yellow-500/10' : 'bg-muted'
                      }`}>
                        {getActionIcon(log.actionType)}
                      </div>
                      <div>
                        <h4 className="font-medium">{log.action}</h4>
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(log.severity)}
                      {getActionTypeBadge(log.actionType)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3 pt-3 border-t">
                    <div>
                      <p className="text-muted-foreground">Technician</p>
                      <p className="font-medium flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.userName}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Resource</p>
                      <p className="font-medium flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        {log.resourceName || log.resourceType}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IP Address</p>
                      <p className="font-medium font-mono text-xs">{log.ipAddress}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Timestamp</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {log.tenantName && (
                    <div className="mt-2">
                      <Badge variant="outline">{log.tenantName}</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
