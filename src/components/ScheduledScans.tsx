import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Calendar, Clock, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduledScan {
  id: string;
  scan_type: 'email' | 'url' | 'document' | 'bulk';
  scan_target: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  schedule_time: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string;
}

export const ScheduledScans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newScan, setNewScan] = useState({
    scan_type: 'url' as const,
    scan_target: '',
    frequency: 'daily' as const,
    schedule_time: '09:00'
  });

  useEffect(() => {
    if (user) {
      loadScheduledScans();
    }
  }, [user]);

  const loadScheduledScans = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_scans')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScheduledScans((data as ScheduledScan[]) || []);
    } catch (error) {
      console.error('Error loading scheduled scans:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduled scans",
        variant: "destructive"
      });
    }
  };

  const createScheduledScan = async () => {
    if (!newScan.scan_target.trim()) {
      toast({
        title: "Error",
        description: "Please provide a scan target",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      
      // Calculate next run time
      const nextRunAt = await supabase.rpc('calculate_next_run', {
        frequency: newScan.frequency,
        schedule_time: newScan.schedule_time
      });

      const { error } = await supabase
        .from('scheduled_scans')
        .insert({
          user_id: user?.id,
          scan_type: newScan.scan_type,
          scan_target: newScan.scan_target,
          frequency: newScan.frequency,
          schedule_time: newScan.schedule_time,
          next_run_at: nextRunAt.data
        });

      if (error) throw error;

      toast({
        title: "Scheduled Scan Created",
        description: `${newScan.frequency} scan scheduled for ${newScan.schedule_time}`
      });

      setNewScan({
        scan_type: 'url',
        scan_target: '',
        frequency: 'daily',
        schedule_time: '09:00'
      });

      await loadScheduledScans();
    } catch (error) {
      console.error('Error creating scheduled scan:', error);
      toast({
        title: "Error",
        description: "Failed to create scheduled scan",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleScan = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_scans')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: isActive ? "Scan Enabled" : "Scan Disabled",
        description: `Scheduled scan has been ${isActive ? 'enabled' : 'disabled'}`
      });

      await loadScheduledScans();
    } catch (error) {
      console.error('Error toggling scan:', error);
      toast({
        title: "Error",
        description: "Failed to update scan status",
        variant: "destructive"
      });
    }
  };

  const deleteScan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_scans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Scan Deleted",
        description: "Scheduled scan has been removed"
      });

      await loadScheduledScans();
    } catch (error) {
      console.error('Error deleting scan:', error);
      toast({
        title: "Error",
        description: "Failed to delete scan",
        variant: "destructive"
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'url': return '🔗';
      case 'document': return '📄';
      case 'bulk': return '📦';
      default: return '🔍';
    }
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-green-100 text-green-800',
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-purple-100 text-purple-800'
    };
    return colors[frequency as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Scheduled Scans</h2>
        <p className="text-muted-foreground">
          Automate your security scans to run on a regular schedule
        </p>
      </div>

      {/* Create New Scheduled Scan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Schedule New Scan
          </CardTitle>
          <CardDescription>
            Set up automated security scans to run on your preferred schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scan-type">Scan Type</Label>
              <Select 
                value={newScan.scan_type} 
                onValueChange={(value) => setNewScan(prev => ({ ...prev, scan_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">URL Scan</SelectItem>
                  <SelectItem value="email">Email Monitor</SelectItem>
                  <SelectItem value="document">Document Check</SelectItem>
                  <SelectItem value="bulk">Bulk Scan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scan-target">Target</Label>
              <Input
                id="scan-target"
                placeholder={
                  newScan.scan_type === 'url' ? 'https://example.com' :
                  newScan.scan_type === 'email' ? 'inbox@company.com' :
                  newScan.scan_type === 'document' ? 'Document path/folder' :
                  'Bulk scan configuration'
                }
                value={newScan.scan_target}
                onChange={(e) => setNewScan(prev => ({ ...prev, scan_target: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select 
                value={newScan.frequency} 
                onValueChange={(value) => setNewScan(prev => ({ ...prev, frequency: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule-time">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={newScan.schedule_time}
                onChange={(e) => setNewScan(prev => ({ ...prev, schedule_time: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            onClick={createScheduledScan} 
            disabled={isCreating}
            className="w-full md:w-auto"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Schedule Scan'}
          </Button>
        </CardContent>
      </Card>

      {/* Scheduled Scans List */}
      <div className="space-y-4">
        {scheduledScans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Scheduled Scans</h3>
              <p className="text-muted-foreground">
                Create your first scheduled scan to automate your security monitoring
              </p>
            </CardContent>
          </Card>
        ) : (
          scheduledScans.map((scan) => (
            <Card key={scan.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getScanTypeIcon(scan.scan_type)}</div>
                    <div>
                      <h3 className="font-semibold capitalize">{scan.scan_type} Scan</h3>
                      <p className="text-sm text-muted-foreground">{scan.scan_target}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getFrequencyBadge(scan.frequency)}>
                          {scan.frequency}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {scan.schedule_time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      {scan.last_run_at && (
                        <p className="text-muted-foreground">
                          Last: {formatDateTime(scan.last_run_at)}
                        </p>
                      )}
                      <p className="font-medium">
                        Next: {formatDateTime(scan.next_run_at)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={scan.is_active}
                        onCheckedChange={(checked) => toggleScan(scan.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteScan(scan.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};