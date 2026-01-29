import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Info</Badge>;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          Recent alerts
          <HelpCircle className="h-3 w-3" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No recent alerts</p>
          </div>
        ) : (
          alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{alert.title}</p>
                <p className="text-xs text-muted-foreground">
                  {alert.client_name && <span className="text-primary">{alert.client_name}</span>}
                  {alert.client_name && alert.device_name && ' by '}
                  {alert.device_name && <span className="text-primary">{alert.device_name}</span>}
                  {' '}
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </p>
              </div>
              {getSeverityBadge(alert.severity)}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
