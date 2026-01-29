import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileCode, Package, RefreshCw, Power, ExternalLink, 
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp 
} from "lucide-react";
import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";

interface ActivityLogEntry {
  id: string;
  type: 'script' | 'software' | 'patch' | 'remote_access' | 'shutdown' | 'other';
  action: string;
  timestamp: string;
  technician?: string;
  status: 'success' | 'failed' | 'pending';
  details?: string;
  output?: string;
  duration?: number;
  session_summary?: string;
}

interface DeviceActivityLogWidgetProps {
  activities: ActivityLogEntry[];
  maxHeight?: number;
}

export function DeviceActivityLogWidget({ 
  activities, 
  maxHeight = 400 
}: DeviceActivityLogWidgetProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'script':
        return <FileCode className="h-4 w-4 text-blue-500" />;
      case 'software':
        return <Package className="h-4 w-4 text-purple-500" />;
      case 'patch':
        return <RefreshCw className="h-4 w-4 text-green-500" />;
      case 'remote_access':
        return <ExternalLink className="h-4 w-4 text-teal-500" />;
      case 'shutdown':
        return <Power className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
    }
  };

  return (
    <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-purple-500/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white/60">Activity log</CardTitle>
        <p className="text-xs text-white/40">
          Scripts, software updates, patches, remote access, and shutdown actions
        </p>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-4">No recent activity</p>
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="border border-cyan-500/20 rounded-lg p-3 hover:bg-cyan-500/5 transition-colors bg-black/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {getTypeIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-white/60">
                            {format(new Date(activity.timestamp), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          {activity.technician && (
                            <>
                              <span className="text-xs text-white/40">•</span>
                              <span className="text-xs text-white/60">by {activity.technician}</span>
                            </>
                          )}
                          {activity.duration && (
                            <>
                              <span className="text-xs text-white/40">•</span>
                              <span className="text-xs text-white/60">{activity.duration}s</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                  
                  {/* Expandable details */}
                  {(activity.details || activity.output || activity.session_summary) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs text-white/60 p-0 h-auto hover:text-cyan-400"
                        onClick={() => toggleExpand(activity.id)}
                      >
                        {expandedItems.has(activity.id) ? (
                          <><ChevronUp className="h-3 w-3 mr-1" /> Hide details</>
                        ) : (
                          <><ChevronDown className="h-3 w-3 mr-1" /> Show details</>
                        )}
                      </Button>
                      
                      {expandedItems.has(activity.id) && (
                        <div className="mt-2 pt-2 border-t border-cyan-500/20 space-y-2">
                          {activity.details && (
                            <p className="text-xs text-white/60">{activity.details}</p>
                          )}
                          
                          {activity.output && (
                            <div className="bg-black text-green-400 text-xs p-2 rounded font-mono overflow-x-auto border border-cyan-500/20">
                              <pre>{activity.output}</pre>
                            </div>
                          )}
                          
                          {activity.session_summary && (
                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded p-2">
                              <p className="text-xs text-cyan-400 font-medium mb-1">Session Summary</p>
                              <p className="text-xs text-cyan-400/70">{activity.session_summary}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
