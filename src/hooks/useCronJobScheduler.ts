import { useState, useCallback } from 'react';

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  functionName: string;
  description: string;
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
  timezone: string;
  createdAt: Date;
}

const SCHEDULE_PRESETS: Record<string, { label: string; cron: string }> = {
  'every_minute': { label: 'Every Minute', cron: '* * * * *' },
  'every_5_minutes': { label: 'Every 5 Minutes', cron: '*/5 * * * *' },
  'every_15_minutes': { label: 'Every 15 Minutes', cron: '*/15 * * * *' },
  'every_hour': { label: 'Every Hour', cron: '0 * * * *' },
  'every_6_hours': { label: 'Every 6 Hours', cron: '0 */6 * * *' },
  'daily_midnight': { label: 'Daily at Midnight', cron: '0 0 * * *' },
  'daily_9am': { label: 'Daily at 9 AM', cron: '0 9 * * *' },
  'weekly_monday': { label: 'Weekly on Monday', cron: '0 0 * * 1' },
  'monthly_first': { label: 'Monthly on 1st', cron: '0 0 1 * *' },
};

function parseCronExpression(cron: string): string {
  const parts = cron.split(' ');
  if (parts.length !== 5) return 'Invalid expression';
  const [min, hour, day, month, dow] = parts;
  const descriptions: string[] = [];

  if (min === '*' && hour === '*') descriptions.push('Every minute');
  else if (min.startsWith('*/')) descriptions.push(`Every ${min.slice(2)} minutes`);
  else if (hour === '*') descriptions.push(`At minute ${min}`);
  else descriptions.push(`At ${hour}:${min.padStart(2, '0')}`);

  if (day !== '*') descriptions.push(`on day ${day}`);
  if (month !== '*') descriptions.push(`in month ${month}`);
  if (dow !== '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    descriptions.push(`on ${days[parseInt(dow)] || dow}`);
  }

  return descriptions.join(' ');
}

function calculateNextRun(cron: string): Date {
  // Simplified: returns approximate next run
  const now = new Date();
  const parts = cron.split(' ');
  if (parts[0]?.startsWith('*/')) {
    const interval = parseInt(parts[0].slice(2)) || 5;
    return new Date(now.getTime() + interval * 60 * 1000);
  }
  // Default: next hour
  const next = new Date(now);
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return next;
}

export function useCronJobScheduler() {
  const [jobs, setJobs] = useState<CronJob[]>([]);

  const addJob = useCallback((name: string, schedule: string, functionName: string, description = ''): CronJob => {
    const job: CronJob = {
      id: crypto.randomUUID(),
      name,
      schedule,
      functionName,
      description,
      isActive: true,
      nextRun: calculateNextRun(schedule),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: new Date(),
    };
    setJobs(prev => [...prev, job]);
    return job;
  }, []);

  const updateJob = useCallback((id: string, updates: Partial<CronJob>) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== id) return j;
      const updated = { ...j, ...updates };
      if (updates.schedule) updated.nextRun = calculateNextRun(updates.schedule);
      return updated;
    }));
  }, []);

  const removeJob = useCallback((id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const toggleJob = useCallback((id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, isActive: !j.isActive } : j));
  }, []);

  const exportAsSQL = useCallback((job: CronJob): string => {
    return `-- Cron Job: ${job.name}\n-- Schedule: ${parseCronExpression(job.schedule)}\nSELECT cron.schedule(\n  '${job.name.replace(/'/g, "''")}',\n  '${job.schedule}',\n  $$SELECT net.http_post(\n    url := current_setting('app.settings.supabase_url') || '/functions/v1/${job.functionName}',\n    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),\n    body := '{}'::jsonb\n  )$$\n);`;
  }, []);

  const exportAllAsSQL = useCallback((): string => {
    return jobs.filter(j => j.isActive).map(exportAsSQL).join('\n\n');
  }, [jobs, exportAsSQL]);

  return {
    jobs, addJob, updateJob, removeJob, toggleJob,
    exportAsSQL, exportAllAsSQL,
    schedulePresets: SCHEDULE_PRESETS,
    parseCronExpression,
    activeCount: jobs.filter(j => j.isActive).length,
  };
}
