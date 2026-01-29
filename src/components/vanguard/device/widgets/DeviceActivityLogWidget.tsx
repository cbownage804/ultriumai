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
        return <Badge className="bg-green-100 text-green-700 border-green-200">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Activity log</CardTitle>
        <p className="text-xs text-gray-400">
          Scripts, software updates, patches, remote access, and shutdown actions
        </p>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            <div className="space-y-3">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {getTypeIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">
                            {format(new Date(activity.timestamp), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          {activity.technician && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">by {activity.technician}</span>
                            </>
                          )}
                          {activity.duration && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{activity.duration}s</span>
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
                        className="mt-2 text-xs text-gray-500 p-0 h-auto"
                        onClick={() => toggleExpand(activity.id)}
                      >
                        {expandedItems.has(activity.id) ? (
                          <><ChevronUp className="h-3 w-3 mr-1" /> Hide details</>
                        ) : (
                          <><ChevronDown className="h-3 w-3 mr-1" /> Show details</>
                        )}
                      </Button>
                      
                      {expandedItems.has(activity.id) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                          {activity.details && (
                            <p className="text-xs text-gray-600">{activity.details}</p>
                          )}
                          
                          {activity.output && (
                            <div className="bg-gray-900 text-green-400 text-xs p-2 rounded font-mono overflow-x-auto">
                              <pre>{activity.output}</pre>
                            </div>
                          )}
                          
                          {activity.session_summary && (
                            <div className="bg-teal-50 border border-teal-100 rounded p-2">
                              <p className="text-xs text-teal-700 font-medium mb-1">Session Summary</p>
                              <p className="text-xs text-teal-600">{activity.session_summary}</p>
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
