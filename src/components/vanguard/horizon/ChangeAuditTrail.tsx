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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  History, Search, RefreshCw, Loader2, Download, User, Monitor, Settings, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ChangeAuditTrailProps {
  agents: any[];
}

export function ChangeAuditTrail({ agents }: ChangeAuditTrailProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => { loadAuditLog(); }, []);

  const loadAuditLog = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data } = await supabase
        .from('atlas_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      setEntries((data || []).map(e => ({
        id: e.id,
        timestamp: new Date(e.created_at),
        user: e.user_id?.slice(0, 8) + '...',
        device: e.resource_name || e.resource_id?.slice(0, 12),
        action: e.action,
        category: e.resource_type === 'security' ? 'security' : e.resource_type === 'script' ? 'script_execution' : e.resource_type === 'software' ? 'software' : 'configuration',
        details: JSON.stringify(e.changes || e.new_values || {}).slice(0, 100),
        result: 'success',
        ipAddress: e.ip_address || '',
      })));
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'remote_access': return <Monitor className="h-4 w-4" />;
      case 'security': return <AlertTriangle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = { remote_access: 'Remote Access', script_execution: 'Script Execution', software: 'Software', configuration: 'Configuration', security: 'Security' };
    return labels[category] || category;
  };

  const filtered = entries.filter(e => {
    const matchesSearch = e.action.toLowerCase().includes(searchQuery.toLowerCase()) || (e.device || '').toLowerCase().includes(searchQuery.toLowerCase()) || (e.details || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const exportAuditLog = () => {
    const csv = ['Timestamp,User,Device,Action,Category,Details,Result', ...entries.map(e => `"${e.timestamp.toISOString()}","${e.user}","${e.device}","${e.action}","${e.category}","${e.details}","${e.result}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Change Audit Trail</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportAuditLog}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline" size="sm" onClick={loadAuditLog} disabled={isLoading}><RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh</Button>
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search audit log..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="script_execution">Scripts</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="configuration">Configuration</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>User</TableHead><TableHead>Device</TableHead><TableHead>Action</TableHead><TableHead>Category</TableHead><TableHead>Result</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">{format(entry.timestamp, 'MMM d, HH:mm')}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{entry.user}</span></div></TableCell>
                    <TableCell className="font-medium">{entry.device}</TableCell>
                    <TableCell><div><div className="font-medium text-sm">{entry.action}</div><div className="text-xs text-muted-foreground truncate max-w-[200px]">{entry.details}</div></div></TableCell>
                    <TableCell><Badge variant="outline" className="gap-1">{getCategoryIcon(entry.category)}{getCategoryLabel(entry.category)}</Badge></TableCell>
                    <TableCell><Badge className="bg-green-500">Success</Badge></TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No audit entries found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
