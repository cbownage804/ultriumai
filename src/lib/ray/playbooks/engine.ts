/**
 * Ray Action Engine — runtime for playbook lifecycle.
 *
 * Responsibilities:
 * - start a playbook from a template (snapshots tasks),
 * - advance / toggle tasks,
 * - pause / resume / archive,
 * - on completion: timeline event, memory achievement, score bump.
 */
import { supabase } from '@/integrations/supabase/client';
import { rememberFact, recordTimelineEvent } from '@/lib/ray/brain';
import { RAY_TASKS, type RayTaskId } from './catalog';
import { findTemplate, type PlaybookTemplate } from './templates';

import { devLog } from '@/lib/logger';
export type PlaybookStatus =
  | 'new'
  | 'ready'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'archived';

export type PlaybookTaskRun = {
  id: RayTaskId;
  label: string;
  rayPrompt: string;
  externalUrl?: string;
  externalLabel?: string;
  done: boolean;
  done_at: string | null;
};

export type PlaybookRun = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  status: PlaybookStatus;
  estimated_minutes: number;
  reward_score: number;
  score_delta_actual: number | null;
  progress: number;
  tasks: PlaybookTaskRun[];
  affected_assets: unknown[];
  source_recommendation_id: string | null;
  started_at: string;
  paused_at: string | null;
  completed_at: string | null;
  archived_at: string | null;
  completion_message?: string;
};

type Row = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  status: PlaybookStatus;
  estimated_minutes: number;
  reward_score: number;
  score_delta_actual: number | null;
  progress: number;
  tasks: unknown;
  affected_assets: unknown;
  source_recommendation_id: string | null;
  started_at: string;
  paused_at: string | null;
  completed_at: string | null;
  archived_at: string | null;
};

function rowToRun(row: Row): PlaybookRun {
  const template = findTemplate(row.slug);
  return {
    ...row,
    tasks: Array.isArray(row.tasks) ? (row.tasks as PlaybookTaskRun[]) : [],
    affected_assets: Array.isArray(row.affected_assets) ? (row.affected_assets as unknown[]) : [],
    completion_message: template?.completion,
  };
}

function snapshotTasks(template: PlaybookTemplate): PlaybookTaskRun[] {
  return template.steps.map((step) => {
    const base = RAY_TASKS[step.task];
    return {
      id: base.id,
      label: base.label,
      rayPrompt: step.rayPrompt ?? base.rayPrompt,
      externalUrl: step.externalUrl ?? base.externalUrl,
      externalLabel: step.externalLabel ?? base.externalLabel,
      done: false,
      done_at: null,
    };
  });
}

function computeProgress(tasks: PlaybookTaskRun[]): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.done).length;
  return Math.round((done / tasks.length) * 100);
}

/* ------------------------------ start ------------------------------ */

export async function startPlaybook(
  userId: string,
  slug: string,
  options?: { sourceRecommendationId?: string | null; affectedAssets?: unknown[] },
): Promise<PlaybookRun | null> {
  const template = findTemplate(slug);
  if (!template) {
    devLog.warn('[ray.playbooks] unknown template', slug);
    return null;
  }

  // Reuse an in-flight run for the same slug if one exists.
  const { data: existing } = await supabase
    .from('ray_playbook_runs')
    .select('*')
    .eq('user_id', userId)
    .eq('slug', slug)
    .in('status', ['in_progress', 'paused', 'new', 'ready'])
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) {
    if ((existing as Row).status === 'paused') {
      await supabase
        .from('ray_playbook_runs')
        .update({ status: 'in_progress', paused_at: null })
        .eq('id', (existing as Row).id);
    }
    return rowToRun(existing as Row);
  }

  const tasks = snapshotTasks(template);
  const { data, error } = await supabase
    .from('ray_playbook_runs')
    .insert({
      user_id: userId,
      slug: template.slug,
      title: template.title,
      description: template.description,
      category: template.category,
      status: 'in_progress',
      estimated_minutes: template.estimated_minutes,
      reward_score: template.reward_score,
      progress: 0,
      tasks: tasks as never,
      affected_assets: (options?.affectedAssets ?? []) as never,
      source_recommendation_id: options?.sourceRecommendationId ?? null,
    })
    .select('*')
    .single();
  if (error || !data) {
    devLog.warn('[ray.playbooks] startPlaybook failed', error);
    return null;
  }

  // Link recommendation → run, mark in_progress.
  if (options?.sourceRecommendationId) {
    void supabase
      .from('ray_recommendations')
      .update({ status: 'in_progress', playbook_run_id: (data as Row).id })
      .eq('id', options.sourceRecommendationId);
  }

  void recordTimelineEvent(userId, {
    event_type: 'playbook_started',
    summary: `Started playbook: ${template.title}`,
    severity: 'info',
    payload: { slug: template.slug, run_id: (data as Row).id },
  });

  return rowToRun(data as Row);
}

/* ------------------------------ task ops ------------------------------ */

export async function toggleTask(run: PlaybookRun, taskId: RayTaskId): Promise<PlaybookRun> {
  const now = new Date().toISOString();
  const tasks = run.tasks.map((t) =>
    t.id === taskId ? { ...t, done: !t.done, done_at: !t.done ? now : null } : t,
  );
  const progress = computeProgress(tasks);
  const allDone = progress === 100;
  const status: PlaybookStatus = allDone ? 'completed' : 'in_progress';

  const updates: Record<string, unknown> = {
    tasks: tasks as never,
    progress,
    status,
    completed_at: allDone ? now : null,
  };

  const { error } = await supabase
    .from('ray_playbook_runs')
    .update(updates)
    .eq('id', run.id);
  if (error) devLog.warn('[ray.playbooks] toggleTask failed', error);

  const next: PlaybookRun = { ...run, tasks, progress, status,
    completed_at: allDone ? now : null };

  if (allDone) {
    await handleCompletion(next);
  }
  return next;
}

export async function advanceTask(run: PlaybookRun, taskId: RayTaskId): Promise<PlaybookRun> {
  // Mark a task done (forward-only).
  const task = run.tasks.find((t) => t.id === taskId);
  if (task?.done) return run;
  return toggleTask(run, taskId);
}

/* ------------------------------ lifecycle ------------------------------ */

export async function pauseRun(id: string) {
  await supabase
    .from('ray_playbook_runs')
    .update({ status: 'paused', paused_at: new Date().toISOString() })
    .eq('id', id);
}

export async function resumeRun(id: string) {
  await supabase
    .from('ray_playbook_runs')
    .update({ status: 'in_progress', paused_at: null })
    .eq('id', id);
}

export async function archiveRun(id: string) {
  await supabase
    .from('ray_playbook_runs')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', id);
}

/* ------------------------------ completion ------------------------------ */

async function handleCompletion(run: PlaybookRun) {
  // Score bump — store an actual delta equal to reward_score.
  const { data: latest } = await supabase
    .from('ray_security_scores')
    .select('score')
    .eq('user_id', run.user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const prev = (latest as { score?: number } | null)?.score ?? 60;
  const next = Math.max(0, Math.min(100, prev + run.reward_score));

  await supabase.from('ray_security_scores').insert({
    user_id: run.user_id,
    score: next,
    reason: `Completed playbook: ${run.title}`,
  });

  await supabase
    .from('ray_playbook_runs')
    .update({ score_delta_actual: next - prev })
    .eq('id', run.id);

  await recordTimelineEvent(run.user_id, {
    event_type: 'playbook_completed',
    summary: `Completed playbook: ${run.title}`,
    severity: 'info',
    payload: {
      slug: run.slug,
      run_id: run.id,
      score_before: prev,
      score_after: next,
      score_delta: next - prev,
      affected_assets: run.affected_assets,
    },
  });

  await rememberFact(
    run.user_id,
    `achievement:${run.slug}`,
    {
      title: run.title,
      completed_at: run.completed_at,
      score_delta: next - prev,
    },
    'system',
    0.95,
  );

  // Wrayth 4.0 — bump per-provider Account Health when a "secure-*" playbook completes.
  if (run.slug.startsWith('secure-')) {
    const providerId = run.slug.replace(/^secure-/, '').split('-')[0];
    try {
      const { data: existing } = await supabase
        .from('ray_account_health')
        .select('score')
        .eq('user_id', run.user_id)
        .eq('provider', providerId)
        .maybeSingle();
      const prevScore = (existing as { score?: number } | null)?.score ?? 50;
      const bumped = Math.min(100, prevScore + Math.max(8, Math.round(run.reward_score * 1.2)));
      await supabase
        .from('ray_account_health')
        .upsert(
          {
            user_id: run.user_id,
            provider: providerId,
            score: bumped,
            last_playbook_slug: run.slug,
            last_completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,provider' },
        );
    } catch (err) {
      devLog.warn('[ray.playbooks] account-health bump failed', err);
    }
  }


  // If this run resolved a recommendation, complete it.
  if (run.source_recommendation_id) {
    void supabase
      .from('ray_recommendations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', run.source_recommendation_id);
  }
}

/* ------------------------------ reads ------------------------------ */

export async function getRun(id: string): Promise<PlaybookRun | null> {
  const { data, error } = await supabase
    .from('ray_playbook_runs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToRun(data as Row);
}

export async function listRuns(
  userId: string,
  statuses: PlaybookStatus[] = ['in_progress', 'paused', 'completed'],
): Promise<PlaybookRun[]> {
  const { data } = await supabase
    .from('ray_playbook_runs')
    .select('*')
    .eq('user_id', userId)
    .in('status', statuses)
    .order('started_at', { ascending: false })
    .limit(50);
  return ((data as Row[]) ?? []).map(rowToRun);
}
