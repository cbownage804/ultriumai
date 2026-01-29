import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertTriangle, AlertCircle, Info, Sparkles, Ticket, 
  CheckCircle, Clock, Trash2, MoreHorizontal, Filter, ChevronDown
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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
  onCreateTicket: (alertId: string) => void;
  onLaunchCopilot: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onSnooze: (alertId: string) => void;
  onDelete: (alertId: string) => void;
}

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

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAlerts(newExpanded);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Warning</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Info</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="outline" className="text-green-600 border-green-300">Resolved</Badge>;
      case 'snoozed':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Snoozed</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600">Open</Badge>;
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-500">Alerts</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
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
          <p className="text-sm text-gray-500 text-center py-4">No alerts</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{alert.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {getStatusBadge(alert.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onLaunchCopilot(alert.id)}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Launch Copilot
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCreateTicket(alert.id)}>
                          <Ticket className="h-4 w-4 mr-2" />
                          Create ticket
                        </DropdownMenuItem>
                        {alert.status === 'open' && (
                          <>
                            <DropdownMenuItem onClick={() => onResolve(alert.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSnooze(alert.id)}>
                              <Clock className="h-4 w-4 mr-2" />
                              Snooze
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => onDelete(alert.id)}
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
                  className="mt-2 text-xs text-gray-500 p-0 h-auto"
                  onClick={() => toggleExpand(alert.id)}
                >
                  <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${expandedAlerts.has(alert.id) ? 'rotate-180' : ''}`} />
                  {expandedAlerts.has(alert.id) ? 'Hide details' : 'Show details'}
                </Button>
                
                {expandedAlerts.has(alert.id) && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                    <p>{alert.details || 'No additional details available.'}</p>
                    {alert.resolved_at && (
                      <p className="mt-1 text-gray-400">
                        Resolved {formatDistanceToNow(new Date(alert.resolved_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
