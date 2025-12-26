import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, Server, Shield, AlertTriangle, TrendingUp, TrendingDown,
  Search, ChevronRight, Users, Globe, CheckCircle, XCircle, Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Vulnerability {
  id: string;
  vulnerability_id: string;
  title: string;
  severity: string;
  status: string | null;
  discovered_at: string;
  device_id: string | null;
}

interface Organization {
  id: string;
  name: string;
  sites: Site[];
}

interface Site {
  id: string;
  name: string;
  location: string;
  deviceCount: number;
  vulnerabilities: VulnSummary;
  lastScan: string | null;
  scanStatus: 'idle' | 'scanning' | 'completed' | 'failed';
}

interface VulnSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  newThisWeek: number;
  resolvedThisWeek: number;
}

interface VulnMultiTenantDashboardProps {
  vulnerabilities: Vulnerability[];
  agents: Array<{ id: string; name: string; hostname: string; ip_address: string; status: string }>;
  clients: Array<{ id: string; company_name: string }>;
}

export function VulnMultiTenantDashboard({ vulnerabilities, agents, clients }: VulnMultiTenantDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'vulns' | 'critical'>('critical');

  // Build organization structure from agents and clients
  const organizations = useMemo(() => {
    const orgs: Organization[] = [];
    
    // Group agents by client or create default org
    const agentsByClient = new Map<string, typeof agents>();
    
    agents.forEach(agent => {
      const clientId = 'default'; // In real impl, agents would have client_id
      if (!agentsByClient.has(clientId)) {
        agentsByClient.set(clientId, []);
      }
      agentsByClient.get(clientId)!.push(agent);
    });

    // Create organizations from clients
    if (clients.length > 0) {
      clients.forEach(client => {
        const clientAgents = agents; // In real impl, filter by client
        const clientVulns = vulnerabilities; // In real impl, filter by client
        
        const vulnSummary: VulnSummary = {
          critical: clientVulns.filter(v => v.severity.toLowerCase() === 'critical').length,
          high: clientVulns.filter(v => v.severity.toLowerCase() === 'high').length,
          medium: clientVulns.filter(v => v.severity.toLowerCase() === 'medium').length,
          low: clientVulns.filter(v => v.severity.toLowerCase() === 'low').length,
          total: clientVulns.length,
          newThisWeek: clientVulns.filter(v => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(v.discovered_at) >= weekAgo;
          }).length,
          resolvedThisWeek: clientVulns.filter(v => v.status === 'patched').length,
        };

        orgs.push({
          id: client.id,
          name: client.company_name,
          sites: [{
            id: `${client.id}-main`,
            name: 'Main Site',
            location: 'Primary Network',
            deviceCount: clientAgents.length,
            vulnerabilities: vulnSummary,
            lastScan: new Date().toISOString(),
            scanStatus: 'completed',
          }]
        });
      });
    } else {
      // Default organization from agents
      const vulnSummary: VulnSummary = {
        critical: vulnerabilities.filter(v => v.severity.toLowerCase() === 'critical').length,
        high: vulnerabilities.filter(v => v.severity.toLowerCase() === 'high').length,
        medium: vulnerabilities.filter(v => v.severity.toLowerCase() === 'medium').length,
        low: vulnerabilities.filter(v => v.severity.toLowerCase() === 'low').length,
        total: vulnerabilities.length,
        newThisWeek: vulnerabilities.filter(v => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(v.discovered_at) >= weekAgo;
        }).length,
        resolvedThisWeek: vulnerabilities.filter(v => v.status === 'patched').length,
      };

      orgs.push({
        id: 'default',
        name: 'My Organization',
        sites: agents.map(agent => ({
          id: agent.id,
          name: agent.name,
          location: agent.ip_address,
          deviceCount: 1,
          vulnerabilities: vulnSummary,
          lastScan: new Date().toISOString(),
          scanStatus: agent.status === 'online' ? 'completed' : 'idle',
        }))
      });
    }

    return orgs;
  }, [agents, clients, vulnerabilities]);

  // Calculate totals
  const totals = useMemo(() => {
    return {
      organizations: organizations.length,
      sites: organizations.reduce((sum, org) => sum + org.sites.length, 0),
      devices: organizations.reduce((sum, org) => 
        sum + org.sites.reduce((s, site) => s + site.deviceCount, 0), 0),
      critical: vulnerabilities.filter(v => v.severity.toLowerCase() === 'critical').length,
      high: vulnerabilities.filter(v => v.severity.toLowerCase() === 'high').length,
      total: vulnerabilities.length,
      open: vulnerabilities.filter(v => v.status !== 'patched').length,
    };
  }, [organizations, vulnerabilities]);

  // Filter and sort organizations
  const filteredOrgs = useMemo(() => {
    let filtered = organizations.filter(org => 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.sites.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
      const aVulns = a.sites.reduce((sum, s) => sum + s.vulnerabilities.total, 0);
      const bVulns = b.sites.reduce((sum, s) => sum + s.vulnerabilities.total, 0);
      const aCrit = a.sites.reduce((sum, s) => sum + s.vulnerabilities.critical, 0);
      const bCrit = b.sites.reduce((sum, s) => sum + s.vulnerabilities.critical, 0);

      switch (sortBy) {
        case 'vulns': return bVulns - aVulns;
        case 'critical': return bCrit - aCrit;
        default: return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [organizations, searchQuery, sortBy]);

  const getScanStatusIcon = (status: Site['scanStatus']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'scanning': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.organizations}</p>
                <p className="text-xs text-muted-foreground">Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.sites}</p>
                <p className="text-xs text-muted-foreground">Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Server className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.devices}</p>
                <p className="text-xs text-muted-foreground">Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{totals.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.open}</p>
                <p className="text-xs text-muted-foreground">Open Vulns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizations or sites..."
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="critical">Most Critical First</SelectItem>
            <SelectItem value="vulns">Most Vulnerabilities</SelectItem>
            <SelectItem value="name">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Organizations List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {filteredOrgs.map(org => {
            const orgTotalVulns = org.sites.reduce((sum, s) => sum + s.vulnerabilities.total, 0);
            const orgCritical = org.sites.reduce((sum, s) => sum + s.vulnerabilities.critical, 0);
            const orgHigh = org.sites.reduce((sum, s) => sum + s.vulnerabilities.high, 0);
            const orgNew = org.sites.reduce((sum, s) => sum + s.vulnerabilities.newThisWeek, 0);
            const orgResolved = org.sites.reduce((sum, s) => sum + s.vulnerabilities.resolvedThisWeek, 0);
            const isExpanded = selectedOrg === org.id;

            return (
              <Card key={org.id} className={isExpanded ? 'ring-2 ring-primary' : ''}>
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedOrg(isExpanded ? null : org.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{org.name}</CardTitle>
                        <CardDescription>
                          {org.sites.length} site{org.sites.length !== 1 ? 's' : ''} • 
                          {org.sites.reduce((sum, s) => sum + s.deviceCount, 0)} devices
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Vuln counts */}
                      <div className="flex items-center gap-2">
                        {orgCritical > 0 && (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
                            {orgCritical} Critical
                          </Badge>
                        )}
                        {orgHigh > 0 && (
                          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                            {orgHigh} High
                          </Badge>
                        )}
                        <Badge variant="outline">{orgTotalVulns} Total</Badge>
                      </div>
                      
                      {/* Trend indicators */}
                      <div className="flex items-center gap-2 text-sm">
                        {orgNew > 0 && (
                          <span className="flex items-center gap-1 text-red-500">
                            <TrendingUp className="h-3 w-3" />
                            +{orgNew}
                          </span>
                        )}
                        {orgResolved > 0 && (
                          <span className="flex items-center gap-1 text-green-500">
                            <TrendingDown className="h-3 w-3" />
                            -{orgResolved}
                          </span>
                        )}
                      </div>
                      
                      <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3 mt-2">
                      {org.sites.map(site => (
                        <div 
                          key={site.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            {getScanStatusIcon(site.scanStatus)}
                            <div>
                              <p className="font-medium">{site.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {site.location} • {site.deviceCount} device{site.deviceCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Severity breakdown */}
                            <div className="flex items-center gap-1">
                              {site.vulnerabilities.critical > 0 && (
                                <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center text-red-500 text-sm font-bold">
                                  {site.vulnerabilities.critical}
                                </div>
                              )}
                              {site.vulnerabilities.high > 0 && (
                                <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-500 text-sm font-bold">
                                  {site.vulnerabilities.high}
                                </div>
                              )}
                              {site.vulnerabilities.medium > 0 && (
                                <div className="w-8 h-8 rounded bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-sm font-bold">
                                  {site.vulnerabilities.medium}
                                </div>
                              )}
                              {site.vulnerabilities.low > 0 && (
                                <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500 text-sm font-bold">
                                  {site.vulnerabilities.low}
                                </div>
                              )}
                            </div>
                            
                            {site.lastScan && (
                              <span className="text-xs text-muted-foreground">
                                Last scan: {formatDistanceToNow(new Date(site.lastScan), { addSuffix: true })}
                              </span>
                            )}
                            
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          
          {filteredOrgs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No organizations found</p>
              <p className="text-sm">Add agents to start scanning</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
