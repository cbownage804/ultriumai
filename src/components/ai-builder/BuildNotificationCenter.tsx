import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Rocket, Code2, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BuildNotification {
  id: string;
  type: 'success' | 'error' | 'deploy' | 'info';
  title: string;
  detail?: string;
  timestamp: Date;
  read: boolean;
  filePath?: string;
}

interface BuildNotificationCenterProps {
  notifications: BuildNotification[];
  onMarkRead: (id: string) => void;
  onClear: () => void;
  onClickNotification?: (notification: BuildNotification) => void;
}

const TYPE_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  error: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  deploy: { icon: Rocket, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  info: { icon: Code2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

export function BuildNotificationCenter({ notifications, onMarkRead, onClear, onClickNotification }: BuildNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatTime = (d: Date) => {
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-7 w-7 rounded-md flex items-center justify-center transition-colors relative",
          isOpen ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60 hover:bg-white/5"
        )}
      >
        <Bell className="h-3.5 w-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-80 rounded-lg border border-white/[0.08] bg-[#0d0d14] shadow-xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
            <span className="text-[11px] font-medium text-white/60">Notifications</span>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button onClick={onClear} className="text-[10px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-0.5">
                  <Trash2 className="h-2.5 w-2.5" />Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-64 overflow-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-[11px] text-white/20">No notifications</div>
            ) : (
              notifications.slice(0, 20).map(n => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                const Icon = config.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      onMarkRead(n.id);
                      onClickNotification?.(n);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 flex gap-2.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0",
                      !n.read && "bg-white/[0.01]"
                    )}
                  >
                    <div className={cn("h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                      <Icon className={cn("h-3 w-3", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />}
                        <span className="text-[11px] text-white/70 truncate">{n.title}</span>
                      </div>
                      {n.detail && <div className="text-[10px] text-white/30 truncate mt-0.5">{n.detail}</div>}
                      <div className="text-[9px] text-white/15 mt-0.5">{formatTime(n.timestamp)}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
