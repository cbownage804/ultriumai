import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Link2, AlertTriangle, Shield, Activity, Network, Clock,
  Search, Play, Loader2, Target, Zap, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface CorrelatedThreat {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  confidence: number;
  events: {
    source: 'edr' | 'network' | 'siem' | 'firewall' | 'ids';
    description: string;
    timestamp: string;
    deviceName: string;
  }[];
  mitreAttack: string[];
  recommendation: string;
  status: 'active' | 'investigating' | 'resolved';
}

export function ThreatCorrelationEngine() {
  const [isCorrelating, setIsCorrelating] = useState(false);

  const [threats] = useState<CorrelatedThreat[]>([
    {
      id: '1',
      title: 'Possible Lateral Movement via PsExec + Credential Dumping',
      severity: 'critical',
      confidence: 92,
      events: [
        { source: 'edr', description: 'mimikatz.exe detected on WORKSTATION-05', timestamp: new Date(Date.now() - 1800000).toISOString(), deviceName: 'WORKSTATION-05' },
        { source: 'network', description: 'SMB traffic spike between WORKSTATION-05 and SERVER-DC-01', timestamp: new Date(Date.now() - 1700000).toISOString(), deviceName: 'WORKSTATION-05' },
        { source: 'siem', description: 'Multiple failed auth attempts from WORKSTATION-05', timestamp: new Date(Date.now() - 1600000).toISOString(), deviceName: 'SERVER-DC-01' },
        { source: 'edr', description: 'psexec.exe service installed on SERVER-DB-01', timestamp: new Date(Date.now() - 1500000).toISOString(), deviceName: 'SERVER-DB-01' },
      ],
      mitreAttack: ['T1003', 'T1021.002', 'T1570'],
      recommendation: 'Isolate WORKSTATION-05 immediately. Reset credentials for affected accounts. Investigate SERVER-DB-01 for data exfiltration.',
      status: 'active',
    },
    {
      id: '2',
      title: 'Phishing Campaign with Payload Delivery',
      severity: 'high',
      confidence: 85,
      events: [
        { source: 'network', description: 'DNS query to known malicious domain phish-update.com', timestamp: new Date(Date.now() - 7200000).toISOString(), deviceName: 'LAPTOP-SALES-02' },
        { source: 'edr', description: 'Suspicious Office macro execution', timestamp: new Date(Date.now() - 7100000).toISOString(), deviceName: 'LAPTOP-SALES-02' },
        { source: 'firewall', description: 'Outbound C2 connection blocked to 185.234.72.21', timestamp: new Date(Date.now() - 7000000).toISOString(), deviceName: 'LAPTOP-SALES-02' },
      ],
      mitreAttack: ['T1566.001', 'T1059.005', 'T1071'],
      recommendation: 'Scan all email inboxes for similar phishing emails. Block IOCs at firewall level. Run AV scan on affected device.',
      status: 'investigating',
    },
    {
      id: '3',
      title: 'Anomalous Data Transfer Detected',
      severity: 'medium',
      confidence: 68,
      events: [
        { source: 'network', description: 'Unusual 2.3GB upload to external IP during off-hours', timestamp: new Date(Date.now() - 28800000).toISOString(), deviceName: 'SERVER-FILE-01' },
        { source: 'ids', description: 'IDS alert: potential data exfiltration pattern', timestamp: new Date(Date.now() - 28700000).toISOString(), deviceName: 'SERVER-FILE-01' },
      ],
      mitreAttack: ['T1041', 'T1567'],
      recommendation: 'Review file access logs on SERVER-FILE-01. Check if data transfer was authorized. Investigate destination IP.',
      status: 'investigating',
    },
  ]);

  const handleCorrelate = () => {
    setIsCorrelating(true);
    toast.info('Running cross-source threat correlation...');
    setTimeout(() => {
      setIsCorrelating(false);
      toast.success('Correlation complete. Found 3 correlated threat chains.');
    }, 3000);
  };

  const sourceIcons: Record<string, React.ElementType> = {
    edr: Shield, network: Network, siem: Activity, firewall: Zap, ids: Target,
  };

  const severityColors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6" />
            Threat Correlation Engine
          </h2>
          <p className="text-muted-foreground">Cross-reference EDR, network, and SIEM events to detect complex attacks</p>
        </div>
        <Button onClick={handleCorrelate} disabled={isCorrelating}>
          {isCorrelating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
          {isCorrelating ? 'Correlating...' : 'Run Correlation'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-500">{threats.filter(t => t.severity === 'critical').length}</p>
            <p className="text-xs text-muted-foreground">Critical Chains</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{threats.length}</p>
            <p className="text-xs text-muted-foreground">Correlated Threats</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{threats.reduce((acc, t) => acc + t.events.length, 0)}</p>
            <p className="text-xs text-muted-foreground">Linked Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-500">{threats.filter(t => t.status === 'active').length}</p>
            <p className="text-xs text-muted-foreground">Active Threats</p>
          </CardContent>
        </Card>
      </div>

      {/* Threat Chains */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {threats.map((threat) => (
            <Card key={threat.id} className={`border-l-4 ${threat.severity === 'critical' ? 'border-l-red-500' : threat.severity === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${threat.severity === 'critical' ? 'text-red-500' : 'text-orange-500'}`} />
                    <CardTitle className="text-base">{threat.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={severityColors[threat.severity]}>{threat.severity}</Badge>
                    <Badge variant="outline">{threat.confidence}% confidence</Badge>
                    <Badge variant={threat.status === 'active' ? 'destructive' : 'secondary'}>{threat.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-1 mt-2">
                  {threat.mitreAttack.map(t => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Event Timeline */}
                <div className="space-y-2">
                  {threat.events.map((event, i) => {
                    const SourceIcon = sourceIcons[event.source] || Activity;
                    return (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="flex flex-col items-center mt-1">
                          <div className="p-1 rounded bg-muted"><SourceIcon className="h-3 w-3" /></div>
                          {i < threat.events.length - 1 && <div className="w-px h-6 bg-border" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs uppercase">{event.source}</Badge>
                            <span className="text-xs text-muted-foreground">{event.deviceName}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-0.5">{event.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendation */}
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium text-xs mb-1">Recommended Action</p>
                  <p className="text-muted-foreground">{threat.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
