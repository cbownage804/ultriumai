import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Monitor, Ticket, AlertTriangle, Building2, Download,
  Settings, BarChart3, RefreshCw
} from "lucide-react";
import { OrganizationSidebar } from "@/components/vanguard/OrganizationSidebar";
import { OrgDevicesTab } from "@/components/vanguard/OrgDevicesTab";
import { OrgTicketsTab } from "@/components/vanguard/OrgTicketsTab";
import { OrgAlertsTab } from "@/components/vanguard/OrgAlertsTab";
import { AddOrganizationDialog } from "@/components/vanguard/AddOrganizationDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { msp, clients, createClient, isLoading: mspLoading } = useMSP();
  const { agents, refetch: refreshAgents } = useVanguardAgents();
  
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
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
    if (selectedOrgId) {
      loadOrgData(selectedOrgId);
    } else {
      // Load all data when "All Organizations" is selected
      loadAllData();
    }
  }, [selectedOrgId, agents]);

  const loadOrgData = async (orgId: string) => {
    setIsLoadingData(true);
    try {
      // Filter agents for this organization
      const devices = agents.filter(a => a.client_id === orgId);
      setOrgDevices(devices);

      // Load tickets for this organization (mock for now)
      setOrgTickets([]);

      // Load alerts for this organization (mock for now)
      setOrgAlerts([]);
    } catch (error) {
      console.error('Error loading org data:', error);
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
      toast.success(`Organization "${data.company_name}" added successfully`);
      setSelectedOrgId(result.id);
    }
  };

  const handleRefresh = () => {
    refreshAgents();
    if (selectedOrgId) {
      loadOrgData(selectedOrgId);
    }
    toast.success('Data refreshed');
  };

  // Calculate stats
  const totalDevices = agents.length;
  const onlineDevices = agents.filter(a => {
    if (!a.last_heartbeat) return false;
    return Date.now() - new Date(a.last_heartbeat).getTime() < 5 * 60 * 1000;
  }).length;
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter(o => o.is_active).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <OrganizationSidebar
        organizations={organizations}
        selectedOrgId={selectedOrgId}
        onSelectOrg={setSelectedOrgId}
        onAddOrg={() => setShowAddOrg(true)}
        isLoading={mspLoading}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">
                  {selectedOrg ? selectedOrg.company_name : 'All Organizations'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedOrg 
                    ? `Managing ${orgDevices.length} device${orgDevices.length !== 1 ? 's' : ''}`
                    : `${totalOrgs} organization${totalOrgs !== 1 ? 's' : ''} • ${totalDevices} device${totalDevices !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {selectedOrg && (
                <Button 
                  size="sm"
                  onClick={() => navigate(`/vanguard/setup?client=${selectedOrgId}`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Deploy Agent
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Devices</p>
                    <p className="text-2xl font-bold">{selectedOrg ? orgDevices.length : totalDevices}</p>
                  </div>
                  <Monitor className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Online</p>
                    <p className="text-2xl font-bold text-green-500">
                      {selectedOrg 
                        ? orgDevices.filter(d => d.last_heartbeat && Date.now() - new Date(d.last_heartbeat).getTime() < 5 * 60 * 1000).length
                        : onlineDevices
                      }
                    </p>
                  </div>
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Open Tickets</p>
                    <p className="text-2xl font-bold text-blue-500">{orgTickets.filter(t => t.status === 'open').length}</p>
                  </div>
                  <Ticket className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                    <p className="text-2xl font-bold text-orange-500">{orgAlerts.filter(a => a.status === 'new').length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6 pt-4 border-b">
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
            </div>

            <div className="flex-1 p-6 overflow-auto">
              <TabsContent value="devices" className="mt-0 h-full">
                <OrgDevicesTab
                  orgId={selectedOrgId || 'all'}
                  orgName={selectedOrg?.company_name || 'All Organizations'}
                  devices={orgDevices}
                  isLoading={isLoadingData}
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="tickets" className="mt-0 h-full">
                <OrgTicketsTab
                  orgId={selectedOrgId || 'all'}
                  orgName={selectedOrg?.company_name || 'All Organizations'}
                  tickets={orgTickets}
                  isLoading={isLoadingData}
                  onCreateTicket={(ticket) => {
                    console.log('Create ticket:', ticket);
                    toast.success('Ticket created');
                  }}
                />
              </TabsContent>

              <TabsContent value="alerts" className="mt-0 h-full">
                <OrgAlertsTab
                  orgId={selectedOrgId || 'all'}
                  orgName={selectedOrg?.company_name || 'All Organizations'}
                  alerts={orgAlerts}
                  isLoading={isLoadingData}
                  onResolveAlert={(alertId) => {
                    console.log('Resolve alert:', alertId);
                    toast.success('Alert resolved');
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

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
