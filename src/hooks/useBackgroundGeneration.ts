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
  input_mode?: string;
}

export interface BuildHistoryEntry {
  id: string;
  status: string;
  input_mode: string;
  progress_percent: number | null;
  bytes_received: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

interface UseBackgroundGenerationOptions {
  onComplete?: (job: BackgroundJob) => void;
  onError?: (job: BackgroundJob) => void;
  onProgress?: (job: BackgroundJob) => void;
  onStreamDelta?: (delta: string, totalContent: string) => void;
  pollIntervalMs?: number;
}

/**
 * Hook for server-side background generation with SSE streaming, build queue, and history.
 * Generation survives tab close — user can come back and see results.
 */
// Module-level Set so it survives component remounts (useRef resets on remount)
const processedJobIds = new Set<string>();

export function useBackgroundGeneration(options: UseBackgroundGenerationOptions = {}) {
  const { onComplete, onError, onProgress, onStreamDelta, pollIntervalMs = 3000 } = options;
  const [activeJob, setActiveJob] = useState<BackgroundJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [buildQueue, setBuildQueue] = useState<{ id: string; status: string }[]>([]);
  const [buildHistory, setBuildHistory] = useState<BuildHistoryEntry[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeJobRef = useRef<BackgroundJob | null>(null);
  const realtimeChannelRef = useRef<any>(null);
  const sseAbortRef = useRef<AbortController | null>(null);
  const streamedContentRef = useRef<string>('');
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);
  const onStreamDeltaRef = useRef(onStreamDelta);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;
  onProgressRef.current = onProgress;
  onStreamDeltaRef.current = onStreamDelta;
  activeJobRef.current = activeJob;

  // ── Throttled state flush for streaming deltas ──
  // During SSE streaming, setActiveJob fires on EVERY token. Each call
  // re-renders the 5000-line workspace with 165+ effects — causing a browser freeze.
  // Instead: accumulate in a ref and flush to state at most every 2s.
  const pendingJobRef = useRef<BackgroundJob | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitActiveJob = useCallback((job: BackgroundJob | null) => {
    activeJobRef.current = job;
    setActiveJob(job);
  }, []);
  const flushActiveJob = useCallback(() => {
    if (pendingJobRef.current) {
      commitActiveJob(pendingJobRef.current);
      pendingJobRef.current = null;
    }
  }, [commitActiveJob]);
  const throttledSetActiveJob = useCallback((updater: BackgroundJob | ((prev: BackgroundJob | null) => BackgroundJob | null)) => {
    // For terminal states, flush immediately
    const job = typeof updater === 'function' ? updater(activeJobRef.current) : updater;
    if (!job) return;
    const isTerminal = job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled';
    if (isTerminal) {
      if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null; }
      pendingJobRef.current = null;
      commitActiveJob(job);
      return;
    }
    // For streaming/progress: accumulate in ref, flush every 2s
    pendingJobRef.current = job;
    activeJobRef.current = job; // keep ref in sync for callbacks
    if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(() => {
        flushTimerRef.current = null;
        flushActiveJob();
      }, 2000);
    }
  }, [commitActiveJob, flushActiveJob]);

  // ── Pending queue for messages sent during active builds ──
  const pendingQueueRef = useRef<Array<{
    params: any;
    resolve: (jobId: string | null) => void;
  }>>([]);

  const cleanup = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    if (sseAbortRef.current) {
      sseAbortRef.current.abort();
      sseAbortRef.current = null;
    }
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    pendingJobRef.current = null;
    setIsPolling(false);
  }, []);

  /** Process the next item in the pending queue */
  const processQueue = useCallback(async () => {
    if (pendingQueueRef.current.length === 0) return;
    const next = pendingQueueRef.current.shift();
    if (!next) return;
    // Will be processed by submitJob's internal logic
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'start', ...next.params, jobUserId: next.params.userId },
      });
      if (error || !data?.jobId) {
        next.resolve(null);
        return;
      }
      next.resolve(data.jobId);
    } catch {
      next.resolve(null);
    }
  }, []);

  /** Handle a job status update */
  const handleJobUpdate = useCallback((job: BackgroundJob) => {
    const isTerminal = job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled';
    if (isTerminal) {
      commitActiveJob(job);
    } else {
      throttledSetActiveJob(job);
    }

    if (job.status === 'streaming' || job.status === 'processing') {
      onProgressRef.current?.(job);
    } else if (job.status === 'completed') {
      cleanup();
      processedJobIds.add(job.id);
      console.info('[BG] ✅ Job completed:', job.id, '— calling onComplete callback');
      onCompleteRef.current?.(job);
      // Process next queued job
      processQueue();
    } else if (job.status === 'failed') {
      cleanup();
      console.error('[BG] ❌ Job failed:', job.id, job.error_message);
      onErrorRef.current?.(job);
      const cleanMsg = job.error_message?.replace(/\{"error":"([^"]+)".*\}/, '$1')
        ?.replace(/AI builder (?:returned|error) \(?(\d+)\)?:\s*/i, '')
        ?.slice(0, 100) || 'Unknown error';
      toast.error(`Build failed: ${cleanMsg}`);
      processQueue();
    } else if (job.status === 'cancelled') {
      cleanup();
      console.info('[BG] Job cancelled:', job.id);
      processQueue();
    }
  }, [cleanup, commitActiveJob, processQueue, throttledSetActiveJob]);

  /** Start SSE stream for live token updates */
  const startSSEStream = useCallback(async (jobId: string) => {
    sseAbortRef.current?.abort();
    const controller = new AbortController();
    sseAbortRef.current = controller;
    streamedContentRef.current = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-builder-background`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: 'stream', jobId }),
          signal: controller.signal,
        }
      );

      if (!response.ok || !response.body) {
        console.warn('[BG SSE] Failed to start stream, falling back to polling');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 2);

          if (!chunk.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(chunk.slice(6));
            
            if (data.type === 'delta') {
              streamedContentRef.current += data.content;
              onStreamDeltaRef.current?.(data.content, streamedContentRef.current);
              // Update active job with progressive content
              throttledSetActiveJob(prev => prev ? {
                ...prev,
                output_content: streamedContentRef.current,
                progress_percent: data.progress || prev.progress_percent,
              } : null);
            } else if (data.type === 'progress') {
              throttledSetActiveJob(prev => prev ? { ...prev, progress_percent: data.progress } : null);
            } else if (data.type === 'complete') {
              // Final status will come via Realtime/polling
            } else if (data.type === 'error') {
              console.error('[BG SSE] Error:', data.error);
            }
          } catch {
            // Skip malformed
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[BG SSE] Stream error, polling handles it:', err.message);
      }
    }
  }, []);

  /** Subscribe to Realtime updates for a job */
  const subscribeToJob = useCallback((jobId: string) => {
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
          handleJobUpdate(payload.new as BackgroundJob);
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  }, [handleJobUpdate]);

  /** Poll for job status (fallback) */
  const pollJob = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'status', jobId },
      });
      if (error) return;
      handleJobUpdate(data as BackgroundJob);
    } catch (err) {
      console.error('[BG Poll] Exception:', err);
    }
  }, [handleJobUpdate]);

  /** Start watching a job via SSE + Realtime + polling */
  const startWatching = useCallback((jobId: string) => {
    cleanup();
    setIsPolling(true);

    // Start SSE for live streaming
    startSSEStream(jobId);

    // Subscribe to Realtime for completion events
    subscribeToJob(jobId);

    // Poll as fallback
    pollJob(jobId);
    pollTimerRef.current = setInterval(() => pollJob(jobId), pollIntervalMs);
  }, [cleanup, startSSEStream, subscribeToJob, pollJob, pollIntervalMs]);

  /** Submit a new background generation job (with queue support) */
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
    // If a job is already running, queue this one
    if (activeJob && ['pending', 'processing', 'streaming'].includes(activeJob.status)) {
      return new Promise((resolve) => {
        pendingQueueRef.current.push({ params, resolve });
        setBuildQueue(prev => [...prev, { id: `queued-${Date.now()}`, status: 'queued' }]);
        toast.info('Build queued — will start after the current build finishes.', { duration: 3000 });
      });
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'start', ...params, jobUserId: params.userId },
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
      commitActiveJob({ id: jobId, status: 'pending' });
      startWatching(jobId);
      return jobId;
    } catch (err) {
      console.error('[BG] Submit exception:', err);
      toast.error('Failed to start background build');
      return null;
    }
  }, [startWatching, activeJob]);

  /** Cancel the active job */
  const cancelJob = useCallback(async (jobId?: string) => {
    const id = jobId || activeJob?.id;
    if (!id) return;

    try {
      await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'cancel', jobId: id },
      });
      cleanup();
      throttledSetActiveJob(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err) {
      console.error('[BG] Cancel error:', err);
    }
  }, [activeJob?.id, cleanup, throttledSetActiveJob]);

  /** Fetch build history from the server */
  const fetchBuildHistory = useCallback(async (userId: string, limit = 20) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'history', userId, limit },
      });
      if (!error && data?.builds) {
        setBuildHistory(data.builds);
      }
      return data?.builds || [];
    } catch {
      return [];
    }
  }, []);

  /** Restore files from a historical build */
  const restoreFromBuild = useCallback(async (jobId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-background', {
        body: { action: 'restore', jobId },
      });
      if (error || !data?.output_content) {
        toast.error('Failed to restore build');
        return null;
      }
      return data.output_content;
    } catch {
      toast.error('Failed to restore build');
      return null;
    }
  }, []);

  // processedJobIds is at module scope (see top of file)

  /** Check for any active jobs on mount (recovery after tab close) */
  const checkPendingJobs = useCallback(async (userId: string) => {
    // Use ref to avoid stale closure — skip if already watching a job
    if (activeJobRef.current) return { type: 'active' as const, id: activeJobRef.current.id };
    try {
      // Only look for jobs older than 10 seconds to avoid picking up
      // the job that was JUST created by the current generation request
      const tenSecondsAgo = new Date(Date.now() - 10_000).toISOString();
      const { data: jobs } = await supabase
        .from('app_builder_jobs')
        .select('id, status, progress_percent, created_at')
        .eq('user_id', userId)
        .in('status', ['pending', 'processing', 'streaming'])
        .lt('created_at', tenSecondsAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (jobs && jobs.length > 0) {
        const job = jobs[0];
        if (processedJobIds.has(job.id)) {
          console.info('[BG] Job already processed in this session, skipping:', job.id);
          return null;
        }
        console.info('[BG] Found active job from previous session:', job.id);
        toast.info('Resuming your build from where it left off...', { duration: 4000 });
        commitActiveJob({ id: job.id, status: job.status as BackgroundJob['status'], progress_percent: job.progress_percent ?? undefined });
        startWatching(job.id);
        return { type: 'active' as const, id: job.id };
      }

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
        // Skip if this job was already processed in the current session
        if (processedJobIds.has(job.id)) {
          console.info('[BG] Completed job already processed, skipping:', job.id);
          return null;
        }
        processedJobIds.add(job.id);
        console.info('[BG] Found recently completed job:', job.id);
        toast.success('Your build completed while you were away!', { duration: 5000 });
        const { data: fullJob } = await supabase
          .from('app_builder_jobs')
          .select('*')
          .eq('id', job.id)
          .single();
        
        if (fullJob) {
          commitActiveJob(fullJob as unknown as BackgroundJob);
          onCompleteRef.current?.(fullJob as unknown as BackgroundJob);
          return { type: 'completed' as const, id: job.id };
        }
      }

      return null;
    } catch (err) {
      console.error('[BG] checkPendingJobs error:', err);
      return null;
    }
  }, [startWatching]);

  /** Reset local watcher/runtime state for a true fresh-session start */
  const resetState = useCallback(() => {
    cleanup();
    commitActiveJob(null);
    setBuildQueue([]);
    streamedContentRef.current = '';
  }, [cleanup, commitActiveJob]);

  /** Get streamed content ref for incremental file parsing */
  const getStreamedContent = useCallback(() => streamedContentRef.current, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    activeJob,
    isPolling,
    buildQueue,
    buildHistory,
    submitJob,
    cancelJob,
    checkPendingJobs,
    startWatching,
    cleanup,
    resetState,
    fetchBuildHistory,
    restoreFromBuild,
    getStreamedContent,
    streamedContentRef,
  };
}
