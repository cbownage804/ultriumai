import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Database, 
  Zap, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Activity,
  Globe,
  Lock,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Download,
  Upload,
  Clock,
  Shield,
  Network,
  Server,
  FileText,
  Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SIEMConnector {
  id: string;
  name: string;
  type: 'splunk' | 'qradar' | 'arcsight' | 'sentinel' | 'elastic' | 'chronicle' | 'sumologic';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  endpoint: string;
  last_sync: string;
  events_sent: number;
  events_received: number;
  data_volume_mb: number;
  auth_method: 'api_key' | 'oauth' | 'certificate';
  config: Record<string, any>;
  enabled: boolean;
}

interface EventMapping {
  id: string;
  source_app: 'safedoc' | 'safemail' | 'safelink' | 'safepass' | 'safenet';
  event_type: string;
  siem_format: string;
  field_mappings: Record<string, string>;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    status: 'compliant' | 'partial' | 'non_compliant';
    evidence_collected: boolean;
  }>;
  coverage_percentage: number;
  last_assessment: string;
}

export const SIEMIntegration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [connectors, setConnectors] = useState<SIEMConnector[]>([
    {
      id: 'conn-001',
      name: 'Splunk Enterprise',
      type: 'splunk',
      status: 'connected',
      endpoint: 'https://splunk.company.com:8089',
      last_sync: '2024-01-20T16:30:00Z',
      events_sent: 15847,
      events_received: 0,
      data_volume_mb: 245.7,
      auth_method: 'api_key',
      config: { index: 'ultrium_security' },
      enabled: true
    },
    {
      id: 'conn-002',
      name: 'Microsoft Sentinel',
      type: 'sentinel',
      status: 'connected',
      endpoint: 'https://management.azure.com',
      last_sync: '2024-01-20T16:25:00Z',
      events_sent: 8934,
      events_received: 12,
      data_volume_mb: 134.2,
      auth_method: 'oauth',
      config: { workspace_id: 'ws-12345', subscription_id: 'sub-67890' },
      enabled: true
    }
  ]);

  const [eventMappings, setEventMappings] = useState<EventMapping[]>([
    {
      id: 'map-001',
      source_app: 'safedoc',
      event_type: 'threat_detected',
      siem_format: 'CEF',
      field_mappings: {
        'timestamp': '@timestamp',
        'file_hash': 'file.hash.sha256',
        'threat_name': 'threat.indicator.name',
        'user_email': 'user.email'
      },
      enabled: true,
      priority: 'high'
    },
    {
      id: 'map-002',
      source_app: 'safemail',
      event_type: 'phishing_detected',
      siem_format: 'STIX',
      field_mappings: {
        'timestamp': 'observed_data.first_observed',
        'sender_email': 'email_message.sender_ref',
        'subject': 'email_message.subject',
        'threat_score': 'malware_analysis.result'
      },
      enabled: true,
      priority: 'critical'
    }
  ]);

  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([
    {
      id: 'compliance-001',
      name: 'SOC 2 Type II',
      description: 'System and Organization Controls for Security, Availability, and Confidentiality',
      requirements: [
        {
          id: 'req-001',
          title: 'Access Controls',
          description: 'Implement logical and physical access controls',
          status: 'compliant',
          evidence_collected: true
        },
        {
          id: 'req-002',
          title: 'Monitoring and Logging',
          description: 'Comprehensive logging and monitoring of security events',
          status: 'compliant',
          evidence_collected: true
        }
      ],
      coverage_percentage: 87,
      last_assessment: '2024-01-15T00:00:00Z'
    }
  ]);

  const [syncMetrics, setSyncMetrics] = useState({
    total_events_today: 24781,
    successful_deliveries: 99.2,
    failed_deliveries: 0.8,
    average_latency_ms: 145,
    data_processed_gb: 2.4
  });

  const testConnection = async (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) return;

    setConnectors(prev => prev.map(c => 
      c.id === connectorId ? { ...c, status: 'syncing' } : c
    ));

    // Simulate connection test
    setTimeout(() => {
      setConnectors(prev => prev.map(c => 
        c.id === connectorId ? { 
          ...c, 
          status: Math.random() > 0.1 ? 'connected' : 'error',
          last_sync: new Date().toISOString()
        } : c
      ));
      
      toast({
        title: "Connection Test Complete",
        description: `Connection test for ${connector.name} completed`,
      });
    }, 3000);
  };

  const toggleConnector = async (connectorId: string) => {
    setConnectors(prev => prev.map(c => 
      c.id === connectorId ? { ...c, enabled: !c.enabled } : c
    ));
    
    toast({
      title: "Connector Updated",
      description: "SIEM connector status has been updated",
    });
  };

  const exportComplianceReport = async (frameworkId: string) => {
    toast({
      title: "Report Generated",
      description: "Compliance report has been generated and is ready for download",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500 bg-green-50';
      case 'disconnected': return 'text-gray-500 bg-gray-50';
      case 'error': return 'text-red-500 bg-red-50';
      case 'syncing': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'high': return 'text-orange-500 bg-orange-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-500';
      case 'partial': return 'text-yellow-500';
      case 'non_compliant': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            SIEM Integration & Compliance
          </h1>
          <p className="text-muted-foreground">
            Centralized security information and event management with compliance automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button variant="hero">
            <Download className="h-4 w-4 mr-2" />
            Export Compliance
          </Button>
        </div>
      </div>

      {/* Sync Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncMetrics.total_events_today.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Processed events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{syncMetrics.successful_deliveries}%</div>
            <Progress value={syncMetrics.successful_deliveries} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{syncMetrics.failed_deliveries}%</div>
            <Progress value={syncMetrics.failed_deliveries} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncMetrics.average_latency_ms}ms</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Volume</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncMetrics.data_processed_gb}GB</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="connectors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connectors">SIEM Connectors</TabsTrigger>
          <TabsTrigger value="mappings">Event Mappings</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="connectors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SIEM Platform Connectors</CardTitle>
              <CardDescription>
                Manage integrations with Security Information and Event Management platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectors.map((connector) => (
                  <div key={connector.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5" />
                        <div>
                          <h3 className="font-semibold">{connector.name}</h3>
                          <p className="text-sm text-muted-foreground">{connector.endpoint}</p>
                        </div>
                        <Badge className={getStatusColor(connector.status)}>
                          {connector.status}
                        </Badge>
                        <Badge variant="outline" className="uppercase">
                          {connector.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={connector.enabled}
                          onCheckedChange={() => toggleConnector(connector.id)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testConnection(connector.id)}
                          disabled={connector.status === 'syncing'}
                        >
                          {connector.status === 'syncing' ? (
                            <Pause className="h-4 w-4 mr-1" />
                          ) : (
                            <Play className="h-4 w-4 mr-1" />
                          )}
                          Test
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Events Sent:</span> {connector.events_sent.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Events Received:</span> {connector.events_received.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Data Volume:</span> {connector.data_volume_mb.toFixed(1)} MB
                      </div>
                      <div>
                        <span className="font-medium">Last Sync:</span> {new Date(connector.last_sync).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Field Mappings</CardTitle>
              <CardDescription>
                Configure how security events are formatted for different SIEM platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventMappings.map((mapping) => (
                  <div key={mapping.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{mapping.source_app} - {mapping.event_type}</h3>
                        <Badge variant="outline" className="uppercase">
                          {mapping.siem_format}
                        </Badge>
                        <Badge className={getPriorityColor(mapping.priority)}>
                          {mapping.priority}
                        </Badge>
                      </div>
                      <Switch checked={mapping.enabled} />
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">Field Mappings:</span>
                      <div className="mt-1 text-muted-foreground">
                        {Object.entries(mapping.field_mappings).map(([source, target], index) => (
                          <span key={source}>
                            {source} → {target}
                            {index < Object.entries(mapping.field_mappings).length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Frameworks</CardTitle>
              <CardDescription>
                Monitor compliance status across security frameworks and standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {complianceFrameworks.map((framework) => (
                  <div key={framework.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{framework.name}</h3>
                        <p className="text-sm text-muted-foreground">{framework.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-500">{framework.coverage_percentage}%</div>
                        <p className="text-xs text-muted-foreground">Coverage</p>
                      </div>
                    </div>
                    
                    <Progress value={framework.coverage_percentage} className="mb-4 h-2" />
                    
                    <div className="space-y-2 mb-4">
                      {framework.requirements.slice(0, 3).map((req) => (
                        <div key={req.id} className="flex items-center justify-between text-sm">
                          <span>{req.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getComplianceStatusColor(req.status)} bg-opacity-10`}>
                              {req.status.replace('_', ' ')}
                            </Badge>
                            {req.evidence_collected && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Last Assessment: {new Date(framework.last_assessment).toLocaleDateString()}</span>
                      <Button
                        size="sm"
                        onClick={() => exportComplianceReport(framework.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export Report
                      </Button>
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