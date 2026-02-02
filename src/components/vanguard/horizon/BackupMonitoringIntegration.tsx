import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HardDrive, CheckCircle, XCircle, Clock, AlertTriangle,
  RefreshCw, Calendar, TrendingUp, Server, Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BackupJob {
  id: string;
  deviceName: string;
  provider: 'veeam' | 'acronis' | 'datto' | 'carbonite' | 'azure';
  jobName: string;
  lastBackup: string;
  nextBackup: string;
  status: 'success' | 'failed' | 'running' | 'warning';
  size: string;
  retention: string;
  successRate: number;
}

const mockBackupJobs: BackupJob[] = [
  { id: '1', deviceName: 'SRV-DC01', provider: 'veeam', jobName: 'DC Daily Backup', lastBackup: '2024-01-15 02:00', nextBackup: '2024-01-16 02:00', status: 'success', size: '45 GB', retention: '30 days', successRate: 99.5 },
  { id: '2', deviceName: 'SRV-SQL01', provider: 'veeam', jobName: 'SQL Full Backup', lastBackup: '2024-01-15 03:30', nextBackup: '2024-01-16 03:30', status: 'success', size: '120 GB', retention: '60 days', successRate: 98.2 },
  { id: '3', deviceName: 'SRV-FILE01', provider: 'acronis', jobName: 'File Server Backup', lastBackup: '2024-01-15 01:00', nextBackup: '2024-01-16 01:00', status: 'warning', size: '890 GB', retention: '90 days', successRate: 95.8 },
  { id: '4', deviceName: 'WKS-EXEC01', provider: 'carbonite', jobName: 'Executive Backup', lastBackup: '2024-01-14 22:00', nextBackup: '2024-01-15 22:00', status: 'failed', size: '25 GB', retention: '14 days', successRate: 87.3 },
  { id: '5', deviceName: 'SRV-WEB01', provider: 'azure', jobName: 'Azure VM Backup', lastBackup: '2024-01-15 04:00', nextBackup: '2024-01-16 04:00', status: 'running', size: '80 GB', retention: '30 days', successRate: 100 },
  { id: '6', deviceName: 'SRV-APP01', provider: 'datto', jobName: 'Datto BCDR', lastBackup: '2024-01-15 00:00', nextBackup: 'Every 15 min', status: 'success', size: '250 GB', retention: '1 year', successRate: 99.9 },
];

export function BackupMonitoringIntegration() {
  const { toast } = useToast();
  const [jobs] = useState(mockBackupJobs);
  const [providerFilter, setProviderFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'running': return 'bg-blue-500/20 text-blue-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'veeam': return 'bg-green-500/20 text-green-400';
      case 'acronis': return 'bg-blue-500/20 text-blue-400';
      case 'datto': return 'bg-purple-500/20 text-purple-400';
      case 'carbonite': return 'bg-orange-500/20 text-orange-400';
      case 'azure': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredJobs = providerFilter === 'all' 
    ? jobs 
    : jobs.filter(j => j.provider === providerFilter);

  const successCount = jobs.filter(j => j.status === 'success').length;
  const failedCount = jobs.filter(j => j.status === 'failed').length;
  const warningCount = jobs.filter(j => j.status === 'warning').length;
  const overallSuccessRate = Math.round(jobs.reduce((sum, j) => sum + j.successRate, 0) / jobs.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backup Monitoring</h2>
          <p className="text-muted-foreground">Monitor backup job status from Veeam, Acronis, Datto, and more</p>
        </div>
        <Button onClick={() => toast({ title: 'Refreshing backup status...' })}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className={`${overallSuccessRate >= 95 ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <CardContent className="pt-4">
            <div className={`text-3xl font-bold ${overallSuccessRate >= 95 ? 'text-green-400' : 'text-yellow-400'}`}>
              {overallSuccessRate}%
            </div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{successCount}</div>
            <p className="text-sm text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card className={`${failedCount > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-card/50'}`}>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${failedCount > 0 ? 'text-red-400' : ''}`}>{failedCount}</div>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card className={`${warningCount > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-card/50'}`}>
          <CardContent className="pt-4">
            <div className={`text-2xl font-bold ${warningCount > 0 ? 'text-yellow-400' : ''}`}>{warningCount}</div>
            <p className="text-sm text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">1.4 TB</div>
            <p className="text-sm text-muted-foreground">Total Backup Size</p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Backup Alert */}
      {failedCount > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <XCircle className="h-6 w-6 text-red-400" />
              <div className="flex-1">
                <p className="font-medium text-red-400">{failedCount} backup job(s) failed</p>
                <p className="text-sm text-muted-foreground">Immediate attention required</p>
              </div>
              <Button variant="outline" size="sm" className="text-red-400 border-red-400/30">
                View Failed Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="jobs">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="jobs">Backup Jobs</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="veeam">Veeam</SelectItem>
              <SelectItem value="acronis">Acronis</SelectItem>
              <SelectItem value="datto">Datto</SelectItem>
              <SelectItem value="carbonite">Carbonite</SelectItem>
              <SelectItem value="azure">Azure Backup</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="jobs">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Last Backup</TableHead>
                  <TableHead>Next Backup</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map(job => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{job.deviceName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{job.jobName}</TableCell>
                    <TableCell>
                      <Badge className={getProviderColor(job.provider)}>
                        {job.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {job.lastBackup}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {job.nextBackup}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {job.size}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={job.successRate >= 95 ? 'text-green-400' : job.successRate >= 80 ? 'text-yellow-400' : 'text-red-400'}>
                          {job.successRate}%
                        </span>
                        <Progress value={job.successRate} className="w-16 h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status === 'running' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => toast({ title: 'Starting backup...' })}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'Veeam', jobs: 2, success: 2, failed: 0, size: '165 GB' },
              { name: 'Acronis', jobs: 1, success: 0, failed: 0, size: '890 GB', warning: 1 },
              { name: 'Datto', jobs: 1, success: 1, failed: 0, size: '250 GB' },
              { name: 'Carbonite', jobs: 1, success: 0, failed: 1, size: '25 GB' },
              { name: 'Azure Backup', jobs: 1, success: 0, failed: 0, size: '80 GB', running: 1 },
            ].map((provider, i) => (
              <Card key={i} className="bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">{provider.name}</h3>
                    <Badge variant="outline">{provider.jobs} jobs</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="p-2 rounded bg-green-500/10">
                      <p className="text-lg font-bold text-green-400">{provider.success}</p>
                      <p className="text-xs text-muted-foreground">Success</p>
                    </div>
                    <div className={`p-2 rounded ${provider.failed > 0 ? 'bg-red-500/10' : 'bg-muted/30'}`}>
                      <p className={`text-lg font-bold ${provider.failed > 0 ? 'text-red-400' : ''}`}>{provider.failed}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                    <div className={`p-2 rounded ${provider.warning ? 'bg-yellow-500/10' : provider.running ? 'bg-blue-500/10' : 'bg-muted/30'}`}>
                      <p className={`text-lg font-bold ${provider.warning ? 'text-yellow-400' : provider.running ? 'text-blue-400' : ''}`}>
                        {provider.warning || provider.running || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">{provider.warning ? 'Warning' : provider.running ? 'Running' : 'Other'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Size</span>
                    <span className="font-medium">{provider.size}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Backup History (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Backup history chart would display here</p>
                  <p className="text-sm">Showing success/failure trends over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
