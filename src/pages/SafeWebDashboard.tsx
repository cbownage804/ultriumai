import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Globe,
  User,
  Building,
  CreditCard,
  Calendar,
  MapPin,
  ExternalLink,
  Plus,
  Settings,
  Bell,
  Download,
  Filter,
  RefreshCw,
  TrendingUp,
  Database,
  Network,
  Lock,
  Users,
  Activity,
  Inbox
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useSafeWebData } from "@/hooks/useSafeWebData";

interface ThreatIntelligence {
  id: string;
  type: 'credential' | 'data_breach' | 'threat_actor' | 'marketplace' | 'brand_mention';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  date: string;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  affectedAssets: string[];
  confidence: number;
  tags: string[];
}

interface MonitoredAsset {
  id: string;
  type: 'email' | 'domain' | 'brand' | 'executive' | 'ip_range';
  value: string;
  status: 'active' | 'paused';
  threatsFound: number;
  lastScan: string;
  addedDate: string;
}

const SafeWebDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [newAsset, setNewAsset] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  
  // Use real data from Supabase
  const { 
    threats: realThreats, 
    assets: realAssets, 
    loading, 
    fetchAssets,
    fetchThreats,
    addAsset,
    triggerScan,
    updateThreatStatus
  } = useSafeWebData();

  // Transform SafeWebThreat to ThreatIntelligence format
  const threats: ThreatIntelligence[] = realThreats.map(t => ({
    id: t.id,
    type: t.threat_type === 'executive_mention' ? 'brand_mention' : t.threat_type,
    title: t.title,
    description: t.description,
    severity: t.severity,
    source: t.source_name || 'Dark Web Scanner',
    date: t.created_at,
    status: t.status,
    affectedAssets: t.affected_assets || [],
    confidence: t.confidence_score || 75,
    tags: t.tags || []
  }));

  // Transform SafeWebAsset to MonitoredAsset format
  const assets: MonitoredAsset[] = realAssets.map(a => ({
    id: a.id,
    type: a.asset_type,
    value: a.asset_value,
    status: a.status === 'archived' ? 'paused' : a.status,
    threatsFound: a.threats_found || 0,
    lastScan: a.last_scan_at || a.created_at,
    addedDate: a.created_at
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-500 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-violet-500 bg-violet-500/20 border-violet-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'investigating': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'false_positive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredThreats = filterSeverity === 'all' 
    ? threats 
    : threats.filter(threat => threat.severity === filterSeverity);

  const criticalThreats = threats.filter(t => t.severity === 'critical').length;
  const newThreats = threats.filter(t => t.status === 'new').length;
  const totalAssets = assets.length;
  const activeScans = assets.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <Eye className="h-8 w-8 text-violet-500" />
              <span className="text-violet-500">SafeWeb™</span> Intelligence Center
            </h1>
            <p className="text-gray-400 mt-2">
              Continuous dark web monitoring and threat intelligence
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-violet-500/30 text-violet-500 hover:bg-violet-500/10">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button variant="outline" className="border-violet-500/30 text-violet-500 hover:bg-violet-500/10">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-[#1a1a1a] border border-violet-500/10">
            <TabsTrigger value="dashboard" className="text-gray-400 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-500">Dashboard</TabsTrigger>
            <TabsTrigger value="threats" className="text-gray-400 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-500">Threats ({newThreats})</TabsTrigger>
            <TabsTrigger value="assets" className="text-gray-400 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-500">Assets ({totalAssets})</TabsTrigger>
            <TabsTrigger value="reports" className="text-gray-400 data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-500">Reports</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-[#141414] border-violet-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Critical Threats</p>
                      <p className="text-2xl font-bold text-red-500">{criticalThreats}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#141414] border-violet-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Bell className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">New Alerts</p>
                      <p className="text-2xl font-bold text-orange-500">{newThreats}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#141414] border-violet-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                      <Database className="h-6 w-6 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Monitored Assets</p>
                      <p className="text-2xl font-bold text-violet-500">{totalAssets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#141414] border-violet-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Activity className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Active Scans</p>
                      <p className="text-2xl font-bold text-green-500">{activeScans}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Threats */}
            <Card className="bg-[#141414] border-violet-500/10">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Recent Threat Intelligence</CardTitle>
                    <CardDescription className="text-gray-400">Latest threats detected in the past 7 days</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-violet-500/30 text-violet-500 hover:bg-violet-500/10">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threats.slice(0, 3).map((threat) => (
                    <div key={threat.id} className="flex items-start gap-4 p-4 border border-violet-500/10 rounded-lg bg-[#1a1a1a]">
                      <div className={`p-2 rounded-full ${getSeverityColor(threat.severity)}`}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-white">{threat.title}</h4>
                          <Badge className={getStatusColor(threat.status)}>
                            {threat.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{threat.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Source: {threat.source}</span>
                          <span>•</span>
                          <span>{new Date(threat.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Confidence: {threat.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Threats Tab */}
          <TabsContent value="threats" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <select 
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="border rounded px-3 py-1"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Manual Investigation
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredThreats.map((threat) => (
                <Card key={threat.id} className={`border-l-4 ${getSeverityColor(threat.severity)}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{threat.title}</h3>
                        <p className="text-muted-foreground mb-2">{threat.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={getSeverityColor(threat.severity)}>
                          {threat.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(threat.status)}>
                          {threat.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium">Source</p>
                        <p className="text-sm text-muted-foreground">{threat.source}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Date Discovered</p>
                        <p className="text-sm text-muted-foreground">{new Date(threat.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Confidence Score</p>
                        <p className="text-sm text-muted-foreground">{threat.confidence}%</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Affected Assets</p>
                      <div className="flex flex-wrap gap-2">
                        {threat.affectedAssets.map((asset, index) => (
                          <Badge key={index} variant="secondary">{asset}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-2">
                        {threat.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Mark as False Positive
                        </Button>
                        <Button size="sm">
                          Investigate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Monitored Assets</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Add email, domain, or brand to monitor"
                  value={newAsset}
                  onChange={(e) => setNewAsset(e.target.value)}
                  className="w-80"
                />
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {assets.map((asset) => (
                <Card key={asset.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {asset.type === 'email' && <User className="h-5 w-5 text-primary" />}
                          {asset.type === 'domain' && <Globe className="h-5 w-5 text-primary" />}
                          {asset.type === 'brand' && <Building className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <h4 className="font-semibold">{asset.value}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{asset.type} monitoring</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={asset.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {asset.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium">Threats Found</p>
                        <p className="text-2xl font-bold text-red-600">{asset.threatsFound}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Scan</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(asset.lastScan).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Added</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(asset.addedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        View Threats
                      </Button>
                      <Button variant="outline" size="sm">
                        Scan Now
                      </Button>
                      <Button variant="outline" size="sm">
                        Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Threat Intelligence Reports</CardTitle>
                <CardDescription>Generate comprehensive reports for stakeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Executive Summary Report</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      High-level overview of threats and security posture
                    </p>
                    <Button className="w-full">Generate Report</Button>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Technical Threat Report</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Detailed technical analysis for security teams
                    </p>
                    <Button className="w-full">Generate Report</Button>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Compliance Report</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Regulatory compliance and audit documentation
                    </p>
                    <Button className="w-full">Generate Report</Button>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Trend Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Historical threat trends and patterns
                    </p>
                    <Button className="w-full">Generate Report</Button>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default SafeWebDashboard;