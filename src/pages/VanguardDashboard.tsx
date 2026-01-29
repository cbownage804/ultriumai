import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Shield, Monitor, Ticket, AlertTriangle, Building2, Download,
  Plus, RefreshCw
} from "lucide-react";
import { OrgDevicesTab } from "@/components/vanguard/OrgDevicesTab";
import { OrgTicketsTab } from "@/components/vanguard/OrgTicketsTab";
import { OrgAlertsTab } from "@/components/vanguard/OrgAlertsTab";
import { AddOrganizationDialog } from "@/components/vanguard/AddOrganizationDialog";
import { useMSP } from "@/hooks/useMSP";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Organization {
  id: string;
  company_name: string;
  is_active: boolean;
  device_count?: number;
  alert_count?: number;
}

const VanguardDashboard = () => {
  const navigate = useNavigate();
  const { clients, createClient, isLoading: mspLoading } = useMSP();
  const { agents, refetch: refreshAgents } = useVanguardAgents();
  
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState("devices");
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [orgDevices, setOrgDevices] = useState<any[]>([]);
  const [orgTickets, setOrgTickets] = useState<any[]>([]);
  const [orgAlerts, setOrgAlerts] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Transform MSP clients to organizations with device counts
  const organizations: Organization[] = clients.map(client => {
    const deviceCount = agents.filter(a => a.client_id === client.id).length;
    return {
      id: client.id,
      company_name: client.company_name,
      is_active: client.is_active,
      device_count: deviceCount,
      alert_count: client.alerts || 0
    };
  });

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);

  // Load organization-specific data when selection changes
  useEffect(() => {
    if (selectedOrgId && selectedOrgId !== 'all') {
      loadOrgData(selectedOrgId);
    } else {
      loadAllData();
    }
  }, [selectedOrgId, agents]);

  const loadOrgData = async (orgId: string) => {
    setIsLoadingData(true);
    try {
      const devices = agents.filter(a => a.client_id === orgId);
      setOrgDevices(devices);
      setOrgTickets([]);
      setOrgAlerts([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadAllData = () => {
    setOrgDevices(agents);
    setOrgTickets([]);
    setOrgAlerts([]);
  };

  const handleAddOrganization = async (data: any) => {
    const result = await createClient({
      company_name: data.company_name,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      phone: data.phone,
      business_size: data.business_size,
      monthly_rate: 0
    });

    if (result) {
      toast.success(`Organization "${data.company_name}" added`);
      setSelectedOrgId(result.id);
    }
  };

  const handleRefresh = () => {
    refreshAgents();
    toast.success('Refreshed');
  };

  // Stats
  const totalDevices = agents.length;
  const onlineDevices = agents.filter(a => {
    if (!a.last_heartbeat) return false;
    return Date.now() - new Date(a.last_heartbeat).getTime() < 5 * 60 * 1000;
  }).length;

  const displayDevices = selectedOrgId === 'all' ? agents : orgDevices;
  const displayOnline = displayDevices.filter(d => 
    d.last_heartbeat && Date.now() - new Date(d.last_heartbeat).getTime() < 5 * 60 * 1000
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Org Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">SafeOps Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {organizations.length} organization{organizations.length !== 1 ? 's' : ''} • {totalDevices} device{totalDevices !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Organization Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <span>{org.company_name}</span>
                      {org.device_count !== undefined && org.device_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {org.device_count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setShowAddOrg(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {selectedOrgId !== 'all' && (
            <Button onClick={() => navigate(`/vanguard/setup?client=${selectedOrgId}`)}>
              <Download className="h-4 w-4 mr-2" />
              Deploy Agent
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Devices</p>
                <p className="text-2xl font-bold">{displayDevices.length}</p>
              </div>
              <Monitor className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-500">{displayOnline}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-2xl font-bold text-blue-500">0</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-orange-500">0</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="devices" className="gap-2">
            <Monitor className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <Ticket className="h-4 w-4" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="mt-6">
          <OrgDevicesTab
            orgId={selectedOrgId}
            orgName={selectedOrg?.company_name || 'All Organizations'}
            devices={displayDevices}
            isLoading={isLoadingData}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <OrgTicketsTab
            orgId={selectedOrgId}
            orgName={selectedOrg?.company_name || 'All Organizations'}
            tickets={orgTickets}
            isLoading={isLoadingData}
            onCreateTicket={(ticket) => {
              toast.success('Ticket created');
            }}
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <OrgAlertsTab
            orgId={selectedOrgId}
            orgName={selectedOrg?.company_name || 'All Organizations'}
            alerts={orgAlerts}
            isLoading={isLoadingData}
            onResolveAlert={(alertId) => {
              toast.success('Alert resolved');
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Add Organization Dialog */}
      <AddOrganizationDialog
        open={showAddOrg}
        onOpenChange={setShowAddOrg}
        onSubmit={handleAddOrganization}
      />
    </div>
  );
};

export default VanguardDashboard;
