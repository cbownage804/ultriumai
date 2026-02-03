import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, RefreshCw, AlertTriangle, CheckCircle, Clock, History, Shield } from "lucide-react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";

interface PendingUpdate {
  title: string;
  kb_number?: string;
  severity?: 'Critical' | 'Important' | 'Moderate' | 'Low' | 'Unknown';
  category?: string;
  size_mb?: number;
  download_url?: string;
  is_downloaded?: boolean;
  is_mandatory?: boolean;
  release_date?: string;
}

interface InstalledUpdate {
  title: string;
  kb_number?: string;
  installed_date?: string;
  result?: 'Succeeded' | 'Failed' | 'Unknown';
  category?: string;
}

interface DeviceUpdatesTabProps {
  agent: VanguardAgent;
  onInstallUpdate?: (kbNumber: string) => Promise<void>;
  onInstallAll?: () => Promise<void>;
}

export function DeviceUpdatesTab({ agent, onInstallUpdate, onInstallAll }: DeviceUpdatesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  // Get pending updates from agent config
  const pendingUpdates: PendingUpdate[] = useMemo(() => {
    return (agent.config as any)?.pending_updates || [];
  }, [agent.config]);

  // Get update history from agent config
  const updateHistory: InstalledUpdate[] = useMemo(() => {
    const history = (agent.config as any)?.update_history || [];
    return history.sort((a: InstalledUpdate, b: InstalledUpdate) => {
      if (!a.installed_date || !b.installed_date) return 0;
      return new Date(b.installed_date).getTime() - new Date(a.installed_date).getTime();
    });
  }, [agent.config]);

  const filteredUpdates = useMemo(() => {
    if (!searchQuery.trim()) return pendingUpdates;
    const query = searchQuery.toLowerCase();
    return pendingUpdates.filter(
      (u) =>
        u.title?.toLowerCase().includes(query) ||
        u.kb_number?.toLowerCase().includes(query) ||
        u.category?.toLowerCase().includes(query)
    );
  }, [pendingUpdates, searchQuery]);

  const filteredHistory = useMemo(() => {
    if (!historySearchQuery.trim()) return updateHistory;
    const query = historySearchQuery.toLowerCase();
    return updateHistory.filter(
      (u) =>
        u.title?.toLowerCase().includes(query) ||
        u.kb_number?.toLowerCase().includes(query) ||
        u.category?.toLowerCase().includes(query)
    );
  }, [updateHistory, historySearchQuery]);

  const severityCounts = useMemo(() => {
    return pendingUpdates.reduce((acc, u) => {
      const sev = u.severity || 'Unknown';
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [pendingUpdates]);

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'Critical':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Critical</Badge>;
      case 'Important':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Important</Badge>;
      case 'Moderate':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Moderate</Badge>;
      case 'Low':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Low</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Unknown</Badge>;
    }
  };

  const getResultBadge = (result?: string) => {
    switch (result) {
      case 'Succeeded':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'Failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Unknown</Badge>;
    }
  };

  const handleInstallAll = async () => {
    if (!onInstallAll) {
      toast.info("Install functionality will send command to agent");
      return;
    }
    setIsInstalling(true);
    try {
      await onInstallAll();
      toast.success("Install command sent to agent");
    } catch (err) {
      toast.error("Failed to send install command");
    } finally {
      setIsInstalling(false);
    }
  };

  const lastUpdateCheck = (agent.config as any)?.last_update_check;

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Windows Updates
          </CardTitle>
          {lastUpdateCheck && (
            <span className="text-xs text-slate-500">
              Last check: {new Date(lastUpdateCheck).toLocaleString()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 mb-4">
            <TabsTrigger value="pending" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <Clock className="h-4 w-4 mr-2" />
              Pending
              {pendingUpdates.length > 0 && (
                <Badge className="ml-2 bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                  {pendingUpdates.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              <History className="h-4 w-4 mr-2" />
              History
              {updateHistory.length > 0 && (
                <Badge className="ml-2 bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                  {updateHistory.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0">
            {pendingUpdates.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-2">System is up to date</p>
                <p className="text-xs text-slate-500">No pending updates found</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-2 flex-wrap">
                    {severityCounts.Critical && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        {severityCounts.Critical} Critical
                      </Badge>
                    )}
                    {severityCounts.Important && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        {severityCounts.Important} Important
                      </Badge>
                    )}
                    {severityCounts.Moderate && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        {severityCounts.Moderate} Moderate
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleInstallAll}
                    disabled={isInstalling}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    {isInstalling ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Install All
                  </Button>
                </div>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search updates by title, KB number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-cyan-500/20 text-white placeholder:text-slate-500"
                  />
                </div>

                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-cyan-500/20 hover:bg-transparent">
                        <TableHead className="text-cyan-400">Update</TableHead>
                        <TableHead className="text-cyan-400">KB</TableHead>
                        <TableHead className="text-cyan-400">Severity</TableHead>
                        <TableHead className="text-cyan-400">Category</TableHead>
                        <TableHead className="text-cyan-400">Size</TableHead>
                        <TableHead className="text-cyan-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUpdates.map((update, i) => (
                        <TableRow key={`${update.kb_number}-${i}`} className="border-cyan-500/10 hover:bg-cyan-500/5">
                          <TableCell>
                            <div className="font-medium text-slate-200 max-w-[300px] truncate" title={update.title}>
                              {update.title}
                            </div>
                            {update.release_date && (
                              <div className="text-xs text-slate-500">
                                Released: {new Date(update.release_date).toLocaleDateString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-400">
                            {update.kb_number || '-'}
                          </TableCell>
                          <TableCell>
                            {getSeverityBadge(update.severity)}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {update.category || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {update.size_mb ? `${update.size_mb.toFixed(1)} MB` : '-'}
                          </TableCell>
                          <TableCell>
                            {update.is_downloaded ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ready
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredUpdates.length === 0 && searchQuery && (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No updates matching "{searchQuery}"</p>
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {updateHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 mb-2">No update history available</p>
                <p className="text-xs text-slate-500">
                  Update history is collected during agent telemetry sync
                </p>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search history by title, KB number..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-cyan-500/20 text-white placeholder:text-slate-500"
                  />
                </div>

                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-cyan-500/20 hover:bg-transparent">
                        <TableHead className="text-cyan-400">Update</TableHead>
                        <TableHead className="text-cyan-400">KB</TableHead>
                        <TableHead className="text-cyan-400">Category</TableHead>
                        <TableHead className="text-cyan-400">Installed</TableHead>
                        <TableHead className="text-cyan-400">Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((update, i) => (
                        <TableRow key={`${update.kb_number}-${i}`} className="border-cyan-500/10 hover:bg-cyan-500/5">
                          <TableCell>
                            <div className="font-medium text-slate-200 max-w-[300px] truncate" title={update.title}>
                              {update.title}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-400">
                            {update.kb_number || '-'}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {update.category || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {update.installed_date ? new Date(update.installed_date).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {getResultBadge(update.result)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredHistory.length === 0 && historySearchQuery && (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">No history matching "{historySearchQuery}"</p>
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
