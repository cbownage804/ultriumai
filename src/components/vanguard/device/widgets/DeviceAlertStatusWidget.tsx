import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from "@/components/ui/tooltip";
import { 
  AlertTriangle, AlertCircle, Info, Pause, Play, 
  Shield, ShieldCheck, ShieldAlert, Wifi, WifiOff, Clock
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AlertCategory {
  name: string;
  count: number;
}

interface DeviceAlertStatusWidgetProps {
  status?: 'online' | 'offline' | 'warning' | 'critical';
  lastHeartbeat?: Date | string | null;
  securityScore?: number;
  warningCount: number;
  criticalCount: number;
  infoCount?: number;
  warningCategories?: AlertCategory[];
  criticalCategories?: AlertCategory[];
  isPaused?: boolean;
  onPauseToggle?: (paused: boolean) => void;
}

const statusConfig = {
  online: {
    label: 'Online',
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    glow: 'shadow-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  offline: {
    label: 'Offline',
    icon: WifiOff,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    glow: 'shadow-slate-500/20',
    dot: 'bg-slate-500',
  },
  warning: {
    label: 'Warning',
    icon: ShieldAlert,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    glow: 'shadow-amber-500/20',
    dot: 'bg-amber-500',
  },
  critical: {
    label: 'Critical',
    icon: ShieldAlert,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    glow: 'shadow-red-500/20',
    dot: 'bg-red-500',
  },
};

export function DeviceAlertStatusWidget({
  status = 'online',
  lastHeartbeat,
  securityScore = 100,
  warningCount,
  criticalCount,
  infoCount = 0,
  warningCategories = [],
  criticalCategories = [],
  isPaused = false,
  onPauseToggle,
}: DeviceAlertStatusWidgetProps) {
  const [paused, setPaused] = useState(isPaused);

  const handlePauseToggle = () => {
    const newState = !paused;
    setPaused(newState);
    onPauseToggle?.(newState);
    toast.success(newState ? "Alerts paused" : "Alerts resumed");
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const defaultCategories: AlertCategory[] = [
    { name: "Hardware", count: 0 },
    { name: "Disk", count: 0 },
    { name: "Availability", count: 0 },
    { name: "Performance", count: 0 },
    { name: "Network", count: 0 },
  ];

  const warningCats = warningCategories.length > 0 ? warningCategories : defaultCategories;
  const criticalCats = criticalCategories.length > 0 ? criticalCategories : defaultCategories;

  return (
    <Card className={cn(
      "relative overflow-hidden border-0",
      "bg-gradient-to-br from-[#1a3a3a] to-[#0f2a2a]"
    )}>
      {/* Decorative glow */}
      <div className={cn(
        "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30",
        config.bg
      )} />
      
      <CardHeader className="pb-2 flex flex-row items-center justify-between relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">Device Status</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePauseToggle}
          className="gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {paused ? (
            <>
              <Play className="h-3 w-3" />
              Resume
            </>
          ) : (
            <>
              <Pause className="h-3 w-3" />
              Pause
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "relative p-3 rounded-xl",
              config.bg,
              "shadow-lg",
              config.glow
            )}>
              <Icon className={cn("h-6 w-6", config.color)} />
              {/* Pulsing dot for online */}
              {status === 'online' && !paused && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    config.dot
                  )} />
                  <span className={cn(
                    "relative inline-flex rounded-full h-3 w-3",
                    config.dot
                  )} />
                </span>
              )}
            </div>
            <div>
              <p className={cn("text-lg font-semibold", config.color)}>
                {config.label}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastHeartbeat 
                  ? formatDistanceToNow(new Date(lastHeartbeat), { addSuffix: true })
                  : 'Never'
                }
              </p>
            </div>
          </div>

          {/* Security Score */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Shield className={cn("h-4 w-4", getScoreColor(securityScore))} />
              <span className={cn("text-2xl font-bold", getScoreColor(securityScore))}>
                {securityScore}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Security</p>
          </div>
        </div>

        {/* Alert counts */}
        <TooltipProvider>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            {infoCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold text-cyan-400">{infoCount}</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 gap-1 text-xs">
                  <Info className="h-3 w-3" />
                  Info
                </Badge>
              </div>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xl font-semibold text-amber-400">{warningCount}</span>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 gap-1 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    Warning
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-800 border-slate-700">
                <div className="text-xs">
                  <p className="font-medium mb-2 text-amber-400">Warning alerts by category</p>
                  {warningCats.map((cat) => (
                    <div key={cat.name} className="flex justify-between py-0.5 gap-4">
                      <span className="text-muted-foreground">{cat.name}</span>
                      <span className="font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xl font-semibold text-red-400">{criticalCount}</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    Critical
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-800 border-slate-700">
                <div className="text-xs">
                  <p className="font-medium mb-2 text-red-400">Critical alerts by category</p>
                  {criticalCats.map((cat) => (
                    <div key={cat.name} className="flex justify-between py-0.5 gap-4">
                      <span className="text-muted-foreground">{cat.name}</span>
                      <span className="font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        
        {paused && (
          <p className="text-xs text-amber-400/80 mt-3 flex items-center gap-1 bg-amber-500/10 p-2 rounded-lg">
            <Pause className="h-3 w-3" />
            Alerts are currently paused for this device
          </p>
        )}
      </CardContent>
    </Card>
  );
}
