import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from "@/components/ui/tooltip";
import { AlertTriangle, AlertCircle, Info, Pause, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AlertCategory {
  name: string;
  count: number;
}

interface DeviceAlertStatusWidgetProps {
  warningCount: number;
  criticalCount: number;
  infoCount?: number;
  warningCategories?: AlertCategory[];
  criticalCategories?: AlertCategory[];
  isPaused?: boolean;
  onPauseToggle?: (paused: boolean) => void;
}

export function DeviceAlertStatusWidget({
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

  const defaultCategories: AlertCategory[] = [
    { name: "Hardware", count: 0 },
    { name: "Disk", count: 0 },
    { name: "Availability", count: 0 },
    { name: "Performance", count: 0 },
    { name: "Exchange", count: 0 },
    { name: "General", count: 0 },
    { name: "Network", count: 0 },
    { name: "Apps", count: 0 },
    { name: "Script-based", count: 0 },
  ];

  const warningCats = warningCategories.length > 0 ? warningCategories : defaultCategories;
  const criticalCats = criticalCategories.length > 0 ? criticalCategories : defaultCategories;

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-500">Alert status</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePauseToggle}
          className="gap-1 text-xs"
        >
          {paused ? (
            <>
              <Play className="h-3 w-3" />
              Resume alerts
            </>
          ) : (
            <>
              <Pause className="h-3 w-3" />
              Pause alerts
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex items-center gap-6">
            {/* Info Count */}
            {infoCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold">{infoCount}</span>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
                  <Info className="h-3 w-3" />
                  Info
                </Badge>
              </div>
            )}
            
            {/* Warning Count with Hover Categories */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <span className="text-2xl font-semibold">{warningCount}</span>
                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Warning
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="w-48">
                <div className="text-xs">
                  <p className="font-medium mb-2">Warning alerts by category</p>
                  {warningCats.map((cat) => (
                    <div key={cat.name} className="flex justify-between py-0.5">
                      <span>{cat.name}</span>
                      <span className="font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
            
            {/* Critical Count with Hover Categories */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <span className="text-2xl font-semibold">{criticalCount}</span>
                  <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Critical
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="w-48">
                <div className="text-xs">
                  <p className="font-medium mb-2">Critical alerts by category</p>
                  {criticalCats.map((cat) => (
                    <div key={cat.name} className="flex justify-between py-0.5">
                      <span>{cat.name}</span>
                      <span className="font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        
        {paused && (
          <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
            <Pause className="h-3 w-3" />
            Alerts are currently paused for this device
          </p>
        )}
      </CardContent>
    </Card>
  );
}
