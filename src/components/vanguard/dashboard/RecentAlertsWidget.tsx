import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
          Recent alerts
          <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[280px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <AlertTriangle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No recent alerts</p>
          </div>
        ) : (
          alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{alert.title}</p>
                <p className="text-xs text-gray-500">
                  {alert.client_name && <span className="text-teal-600">{alert.client_name}</span>}
                  {alert.client_name && alert.device_name && ' by '}
                  {alert.device_name && <span className="text-teal-600">{alert.device_name}</span>}
                  {' '}
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: false })}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                alert.severity === 'critical' 
                  ? 'text-red-600 bg-red-50 border border-red-200' 
                  : alert.severity === 'warning'
                  ? 'text-orange-600 bg-orange-50 border border-orange-200'
                  : 'text-blue-600 bg-blue-50 border border-blue-200'
              }`}>
                {alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'Warning' : 'Info'}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
