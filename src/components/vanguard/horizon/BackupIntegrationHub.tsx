import { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  duration?: number;
  sizeGB?: number;
  retentionDays: number;
  errorMessage?: string;
}

const defaultVendors: BackupVendor[] = [
  { id: 'veeam', name: 'Veeam', logo: '🟢', color: 'text-green-500', connected: false, apiKeyConfigured: false },
  { id: 'acronis', name: 'Acronis', logo: '🔵', color: 'text-blue-500', connected: false, apiKeyConfigured: false },
  { id: 'datto', name: 'Datto', logo: '🟣', color: 'text-purple-500', connected: false, apiKeyConfigured: false },
  { id: 'axcient', name: 'Axcient', logo: '🟠', color: 'text-orange-500', connected: false, apiKeyConfigured: false },
  { id: 'carbonite', name: 'Carbonite', logo: '🔴', color: 'text-red-500', connected: false, apiKeyConfigured: false },
  { id: 'msp360', name: 'MSP360', logo: '🟡', color: 'text-yellow-500', connected: false, apiKeyConfigured: false },
];

export function BackupIntegrationHub() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<BackupVendor[]>(defaultVendors);
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<BackupVendor | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load connected vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('vanguard_backup_vendors')
        .select('*')
        .eq('user_id', user?.id);

      if (!vendorError && vendorData) {
        const connectedVendorIds = new Set(vendorData.map((v: any) => v.vendor_type));
        const updatedVendors = defaultVendors.map(v => ({
          ...v,
          connected: connectedVendorIds.has(v.id),
          apiKeyConfigured: connectedVendorIds.has(v.id),
        }));
        setVendors(updatedVendors);
      }

      // Load backup jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('vanguard_backup_jobs')
        .select('*, vanguard_backup_vendors(vendor_name)')
        .eq('user_id', user?.id)
        .order('last_run', { ascending: false });

      if (!jobsError && jobsData) {
        const mappedJobs: BackupJob[] = jobsData.map((job: any) => ({
          id: job.id,
          vendorId: job.vendor_id || '',
          vendorName: job.vanguard_backup_vendors?.vendor_name || 'Unknown',
          clientName: 'Client',
          deviceName: job.device_name,
          jobType: job.job_type as BackupJob['jobType'],
          status: job.status as BackupJob['status'],
          lastRun: new Date(job.last_run || job.created_at),
          nextRun: job.next_run ? new Date(job.next_run) : undefined,
          duration: job.duration_minutes,
          sizeGB: job.size_gb ? Number(job.size_gb) : undefined,
          retentionDays: job.retention_days || 30,
          errorMessage: job.error_message,
        }));
        setJobs(mappedJobs);
      }
    } catch (err) {
      console.error('Failed to load backup data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedVendor || !apiKey) return;
    
    setIsConnecting(true);
    
    try {
      const { error } = await supabase
        .from('vanguard_backup_vendors')
        .insert({
          user_id: user?.id,
          vendor_name: selectedVendor.name,
          vendor_type: selectedVendor.id,
          api_key_configured: true,
          is_connected: true,
          api_endpoint: apiUrl || null,
          last_sync: new Date().toISOString(),
        });

      if (error) throw error;

      setVendors(prev => prev.map(v => 
        v.id === selectedVendor.id 
          ? { ...v, connected: true, apiKeyConfigured: true }
          : v
      ));
      
      toast({
        title: 'Connected Successfully',
        description: `${selectedVendor.name} integration is now active`,
      });
      
      setSelectedVendor(null);
      setApiKey('');
      setApiUrl('');
    } catch (err) {
      console.error('Failed to connect:', err);
      toast({ title: 'Connection Failed', description: 'Please check your credentials', variant: 'destructive' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (vendorId: string) => {
    try {
      const { error } = await supabase
        .from('vanguard_backup_vendors')
        .delete()
        .eq('user_id', user?.id)
        .eq('vendor_type', vendorId);

      if (error) throw error;

      setVendors(prev => prev.map(v => 
        v.id === vendorId 
          ? { ...v, connected: false, apiKeyConfigured: false }
          : v
      ));
      toast({
        title: 'Disconnected',
        description: 'Integration has been removed',
      });
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="jobs">Backup Jobs</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
        </div>

        {/* Backup Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4 mt-4">
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
          </div>

          <Card>
            <CardContent className="p-0">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No backup jobs found</p>
                  <p className="text-sm">Connect a backup vendor to start monitoring</p>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4 mt-4">
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
                              <Label>API Key</Label>
                              <Input
                                type="password"
                                placeholder="Enter your API key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>API Endpoint (Optional)</Label>
                              <Input
                                placeholder="https://api.example.com"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedVendor(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleConnect} disabled={isConnecting || !apiKey}>
                              {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                              Connect
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
        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-500" />
                  Backup Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-500">{successRate}%</p>
                    <p className="text-sm text-muted-foreground">Overall Success Rate</p>
                  </div>
                  <Progress value={successRate} className="h-3" />
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                      <p className="text-2xl font-bold text-green-500">{successJobs.length}</p>
                      <p className="text-xs text-muted-foreground">Successful</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                      <p className="text-2xl font-bold text-red-500">{failedJobs.length}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  Storage Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-purple-500">{totalProtectedGB.toFixed(1)} GB</p>
                    <p className="text-sm text-muted-foreground">Total Protected Data</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 rounded-lg bg-blue-500/10">
                      <p className="text-2xl font-bold text-blue-500">{jobs.length}</p>
                      <p className="text-xs text-muted-foreground">Total Jobs</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-cyan-500/10">
                      <p className="text-2xl font-bold text-cyan-500">{connectedVendors.length}</p>
                      <p className="text-xs text-muted-foreground">Vendors</p>
                    </div>
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
