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
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-500">Scheduled shutdown actions</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Plus className="h-3 w-3" />
              Shutdown actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out user now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRestart}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShutdown}>
              <Power className="h-4 w-4 mr-2" />
              Shut down now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onScheduleAction}>
              <Clock className="h-4 w-4 mr-2" />
              Schedule action...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {scheduledActions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No scheduled actions</p>
        ) : (
          <div className="space-y-2">
            {scheduledActions.map((action) => (
              <div 
                key={action.id} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {getActionIcon(action.action_type)}
                  <div>
                    <p className="text-sm font-medium">{getActionLabel(action.action_type)}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(action.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      {action.repeat && action.repeat !== 'once' && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {action.repeat}
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-400 hover:text-red-500"
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
