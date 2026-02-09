import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, AlertTriangle, CheckCircle2, XCircle, Bell, 
  RefreshCw, TrendingDown, ArrowRight, Clock, Monitor 
} from 'lucide-react';
import { toast } from 'sonner';

interface DriftEvent {
  id: string;
  deviceName: string;
  baseline: string;
  checkName: string;
  previousState: 'pass' | 'fail';
  currentState: 'pass' | 'fail';
  detectedAt: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoRemediate: boolean;
  cisId?: string;
}

export function ComplianceDriftDetector() {
  const [autoAlert, setAutoAlert] = useState(true);
  const [autoRemediate, setAutoRemediate] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [driftEvents] = useState<DriftEvent[]>([
    {
      id: '1', deviceName: 'WORKSTATION-12', baseline: 'CIS Windows 11', checkName: 'BitLocker Encryption',
      previousState: 'pass', currentState: 'fail', detectedAt: new Date(Date.now() - 3600000).toISOString(),
      severity: 'critical', autoRemediate: false, cisId: '18.9.11.1',
    },
    {
      id: '2', deviceName: 'SERVER-DB-01', baseline: 'CIS Windows Server', checkName: 'Windows Firewall Domain Profile',
      previousState: 'pass', currentState: 'fail', detectedAt: new Date(Date.now() - 7200000).toISOString(),
      severity: 'high', autoRemediate: true, cisId: '9.1.1',
    },
    {
      id: '3', deviceName: 'LAPTOP-EXEC-03', baseline: 'CIS Windows 11', checkName: 'Password Minimum Length',
      previousState: 'pass', currentState: 'fail', detectedAt: new Date(Date.now() - 14400000).toISOString(),
      severity: 'medium', autoRemediate: true, cisId: '1.1.4',
    },
    {
      id: '4', deviceName: 'WORKSTATION-08', baseline: 'CIS Windows 11', checkName: 'NLA for RDP',
      previousState: 'pass', currentState: 'fail', detectedAt: new Date(Date.now() - 28800000).toISOString(),
      severity: 'high', autoRemediate: false, cisId: '18.9.65.3.9.2',
    },
  ]);

  const handleScan = () => {
    setIsScanning(true);
    toast.info('Running compliance drift detection across all endpoints...');
    setTimeout(() => {
      setIsScanning(false);
      toast.success('Drift scan complete. Found 4 configuration changes.');
    }, 3000);
  };

  const handleRemediate = (event: DriftEvent) => {
    toast.success(`Auto-remediation triggered for ${event.checkName} on ${event.deviceName}`);
  };

  const severityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };
    return <Badge className={colors[severity]}>{severity}</Badge>;
  };

  const criticalCount = driftEvents.filter(e => e.severity === 'critical').length;
  const highCount = driftEvents.filter(e => e.severity === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingDown className="h-6 w-6" />
            Compliance Drift Detection
          </h2>
          <p className="text-muted-foreground">Monitor devices falling out of baseline compliance</p>
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
          <CardDescription>Devices that changed from passing to failing compliance checks</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
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
                        <span className="font-medium">{event.deviceName}</span>
                        {event.cisId && <Badge variant="outline" className="text-xs">{event.cisId}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{event.checkName} — {event.baseline}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Detected {new Date(event.detectedAt).toLocaleString()}
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
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
