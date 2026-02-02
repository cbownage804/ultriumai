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
  Radar,
  Search,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Shield,
  Monitor,
  Clock,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CorrelatedEvent {
  id: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedDevices: string[];
  eventCount: number;
  firstSeen: Date;
  lastSeen: Date;
  description: string;
  mitreAttack?: string;
  recommended: string;
}

interface EventLogCorrelationProps {
  agents: any[];
}

export function EventLogCorrelation({ agents }: EventLogCorrelationProps) {
  const [correlations, setCorrelations] = useState<CorrelatedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    loadCorrelations();
  }, [agents]);

  const loadCorrelations = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockCorrelations: CorrelatedEvent[] = [
      {
        id: '1',
        pattern: 'Brute Force Login Attempts',
        severity: 'critical',
        affectedDevices: ['WORKSTATION-01', 'LAPTOP-02'],
        eventCount: 156,
        firstSeen: new Date(Date.now() - 7200000),
        lastSeen: new Date(Date.now() - 300000),
        description: 'Multiple failed login attempts detected from external IPs',
        mitreAttack: 'T1110',
        recommended: 'Block source IPs and enable account lockout policy',
      },
      {
        id: '2',
        pattern: 'Suspicious PowerShell Activity',
        severity: 'high',
        affectedDevices: ['SERVER-01'],
        eventCount: 23,
        firstSeen: new Date(Date.now() - 3600000),
        lastSeen: new Date(Date.now() - 600000),
        description: 'Encoded PowerShell commands and unusual execution patterns',
        mitreAttack: 'T1059.001',
        recommended: 'Review PowerShell logs and investigate user activity',
      },
      {
        id: '3',
        pattern: 'Service Installation',
        severity: 'medium',
        affectedDevices: ['WORKSTATION-03'],
        eventCount: 5,
        firstSeen: new Date(Date.now() - 86400000),
        lastSeen: new Date(Date.now() - 43200000),
        description: 'New services installed outside maintenance window',
        mitreAttack: 'T1543.003',
        recommended: 'Verify service legitimacy and review installation source',
      },
      {
        id: '4',
        pattern: 'Cleared Event Logs',
        severity: 'high',
        affectedDevices: ['SERVER-02'],
        eventCount: 3,
        firstSeen: new Date(Date.now() - 14400000),
        lastSeen: new Date(Date.now() - 14400000),
        description: 'Security and System event logs were cleared',
        mitreAttack: 'T1070.001',
        recommended: 'Investigate user who cleared logs and restore from backup',
      },
    ];
    
    setCorrelations(mockCorrelations);
    setIsLoading(false);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500"><AlertTriangle className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const filteredCorrelations = correlations.filter(c => {
    const matchesSearch = c.pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || c.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const criticalCount = correlations.filter(c => c.severity === 'critical').length;
  const highCount = correlations.filter(c => c.severity === 'high').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-5 w-5" />
            Event Log Correlation (SIEM-Lite)
          </CardTitle>
          <div className="flex items-center gap-4">
            {criticalCount > 0 && <Badge variant="destructive">{criticalCount} Critical</Badge>}
            {highCount > 0 && <Badge className="bg-orange-500">{highCount} High</Badge>}
            <Button variant="outline" size="sm" onClick={loadCorrelations} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Analyze
            </Button>
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
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
            <div className="space-y-4">
              {filteredCorrelations.map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getSeverityBadge(event.severity)}
                        <h4 className="font-medium">{event.pattern}</h4>
                        {event.mitreAttack && (
                          <Badge variant="outline" className="font-mono text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            ATT&CK {event.mitreAttack}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Monitor className="h-4 w-4" />
                          {event.affectedDevices.length} device{event.affectedDevices.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Link2 className="h-4 w-4" />
                          {event.eventCount} events
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Last: {format(event.lastSeen, 'MMM d, HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm">
                      <span className="font-medium text-primary">Recommended: </span>
                      <span className="text-muted-foreground">{event.recommended}</span>
                    </div>
                  </div>
                </Card>
              ))}
              {filteredCorrelations.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Radar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No correlated events found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
