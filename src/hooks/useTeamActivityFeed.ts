/**
 * Phase 116: Team Activity Feed
 * Real-time feed of team actions with timestamps and diffs.
 */
import { useCallback, useState } from 'react';

export interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  action: 'edit' | 'prompt' | 'deploy' | 'comment' | 'review' | 'branch' | 'merge' | 'settings' | 'invite' | 'approve' | 'reject';
  target: string; // file path, prompt summary, deploy version, etc.
  detail?: string;
  diff?: { added: number; removed: number };
  timestamp: Date;
}

export function useTeamActivityFeed() {
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [filter, setFilter] = useState<TeamActivity['action'] | 'all'>('all');

  const addActivity = useCallback((
    activity: Omit<TeamActivity, 'id' | 'timestamp'>
  ) => {
    setActivities(prev => [{
      ...activity,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    }, ...prev].slice(0, 200));
  }, []);

  const logEdit = useCallback((userName: string, filePath: string, added: number, removed: number) => {
    addActivity({
      userId: 'self', userName, userColor: '#06b6d4',
      action: 'edit', target: filePath,
      detail: `+${added} -${removed} lines`,
      diff: { added, removed },
    });
  }, [addActivity]);

  const logPrompt = useCallback((userName: string, prompt: string) => {
    addActivity({
      userId: 'self', userName, userColor: '#06b6d4',
      action: 'prompt', target: prompt.slice(0, 80),
    });
  }, [addActivity]);

  const logDeploy = useCallback((userName: string, version: string) => {
    addActivity({
      userId: 'self', userName, userColor: '#06b6d4',
      action: 'deploy', target: version,
    });
  }, [addActivity]);

  const logComment = useCallback((userName: string, filePath: string, line: number) => {
    addActivity({
      userId: 'self', userName, userColor: '#06b6d4',
      action: 'comment', target: `${filePath}:${line}`,
    });
  }, [addActivity]);

  const logApproval = useCallback((userName: string, target: string, approved: boolean) => {
    addActivity({
      userId: 'self', userName, userColor: '#06b6d4',
      action: approved ? 'approve' : 'reject', target,
    });
  }, [addActivity]);

  const filtered = filter === 'all' ? activities : activities.filter(a => a.action === filter);

  const getActionIcon = useCallback((action: TeamActivity['action']): string => {
    const icons: Record<string, string> = {
      edit: '✏️', prompt: '🤖', deploy: '🚀', comment: '💬',
      review: '👀', branch: '🌿', merge: '🔀', settings: '⚙️',
      invite: '📨', approve: '✅', reject: '❌',
    };
    return icons[action] || '•';
  }, []);

  const getActionLabel = useCallback((action: TeamActivity['action']): string => {
    const labels: Record<string, string> = {
      edit: 'edited', prompt: 'ran a prompt', deploy: 'deployed',
      comment: 'commented on', review: 'reviewed', branch: 'created branch',
      merge: 'merged', settings: 'changed settings', invite: 'invited',
      approve: 'approved', reject: 'rejected',
    };
    return labels[action] || action;
  }, []);

  return {
    activities: filtered,
    allActivities: activities,
    filter,
    setFilter,
    addActivity,
    logEdit,
    logPrompt,
    logDeploy,
    logComment,
    logApproval,
    getActionIcon,
    getActionLabel,
    clearActivities: useCallback(() => setActivities([]), []),
  };
}
