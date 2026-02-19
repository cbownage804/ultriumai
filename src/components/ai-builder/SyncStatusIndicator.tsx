import { Cloud, CloudOff, Loader2, CloudUpload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SyncStatus } from '@/hooks/useIndexedDBPersistence';
import { cn } from '@/lib/utils';

interface Props {
  status: SyncStatus;
  lastSaved?: Date | null;
}

const config: Record<SyncStatus, { icon: typeof Cloud; label: string; color: string }> = {
  synced: { icon: Cloud, label: 'All changes saved', color: 'text-emerald-400/60' },
  syncing: { icon: Loader2, label: 'Saving...', color: 'text-amber-400/60' },
  unsaved: { icon: CloudUpload, label: 'Unsaved changes', color: 'text-amber-400/60' },
  offline: { icon: CloudOff, label: 'Offline — changes saved locally', color: 'text-red-400/60' },
};

export function SyncStatusIndicator({ status, lastSaved }: Props) {
  const { icon: Icon, label, color } = config[status];
  const timeStr = lastSaved
    ? `Last saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded', color)}>
          <Icon className={cn('h-3 w-3', status === 'syncing' && 'animate-spin')} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <p>{label}</p>
        {timeStr && <p className="text-white/40">{timeStr}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
