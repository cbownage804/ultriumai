import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface EventLog {
  id: string;
  level: 'error' | 'warning' | 'information' | 'critical';
  source: string;
  eventId: number;
  message: string;
  timestamp: Date;
  category?: string;
  user?: string;
  computer?: string;
}

interface EventViewerProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

export function EventViewer({ agentId, sendCommand }: EventViewerProps) {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logType, setLogType] = useState<'all' | 'Application' | 'System' | 'Security'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'error' | 'warning' | 'information' | 'critical'>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventLog | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<Date | null>(null);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const result = await sendCommand('get_event_logs', { 
        logName: logType === 'all' ? undefined : logType,
        level: levelFilter === 'all' ? undefined : levelFilter,
        limit: 100
      });
      if (result?.events) {
        setEvents(result.events.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        })));
        setLastLoadTime(new Date());
      } else if (result?.pending) {
        // Command queued but agent offline
        toast.info('Command queued - waiting for agent response');
      }
    } catch (err) {
      // No data - show empty state
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load on mount
  useEffect(() => {
    loadEvents();
  }, [agentId]);

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLog = logType === 'all' || e.category === logType;
    const matchesLevel = levelFilter === 'all' || e.level === levelFilter;
    return matchesSearch && matchesLog && matchesLevel;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-red-600 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-black',
      information: 'bg-blue-500 text-white',
    };
    return <Badge className={variants[level] || 'bg-gray-500'}>{level}</Badge>;
  };

  const exportEvents = () => {
    const csv = [
      ['Timestamp', 'Level', 'Source', 'Event ID', 'Message'],
      ...filteredEvents.map(e => [
        e.timestamp.toISOString(),
        e.level,
        e.source,
        e.eventId.toString(),
        `"${e.message.replace(/"/g, '""')}"`
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${agentId}-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Events exported');
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Event Viewer
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportEvents}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={loadEvents} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={logType} onValueChange={(v: any) => setLogType(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Log type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="Application">Application</SelectItem>
                <SelectItem value="System">System</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={(v: any) => setLevelFilter(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="information">Information</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Event ID</TableHead>
                    <TableHead className="max-w-[400px]">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow 
                      key={event.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <TableCell>{getLevelIcon(event.level)}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(event.timestamp, 'MMM dd HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{event.source}</TableCell>
                      <TableCell className="font-mono text-sm">{event.eventId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[400px]">
                        {event.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getLevelIcon(selectedEvent.level)}
              Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Level:</span>
                  <span className="ml-2">{getLevelBadge(selectedEvent.level)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Event ID:</span>
                  <span className="ml-2 font-mono">{selectedEvent.eventId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Source:</span>
                  <span className="ml-2">{selectedEvent.source}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <span className="ml-2">{selectedEvent.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <span className="ml-2">{format(selectedEvent.timestamp, 'PPpp')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">User:</span>
                  <span className="ml-2">{selectedEvent.user || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Message:</span>
                <div className="mt-1 p-3 bg-muted rounded-lg font-mono text-sm whitespace-pre-wrap">
                  {selectedEvent.message}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
