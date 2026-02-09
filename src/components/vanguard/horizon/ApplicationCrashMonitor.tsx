import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertOctagon, Search, RefreshCw, Loader2, Monitor, Clock, Download, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationCrashMonitorProps {
  agents: any[];
}

export function ApplicationCrashMonitor({ agents }: ApplicationCrashMonitorProps) {
  const [crashes, setCrashes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCrashData();
  }, [agents]);

  const loadCrashData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data, error } = await supabase
        .from('application_crashes')
        .select('*')
        .eq('user_id', user.id)
        .order('crash_time', { ascending: false })
        .limit(50);

      if (!error) setCrashes(data || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const exportCrashLog = () => {
    const csv = [
      'Application,Device,Error Type,Time,Occurrences,Message',
      ...crashes.map(c =>
        `"${c.application}","${c.device_name}","${c.error_type}","${c.crash_time}","${c.occurrences}","${c.error_message || ''}"`
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crash-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Crash log exported');
  };

  const filteredCrashes = crashes.filter(c =>
    (c.application || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.device_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.error_type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCrashes = crashes.reduce((acc, c) => acc + (c.occurrences || 1), 0);
  const affectedDevices = new Set(crashes.map(c => c.agent_id || c.device_name)).size;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-destructive" />
            Application Crash Monitor
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="destructive">{totalCrashes} crashes</Badge>
            <Badge variant="outline">{affectedDevices} devices affected</Badge>
            <Button variant="outline" size="sm" onClick={exportCrashLog}>
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
            <Button variant="outline" size="sm" onClick={loadCrashData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search crashes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filteredCrashes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertOctagon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No application crashes detected</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Error Type</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Occurrences</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCrashes.map((crash) => (
                  <TableRow key={crash.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-destructive" />
                        <div>
                          <div className="font-medium">{crash.application}</div>
                          <div className="text-xs text-muted-foreground">v{crash.version || '?'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        {crash.device_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{crash.error_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(crash.crash_time), 'MMM d, HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={(crash.occurrences || 1) > 3 ? 'destructive' : 'secondary'}>
                        {crash.occurrences || 1}x
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
