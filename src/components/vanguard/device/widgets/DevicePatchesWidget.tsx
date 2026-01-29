import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, Download } from "lucide-react";
import { toast } from "sonner";

interface DevicePatchesWidgetProps {
  availableCount: number;
  pendingCount: number;
  lastChecked?: string;
  onManagePatches: () => void;
  onReboot: () => void;
}

export function DevicePatchesWidget({
  availableCount,
  pendingCount,
  lastChecked,
  onManagePatches,
  onReboot,
}: DevicePatchesWidgetProps) {
  return (
    <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-purple-500/10">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-white/60">Patches</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white hover:bg-cyan-500/10" onClick={onManagePatches}>
          <Settings className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-semibold text-white">{availableCount}</div>
              <div className="text-xs text-white/60">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-white">{pendingCount}</div>
              <div className="text-xs text-white/60">Pending</div>
            </div>
          </div>
          
          {pendingCount > 0 && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              Reboot required
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-1 border-cyan-500/30 text-white hover:bg-cyan-500/10"
            onClick={onManagePatches}
          >
            <Download className="h-3 w-3" />
            Manage patches
          </Button>
          {pendingCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 border-cyan-500/30 text-white hover:bg-cyan-500/10"
              onClick={onReboot}
            >
              <RefreshCw className="h-3 w-3" />
              Reboot
            </Button>
          )}
        </div>
        
        {lastChecked && (
          <p className="text-xs text-white/40">Last checked: {lastChecked}</p>
        )}
      </CardContent>
    </Card>
  );
}
