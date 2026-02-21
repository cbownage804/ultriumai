import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BackgroundJob {
  id: string;
  status: 'pending' | 'processing' | 'streaming' | 'completed' | 'failed' | 'cancelled';
  output_content?: string;
  output_files?: any;
  output_deletions?: any;
  output_edits?: any;
  output_migrations?: any;
  output_edge_functions?: any;
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
  onProgress?: (job: BackgroundJob) => void;
  pollIntervalMs?: number;
}

/**
 * Hook for server-side background generation.
 * Submits a build job to the edge function, then uses Realtime + polling for status.
 * Generation survives tab close — user can come back and see results.
 */
export function useBackgroundGeneration(options: UseBackgroundGenerationOptions = {}) {
  const { onComplete, onError, onProgress, pollIntervalMs = 3000 } = options;
  const [activeJob, setActiveJob] = useState<BackgroundJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;
  onProgressRef.current = onProgress;

  const cleanup = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    setIsPolling(false);
  }, []);

  /** Handle a job status update (from Realtime or polling) */
  const handleJobUpdate = useCallback((job: BackgroundJob) => {
    setActiveJob(job);

    if (job.status === 'streaming' || job.status === 'processing') {
      onProgressRef.current?.(job);
    } else if (job.status === 'completed') {
      cleanup();
      console.info('[BG] Job completed:', job.id);
      onCompleteRef.current?.(job);
    } else if (job.status === 'failed') {
      cleanup();
      console.error('[BG] Job failed:', job.error_message);
      onErrorRef.current?.(job);
      toast.error(`Build failed: ${job.error_message?.slice(0, 100) || 'Unknown error'}`);
    } else if (job.status === 'cancelled') {
      cleanup();
      console.info('[BG] Job cancelled:', job.id);
    }
  }, [cleanup]);

  /** Subscribe to Realtime updates for a job */
  const subscribeToJob = useCallback((jobId: string) => {
    // Clean up any existing subscription
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`bg-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_builder_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload: any) => {
          const job = payload.new as BackgroundJob;
          handleJobUpdate(job);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [handleJobUpdate]);

  /** Poll for job status (fallback if Realtime misses updates) */
  const pollJob = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'status', jobId },
      });

      if (error) {
        console.error('[BG Poll] Error:', error);
        return;
      }

      handleJobUpdate(data as BackgroundJob);
    } catch (err) {
      console.error('[BG Poll] Exception:', err);
    }
  }, [handleJobUpdate]);

  /** Start watching a job via Realtime + polling fallback */
  const startWatching = useCallback((jobId: string) => {
    cleanup();
    setIsPolling(true);

    // Subscribe to Realtime for instant updates
    subscribeToJob(jobId);

    // Also poll as fallback (Realtime can miss events during reconnects)
    pollJob(jobId); // Immediate first poll
    pollTimerRef.current = setInterval(() => pollJob(jobId), pollIntervalMs);
  }, [cleanup, subscribeToJob, pollJob, pollIntervalMs]);

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
      startWatching(jobId);
      return jobId;
    } catch (err) {
      console.error('[BG] Submit exception:', err);
      toast.error('Failed to start background build');
      return null;
    }
  }, [startWatching]);

  /** Cancel the active job */
  const cancelJob = useCallback(async (jobId?: string) => {
    const id = jobId || activeJob?.id;
    if (!id) return;

    try {
      await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'cancel', jobId: id },
      });
      cleanup();
      setActiveJob(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err) {
      console.error('[BG] Cancel error:', err);
    }
  }, [activeJob?.id, cleanup]);

  /** Check for any active jobs on mount (recovery after tab close) */
  const checkPendingJobs = useCallback(async (userId: string) => {
    try {
      // Check for active jobs
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
        startWatching(job.id);
        return job.id;
      }

      // Check for recently completed jobs that might not have been consumed
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
  }, [startWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    activeJob,
    isPolling,
    submitJob,
    cancelJob,
    checkPendingJobs,
    startWatching,
    cleanup,
  };
}
