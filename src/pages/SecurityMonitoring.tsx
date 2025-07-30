import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Shield, Activity, Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { ThreatAnalysisEngine } from "@/components/security/ThreatAnalysisEngine";
import { ThreatPredictionEngine } from "@/components/security/ThreatPredictionEngine";
import { ThreatMonitor } from "@/components/shield/ThreatMonitor";

const mockThreats = [
  {
    id: "1",
    event_id: "EVT-001",
    hostname: "DESKTOP-ABC123",
    threat_type: "Malware Detection",
    severity: "high" as const,
    ai_confidence_score: 95,
    detected_at: "2024-01-20T10:30:00Z",
    status: "active",
    ai_analysis: {
      threat_assessment: "Suspicious executable detected in system directory with high confidence malware signatures",
      recommended_actions: ["Quarantine file", "Run full system scan", "Update antivirus definitions"],
      isolation_required: true,
      walkthrough_steps: ["Isolate affected system", "Run deep scan", "Remove threats", "Restore from backup if needed"],
      impact_analysis: "High risk to system integrity and data security",
      containment_strategy: "Immediate isolation and quarantine of suspicious files"
    },
    behavioral_indicators: ["Unusual file execution", "Network anomalies", "System performance degradation"]
  },
  {
    id: "2",
    event_id: "EVT-002", 
    hostname: "SERVER-XYZ789",
    threat_type: "Unauthorized Access",
    severity: "critical" as const,
    ai_confidence_score: 89,
    detected_at: "2024-01-20T09:15:00Z",
    status: "investigating",
    ai_analysis: {
      threat_assessment: "Multiple failed login attempts from unknown IP address suggesting brute force attack",
      recommended_actions: ["Block IP address", "Enable 2FA", "Review access logs"],
      isolation_required: false,
      walkthrough_steps: ["Block malicious IP", "Review authentication logs", "Strengthen password policies", "Enable multi-factor authentication"],
      impact_analysis: "Critical risk to system access and data confidentiality",
      containment_strategy: "Immediate IP blocking and enhanced authentication measures"
    },
    behavioral_indicators: ["Failed login patterns", "Unusual access times", "Geographic anomalies"]
  },
  {
    id: "3",
    event_id: "EVT-003",
    hostname: "LAPTOP-DEF456",
    threat_type: "Phishing Attempt", 
    severity: "medium" as const,
    ai_confidence_score: 78,
    detected_at: "2024-01-20T08:45:00Z",
    status: "monitoring",
    ai_analysis: {
      threat_assessment: "Suspicious email link clicked, potential phishing attempt detected",
      recommended_actions: ["Educate user", "Update email filters", "Monitor network traffic"],
      isolation_required: false,
      walkthrough_steps: ["Review email content", "Check for credential theft", "Update security training", "Monitor for further suspicious activity"],
      impact_analysis: "Medium risk to user credentials and system access",
      containment_strategy: "User education and enhanced email filtering"
    },
    behavioral_indicators: ["Suspicious email interaction", "Unusual browsing patterns"]
  }
];

const SecurityStats = () => {
  return (
    <div className="grid gap-4 md:grid-cols-4 animate-fade-in-up stagger-3">
      <Card className="hover-scale hover-glow animate-fade-in stagger-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive animate-glow">7</div>
          <p className="text-xs text-muted-foreground">
            +2 from last hour
          </p>
        </CardContent>
      </Card>

      <Card className="hover-scale hover-glow animate-fade-in stagger-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Protected Assets</CardTitle>
          <Shield className="h-4 w-4 text-primary animate-bounce-gentle" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary animate-glow">1,247</div>
          <p className="text-xs text-muted-foreground">
            All systems monitored
          </p>
        </CardContent>
      </Card>

      <Card className="hover-scale hover-glow animate-fade-in stagger-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          <Activity className="h-4 w-4 text-accent animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent animate-glow">94%</div>
          <p className="text-xs text-muted-foreground">
            Excellent security posture
          </p>
        </CardContent>
      </Card>

      <Card className="hover-scale hover-glow animate-fade-in stagger-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          <Clock className="h-4 w-4 text-secondary animate-bounce-gentle" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary animate-glow">2.3s</div>
          <p className="text-xs text-muted-foreground">
            Average detection time
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const RecentIncidents = () => {
  const incidents = [
    {
      id: "INC-001",
      title: "Malware Detection on DESKTOP-ABC123",
      severity: "high",
      status: "investigating",
      time: "10 minutes ago",
      assignee: "Security Team"
    },
    {
      id: "INC-002", 
      title: "Unauthorized Access Attempt",
      severity: "critical",
      status: "resolved",
      time: "1 hour ago",
      assignee: "SOC Analyst"
    },
    {
      id: "INC-003",
      title: "Phishing Email Detected",
      severity: "medium", 
      status: "monitoring",
      time: "2 hours ago",
      assignee: "Email Security"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "warning";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved": return <CheckCircle className="h-4 w-4 text-primary" />;
      case "investigating": return <Eye className="h-4 w-4 text-warning" />;
      case "monitoring": return <Activity className="h-4 w-4 text-accent" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Security Incidents</CardTitle>
        <CardDescription>
          Latest security events requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {incidents.map((incident) => (
            <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                {getStatusIcon(incident.status)}
                <div>
                  <div className="font-medium">{incident.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {incident.id} • Assigned to {incident.assignee}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getSeverityColor(incident.severity) as any}>
                  {incident.severity}
                </Badge>
                <span className="text-sm text-muted-foreground">{incident.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ThreatFilters = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Threat Filters</CardTitle>
        <CardDescription>
          Filter and search security threats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Search threats..." />
        <div className="grid grid-cols-2 gap-4">
          <Select>
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
          
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button className="w-full">Apply Filters</Button>
      </CardContent>
    </Card>
  );
};

export default function SecurityMonitoring() {
  const [selectedThreat, setSelectedThreat] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-glow">
              Security Monitoring
            </h1>
            <p className="text-lg text-muted-foreground mt-2 animate-fade-in stagger-1">
              Real-time threat detection and incident response
            </p>
          </div>
          <Button className="hover-scale hover-glow animate-fade-in stagger-2">
            <Activity className="h-4 w-4 mr-2 animate-bounce-gentle" />
            Run Security Scan
          </Button>
        </div>

        {/* Security Stats */}
        <SecurityStats />

        {/* Main Content */}
        <Tabs defaultValue="threats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50">
            <TabsTrigger value="threats" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Active Threats
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="prediction" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Threat Prediction
            </TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Incidents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="threats" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <ThreatMonitor 
                  threats={mockThreats}
                  onThreatSelect={setSelectedThreat}
                />
              </div>
              <div>
                <ThreatFilters />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <ThreatAnalysisEngine />
          </TabsContent>

          <TabsContent value="prediction" className="space-y-6">
            <ThreatPredictionEngine />
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            <RecentIncidents />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}