import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HardDrive, CheckCircle, AlertTriangle, Clock, Server, Database, RefreshCw, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BackupJob {
  id: string;
  device_name: string;
  backup_type: string;
  status: string;
  last_backup: string;
  next_backup: string;
  size: string;
  retention_days: number;
  success_rate: number;
}

export const BackupMonitoring = () => {
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupJob[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    inProgress: 0,
    totalSize: '0 TB'
  });

  useEffect(() => {
    if (user) loadBackups();
  }, [user]);

  const loadBackups = async () => {
    // Mock backup data - would come from agent monitoring
    const mockBackups: BackupJob[] = [
      { id: '1', device_name: 'DC-PRIMARY', backup_type: 'Full System', status: 'success', last_backup: '2024-12-25T02:00:00Z', next_backup: '2024-12-26T02:00:00Z', size: '245 GB', retention_days: 30, success_rate: 98 },
      { id: '2', device_name: 'SQL-SERVER-01', backup_type: 'Database', status: 'success', last_backup: '2024-12-25T04:00:00Z', next_backup: '2024-12-25T16:00:00Z', size: '156 GB', retention_days: 14, success_rate: 100 },
      { id: '3', device_name: 'FILE-SERVER', backup_type: 'Incremental', status: 'in_progress', last_backup: '2024-12-24T23:00:00Z', next_backup: '2024-12-25T23:00:00Z', size: '1.2 TB', retention_days: 60, success_rate: 95 },
      { id: '4', device_name: 'WEB-SERVER-01', backup_type: 'Full System', status: 'failed', last_backup: '2024-12-24T03:00:00Z', next_backup: '2024-12-25T03:00:00Z', size: '78 GB', retention_days: 7, success_rate: 85 },
      { id: '5', device_name: 'EXCHANGE-01', backup_type: 'Mail Database', status: 'success', last_backup: '2024-12-25T01:00:00Z', next_backup: '2024-12-26T01:00:00Z', size: '890 GB', retention_days: 90, success_rate: 99 },
    ];

    setBackups(mockBackups);
    setStats({
      total: mockBackups.length,
      successful: mockBackups.filter(b => b.status === 'success').length,
      failed: mockBackups.filter(b => b.status === 'failed').length,
      inProgress: mockBackups.filter(b => b.status === 'in_progress').length,
      totalSize: '2.57 TB'
    });
  };

  const triggerBackup = async (backupId: string) => {
    toast.success('Backup job started');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-green-500',
      failed: 'bg-red-500',
      in_progress: 'bg-blue-500',
      pending: 'bg-gray-500'
    };
    return <Badge className={colors[status] || 'bg-muted'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Successful
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.successful}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Total Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSize}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup Jobs
          </CardTitle>
          <CardDescription>
            Monitor backup status across all endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backups.map(backup => (
              <div key={backup.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(backup.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{backup.device_name}</h4>
                        {getStatusBadge(backup.status)}
                        <Badge variant="outline">{backup.backup_type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Last: {new Date(backup.last_backup).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Next: {new Date(backup.next_backup).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-4 w-4" />
                          <span>{backup.size}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Server className="h-4 w-4" />
                          <span>{backup.retention_days}d retention</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Success Rate</span>
                          <span>{backup.success_rate}%</span>
                        </div>
                        <Progress value={backup.success_rate} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerBackup(backup.id)}
                    disabled={backup.status === 'in_progress'}
                  >
                    Run Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Backup Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-sm">WEB-SERVER-01 backup failed</p>
                  <p className="text-xs text-muted-foreground">Insufficient disk space on target</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-sm">FILE-SERVER backup running longer than expected</p>
                  <p className="text-xs text-muted-foreground">Started 4 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Daily Full Backups</span>
                <Badge>5 jobs</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Hourly Incrementals</span>
                <Badge>3 jobs</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Weekly Archives</span>
                <Badge>2 jobs</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
