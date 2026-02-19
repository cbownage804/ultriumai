import { X, Clock, Plus, Trash2, Play, Pause, Copy, Download } from 'lucide-react';
import type { CronJob } from '@/hooks/useCronJobScheduler';
import { useState } from 'react';

interface CronSchedulerPanelProps {
  open: boolean;
  onClose: () => void;
  jobs: CronJob[];
  schedulePresets: Record<string, { label: string; cron: string }>;
  onAddJob: (name: string, schedule: string, functionName: string, description?: string) => void;
  onUpdateJob: (id: string, updates: Partial<CronJob>) => void;
  onRemoveJob: (id: string) => void;
  onToggleJob: (id: string) => void;
  onExportSQL: (job: CronJob) => string;
  onExportAllSQL: () => string;
  parseCronExpression: (cron: string) => string;
  activeCount: number;
}

export function CronSchedulerPanel({ open, onClose, jobs, schedulePresets, onAddJob, onRemoveJob, onToggleJob, onExportSQL, onExportAllSQL, parseCronExpression, activeCount }: CronSchedulerPanelProps) {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('0 * * * *');
  const [fnName, setFnName] = useState('');
  const [description, setDescription] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[650px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-white">Cron Job Scheduler</span>
            <span className="text-[10px] text-white/20">{activeCount} active</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Job name" className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
              <input value={fnName} onChange={e => setFnName(e.target.value)} placeholder="Edge Function" className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80" />
            </div>
            <div className="flex gap-2">
              <input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="* * * * *" className="w-32 h-7 px-2 bg-black/30 border border-white/[0.08] rounded text-xs text-white/80 font-mono" />
              <span className="text-[10px] text-white/30 self-center flex-1">{parseCronExpression(schedule)}</span>
              <button onClick={() => { if (name && fnName) { onAddJob(name, schedule, fnName, description); setName(''); setFnName(''); setDescription(''); } }} disabled={!name || !fnName} className="h-7 px-3 bg-indigo-500/20 text-indigo-300 rounded text-xs hover:bg-indigo-500/30 disabled:opacity-30">
                <Plus className="h-3.5 w-3.5 inline mr-1" />Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(schedulePresets).map(([key, { label, cron }]) => (
                <button key={key} onClick={() => setSchedule(cron)} className={`px-2 py-0.5 rounded text-[9px] transition-colors ${schedule === cron ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/20 hover:text-white/40 hover:bg-white/5'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {jobs.map(job => (
            <div key={job.id} className="p-3 bg-black/20 rounded-lg border border-white/[0.04] space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggleJob(job.id)}>
                    {job.isActive ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-white/30" />}
                  </button>
                  <span className="text-xs text-white/70 font-medium">{job.name}</span>
                  <code className="text-[9px] text-indigo-400/60 font-mono bg-indigo-500/[0.08] px-1.5 rounded">{job.schedule}</code>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => navigator.clipboard.writeText(onExportSQL(job))} className="text-white/20 hover:text-white/50"><Copy className="h-3 w-3" /></button>
                  <button onClick={() => onRemoveJob(job.id)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-white/25">
                <span>→ {job.functionName}</span>
                <span>{parseCronExpression(job.schedule)}</span>
                {job.nextRun && <span>Next: {job.nextRun.toLocaleString()}</span>}
              </div>
            </div>
          ))}

          {jobs.length > 0 && (
            <div className="pt-3 border-t border-white/[0.06]">
              <button onClick={() => navigator.clipboard.writeText(onExportAllSQL())} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded text-xs hover:bg-indigo-500/30">
                <Download className="h-3 w-3" /> Export All as SQL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
