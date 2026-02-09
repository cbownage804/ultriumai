import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, Target, AlertTriangle, Shield, Activity, 
  FileSearch, Clock, Play, Pause, Eye, Download,
  Crosshair, Skull, Bug, Network, Loader2, Plus, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useThreatHunts } from '@/hooks/useHorizon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ThreatHuntingDashboard: React.FC = () => {
  const { toast } = useToast();
  const { hunts, isLoading, createHunt, startHunt, refetch } = useThreatHunts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [customIoc, setCustomIoc] = useState('');
  const [newHuntName, setNewHuntName] = useState('');
  const [newHuntType, setNewHuntType] = useState<'ioc' | 'behavioral' | 'memory' | 'network'>('ioc');

  // Derive stats from live hunt data
  const stats = useMemo(() => {
    const totalFindings = hunts.reduce((sum, h) => sum + (h.results_count || 0), 0);
    const runningHunts = hunts.filter(h => h.status === 'running').length;
    const completedHunts = hunts.filter(h => h.status === 'completed').length;
    const criticalFindings = hunts.reduce((sum, h) => {
      const findings = h.findings || [];
      return sum + findings.filter((f: any) => f?.severity === 'critical').length;
    }, 0);
    return { totalHunts: hunts.length, totalFindings, runningHunts, completedHunts, criticalFindings };
  }, [hunts]);

  // Filter hunts
  const filteredHunts = useMemo(() =>
    hunts.filter(h =>
      (selectedType === 'all' || h.hunt_type === selectedType) &&
      (h.hunt_name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  [hunts, selectedType, searchQuery]);

  const handleCreateHunt = async () => {
    if (!newHuntName.trim()) return;
    try {
      await createHunt({
        hunt_name: newHuntName,
        hunt_type: newHuntType,
        query_parameters: customIoc ? { ioc_values: customIoc.split('\n').filter(Boolean) } : {},
      });
      setNewHuntName('');
      setCustomIoc('');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create hunt', variant: 'destructive' });
    }
  };

  const handleStartHunt = async (huntId: string) => {
    try {
      await startHunt(huntId);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to start hunt', variant: 'destructive' });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };
    return <Badge className={variants[severity] || ''}>{severity}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      running: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return <Badge className={map[status] || ''}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Crosshair className="h-6 w-6" />
            Threat Hunting
          </h2>
          <p className="text-muted-foreground">Proactive threat detection and IOC searches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hunts</p>
                <p className="text-2xl font-bold">{stats.totalHunts}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Findings</p>
                <p className="text-2xl font-bold text-red-500">{stats.totalFindings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Running</p>
                <p className="text-2xl font-bold">{stats.runningHunts}</p>
              </div>
              <Activity className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Findings</p>
                <p className="text-2xl font-bold text-red-500">{stats.criticalFindings}</p>
              </div>
              <Skull className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hunts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hunts">Threat Hunts</TabsTrigger>
          <TabsTrigger value="create">Create Hunt</TabsTrigger>
        </TabsList>

        <TabsContent value="hunts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Threat Hunts</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="ioc">IOC</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search hunts..." 
                      className="pl-8 w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {filteredHunts.length > 0 ? (
                  <div className="space-y-3">
                    {filteredHunts.map((hunt) => (
                      <div key={hunt.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{hunt.hunt_name}</h4>
                            {getStatusBadge(hunt.status)}
                            <Badge variant="outline" className="text-xs">{hunt.hunt_type}</Badge>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Created: {new Date(hunt.created_at).toLocaleDateString()}</span>
                            {hunt.started_at && <span>Started: {new Date(hunt.started_at).toLocaleString()}</span>}
                            {hunt.completed_at && <span>Completed: {new Date(hunt.completed_at).toLocaleString()}</span>}
                          </div>
                          {hunt.results_count > 0 && (
                            <p className="text-sm text-red-400 mt-1">{hunt.results_count} finding(s)</p>
                          )}
                          {hunt.findings && hunt.findings.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {(hunt.findings as any[]).slice(0, 3).map((f: any, i: number) => (
                                <div key={i} className="text-xs p-2 bg-muted/20 rounded flex items-center gap-2">
                                  {f.severity && getSeverityBadge(f.severity)}
                                  <span className="font-mono">{f.value || f.description || JSON.stringify(f)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {(hunt.status === 'pending' || hunt.status === 'completed') && (
                            <Button size="sm" onClick={() => handleStartHunt(hunt.id)}>
                              <Play className="h-4 w-4 mr-1" />
                              {hunt.status === 'completed' ? 'Re-run' : 'Start'}
                            </Button>
                          )}
                          {hunt.status === 'running' && (
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse">
                              Running...
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Crosshair className="h-12 w-12 mb-3 opacity-50" />
                    <p className="font-medium">No threat hunts yet</p>
                    <p className="text-sm">Create your first hunt to start proactive threat detection</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Threat Hunt</CardTitle>
              <CardDescription>Define a hunt with IOCs or behavioral queries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hunt Name</Label>
                  <Input 
                    placeholder="e.g., Emotet IOC Sweep" 
                    value={newHuntName}
                    onChange={(e) => setNewHuntName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hunt Type</Label>
                  <Select value={newHuntType} onValueChange={(v: any) => setNewHuntType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ioc">IOC Search</SelectItem>
                      <SelectItem value="behavioral">Behavioral Analysis</SelectItem>
                      <SelectItem value="memory">Memory Scan</SelectItem>
                      <SelectItem value="network">Network Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>IOC Values / Query Parameters (one per line)</Label>
                <Textarea 
                  placeholder="Enter IOC values, hashes, IPs, domains..."
                  className="font-mono"
                  rows={6}
                  value={customIoc}
                  onChange={(e) => setCustomIoc(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateHunt} disabled={!newHuntName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Hunt
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
