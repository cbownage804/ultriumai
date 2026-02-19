/**
 * Phase 116: Team Activity Feed Panel
 */
import { X, Activity, Filter } from 'lucide-react';
import type { TeamActivity } from '@/hooks/useTeamActivityFeed';

interface TeamActivityPanelProps {
  open: boolean;
  onClose: () => void;
  activities: TeamActivity[];
  filter: TeamActivity['action'] | 'all';
  onFilterChange: (f: TeamActivity['action'] | 'all') => void;
  getActionIcon: (a: TeamActivity['action']) => string;
  getActionLabel: (a: TeamActivity['action']) => string;
}

const FILTER_OPTIONS: (TeamActivity['action'] | 'all')[] = ['all', 'edit', 'prompt', 'deploy', 'comment', 'branch', 'merge', 'approve', 'reject'];

export function TeamActivityPanel({
  open, onClose, activities, filter, onFilterChange,
  getActionIcon, getActionLabel,
}: TeamActivityPanelProps) {
  if (!open) return null;

  const formatTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-y-0 right-0 w-72 bg-[#0d0d14] border-l border-white/[0.06] z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400/60" />
          <h3 className="text-sm font-medium text-white/80">Team Activity</h3>
        </div>
        <button onClick={onClose} className="p-1 text-white/30 hover:text-white/60"><X className="h-3.5 w-3.5" /></button>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] overflow-x-auto">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap ${
              filter === f ? 'bg-white/[0.1] text-white/70' : 'text-white/25 hover:text-white/40'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
            <span className="text-xs mt-0.5 shrink-0">{getActionIcon(activity.action)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-white/60 leading-snug">
                <span className="font-medium" style={{ color: activity.userColor }}>{activity.userName}</span>
                {' '}{getActionLabel(activity.action)}{' '}
                <span className="text-white/40 font-mono truncate">{activity.target}</span>
              </p>
              {activity.diff && (
                <span className="text-[9px] text-white/20">
                  +{activity.diff.added} −{activity.diff.removed}
                </span>
              )}
            </div>
            <span className="text-[9px] text-white/15 shrink-0">{formatTime(activity.timestamp)}</span>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center text-[11px] text-white/20 py-8">No activity yet</div>
        )}
      </div>
    </div>
  );
}
