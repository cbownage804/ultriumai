import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Play, Pause, Plus, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  target: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'success' | 'failed' | 'pending';
}

const CronSchedulerTab = () => {
  const [jobs, setJobs] = useState<CronJob[]>([
    { id: '1', name: 'DB Cleanup', schedule: '0 2 * * *', target: 'cleanup-old-data', enabled: true, lastRun: '2h ago', nextRun: 'Tonight 2:00 AM', status: 'success' },
    { id: '2', name: 'Daily Report', schedule: '0 8 * * 1-5', target: 'generate-daily-report', enabled: true, lastRun: 'Yesterday 8:00 AM', nextRun: 'Tomorrow 8:00 AM', status: 'success' },
    { id: '3', name: 'Health Check', schedule: '*/5 * * * *', target: 'health-ping', enabled: true, lastRun: '3 min ago', nextRun: 'In 2 min', status: 'success' },
    { id: '4', name: 'Stale Session Purge', schedule: '0 */6 * * *', target: 'purge-sessions', enabled: false, lastRun: '6h ago', status: 'failed' },
  ]);

  const [newName, setNewName] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  const [newTarget, setNewTarget] = useState('');

  const toggleJob = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, enabled: !j.enabled } : j));
  };

  const addJob = () => {
    if (!newName || !newSchedule || !newTarget) { toast.error('All fields required'); return; }
    setJobs(prev => [...prev, { id: Date.now().toString(), name: newName, schedule: newSchedule, target: newTarget, enabled: true, status: 'pending' }]);
    setNewName(''); setNewSchedule(''); setNewTarget('');
    toast.success('Cron job added');
  };

  const removeJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    toast.success('Job removed');
  };

  const runNow = (id: string) => {
    toast.info('Job triggered manually (simulated)');
  };

  const statusColor = (s: string) => s === 'success' ? 'bg-green-500/20 text-green-500' : s === 'failed' ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6" /> Cron Job Scheduler</h2>
        <p className="text-muted-foreground">Schedule and monitor recurring background tasks</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Add Job</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="Job name" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1" />
          <Input placeholder="Cron expression (e.g. 0 * * * *)" value={newSchedule} onChange={e => setNewSchedule(e.target.value)} className="w-56 font-mono text-sm" />
          <Input placeholder="Target function" value={newTarget} onChange={e => setNewTarget(e.target.value)} className="flex-1" />
          <Button onClick={addJob} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {jobs.map(job => (
          <Card key={job.id} className={!job.enabled ? 'opacity-60' : ''}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Switch checked={job.enabled} onCheckedChange={() => toggleJob(job.id)} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{job.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs font-mono">{job.schedule}</Badge>
                    <span className="text-xs text-muted-foreground">→ {job.target}</span>
                    <Badge className={`text-xs ${statusColor(job.status)}`}>{job.status}</Badge>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {job.lastRun && <span>Last: {job.lastRun}</span>}
                    {job.nextRun && <span>Next: {job.nextRun}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => runNow(job.id)}><Play className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => removeJob(job.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CronSchedulerTab;
