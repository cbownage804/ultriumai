import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Pause, Play, Maximize2, Minimize2, X } from "lucide-react";

interface RemoteDesktopControlsProps {
  deviceName: string;
  isPaused: boolean;
  isFullscreen: boolean;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
}

export const RemoteDesktopControls = ({
  deviceName,
  isPaused,
  isFullscreen,
  onTogglePause,
  onToggleFullscreen,
  onClose
}: RemoteDesktopControlsProps) => {
  return (
    <div className="flex items-center justify-between pb-2">
      <div className="flex items-center gap-2">
        <Monitor className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Remote Desktop - {deviceName}</h3>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Connected
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onTogglePause}>
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleFullscreen}>
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};