import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertTriangle, AlertCircle, Info, Sparkles, Ticket, 
  CheckCircle, Clock, Trash2, MoreHorizontal, Filter, ChevronDown, Bell
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  created_at: string;
  status: 'open' | 'snoozed' | 'resolved';
  resolved_at?: string;
  details?: string;
}

interface DeviceAlertsWidgetProps {
  alerts: Alert[];
  onCreateTicket?: (alertId: string) => void;
  onLaunchCopilot?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onSnooze?: (alertId: string) => void;
  onDelete?: (alertId: string) => void;
}

const alertConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  info: {
    icon: Info,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
};

export function DeviceAlertsWidget({
  alerts,
  onCreateTicket,
  onLaunchCopilot,
  onResolve,
  onSnooze,
  onDelete,
}: DeviceAlertsWidgetProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'snoozed' | 'resolved'>('all');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'open').length;
  const warningCount = alerts.filter(a => a.severity === 'warning' && a.status === 'open').length;

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAlerts(newExpanded);
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900/50 to-slate-800/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <Bell className="h-4 w-4 text-cyan-400" />
          </div>
          Alerts
          <div className="flex items-center gap-2 ml-2">
            {criticalCount > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                {warningCount} Warning
              </Badge>
            )}
          </div>
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Filter className="h-3 w-3" />
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilter('all')}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('open')}>Open</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('snoozed')}>Snoozed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('resolved')}>Resolved</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-10 w-10 mb-2 text-emerald-500/50" />
            <p className="text-sm">No alerts</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {filteredAlerts.map((alert) => {
              const config = alertConfig[alert.severity];
              const Icon = config.icon;
              return (
                <div 
                  key={alert.id} 
                  className={cn(
                    "border rounded-lg p-3 transition-all",
                    config.bg,
                    config.border,
                    "hover:scale-[1.01]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn("p-1.5 rounded-md", config.bg)}>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                          </span>
                          <span className="text-xs text-muted-foreground/50">•</span>
                          <span className="text-xs text-muted-foreground">{alert.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {alert.status === 'resolved' ? (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">
                          Resolved
                        </Badge>
                      ) : alert.status === 'snoozed' ? (
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">
                          Snoozed
                        </Badge>
                      ) : null}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onLaunchCopilot?.(alert.id)}>
                            <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
                            Launch Copilot
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCreateTicket?.(alert.id)}>
                            <Ticket className="h-4 w-4 mr-2" />
                            Create ticket
                          </DropdownMenuItem>
                          {alert.status === 'open' && (
                            <>
                              <DropdownMenuItem onClick={() => onResolve?.(alert.id)}>
                                <CheckCircle className="h-4 w-4 mr-2 text-emerald-400" />
                                Mark resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onSnooze?.(alert.id)}>
                                <Clock className="h-4 w-4 mr-2" />
                                Snooze
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            className="text-red-400"
                            onClick={() => onDelete?.(alert.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Expandable details */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-muted-foreground p-0 h-auto hover:text-cyan-400"
                    onClick={() => toggleExpand(alert.id)}
                  >
                    <ChevronDown className={cn(
                      "h-3 w-3 mr-1 transition-transform",
                      expandedAlerts.has(alert.id) && 'rotate-180'
                    )} />
                    {expandedAlerts.has(alert.id) ? 'Hide details' : 'Show details'}
                  </Button>
                  
                  {expandedAlerts.has(alert.id) && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-xs text-muted-foreground">
                      <p>{alert.details || 'No additional details available.'}</p>
                      {alert.resolved_at && (
                        <p className="mt-1 text-emerald-400/70">
                          Resolved {formatDistanceToNow(new Date(alert.resolved_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
