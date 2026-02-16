import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Bug, ExternalLink, Monitor, MapPin, Clock, User, ChevronDown, RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BugReport {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  screenshot_url: string | null;
  page_url: string | null;
  page_route: string | null;
  user_agent: string | null;
  viewport: string | null;
  console_errors: string | null;
  status: string;
  priority: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  resolved: 'bg-green-500/10 text-green-500 border-green-500/30',
  closed: 'bg-muted text-muted-foreground border-border',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  high: 'bg-destructive/10 text-destructive border-destructive/30',
};

const priorityIcons: Record<string, React.ReactNode> = {
  low: <Info className="h-3 w-3" />,
  medium: <AlertTriangle className="h-3 w-3" />,
  high: <AlertTriangle className="h-3 w-3" />,
};

export function BugReportsTab() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Use service role via edge function or direct admin query
      let query = supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReports((data as BugReport[]) || []);
    } catch (err) {
      console.error('Failed to fetch bug reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('bug_reports')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selectedReport?.id === id) {
        setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const openCount = reports.filter(r => r.status === 'open').length;
  const inProgressCount = reports.filter(r => r.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bug className="h-6 w-6 text-destructive" />
            Bug Reports
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            User-submitted bug reports with auto-captured screenshots and metadata
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-border/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{reports.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{openCount}</p>
            <p className="text-xs text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{inProgressCount}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{reports.filter(r => r.status === 'resolved').length}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 rounded-lg bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-border/30">
          <CardContent className="py-12 text-center">
            <Bug className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No bug reports yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="border-border/30 hover:border-border/60 transition-colors cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{report.title}</h3>
                      <Badge variant="outline" className={cn("text-[10px] capitalize", priorityColors[report.priority])}>
                        {priorityIcons[report.priority]}
                        <span className="ml-1">{report.priority}</span>
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] capitalize", statusColors[report.status])}>
                        {report.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {report.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{report.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </span>
                      {report.page_route && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {report.page_route}
                        </span>
                      )}
                      {report.viewport && (
                        <span className="flex items-center gap-1">
                          <Monitor className="h-2.5 w-2.5" />
                          {report.viewport}
                        </span>
                      )}
                    </div>
                  </div>
                  {report.screenshot_url && (
                    <img
                      src={report.screenshot_url}
                      alt="Screenshot"
                      className="w-20 h-14 rounded border border-border/30 object-cover object-top flex-shrink-0"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-destructive" />
                  {selectedReport.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Status & Priority */}
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={cn("capitalize", priorityColors[selectedReport.priority])}>
                    {selectedReport.priority} priority
                  </Badge>
                  <Select
                    value={selectedReport.status}
                    onValueChange={(val) => updateStatus(selectedReport.id, val)}
                  >
                    <SelectTrigger className="w-36 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                {selectedReport.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{selectedReport.description}</p>
                  </div>
                )}

                {/* Screenshot */}
                {selectedReport.screenshot_url && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Screenshot</p>
                    <a href={selectedReport.screenshot_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedReport.screenshot_url}
                        alt="Bug screenshot"
                        className="w-full rounded-lg border border-border/30 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Page</p>
                    <p className="text-xs font-mono truncate">{selectedReport.page_route || 'Unknown'}</p>
                  </div>
                  <div className="rounded-lg border border-border/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Viewport</p>
                    <p className="text-xs font-mono">{selectedReport.viewport || 'Unknown'}</p>
                  </div>
                  <div className="rounded-lg border border-border/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">User ID</p>
                    <p className="text-xs font-mono truncate">{selectedReport.user_id}</p>
                  </div>
                  <div className="rounded-lg border border-border/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-xs">{new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* User Agent */}
                {selectedReport.user_agent && (
                  <div className="rounded-lg border border-border/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">User Agent</p>
                    <p className="text-[10px] font-mono text-muted-foreground break-all">{selectedReport.user_agent}</p>
                  </div>
                )}

                {/* Console Errors */}
                {selectedReport.console_errors && selectedReport.console_errors !== 'None captured' && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-[10px] text-destructive uppercase tracking-wider mb-1">Console Errors</p>
                    <pre className="text-[10px] font-mono text-destructive/80 whitespace-pre-wrap">{selectedReport.console_errors}</pre>
                  </div>
                )}

                {selectedReport.page_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedReport.page_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      Open Page
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default BugReportsTab;
