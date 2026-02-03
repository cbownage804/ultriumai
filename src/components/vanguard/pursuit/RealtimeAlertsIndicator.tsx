import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, AlertTriangle, Shield, X, Trash2, Wifi, WifiOff } from "lucide-react";
import { usePursuitRealtime, RealtimeThreatAlert } from "@/hooks/usePursuitRealtime";
import { formatDistanceToNow } from "date-fns";

const severityColors: Record<string, string> = {
  critical: "bg-destructive",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
  info: "bg-muted",
};

const severityIcons: Record<string, React.ReactNode> = {
  critical: <AlertTriangle className="h-4 w-4" />,
  high: <AlertTriangle className="h-4 w-4" />,
  medium: <Shield className="h-4 w-4" />,
  low: <Shield className="h-4 w-4" />,
  info: <Shield className="h-4 w-4" />,
};

export function RealtimeAlertsIndicator() {
  const { alerts, unreadCount, isConnected, dismissAlert, clearAlerts } = usePursuitRealtime();
  const [isOpen, setIsOpen] = useState(false);

  const activeAlerts = alerts.filter(a => !a.dismissed);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 ${unreadCount > 0 ? "text-destructive animate-pulse" : ""}`} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px]">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Live Threat Alerts
          </SheetTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="gap-1 text-green-500 border-green-500">
                <Wifi className="h-3 w-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <WifiOff className="h-3 w-3" />
                Disconnected
              </Badge>
            )}
            {activeAlerts.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAlerts} className="text-xs">
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Shield className="h-12 w-12 mb-3 text-green-500" />
              <p className="font-medium">All Clear</p>
              <p className="text-sm">No active threat alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  onDismiss={() => dismissAlert(alert.id)} 
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function AlertCard({ 
  alert, 
  onDismiss 
}: { 
  alert: RealtimeThreatAlert; 
  onDismiss: () => void;
}) {
  return (
    <div 
      className={`p-3 rounded-lg border-l-4 bg-card ${
        alert.severity === "critical" ? "border-l-destructive" :
        alert.severity === "high" ? "border-l-orange-500" :
        alert.severity === "medium" ? "border-l-yellow-500" :
        "border-l-blue-500"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge className={`${severityColors[alert.severity]} text-white gap-1`}>
              {severityIcons[alert.severity]}
              {alert.severity.toUpperCase()}
            </Badge>
          </div>
          <p className="font-medium mt-1 truncate">{alert.threatName}</p>
          {alert.agentName && (
            <p className="text-sm text-muted-foreground">
              Device: {alert.agentName}
            </p>
          )}
          {alert.mitreTechnique && (
            <Badge variant="secondary" className="mt-1 text-xs font-mono">
              {alert.mitreTechnique}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
