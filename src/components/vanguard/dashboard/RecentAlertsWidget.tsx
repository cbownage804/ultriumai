import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, AlertTriangle, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  device_name?: string;
  client_name?: string;
  created_at: string;
}

interface RecentAlertsWidgetProps {
  alerts: Alert[];
}

export function RecentAlertsWidget({ alerts }: RecentAlertsWidgetProps) {
  return (
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-cyan-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <Bell className="h-4 w-4 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]" />
          Recent alerts
          <HelpCircle className="h-3.5 w-3.5 text-slate-500 ml-1" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[280px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500">
            <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No recent alerts</p>
          </div>
        ) : (
          alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-cyan-500/10 transition-colors cursor-pointer">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{alert.title}</p>
                <p className="text-xs text-slate-500">
                  {alert.client_name && <span className="text-cyan-400 font-medium">{alert.client_name}</span>}
                  {alert.client_name && alert.device_name && ' by '}
                  {alert.device_name && <span className="text-cyan-400 font-medium">{alert.device_name}</span>}
                  {' '}
                  <span className="text-slate-500">{formatDistanceToNow(new Date(alert.created_at), { addSuffix: false })}</span>
                </p>
              </div>
              <span className={cn(
                "text-xs font-semibold px-2 py-1 rounded border shadow-lg",
                alert.severity === 'critical' 
                  ? 'text-red-400 bg-red-500/25 border-red-500/40 shadow-red-500/20' 
                  : alert.severity === 'warning'
                  ? 'text-orange-400 bg-orange-500/25 border-orange-500/40 shadow-orange-500/20'
                  : 'text-blue-400 bg-blue-500/25 border-blue-500/40 shadow-blue-500/20'
              )}>
                {alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info'}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
