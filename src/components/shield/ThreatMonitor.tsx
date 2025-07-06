import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  Filter,
  Eye,
  Clock,
  Shield,
  Activity
} from "lucide-react";

interface Threat {
  id: string;
  event_id: string;
  hostname: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ai_confidence_score: number;
  detected_at: string;
  status: string;
  ai_analysis: any;
  behavioral_indicators?: string[];
  file_path?: string;
  process_name?: string;
  network_connection?: string;
}

interface ThreatMonitorProps {
  threats: Threat[];
  onThreatSelect: (threat: Threat) => void;
}

export const ThreatMonitor = ({ threats, onThreatSelect }: ThreatMonitorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredThreats = threats.filter(threat => {
    const matchesSearch = threat.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         threat.threat_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || threat.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <ShieldAlert className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Shield className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getThreatTypeDisplay = (threatType: string) => {
    return threatType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Threat Detection Center
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search threats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredThreats.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {threats.length === 0 ? "No threats detected" : "No threats match your search criteria"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Threat</TableHead>
                    <TableHead>Hostname</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>AI Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredThreats.map((threat) => (
                    <TableRow key={threat.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(threat.severity)}
                          <div>
                            <p className="font-medium">{getThreatTypeDisplay(threat.threat_type)}</p>
                            {threat.file_path && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {threat.file_path}
                              </p>
                            )}
                            {threat.process_name && (
                              <p className="text-xs text-muted-foreground">
                                Process: {threat.process_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{threat.hostname}</p>
                          {threat.network_connection && (
                            <p className="text-xs text-muted-foreground">
                              {threat.network_connection}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(threat.severity)}>
                          {threat.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {Math.round(threat.ai_confidence_score * 100)}%
                          </div>
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${threat.ai_confidence_score * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={threat.status === 'detected' ? 'secondary' : 'outline'}>
                          {threat.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(threat.detected_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onThreatSelect(threat)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Analyze
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threat Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {threats.filter(t => t.severity === 'critical').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">High</p>
                <p className="text-2xl font-bold text-orange-600">
                  {threats.filter(t => t.severity === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Medium</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {threats.filter(t => t.severity === 'medium').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Low</p>
                <p className="text-2xl font-bold text-blue-600">
                  {threats.filter(t => t.severity === 'low').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};