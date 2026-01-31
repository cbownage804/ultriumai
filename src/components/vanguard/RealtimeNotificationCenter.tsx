import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Circle, AlertTriangle, Info, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRealtimeNotifications, RealtimeNotification } from '@/hooks/useRealtimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
};

const severityColors = {
  info: 'text-blue-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  success: 'text-green-400',
};

function NotificationItem({ 
  notification, 
  onMarkRead 
}: { 
  notification: RealtimeNotification; 
  onMarkRead: (id: string) => void;
}) {
  const Icon = severityIcons[notification.severity];
  
  return (
    <div 
      className={cn(
        "p-3 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors cursor-pointer",
        !notification.read && "bg-slate-800/30"
      )}
      onClick={() => onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-1.5 rounded-full bg-slate-800", severityColors[notification.severity])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-slate-200 truncate">{notification.title}</span>
            {!notification.read && (
              <Circle className="h-2 w-2 fill-cyan-400 text-cyan-400 shrink-0" />
            )}
          </div>
          <p className="text-xs text-slate-400 line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {notification.type}
            </Badge>
            <span className="text-[10px] text-slate-500">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RealtimeNotificationCenter() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useRealtimeNotifications();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 bg-slate-900 border-slate-700/50"
        align="end"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-200">Notifications</h3>
              {isConnected ? (
                <div className="flex items-center gap-1 text-[10px] text-green-400">
                  <Wifi className="h-3 w-3" />
                  Live
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] text-yellow-400">
                  <WifiOff className="h-3 w-3" />
                  Connecting...
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-cyan-500/20 text-cyan-400">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs text-red-400 hover:text-red-300"
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                onMarkRead={markAsRead}
              />
            ))
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No notifications yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Real-time alerts will appear here
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
