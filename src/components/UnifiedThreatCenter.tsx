import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Target, 
  AlertTriangle, 
  Shield,
  Activity,
  Globe,
  Zap,
  Search,
  Filter,
  Bell,
  Settings,
  Download,
  Eye,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Database,
  Network,
  Cpu,
  HardDrive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ThreatIndicator {
  id: string;
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  value: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  first_seen: string;
  last_seen: string;
  tags: string[];
  related_campaigns: string[];
  threat_types: string[];
  blocked: boolean;
}

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  source_app: 'safedoc' | 'safemail' | 'safelink' | 'safepass' | 'safenet';
  created_at: string;
  updated_at: string;
  assignee?: string;
  affected_assets: string[];
  remediation_steps: string[];
  timeline: Array<{
    timestamp: string;
    action: string;
    user: string;
    details: string;
  }>;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    app: string;
    event: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'block' | 'alert' | 'quarantine' | 'notify' | 'escalate';
    config: Record<string, any>;
  }>;
  enabled: boolean;
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
}

export const UnifiedThreatCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [threats, setThreats] = useState<ThreatIndicator[]>([
    {
      id: 'threat-001',
      type: 'domain',
      value: 'malicious-site.com',
      confidence: 95,
      severity: 'high',
      source: 'VirusTotal',
      first_seen: '2024-01-20T10:00:00Z',
      last_seen: '2024-01-20T15:30:00Z',
      tags: ['phishing', 'credential-theft'],
      related_campaigns: ['Operation PhishStorm'],
      threat_types: ['phishing', 'malware'],
      blocked: true
    },
    {
      id: 'threat-002',
      type: 'ip',
      value: '192.168.1.100',
      confidence: 87,
      severity: 'medium',
      source: 'Internal Detection',
      first_seen: '2024-01-19T14:22:00Z',
      last_seen: '2024-01-20T16:45:00Z',
      tags: ['suspicious', 'scanning'],
      related_campaigns: [],
      threat_types: ['reconnaissance'],
      blocked: false
    }
  ]);

  const [incidents, setIncidents] = useState<SecurityIncident[]>([
    {
      id: 'inc-001',
      title: 'Phishing Email Campaign Detected',
      description: 'Multiple phishing emails detected targeting employee credentials',
      severity: 'high',
      status: 'investigating',
      source_app: 'safemail',
      created_at: '2024-01-20T09:15:00Z',
      updated_at: '2024-01-20T16:30:00Z',
      assignee: 'security-team',
      affected_assets: ['email-server-01', 'users'],
      remediation_steps: [
        'Block sender domains',
        'Notify affected users',
        'Update email filters',
        'Conduct security awareness training'
      ],
      timeline: [
        {
          timestamp: '2024-01-20T09:15:00Z',
          action: 'Incident Created',
          user: 'system',
          details: 'Automated detection via SafeMail'
        },
        {
          timestamp: '2024-01-20T09:30:00Z',
          action: 'Investigation Started',
          user: 'security-analyst',
          details: 'Initial analysis of email samples'
        }
      ]
    }
  ]);

  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: 'rule-001',
      name: 'Auto-Block Malicious IPs',
      description: 'Automatically block IP addresses with high confidence threat indicators',
      trigger: {
        app: 'safenet',
        event: 'threat_detected',
        conditions: { confidence: '>= 90', type: 'ip' }
      },
      actions: [
        { type: 'block', config: { duration: '24h', scope: 'network' } },
        { type: 'alert', config: { channels: ['email', 'slack'], priority: 'high' } }
      ],
      enabled: true,
      created_at: '2024-01-15T00:00:00Z',
      last_triggered: '2024-01-20T14:30:00Z',
      trigger_count: 23
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'threats' | 'incidents' | 'automation' | 'intelligence'>('threats');

  const blockThreat = async (threatId: string) => {
    setThreats(prev => prev.map(threat => 
      threat.id === threatId ? { ...threat, blocked: true } : threat
    ));
    
    toast({
      title: "Threat Blocked",
      description: "Threat indicator has been added to global blocklist",
    });

    // Log the action
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user?.id,
        action: 'threat_blocked',
        resource_type: 'threat_indicator',
        resource_id: threatId,
        details: { automated: false, user_initiated: true }
      });
  };

  const createIncident = async (threatId: string) => {
    const threat = threats.find(t => t.id === threatId);
    if (!threat) return;

    const newIncident: SecurityIncident = {
      id: `inc-${Date.now()}`,
      title: `Threat Detected: ${threat.value}`,
      description: `${threat.type.toUpperCase()} threat indicator detected with ${threat.confidence}% confidence`,
      severity: threat.severity,
      status: 'open',
      source_app: 'safenet', // Inferred from context
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      affected_assets: [threat.value],
      remediation_steps: [
        'Investigate source and scope',
        'Block threat if confirmed',
        'Monitor for related activity',
        'Update threat intelligence'
      ],
      timeline: [{
        timestamp: new Date().toISOString(),
        action: 'Incident Created',
        user: user?.email || 'unknown',
        details: 'Manual incident creation from threat indicator'
      }]
    };

    setIncidents(prev => [newIncident, ...prev]);
    
    toast({
      title: "Incident Created",
      description: `Security incident ${newIncident.id} has been created`,
    });
  };

  const updateIncidentStatus = async (incidentId: string, status: SecurityIncident['status']) => {
    setIncidents(prev => prev.map(incident => 
      incident.id === incidentId 
        ? { 
            ...incident, 
            status, 
            updated_at: new Date().toISOString(),
            timeline: [
              ...incident.timeline,
              {
                timestamp: new Date().toISOString(),
                action: `Status changed to ${status}`,
                user: user?.email || 'unknown',
                details: `Incident status updated to ${status}`
              }
            ]
          }
        : incident
    ));
    
    toast({
      title: "Incident Updated",
      description: `Incident status changed to ${status}`,
    });
  };

  const toggleAutomationRule = async (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
    
    const rule = automationRules.find(r => r.id === ruleId);
    toast({
      title: "Automation Rule Updated",
      description: `Rule "${rule?.name}" ${rule?.enabled ? 'disabled' : 'enabled'}`,
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredThreats = threats.filter(threat => 
    threat.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
    threat.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Unified Threat Center
          </h1>
          <p className="text-muted-foreground">
            Centralized threat intelligence, incident management, and automated response
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button variant="hero">
            <Download className="h-4 w-4 mr-2" />
            Export Intelligence
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{threats.filter(t => !t.blocked).length}</div>
            <p className="text-xs text-muted-foreground">
              {threats.filter(t => !t.blocked && t.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {incidents.filter(i => i.status === 'open' || i.status === 'investigating').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {incidents.filter(i => i.severity === 'high' || i.severity === 'critical').length} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Threats</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{threats.filter(t => t.blocked).length}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Rules</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {automationRules.filter(r => r.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">Active rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search threats, indicators, or incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Threat Indicators</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence Feeds</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Indicators</CardTitle>
              <CardDescription>
                Centralized view of all threat indicators across security apps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredThreats.map((threat) => (
                  <div key={threat.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="uppercase">
                          {threat.type}
                        </Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {threat.value}
                        </code>
                        <Badge className={getSeverityColor(threat.severity)}>
                          {threat.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {threat.confidence}% confidence
                        </span>
                        {threat.blocked ? (
                          <Badge variant="default">
                            <Lock className="h-3 w-3 mr-1" />
                            Blocked
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Unlock className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>Source: {threat.source}</span>
                      <span>First seen: {new Date(threat.first_seen).toLocaleDateString()}</span>
                      <span>Tags: {threat.tags.join(', ')}</span>
                    </div>

                    <div className="flex gap-2">
                      {!threat.blocked && (
                        <Button size="sm" onClick={() => blockThreat(threat.id)}>
                          <Shield className="h-4 w-4 mr-1" />
                          Block
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => createIncident(threat.id)}>
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Create Incident
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>
                Track and manage security incidents across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{incident.title}</h3>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline">
                          {incident.source_app}
                        </Badge>
                      </div>
                      <select
                        value={incident.status}
                        onChange={(e) => updateIncidentStatus(incident.id, e.target.value as any)}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {incident.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(incident.created_at).toLocaleString()}</span>
                      <span>Updated: {new Date(incident.updated_at).toLocaleString()}</span>
                      <span>Assets: {incident.affected_assets.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Configure automated responses to security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{rule.name}</h3>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAutomationRule(rule.id)}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {rule.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Trigger:</span> {rule.trigger.app} - {rule.trigger.event}
                      </div>
                      <div>
                        <span className="font-medium">Actions:</span> {rule.actions.length} configured
                      </div>
                      <div>
                        <span className="font-medium">Triggered:</span> {rule.trigger_count} times
                      </div>
                      <div>
                        <span className="font-medium">Last triggered:</span> {
                          rule.last_triggered 
                            ? new Date(rule.last_triggered).toLocaleString()
                            : 'Never'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};