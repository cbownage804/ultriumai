import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Eye,
  Download,
  BarChart3,
  Terminal
} from "lucide-react";

interface ExecutionHistoryRecord {
  id: string;
  scriptName: string;
  scriptId: string;
  agentHostname: string;
  agentId: string;
  clientName: string;
  executedBy: string;
  status: 'completed' | 'failed' | 'timeout' | 'cancelled';
  startedAt: string;
  completedAt: string;
  executionTime: number; // in seconds
  exitCode?: number;
  output?: string;
  errorMessage?: string;
  parameters?: Record<string, any>;
  tags: string[];
}

interface ExecutionHistoryProps {
  records: ExecutionHistoryRecord[];
  onExportHistory: () => void;
  onRetryExecution: (record: ExecutionHistoryRecord) => void;
}

export const ExecutionHistory = ({ records, onExportHistory, onRetryExecution }: ExecutionHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');
  const [selectedRecord, setSelectedRecord] = useState<ExecutionHistoryRecord | null>(null);

  // Filter logic
  const filteredRecords = records.filter(record => {
    const matchesSearch = record.scriptName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.agentHostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.executedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesClient = clientFilter === 'all' || record.clientName === clientFilter;
    
    // Date filtering
    const recordDate = new Date(record.startedAt);
    const now = new Date();
    let matchesDate = true;
    
    switch (dateRange) {
      case '24h':
        matchesDate = (now.getTime() - recordDate.getTime()) <= 24 * 60 * 60 * 1000;
        break;
      case '7d':
        matchesDate = (now.getTime() - recordDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        matchesDate = (now.getTime() - recordDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        break;
      case '90d':
        matchesDate = (now.getTime() - recordDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
        break;
    }
    
    return matchesSearch && matchesStatus && matchesClient && matchesDate;
  });

  const uniqueClients = [...new Set(records.map(r => r.clientName))];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'cancelled': return <Clock className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'failed': return 'destructive';
      case 'timeout': return 'secondary';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Calculate statistics
  const stats = {
    total: filteredRecords.length,
    completed: filteredRecords.filter(r => r.status === 'completed').length,
    failed: filteredRecords.filter(r => r.status === 'failed').length,
    avgDuration: filteredRecords.length > 0 
      ? Math.round(filteredRecords.reduce((sum, r) => sum + r.executionTime, 0) / filteredRecords.length)
      : 0,
    successRate: filteredRecords.length > 0 
      ? Math.round((filteredRecords.filter(r => r.status === 'completed').length / filteredRecords.length) * 100)
      : 0
  };

  const RecordCard = ({ record }: { record: ExecutionHistoryRecord }) => (
    <div className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(record.status)}
          <div>
            <h4 className="font-medium">{record.scriptName}</h4>
            <p className="text-sm text-muted-foreground">
              {record.agentHostname} • {record.clientName} • by {record.executedBy}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <div className="font-medium">{formatDuration(record.executionTime)}</div>
            <div className="text-muted-foreground">{formatDateTime(record.startedAt)}</div>
          </div>
          <Badge variant={getStatusColor(record.status) as any}>
            {record.status}
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {record.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7">
                <Eye className="h-3 w-3 mr-1" />
                Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Execution Details
                </DialogTitle>
                <DialogDescription>
                  {record.scriptName} on {record.agentHostname}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="output">Output</TabsTrigger>
                  <TabsTrigger value="parameters">Parameters</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Status:</strong> 
                      <Badge className="ml-2" variant={getStatusColor(record.status) as any}>
                        {record.status}
                      </Badge>
                    </div>
                    <div><strong>Duration:</strong> {formatDuration(record.executionTime)}</div>
                    <div><strong>Started:</strong> {formatDateTime(record.startedAt)}</div>
                    <div><strong>Completed:</strong> {formatDateTime(record.completedAt)}</div>
                    <div><strong>Executed By:</strong> {record.executedBy}</div>
                    <div><strong>Agent:</strong> {record.agentHostname}</div>
                    <div><strong>Client:</strong> {record.clientName}</div>
                    {record.exitCode !== undefined && (
                      <div><strong>Exit Code:</strong> {record.exitCode}</div>
                    )}
                  </div>
                  
                  {record.errorMessage && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded">
                      <h4 className="font-medium text-red-800 mb-2">Error Details:</h4>
                      <p className="text-sm text-red-700">{record.errorMessage}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="output">
                  <ScrollArea className="h-96 bg-muted p-3 rounded">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {record.output || 'No output available'}
                    </pre>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="parameters">
                  {record.parameters && Object.keys(record.parameters).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(record.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 bg-muted rounded">
                          <span className="font-medium">{key}:</span>
                          <span className="text-muted-foreground">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No parameters were used for this execution.</p>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2">
                {record.status === 'failed' && (
                  <Button variant="outline" onClick={() => onRetryExecution(record)}>
                    Retry Execution
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {record.status === 'failed' && (
            <Button size="sm" variant="outline" className="h-7" onClick={() => onRetryExecution(record)}>
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Execution History
            </CardTitle>
            <CardDescription>
              Complete history of script executions across your infrastructure
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onExportHistory}>
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-muted/50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Executions</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search executions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="timeout">Timeout</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {uniqueClients.map(client => (
                <SelectItem key={client} value={client}>{client}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredRecords.length} executions
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No execution history found matching your filters</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};