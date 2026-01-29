import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Power, LogOut, RefreshCw, Clock, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ScheduledAction {
  id: string;
  action_type: 'logout' | 'restart' | 'shutdown';
  scheduled_at: string;
  repeat?: 'once' | 'daily' | 'weekly';
  created_by?: string;
}

interface DeviceShutdownActionsWidgetProps {
  scheduledActions: ScheduledAction[];
  onScheduleAction: () => void;
  onDeleteAction: (actionId: string) => void;
  onLogout: () => void;
  onRestart: () => void;
  onShutdown: () => void;
}

export function DeviceShutdownActionsWidget({
  scheduledActions,
  onScheduleAction,
  onDeleteAction,
  onLogout,
  onRestart,
  onShutdown,
}: DeviceShutdownActionsWidgetProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'logout':
        return <LogOut className="h-4 w-4" />;
      case 'restart':
        return <RefreshCw className="h-4 w-4" />;
      case 'shutdown':
        return <Power className="h-4 w-4" />;
      default:
        return <Power className="h-4 w-4" />;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'logout':
        return 'Log out user';
      case 'restart':
        return 'Restart device';
      case 'shutdown':
        return 'Shut down device';
      default:
        return type;
    }
  };

  return (
    <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-purple-500/10">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-white/60">Scheduled shutdown actions</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-white/60 hover:text-white hover:bg-cyan-500/10">
              <Plus className="h-3 w-3" />
              Shutdown actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-black/95 border-cyan-500/30">
            <DropdownMenuItem onClick={onLogout} className="text-white hover:bg-cyan-500/10">
              <LogOut className="h-4 w-4 mr-2" />
              Log out user now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRestart} className="text-white hover:bg-cyan-500/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShutdown} className="text-white hover:bg-cyan-500/10">
              <Power className="h-4 w-4 mr-2" />
              Shut down now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onScheduleAction} className="text-white hover:bg-cyan-500/10">
              <Clock className="h-4 w-4 mr-2" />
              Schedule action...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {scheduledActions.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-2">No scheduled actions</p>
        ) : (
          <div className="space-y-2">
            {scheduledActions.map((action) => (
              <div 
                key={action.id} 
                className="flex items-center justify-between p-2 bg-black/40 border border-cyan-500/20 rounded-lg"
              >
                <div className="flex items-center gap-2 text-white/80">
                  {getActionIcon(action.action_type)}
                  <div>
                    <p className="text-sm font-medium text-white">{getActionLabel(action.action_type)}</p>
                    <p className="text-xs text-white/60">
                      {format(new Date(action.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      {action.repeat && action.repeat !== 'once' && (
                        <Badge variant="outline" className="ml-2 text-xs border-cyan-500/30 text-cyan-400">
                          {action.repeat}
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => onDeleteAction(action.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
