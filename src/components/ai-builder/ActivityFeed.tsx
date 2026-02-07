import { useState } from 'react';
import { Clock, FileCode, Rocket, GitBranch, Bot, Undo2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActivityEntry {
  id: string;
  type: 'file_edit' | 'ai_generation' | 'deploy' | 'branch' | 'revert' | 'save';
  label: string;
  detail?: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  open: boolean;
  onClose: () => void;
  entries: ActivityEntry[];
}

const ICONS: Record<ActivityEntry['type'], typeof Clock> = {
  file_edit: FileCode,
  ai_generation: Bot,
  deploy: Rocket,
  branch: GitBranch,
  revert: Undo2,
  save: Save,
};

const COLORS: Record<ActivityEntry['type'], string> = {
  file_edit: 'text-blue-400',
  ai_generation: 'text-cyan-400',
  deploy: 'text-emerald-400',
  branch: 'text-violet-400',
  revert: 'text-amber-400',
  save: 'text-white/40',
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ open, onClose, entries }: ActivityFeedProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 260, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full border-r border-white/[0.06] bg-[#0a0a0f] flex flex-col shrink-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider font-medium">
            <Clock className="h-3 w-3" />
            Activity
          </div>
          <button onClick={onClose} className="h-5 w-5 flex items-center justify-center text-white/30 hover:text-white/60 rounded transition-colors">
            <X className="h-3 w-3" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {entries.length === 0 ? (
              <div className="text-center text-xs text-white/15 py-8">No activity yet</div>
            ) : (
              entries.map((entry) => {
                const Icon = ICONS[entry.type];
                return (
                  <div key={entry.id} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-white/[0.03] transition-colors">
                    <Icon className={cn("h-3 w-3 mt-0.5 shrink-0", COLORS[entry.type])} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-white/60 truncate">{entry.label}</div>
                      {entry.detail && <div className="text-[9px] text-white/25 truncate">{entry.detail}</div>}
                    </div>
                    <span className="text-[9px] text-white/15 shrink-0 mt-0.5">{timeAgo(entry.timestamp)}</span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}
