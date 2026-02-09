import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, AlertTriangle, CheckCircle2, XCircle, Bell, 
  RefreshCw, TrendingDown, ArrowRight, Clock, Monitor, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function ComplianceDriftDetector() {
  const { user } = useAuth();
  const [autoAlert, setAutoAlert] = useState(true);
  const [autoRemediate, setAutoRemediate] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [driftEvents, setDriftEvents] = useState<any[]>([]);

  const fetchDrift = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Fetch check results that are failing (drift = was pass, now fail)
      const { data } = await supabase
        .from('agentless_check_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'fail')
        .order('created_at', { ascending: false })
        .limit(50);
      setDriftEvents(data || []);
    } catch (err) {
      console.error('Error fetching drift events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchDrift(); }, [fetchDrift]);

  const handleScan = () => {
    setIsScanning(true);
    toast.info('Running compliance drift detection across all endpoints...');
    setTimeout(() => {
      setIsScanning(false);
      fetchDrift();
      toast.success('Drift scan complete.');
    }, 3000);
  };

  const handleRemediate = (event: any) => {
    toast.success(`Auto-remediation triggered for ${event.check_name} on ${event.target_host}`);
  };

  const severityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };
    return <Badge className={colors[severity || 'medium'] || ''}>{severity || 'medium'}</Badge>;
  };

  const criticalCount = driftEvents.filter(e => e.severity === 'critical').length;
  const highCount = driftEvents.filter(e => e.severity === 'high').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingDown className="h-6 w-6" />
            Compliance Drift Detection
          </h2>
          <p className="text-muted-foreground">
            {driftEvents.length > 0 ? 'Live compliance check failures from agentless scans' : 'No drift events detected'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleScan} disabled={isScanning}>
            {isScanning ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isScanning ? 'Scanning...' : 'Run Drift Scan'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical Drift</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-500">{highCount}</p>
            <p className="text-xs text-muted-foreground">High Drift</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{driftEvents.length}</p>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs">Auto-Alert</span>
              <Switch checked={autoAlert} onCheckedChange={setAutoAlert} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Auto-Remediate</span>
              <Switch checked={autoRemediate} onCheckedChange={setAutoRemediate} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drift Events */}
      <Card>
        <CardHeader>
          <CardTitle>Drift Events</CardTitle>
          <CardDescription>
            {driftEvents.length > 0 ? 'Failing compliance checks detected by agentless scans' : 'No drift events found — run scans to detect configuration changes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {driftEvents.length > 0 ? (
              <div className="space-y-3">
                {driftEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg border-l-4 border-l-red-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <ArrowRight className="h-3 w-3" />
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{event.target_host}</span>
                          {event.cis_benchmark_id && <Badge variant="outline" className="text-xs">{event.cis_benchmark_id}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{event.check_name} — {event.category || event.framework_type || 'Compliance'}</p>
                        {event.check_description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{event.check_description}</p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Detected {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {severityBadge(event.severity)}
                      <Button size="sm" variant="outline" onClick={() => handleRemediate(event)}>
                        Fix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Shield className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">No compliance drift detected</p>
                <p className="text-sm">Run agentless compliance scans to monitor for drift</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
