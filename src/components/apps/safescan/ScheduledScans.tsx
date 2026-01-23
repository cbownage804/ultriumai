import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, Clock, Plus, Play, Pause, Trash2, 
  RefreshCw, Bell, Loader2, CheckCircle, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

interface ScheduledScan {
  id: string;
  name: string;
  scan_type: 'url' | 'email_domain';
  targets: string[];
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  is_active: boolean;
  last_run: string | null;
  next_run: string;
  notify_on_threat: boolean;
  notify_email: string | null;
  created_at: string;
}

interface ScheduledScansProps {
  userId: string;
}

export function ScheduledScans({ userId }: ScheduledScansProps) {
  const { toast } = useToast();
  const [scans, setScans] = useState<ScheduledScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  
  // Form state
  const [newScan, setNewScan] = useState({
    name: '',
    scan_type: 'url' as 'url' | 'email_domain',
    targets: '',
    frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    notify_on_threat: true,
    notify_email: ''
  });

  useEffect(() => {
    loadScheduledScans();
  }, [userId]);

  const loadScheduledScans = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('safescan-scheduled', {
        body: { action: 'list', user_id: userId }
      });

      if (error) throw error;
      setScans(data.scheduled_scans || []);
    } catch (error: any) {
      console.error('Failed to load scheduled scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newScan.name.trim() || !newScan.targets.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter a name and at least one target",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const targets = newScan.targets.split('\n').map(t => t.trim()).filter(t => t);
      
      const { data, error } = await supabase.functions.invoke('safescan-scheduled', {
        body: {
          action: 'create',
          user_id: userId,
          name: newScan.name,
          scan_type: newScan.scan_type,
          targets,
          frequency: newScan.frequency,
          notify_on_threat: newScan.notify_on_threat,
          notify_email: newScan.notify_email || null
        }
      });

      if (error) throw error;

      setScans(prev => [data.scheduled_scan, ...prev]);
      setDialogOpen(false);
      setNewScan({
        name: '',
        scan_type: 'url',
        targets: '',
        frequency: 'daily',
        notify_on_threat: true,
        notify_email: ''
      });

      toast({
        title: "Scheduled scan created",
        description: `"${newScan.name}" will run ${newScan.frequency}`
      });
    } catch (error: any) {
      toast({
        title: "Failed to create scan",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (scan: ScheduledScan) => {
    try {
      const { error } = await supabase.functions.invoke('safescan-scheduled', {
        body: {
          action: 'update',
          id: scan.id,
          user_id: userId,
          is_active: !scan.is_active
        }
      });

      if (error) throw error;

      setScans(prev => prev.map(s => 
        s.id === scan.id ? { ...s, is_active: !s.is_active } : s
      ));

      toast({
        title: scan.is_active ? "Scan paused" : "Scan activated",
        description: `"${scan.name}" is now ${scan.is_active ? 'paused' : 'active'}`
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRunNow = async (scan: ScheduledScan) => {
    setRunningId(scan.id);
    try {
      const { data, error } = await supabase.functions.invoke('safescan-scheduled', {
        body: {
          action: 'run',
          id: scan.id,
          user_id: userId
        }
      });

      if (error) throw error;

      toast({
        title: "Scan complete",
        description: `Found ${data.summary.threats} threats in ${data.summary.total} targets`
      });

      loadScheduledScans();
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (scan: ScheduledScan) => {
    try {
      const { error } = await supabase.functions.invoke('safescan-scheduled', {
        body: {
          action: 'delete',
          id: scan.id,
          user_id: userId
        }
      });

      if (error) throw error;

      setScans(prev => prev.filter(s => s.id !== scan.id));
      toast({
        title: "Scan deleted",
        description: `"${scan.name}" has been removed`
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const frequencyLabel = {
    hourly: 'Every hour',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  };

  if (loading) {
    return (
      <Card className="bg-[#141414] border-red-500/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-red-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#141414] border-red-500/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-red-400" />
            Scheduled Scans
          </CardTitle>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#141414] border-red-500/20">
              <DialogHeader>
                <DialogTitle className="text-white">Create Scheduled Scan</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Name</Label>
                  <Input
                    value={newScan.name}
                    onChange={(e) => setNewScan(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My URL Monitor"
                    className="bg-[#0f0f0f] border-red-500/20 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Scan Type</Label>
                    <Select
                      value={newScan.scan_type}
                      onValueChange={(v) => setNewScan(prev => ({ ...prev, scan_type: v as any }))}
                    >
                      <SelectTrigger className="bg-[#0f0f0f] border-red-500/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="url">URL Scan</SelectItem>
                        <SelectItem value="email_domain">Domain Monitor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Frequency</Label>
                    <Select
                      value={newScan.frequency}
                      onValueChange={(v) => setNewScan(prev => ({ ...prev, frequency: v as any }))}
                    >
                      <SelectTrigger className="bg-[#0f0f0f] border-red-500/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">
                    {newScan.scan_type === 'url' ? 'URLs to monitor' : 'Domains to monitor'} (one per line)
                  </Label>
                  <Textarea
                    value={newScan.targets}
                    onChange={(e) => setNewScan(prev => ({ ...prev, targets: e.target.value }))}
                    placeholder={newScan.scan_type === 'url' 
                      ? "https://example.com\nhttps://mysite.com" 
                      : "example.com\nmycompany.com"}
                    rows={4}
                    className="bg-[#0f0f0f] border-red-500/20 text-white font-mono text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newScan.notify_on_threat}
                      onCheckedChange={(v) => setNewScan(prev => ({ ...prev, notify_on_threat: v }))}
                    />
                    <Label className="text-gray-300 text-sm">Notify on threats</Label>
                  </div>
                </div>

                {newScan.notify_on_threat && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Notification email</Label>
                    <Input
                      value={newScan.notify_email}
                      onChange={(e) => setNewScan(prev => ({ ...prev, notify_email: e.target.value }))}
                      placeholder="alerts@yourcompany.com"
                      className="bg-[#0f0f0f] border-red-500/20 text-white"
                    />
                  </div>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {scans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No scheduled scans yet</p>
            <p className="text-xs mt-1">Create one to automatically monitor URLs or domains</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className={`p-3 rounded-lg bg-[#0f0f0f] border transition-colors ${
                    scan.is_active ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white text-sm">{scan.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                          {scan.scan_type === 'url' ? 'URL' : 'Domain'}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                          {frequencyLabel[scan.frequency]}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {scan.targets.length} target{scan.targets.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <Switch
                      checked={scan.is_active}
                      onCheckedChange={() => handleToggle(scan)}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      {scan.last_run && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Last: {format(new Date(scan.last_run), 'MMM d, h:mm a')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Next: {format(new Date(scan.next_run), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-white"
                        onClick={() => handleRunNow(scan)}
                        disabled={runningId === scan.id}
                      >
                        {runningId === scan.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-400"
                        onClick={() => handleDelete(scan)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
