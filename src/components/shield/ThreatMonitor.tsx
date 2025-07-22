import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Eye, 
  Play,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Threat {
  id: string;
  event_id: string;
  hostname: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ai_confidence_score: number;
  detected_at: string;
  status: string;
  ai_analysis: {
    threat_assessment: string;
    recommended_actions: string[];
    isolation_required: boolean;
    walkthrough_steps: string[];
    impact_analysis: string;
    containment_strategy: string;
  };
  behavioral_indicators?: string[];
}

interface ThreatMonitorProps {
  threats: Threat[];
  onThreatSelect: (threat: Threat) => void;
}

export const ThreatMonitor = ({ threats, onThreatSelect }: ThreatMonitorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

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
      case 'medium': return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'low': return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      default: return <ShieldAlert className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'investigating': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'contained': return <XCircle className="h-4 w-4 text-orange-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const filteredThreats = threats.filter(threat => {
    const matchesSearch = threat.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         threat.threat_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || threat.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || threat.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleThreatClick = (threat: Threat) => {
    onThreatSelect(threat);
    toast({
      title: "Threat Selected",
      description: `Loading AI response guide for ${threat.threat_type} on ${threat.hostname}`,
    });
  };

  const handleAutoFix = async (threat: Threat) => {
    try {
      toast({
        title: "Auto-Fix Started",
        description: `Attempting to automatically remediate ${threat.threat_type} on ${threat.hostname}`,
      });

      // Simulate auto-fix process
      setTimeout(() => {
        toast({
          title: "Auto-Fix Complete",
          description: `Successfully remediated threat on ${threat.hostname}`,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Auto-Fix Failed",
        description: "Unable to automatically fix this threat. Manual intervention required.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />
          Threat Monitor
        </h2>
        <p className="text-muted-foreground">
          Real-time threat detection and analysis powered by AI
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search threats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="contained">Contained</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Threat Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">
                  {threats.filter(t => t.severity === 'critical').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-orange-600">
                  {threats.filter(t => t.severity === 'high').length}
                </p>
              </div>
              <ShieldAlert className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {threats.filter(t => t.status === 'active').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{threats.length}</p>
              </div>
              <ShieldAlert className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threats List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Threats</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredThreats.length === 0 ? (
            <div className="text-center py-8">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No threats found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredThreats.map((threat) => (
                <Card key={threat.id} className="hover:shadow-md transition-shadow cursor-pointer" 
                      onClick={() => handleThreatClick(threat)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getSeverityIcon(threat.severity)}
                          <h3 className="font-medium">{threat.threat_type.replace('_', ' ').toUpperCase()}</h3>
                          <Badge variant={getSeverityColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(threat.status)}
                            <span className="text-sm text-muted-foreground">{threat.status}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Hostname:</span>
                            <span className="ml-2 font-mono">{threat.hostname}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">AI Confidence:</span>
                            <span className="ml-2 font-medium">{Math.round(threat.ai_confidence_score * 100)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Detected:</span>
                            <span className="ml-2">{new Date(threat.detected_at).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">
                            {threat.ai_analysis.threat_assessment}
                          </p>
                        </div>
                        
                        {threat.behavioral_indicators && threat.behavioral_indicators.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {threat.behavioral_indicators.slice(0, 3).map((indicator, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {indicator.replace('_', ' ')}
                              </Badge>
                            ))}
                            {threat.behavioral_indicators.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{threat.behavioral_indicators.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" onClick={() => handleThreatClick(threat)}>
                          <Play className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAutoFix(threat)}>
                          <Zap className="h-4 w-4 mr-2" />
                          Try to Fix
                        </Button>
                        {threat.ai_analysis.isolation_required && (
                          <Alert className="max-w-xs">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Isolation recommended
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};