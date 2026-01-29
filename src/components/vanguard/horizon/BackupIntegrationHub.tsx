import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  HardDrive, 
  Cloud, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings,
  ExternalLink,
  Clock,
  Database,
  Shield,
  TrendingUp,
  Calendar,
  Server,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BackupVendor {
  id: string;
  name: string;
  logo: string;
  color: string;
  connected: boolean;
  apiKeyConfigured: boolean;
}

interface BackupJob {
  id: string;
  vendorId: string;
  vendorName: string;
  clientName: string;
  deviceName: string;
  jobType: 'full' | 'incremental' | 'differential';
  status: 'success' | 'failed' | 'running' | 'warning' | 'scheduled';
  lastRun: Date;
  nextRun?: Date;
  duration?: number; // in minutes
  sizeGB?: number;
  retentionDays: number;
  errorMessage?: string;
}

const mockVendors: BackupVendor[] = [
  { id: 'veeam', name: 'Veeam', logo: '🟢', color: 'text-green-500', connected: true, apiKeyConfigured: true },
  { id: 'acronis', name: 'Acronis', logo: '🔵', color: 'text-blue-500', connected: true, apiKeyConfigured: true },
  { id: 'datto', name: 'Datto', logo: '🟣', color: 'text-purple-500', connected: false, apiKeyConfigured: false },
  { id: 'axcient', name: 'Axcient', logo: '🟠', color: 'text-orange-500', connected: false, apiKeyConfigured: false },
  { id: 'carbonite', name: 'Carbonite', logo: '🔴', color: 'text-red-500', connected: false, apiKeyConfigured: false },
  { id: 'msp360', name: 'MSP360', logo: '🟡', color: 'text-yellow-500', connected: false, apiKeyConfigured: false },
];

const mockJobs: BackupJob[] = [
  {
    id: '1',
    vendorId: 'veeam',
    vendorName: 'Veeam',
    clientName: 'Acme Corp',
    deviceName: 'DC-SERVER-01',
    jobType: 'full',
    status: 'success',
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000),
    duration: 45,
    sizeGB: 256,
    retentionDays: 30,
  },
  {
    id: '2',
    vendorId: 'veeam',
    vendorName: 'Veeam',
    clientName: 'Acme Corp',
    deviceName: 'FILE-SERVER-02',
    jobType: 'incremental',
    status: 'running',
    lastRun: new Date(),
    duration: 15,
    sizeGB: 12,
    retentionDays: 14,
  },
  {
    id: '3',
    vendorId: 'acronis',
    vendorName: 'Acronis',
    clientName: 'TechStart Inc',
    deviceName: 'WS-DEV-05',
    jobType: 'differential',
    status: 'failed',
    lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000),
    retentionDays: 7,
    errorMessage: 'Connection timeout - VSS snapshot failed',
  },
  {
    id: '4',
    vendorId: 'acronis',
    vendorName: 'Acronis',
    clientName: 'TechStart Inc',
    deviceName: 'SQL-SERVER-01',
    jobType: 'full',
    status: 'warning',
    lastRun: new Date(Date.now() - 26 * 60 * 60 * 1000),
    nextRun: new Date(Date.now() + 2 * 60 * 60 * 1000),
    duration: 120,
    sizeGB: 512,
    retentionDays: 90,
    errorMessage: 'Last backup older than 24 hours',
  },
  {
    id: '5',
    vendorId: 'veeam',
    vendorName: 'Veeam',
    clientName: 'GlobalTech',
    deviceName: 'MAIL-SERVER',
    jobType: 'incremental',
    status: 'success',
    lastRun: new Date(Date.now() - 30 * 60 * 1000),
    nextRun: new Date(Date.now() + 4 * 60 * 60 * 1000),
    duration: 8,
    sizeGB: 4.5,
    retentionDays: 30,
  },
];

export function BackupIntegrationHub() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<BackupVendor[]>(mockVendors);
  const [jobs] = useState<BackupJob[]>(mockJobs);
  const [selectedVendor, setSelectedVendor] = useState<BackupVendor | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleConnect = async () => {
    if (!selectedVendor || !apiKey) return;
    
    setIsConnecting(true);
    
    // Simulate API connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setVendors(prev => prev.map(v => 
      v.id === selectedVendor.id 
        ? { ...v, connected: true, apiKeyConfigured: true }
        : v
    ));
    
    toast({
      title: 'Connected Successfully',
      description: `${selectedVendor.name} integration is now active`,
    });
    
    setIsConnecting(false);
    setSelectedVendor(null);
    setApiKey('');
    setApiUrl('');
  };

  const handleDisconnect = (vendorId: string) => {
    setVendors(prev => prev.map(v => 
      v.id === vendorId 
        ? { ...v, connected: false, apiKeyConfigured: false }
        : v
    ));
    toast({
      title: 'Disconnected',
      description: 'Integration has been removed',
    });
  };

  const connectedVendors = vendors.filter(v => v.connected);
  const successJobs = jobs.filter(j => j.status === 'success');
  const failedJobs = jobs.filter(j => j.status === 'failed');
  const runningJobs = jobs.filter(j => j.status === 'running');
  const warningJobs = jobs.filter(j => j.status === 'warning');

  const filteredJobs = filterStatus === 'all' 
    ? jobs 
    : jobs.filter(j => j.status === filterStatus);

  const totalProtectedGB = jobs.reduce((acc, j) => acc + (j.sizeGB || 0), 0);
  const successRate = jobs.length > 0 
    ? Math.round((successJobs.length / jobs.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Cloud className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connectedVendors.length}</p>
                <p className="text-xs text-muted-foreground">Integrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{successJobs.length}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{failedJobs.length}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warningJobs.length}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <TrendingUp className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Database className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalProtectedGB.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">GB Protected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Backup Jobs</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Backup Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="success">Successful</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredJobs.map(job => (
                  <div key={job.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center text-lg',
                          job.status === 'success' && 'bg-green-500/20',
                          job.status === 'failed' && 'bg-red-500/20',
                          job.status === 'running' && 'bg-blue-500/20',
                          job.status === 'warning' && 'bg-yellow-500/20',
                        )}>
                          {job.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {job.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                          {job.status === 'running' && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
                          {job.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{job.deviceName}</span>
                            <Badge variant="outline" className="text-xs">{job.jobType}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {job.clientName} • {job.vendorName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm">
                            {job.status === 'running' ? 'Started' : 'Last run'}: {formatDistanceToNow(job.lastRun, { addSuffix: true })}
                          </p>
                          {job.nextRun && (
                            <p className="text-xs text-muted-foreground">
                              Next: {format(job.nextRun, 'MMM d, h:mm a')}
                            </p>
                          )}
                        </div>
                        <div className="text-right min-w-[80px]">
                          {job.sizeGB && (
                            <p className="text-sm font-medium">{job.sizeGB} GB</p>
                          )}
                          {job.duration && (
                            <p className="text-xs text-muted-foreground">{job.duration} min</p>
                          )}
                        </div>
                        <Badge 
                          variant={
                            job.status === 'success' ? 'default' :
                            job.status === 'failed' ? 'destructive' :
                            job.status === 'running' ? 'secondary' : 'outline'
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    {job.errorMessage && (
                      <div className="mt-2 ml-14 p-2 rounded bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-400">{job.errorMessage}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map(vendor => (
              <Card key={vendor.id} className={cn(
                vendor.connected && 'border-green-500/30'
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{vendor.logo}</span>
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    </div>
                    {vendor.connected ? (
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    ) : (
                      <Badge variant="secondary">Not Connected</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vendor.connected ? (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Jobs Monitored</span>
                          <span className="font-medium">
                            {jobs.filter(j => j.vendorId === vendor.id).length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Sync</span>
                          <span className="font-medium">2 min ago</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Settings className="h-4 w-4 mr-1" />
                            Configure
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDisconnect(vendor.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full" 
                            onClick={() => setSelectedVendor(vendor)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Connect
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Connect to {vendor.name}</DialogTitle>
                            <DialogDescription>
                              Enter your API credentials to start monitoring backup jobs
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>API URL (optional)</Label>
                              <Input 
                                placeholder={`https://api.${vendor.id.toLowerCase()}.com`}
                                value={apiUrl}
                                onChange={e => setApiUrl(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>API Key</Label>
                              <Input 
                                type="password"
                                placeholder="Enter your API key"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                              />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ExternalLink className="h-4 w-4" />
                              <a href="#" className="hover:underline">
                                How to get your {vendor.name} API key
                              </a>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              onClick={handleConnect}
                              disabled={!apiKey || isConnecting}
                            >
                              {isConnecting ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                'Connect'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-500" />
                  Backup Success Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>7-day success rate chart</p>
                    <p className="text-sm">Connect integrations to see data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  Storage by Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Acme Corp', 'TechStart Inc', 'GlobalTech'].map((client, i) => (
                    <div key={client} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{client}</span>
                        <span className="text-muted-foreground">{[268, 512, 4.5][i]} GB</span>
                      </div>
                      <Progress value={[34, 65, 1][i]} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Upcoming Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobs.filter(j => j.nextRun).slice(0, 5).map(job => (
                    <div key={job.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{job.deviceName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {job.nextRun && format(job.nextRun, 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Retention Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">30+ Day Retention</span>
                    <Badge variant="default" className="bg-green-500">
                      {jobs.filter(j => j.retentionDays >= 30).length} jobs
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">14-29 Day Retention</span>
                    <Badge variant="secondary">
                      {jobs.filter(j => j.retentionDays >= 14 && j.retentionDays < 30).length} jobs
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">&lt;14 Day Retention</span>
                    <Badge variant="outline">
                      {jobs.filter(j => j.retentionDays < 14).length} jobs
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
