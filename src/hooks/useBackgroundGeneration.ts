import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BackgroundJob {
  id: string;
  status: 'pending' | 'processing' | 'streaming' | 'completed' | 'failed' | 'cancelled';
  output_content?: string;
  error_message?: string;
  progress_percent?: number;
  bytes_received?: number;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

interface UseBackgroundGenerationOptions {
  onComplete?: (job: BackgroundJob) => void;
  onError?: (job: BackgroundJob) => void;
  pollIntervalMs?: number;
}

/**
 * Hook for server-side background generation.
 * Submits a build job to the edge function, then polls for completion.
 * Generation survives tab close — user can come back and see results.
 */
export function useBackgroundGeneration(options: UseBackgroundGenerationOptions = {}) {
  const { onComplete, onError, pollIntervalMs = 2000 } = options;
  const [activeJob, setActiveJob] = useState<BackgroundJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const pollJob = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'status', jobId },
      });

      if (error) {
        console.error('[BG Poll] Error:', error);
        return;
      }

      const job = data as BackgroundJob;
      setActiveJob(job);

      if (job.status === 'completed') {
        stopPolling();
        console.info('[BG] Job completed:', jobId);
        onCompleteRef.current?.(job);
      } else if (job.status === 'failed') {
        stopPolling();
        console.error('[BG] Job failed:', job.error_message);
        onErrorRef.current?.(job);
        toast.error(`Build failed: ${job.error_message?.slice(0, 100) || 'Unknown error'}`);
      } else if (job.status === 'cancelled') {
        stopPolling();
        console.info('[BG] Job cancelled:', jobId);
      }
    } catch (err) {
      console.error('[BG Poll] Exception:', err);
    }
  }, [stopPolling]);

  const startPolling = useCallback((jobId: string) => {
    stopPolling();
    setIsPolling(true);
    // Immediate first poll
    pollJob(jobId);
    pollTimerRef.current = setInterval(() => pollJob(jobId), pollIntervalMs);
  }, [pollJob, pollIntervalMs, stopPolling]);

  /** Submit a new background generation job */
  const submitJob = useCallback(async (params: {
    messages: any[];
    mode: string;
    model?: string;
    supabaseConfig?: any;
    stripeConfig?: any;
    activeServices?: string[];
    currentFiles?: any[];
    userId?: string;
  }): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-background', {
        body: {
          action: 'start',
          ...params,
          jobUserId: params.userId,
        },
      });

      if (error) {
        console.error('[BG] Submit error:', error);
        toast.error('Failed to start background build');
        return null;
      }

      const jobId = data?.jobId;
      if (!jobId) {
        toast.error('Failed to create build job');
        return null;
      }

      console.info('[BG] Job submitted:', jobId);
      setActiveJob({ id: jobId, status: 'pending' });
      startPolling(jobId);
      return jobId;
    } catch (err) {
      console.error('[BG] Submit exception:', err);
      toast.error('Failed to start background build');
      return null;
    }
  }, [startPolling]);

  /** Cancel the active job */
  const cancelJob = useCallback(async (jobId?: string) => {
    const id = jobId || activeJob?.id;
    if (!id) return;

    try {
      await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'cancel', jobId: id },
      });
      stopPolling();
      setActiveJob(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err) {
      console.error('[BG] Cancel error:', err);
    }
  }, [activeJob?.id, stopPolling]);

  /** Resume polling for a known job (e.g., after tab switch) */
  const resumePolling = useCallback((jobId: string) => {
    console.info('[BG] Resuming poll for job:', jobId);
    startPolling(jobId);
  }, [startPolling]);

  /** Check for any active jobs on mount (recovery after tab close) */
  const checkPendingJobs = useCallback(async (userId: string) => {
    try {
      const { data: jobs } = await supabase
        .from('app_builder_jobs')
        .select('id, status, progress_percent, created_at')
        .eq('user_id', userId)
        .in('status', ['pending', 'processing', 'streaming'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (jobs && jobs.length > 0) {
        const job = jobs[0];
        console.info('[BG] Found active job from previous session:', job.id, job.status);
        toast.info('Resuming your build from where it left off...', { duration: 4000 });
        setActiveJob({ id: job.id, status: job.status as BackgroundJob['status'], progress_percent: job.progress_percent ?? undefined });
        startPolling(job.id);
        return job.id;
      }

      // Also check for recently completed jobs that might not have been consumed
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: completedJobs } = await supabase
        .from('app_builder_jobs')
        .select('id, status, output_content, completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gt('completed_at', fiveMinAgo)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (completedJobs && completedJobs.length > 0 && completedJobs[0].output_content) {
        const job = completedJobs[0];
        console.info('[BG] Found recently completed job:', job.id);
        toast.success('Your build completed while you were away!', { duration: 5000 });
        // Fetch full job data and trigger onComplete
        const { data: fullJob } = await supabase
          .from('app_builder_jobs')
          .select('*')
          .eq('id', job.id)
          .single();
        
        if (fullJob) {
          setActiveJob(fullJob as unknown as BackgroundJob);
          onCompleteRef.current?.(fullJob as unknown as BackgroundJob);
          return job.id;
        }
      }

      return null;
    } catch (err) {
      console.error('[BG] checkPendingJobs error:', err);
      return null;
    }
  }, [startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    activeJob,
    isPolling,
    submitJob,
    cancelJob,
    resumePolling,
    checkPendingJobs,
    stopPolling,
  };
}
