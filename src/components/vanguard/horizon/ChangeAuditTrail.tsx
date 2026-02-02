import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  History,
  Search,
  RefreshCw,
  Loader2,
  Download,
  User,
  Monitor,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  timestamp: Date;
  user: string;
  device: string;
  action: string;
  category: 'remote_access' | 'script_execution' | 'software' | 'configuration' | 'security';
  details: string;
  result: 'success' | 'failed';
  ipAddress: string;
}

interface ChangeAuditTrailProps {
  agents: any[];
}

export function ChangeAuditTrail({ agents }: ChangeAuditTrailProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadAuditLog();
  }, []);

  const loadAuditLog = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockEntries: AuditEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000),
        user: 'admin@company.com',
        device: 'WORKSTATION-01',
        action: 'Remote Script Execution',
        category: 'script_execution',
        details: 'Executed: Get-Process | Select-Object -First 10',
        result: 'success',
        ipAddress: '192.168.1.100',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 900000),
        user: 'tech@company.com',
        device: 'LAPTOP-02',
        action: 'Software Installation',
        category: 'software',
        details: 'Installed: Google Chrome via Chocolatey',
        result: 'success',
        ipAddress: '192.168.1.105',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1800000),
        user: 'admin@company.com',
        device: 'SERVER-01',
        action: 'Service Restart',
        category: 'configuration',
        details: 'Restarted: Print Spooler (Spooler)',
        result: 'success',
        ipAddress: '192.168.1.100',
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 3600000),
        user: 'tech@company.com',
        device: 'WORKSTATION-03',
        action: 'Firewall Rule Added',
        category: 'security',
        details: 'Added inbound rule: Allow RDP (TCP 3389)',
        result: 'success',
        ipAddress: '192.168.1.105',
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 7200000),
        user: 'admin@company.com',
        device: 'LAPTOP-04',
        action: 'Remote Access Session',
        category: 'remote_access',
        details: 'RustDesk session initiated, duration: 15 minutes',
        result: 'success',
        ipAddress: '192.168.1.100',
      },
      {
        id: '6',
        timestamp: new Date(Date.now() - 10800000),
        user: 'tech@company.com',
        device: 'WORKSTATION-01',
        action: 'Registry Modification',
        category: 'configuration',
        details: 'Modified: HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows Defender',
        result: 'failed',
        ipAddress: '192.168.1.105',
      },
    ];
    
    setEntries(mockEntries);
    setIsLoading(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'remote_access': return <Monitor className="h-4 w-4" />;
      case 'script_execution': return <Settings className="h-4 w-4" />;
      case 'software': return <Settings className="h-4 w-4" />;
      case 'configuration': return <Settings className="h-4 w-4" />;
      case 'security': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      remote_access: 'Remote Access',
      script_execution: 'Script Execution',
      software: 'Software',
      configuration: 'Configuration',
      security: 'Security',
    };
    return labels[category] || category;
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = 
      e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const exportAuditLog = () => {
    const csv = [
      'Timestamp,User,Device,Action,Category,Details,Result,IP Address',
      ...entries.map(e => 
        `"${e.timestamp.toISOString()}","${e.user}","${e.device}","${e.action}","${e.category}","${e.details}","${e.result}","${e.ipAddress}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Change Audit Trail
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportAuditLog}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={loadAuditLog} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="remote_access">Remote Access</SelectItem>
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {format(entry.timestamp, 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{entry.user.split('@')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{entry.device}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{entry.action}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {entry.details}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {getCategoryIcon(entry.category)}
                        {getCategoryLabel(entry.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.result === 'success' ? (
                        <Badge className="bg-green-500">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
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
