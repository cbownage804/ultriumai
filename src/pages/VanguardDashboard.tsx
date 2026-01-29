import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Building2, Download, Plus, RefreshCw, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddOrganizationDialog } from "@/components/vanguard/AddOrganizationDialog";
import { useMSP } from "@/hooks/useMSP";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Dashboard widgets
import { TicketStatusWidget } from "@/components/vanguard/dashboard/TicketStatusWidget";
import { AlertStatusWidget } from "@/components/vanguard/dashboard/AlertStatusWidget";
import { AvailabilityMonitoringWidget } from "@/components/vanguard/dashboard/AvailabilityMonitoringWidget";
import { RecentAlertsWidget } from "@/components/vanguard/dashboard/RecentAlertsWidget";
import { CustomerTicketsWidget } from "@/components/vanguard/dashboard/CustomerTicketsWidget";
import { CriticalTicketsWidget } from "@/components/vanguard/dashboard/CriticalTicketsWidget";
import { TicketActivityWidget } from "@/components/vanguard/dashboard/TicketActivityWidget";

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
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  
  // Filter devices based on selected org
  const displayDevices = selectedOrgId === 'all' 
    ? agents 
    : agents.filter(a => a.client_id === selectedOrgId);

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

  // Mock data for widgets (replace with real data when available)
  const ticketStats = { open: 14, pending: 0, dueToday: 0, overdue: 12 };
  const alertStats = { warning: 1, critical: 4 };
  
  const recentAlerts: any[] = [];
  const customerTickets = organizations.map(org => ({
    client_id: org.id,
    client_name: org.company_name,
    ticket_count: 0
  }));
  const criticalTickets: any[] = [];
  const ticketActivity: any[] = [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-[200px] bg-card/50 border-white/10">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Organizations" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>
                  {org.company_name}
                  {org.device_count !== undefined && org.device_count > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({org.device_count})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setShowAddOrg(true)} className="border-white/10">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px] bg-card/50 border-white/10"
            />
          </div>
          
          <Button variant="outline" size="icon" onClick={handleRefresh} className="border-white/10">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {selectedOrgId !== 'all' && (
            <Button onClick={() => navigate(`/vanguard/setup?client=${selectedOrgId}`)}>
              <Download className="h-4 w-4 mr-2" />
              Install agent
            </Button>
          )}
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {selectedOrg && (
          <p className="text-sm text-muted-foreground">{selectedOrg.company_name}</p>
        )}
      </div>

      {/* Top Row: Ticket Status + Alert Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TicketStatusWidget {...ticketStats} />
        </div>
        <div>
          <AlertStatusWidget {...alertStats} />
        </div>
      </div>

      {/* Middle Row: Availability + Recent Alerts + Ticket Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AvailabilityMonitoringWidget devices={displayDevices} />
        <RecentAlertsWidget alerts={recentAlerts} />
        <TicketActivityWidget data={ticketActivity} />
      </div>

      {/* Bottom Row: Customer Tickets + Critical Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CustomerTicketsWidget customers={customerTickets} />
        <div className="lg:col-span-2">
          <CriticalTicketsWidget tickets={criticalTickets} />
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
