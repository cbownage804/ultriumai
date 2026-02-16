import { useState } from 'react';
import { History, RotateCcw, Clock, FileCode, ChevronRight, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { VersionSnapshot } from '@/hooks/useAIAppBuilder';

interface EditHistoryTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  versions: VersionSnapshot[];
  onRestore: (id: string) => void;
  currentVersionId?: string;
}

export function EditHistoryTimeline({ isOpen, onClose, versions, onRestore, currentVersionId }: EditHistoryTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -280, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -280, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0a0a12]/95 backdrop-blur-xl border-r border-white/[0.06] z-30 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-11 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-cyan-400/60" />
            <span className="text-xs font-medium text-white/70">Edit History</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-white/30 font-mono">{versions.length}</span>
          </div>
          <button onClick={onClose} className="h-6 w-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-auto">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Clock className="h-8 w-8 text-white/10 mb-3" />
              <p className="text-xs text-white/30">No history yet</p>
              <p className="text-[10px] text-white/15 mt-1">Changes will appear here as you build</p>
            </div>
          ) : (
            <div className="p-3 space-y-0.5">
              {[...versions].reverse().map((version, idx) => {
                const isExpanded = expandedId === version.id;
                const isCurrent = currentVersionId === version.id || (idx === 0 && !currentVersionId);
                const timeStr = version.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = version.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div key={version.id} className="relative">
                    {/* Timeline line */}
                    {idx < versions.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-0 w-px bg-white/[0.04]" />
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : version.id)}
                      className={cn(
                        "w-full text-left pl-2 pr-2 py-2 rounded-lg transition-all group flex gap-2.5",
                        isCurrent
                          ? "bg-cyan-500/[0.06] border border-cyan-500/15"
                          : "hover:bg-white/[0.03] border border-transparent"
                      )}
                    >
                      {/* Timeline dot */}
                      <div className={cn(
                        "h-[9px] w-[9px] rounded-full mt-1 shrink-0 ring-2",
                        isCurrent
                          ? "bg-cyan-400 ring-cyan-500/20"
                          : "bg-white/10 ring-white/[0.04] group-hover:bg-white/20"
                      )} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-[11px] font-medium truncate",
                            isCurrent ? "text-white/80" : "text-white/50 group-hover:text-white/70"
                          )}>
                            {version.label.replace(/^Before:\s*/, '').slice(0, 40)}
                          </span>
                          <ChevronDown className={cn(
                            "h-2.5 w-2.5 shrink-0 transition-transform text-white/15",
                            isExpanded && "rotate-180"
                          )} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-white/20 font-mono">{timeStr}</span>
                          <span className="text-[9px] text-white/10">{dateStr}</span>
                          <span className="text-[9px] text-white/15">{version.files.length} files</span>
                        </div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden ml-6"
                        >
                          <div className="py-2 space-y-1.5">
                            {/* File list */}
                            <div className="space-y-0.5">
                              {version.files.slice(0, 6).map(f => (
                                <div key={f.path} className="flex items-center gap-1.5 px-2 py-0.5">
                                  <FileCode className="h-2.5 w-2.5 text-white/15 shrink-0" />
                                  <span className="text-[10px] text-white/30 font-mono truncate">{f.path}</span>
                                </div>
                              ))}
                              {version.files.length > 6 && (
                                <div className="text-[9px] text-white/15 px-2">+{version.files.length - 6} more</div>
                              )}
                            </div>

                            {/* Restore button */}
                            {!isCurrent && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onRestore(version.id); }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-[10px] font-medium w-full justify-center"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Restore this version
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
