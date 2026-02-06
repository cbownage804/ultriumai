import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  RotateCcw, HardDrive, Shield, Clock, CheckCircle, AlertTriangle,
  Play, Pause, History, Database, FileWarning, RefreshCw, Zap,
  ArrowRight, Download, Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

interface VSSSnapshot {
  id: string;
  device_name: string;
  agent_id: string;
  snapshot_id: string;
  creation_time: string;
  size_gb: number;
  drive_letter: string;
  status: 'available' | 'restoring' | 'restored' | 'failed' | 'expired';
  is_protected: boolean;
}

interface RollbackJob {
  id: string;
  device_name: string;
  agent_id: string;
  snapshot_id: string;
  trigger: 'manual' | 'auto' | 'ransomware_detected';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  files_restored: number;
  files_failed: number;
  total_files: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  ransomware_event_id: string | null;
}

// Simulated data hooks — these would connect to real agent telemetry
function useVSSSnapshots() {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<VSSSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // In production, this queries agent-reported VSS data
    const fetchSnapshots = async () => {
      try {
        const { data: agents } = await (supabase as any)
          .from('vanguard_agents')
          .select('id, name')
          .eq('user_id', user.id)
          .eq('status', 'active');

        const mockSnapshots: VSSSnapshot[] = (agents || []).flatMap((agent: any, idx: number) => {
          const hours = [2, 6, 12, 24];
          return hours.map((h, i) => ({
            id: `${agent.id}-snap-${i}`,
            device_name: agent.name || 'Unknown',
            agent_id: agent.id,
            snapshot_id: `{VSS-${Math.random().toString(36).substring(2, 10).toUpperCase()}}`,
            creation_time: new Date(Date.now() - h * 3600000).toISOString(),
            size_gb: Math.round((Math.random() * 50 + 10) * 10) / 10,
            drive_letter: 'C:',
            status: 'available' as const,
            is_protected: true,
          }));
        });
        setSnapshots(mockSnapshots);
      } catch (err) {
        console.error('Failed to fetch VSS snapshots:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSnapshots();
  }, [user]);

  return { snapshots, isLoading };
}

function useRollbackJobs() {
  const [jobs, setJobs] = useState<RollbackJob[]>([]);
  return { jobs, setJobs };
}

export function RansomwareRollbackEngine() {
  const { snapshots, isLoading } = useVSSSnapshots();
  const { jobs, setJobs } = useRollbackJobs();
  const [filterDevice, setFilterDevice] = useState('all');
  const [settings, setSettings] = useState({
    autoSnapshot: true,
    snapshotInterval: '4', // hours
    maxSnapshots: 48,
    protectShadowCopies: true,
    autoRollbackOnDetection: false,
    canaryFiles: true,
    canaryDensity: 'medium',
    immutableBackups: true,
    preEncryptionFreeze: true,
  });

  const devices = [...new Set(snapshots.map(s => s.device_name))];
  const filteredSnapshots = filterDevice === 'all'
    ? snapshots
    : snapshots.filter(s => s.device_name === filterDevice);

  const initiateRollback = (snapshot: VSSSnapshot) => {
    const job: RollbackJob = {
      id: `rb-${Date.now()}`,
      device_name: snapshot.device_name,
      agent_id: snapshot.agent_id,
      snapshot_id: snapshot.snapshot_id,
      trigger: 'manual',
      status: 'in_progress',
      files_restored: 0,
      files_failed: 0,
      total_files: Math.floor(Math.random() * 5000 + 500),
      started_at: new Date().toISOString(),
      completed_at: null,
      error_message: null,
      ransomware_event_id: null,
    };
    setJobs(prev => [job, ...prev]);
    toast.success(`Rollback initiated on ${snapshot.device_name} from snapshot ${snapshot.snapshot_id}`);

    // Simulate completion
    setTimeout(() => {
      setJobs(prev => prev.map(j => j.id === job.id ? {
        ...j,
        status: 'completed',
        files_restored: j.total_files - 3,
        files_failed: 3,
        completed_at: new Date().toISOString(),
      } : j));
      toast.success(`Rollback completed: ${job.total_files - 3} files restored on ${snapshot.device_name}`);
    }, 5000);
  };

  const totalProtectedDevices = devices.length;
  const totalSnapshots = snapshots.length;
  const activeRollbacks = jobs.filter(j => j.status === 'in_progress').length;
  const totalRestored = jobs.filter(j => j.status === 'completed').reduce((s, j) => s + j.files_restored, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-green-400" />
              <span className="text-xs text-white/60 uppercase">Protected Devices</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{totalProtectedDevices}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-white/60 uppercase">VSS Snapshots</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{totalSnapshots}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-white/60 uppercase">Active Rollbacks</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{activeRollbacks}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-xs text-white/60 uppercase">Files Recovered</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{totalRestored}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rollback Engine Settings */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-400" />
            Rollback Engine Configuration
          </CardTitle>
          <CardDescription>SentinelOne-grade ransomware rollback with VSS snapshot management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'autoSnapshot', label: 'Automated VSS Snapshots', desc: 'Create VSS snapshots on a schedule across all protected endpoints' },
              { key: 'protectShadowCopies', label: 'Shadow Copy Protection', desc: 'Block vssadmin.exe, wmic shadowcopy delete, and PowerShell deletion attempts' },
              { key: 'autoRollbackOnDetection', label: 'Auto-Rollback on Detection', desc: 'Automatically initiate file rollback when ransomware encryption is detected' },
              { key: 'canaryFiles', label: 'Canary/Honeypot Files', desc: 'Deploy hidden sentinel files to detect encryption activity early' },
              { key: 'immutableBackups', label: 'Immutable Snapshot Copies', desc: 'Store tamper-proof backup copies that ransomware cannot delete or encrypt' },
              { key: 'preEncryptionFreeze', label: 'Pre-Encryption Process Freeze', desc: 'Freeze suspicious processes before they can encrypt, preserving file state' },
            ].map(setting => (
              <div key={setting.key} className="flex items-start justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                <div className="flex-1 mr-3">
                  <p className="font-medium text-white text-sm">{setting.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                </div>
                <Switch
                  checked={settings[setting.key as keyof typeof settings] as boolean}
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, [setting.key]: v }))}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Snapshot Interval:</span>
              <Select value={settings.snapshotInterval} onValueChange={v => setSettings(prev => ({ ...prev, snapshotInterval: v }))}>
                <SelectTrigger className="w-[120px] h-8 text-xs bg-black/30 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Every 1h</SelectItem>
                  <SelectItem value="2">Every 2h</SelectItem>
                  <SelectItem value="4">Every 4h</SelectItem>
                  <SelectItem value="6">Every 6h</SelectItem>
                  <SelectItem value="12">Every 12h</SelectItem>
                  <SelectItem value="24">Every 24h</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Canary Density:</span>
              <Select value={settings.canaryDensity} onValueChange={v => setSettings(prev => ({ ...prev, canaryDensity: v }))}>
                <SelectTrigger className="w-[120px] h-8 text-xs bg-black/30 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (5/drive)</SelectItem>
                  <SelectItem value="medium">Medium (15/drive)</SelectItem>
                  <SelectItem value="high">High (50/drive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rollback Jobs */}
      {jobs.length > 0 && (
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5 text-cyan-400" />
              Rollback History ({jobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className={`p-4 rounded-lg border ${job.status === 'in_progress' ? 'border-purple-500/30 bg-purple-500/5' : job.status === 'completed' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{job.device_name}</span>
                      <Badge className={job.trigger === 'ransomware_detected' ? 'bg-red-500/20 text-red-400' : job.trigger === 'auto' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}>
                        {job.trigger === 'ransomware_detected' ? '🚨 Auto-Triggered' : job.trigger === 'auto' ? '⚡ Automated' : '👤 Manual'}
                      </Badge>
                      <Badge className={job.status === 'completed' ? 'bg-green-500/20 text-green-400' : job.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}>
                        {job.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}</span>
                  </div>
                  {job.status === 'in_progress' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Restoring files...</span>
                        <span>{Math.round((job.files_restored / job.total_files) * 100)}%</span>
                      </div>
                      <Progress value={(job.files_restored / job.total_files) * 100} className="h-2" />
                    </div>
                  )}
                  {job.status === 'completed' && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="text-green-400">✓ {job.files_restored} files restored</span>
                      {job.files_failed > 0 && <span className="text-red-400">✗ {job.files_failed} failed</span>}
                      <span>Snapshot: {job.snapshot_id}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* VSS Snapshots */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-cyan-400" />
                VSS Snapshot Manager
              </CardTitle>
              <CardDescription>Volume Shadow Copy snapshots available for rollback</CardDescription>
            </div>
            <Select value={filterDevice} onValueChange={setFilterDevice}>
              <SelectTrigger className="w-[200px] bg-black/30 border-white/10">
                <SelectValue placeholder="All Devices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                {devices.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">Loading snapshots...</div>
          ) : filteredSnapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Database className="h-8 w-8 mb-2 opacity-50" />
              <p>No snapshots available. Deploy agents to start capturing VSS snapshots.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {filteredSnapshots.map(snapshot => (
                  <div key={snapshot.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-4 w-4 text-cyan-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm">{snapshot.device_name}</span>
                          <code className="text-xs text-muted-foreground font-mono">{snapshot.drive_letter}</code>
                          <Badge className="bg-green-500/20 text-green-400 text-xs">{snapshot.is_protected ? 'Protected' : 'Unprotected'}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          <span>{format(new Date(snapshot.creation_time), 'MMM dd, yyyy HH:mm')}</span>
                          <span className="mx-2">•</span>
                          <span>{snapshot.size_gb} GB</span>
                          <span className="mx-2">•</span>
                          <code className="font-mono">{snapshot.snapshot_id}</code>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      onClick={() => initiateRollback(snapshot)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Rollback
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
