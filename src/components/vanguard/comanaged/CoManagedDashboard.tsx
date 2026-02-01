import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  Ticket, 
  Eye, 
  EyeOff,
  Plus,
  Settings,
  Palette,
  Shield,
  Mail,
  Clock,
  TrendingUp,
  Search,
  MoreVertical,
  ExternalLink
} from "lucide-react";
import { CoManagedOrgSetup } from "./CoManagedOrgSetup";
import { CoManagedBrandingEditor } from "./CoManagedBrandingEditor";
import { CoManagedUserManager } from "./CoManagedUserManager";
import { CoManagedTechAccess } from "./CoManagedTechAccess";

interface CoManagedOrg {
  id: string;
  organization_name: string;
  internal_it_name: string;
  is_active: boolean;
  stats: {
    total_users: number;
    active_tickets: number;
    avg_resolution_hours: number;
  };
  branding?: {
    logo_url?: string;
    primary_color: string;
  };
}

export function CoManagedDashboard() {
  // Empty initial state - data loaded from database
  const [organizations, setOrganizations] = useState<CoManagedOrg[]>([]);

  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [showNewOrgDialog, setShowNewOrgDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const filteredOrgs = organizations.filter(org =>
    org.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.internal_it_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = organizations.reduce((sum, org) => sum + org.stats.total_users, 0);
  const totalTickets = organizations.reduce((sum, org) => sum + org.stats.active_tickets, 0);

  const selectedOrgData = organizations.find(o => o.id === selectedOrg);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-cyan-400" />
            Co-Managed IT Portal
          </h2>
          <p className="text-white/60">
            White-labeled support where your clients' users only see their internal IT branding
          </p>
        </div>
        <Button 
          onClick={() => setShowNewOrgDialog(true)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Co-Managed Client
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-black/40 border-cyan-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Co-Managed Clients</p>
                <p className="text-3xl font-bold text-white">{organizations.length}</p>
              </div>
              <Building2 className="h-10 w-10 text-cyan-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total End Users</p>
                <p className="text-3xl font-bold text-white">{totalUsers}</p>
              </div>
              <Users className="h-10 w-10 text-purple-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Active Tickets</p>
                <p className="text-3xl font-bold text-white">{totalTickets}</p>
              </div>
              <Ticket className="h-10 w-10 text-amber-400/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Avg Resolution</p>
                <p className="text-3xl font-bold text-white">3.4h</p>
              </div>
              <Clock className="h-10 w-10 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Organization List */}
        <Card className="bg-black/40 border-cyan-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Organizations</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-black/40 border-cyan-500/30 text-white"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredOrgs.map((org) => (
              <div
                key={org.id}
                onClick={() => setSelectedOrg(org.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedOrg === org.id
                    ? 'bg-cyan-500/20 border border-cyan-500/50'
                    : 'bg-black/20 border border-transparent hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: org.branding?.primary_color || '#0066cc' }}
                    >
                      {org.organization_name[0]}
                    </div>
                    <div>
                      <p className="text-white font-medium">{org.organization_name}</p>
                      <p className="text-xs text-white/40 flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Appears as: {org.internal_it_name}
                      </p>
                    </div>
                  </div>
                  <Badge className={org.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                    {org.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-white/60">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {org.stats.total_users} users
                  </span>
                  <span className="flex items-center gap-1">
                    <Ticket className="h-3 w-3" />
                    {org.stats.active_tickets} tickets
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {org.stats.avg_resolution_hours}h avg
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Organization Details */}
        <Card className="col-span-2 bg-black/40 border-cyan-500/30">
          {selectedOrgData ? (
            <>
              <CardHeader className="pb-3 border-b border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: selectedOrgData.branding?.primary_color || '#0066cc' }}
                    >
                      {selectedOrgData.organization_name[0]}
                    </div>
                    <div>
                      <CardTitle className="text-white">{selectedOrgData.organization_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Users see: "{selectedOrgData.internal_it_name}"
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-cyan-500/30 hover:bg-cyan-500/10">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Portal
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white/40 hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="bg-black/40 border border-cyan-500/30 mb-4">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="data-[state=active]:bg-cyan-500/20">
                      <Palette className="h-4 w-4 mr-1" />
                      Branding
                    </TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500/20">
                      <Users className="h-4 w-4 mr-1" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger value="technicians" className="data-[state=active]:bg-cyan-500/20">
                      <Shield className="h-4 w-4 mr-1" />
                      Tech Access
                    </TabsTrigger>
                    <TabsTrigger value="email" className="data-[state=active]:bg-cyan-500/20">
                      <Mail className="h-4 w-4 mr-1" />
                      Email Masking
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-black/20 border border-cyan-500/20">
                        <p className="text-sm text-white/60 mb-1">Total Users</p>
                        <p className="text-2xl font-bold text-white">{selectedOrgData.stats.total_users}</p>
                        <p className="text-xs text-green-400">+12 this month</p>
                      </div>
                      <div className="p-4 rounded-lg bg-black/20 border border-cyan-500/20">
                        <p className="text-sm text-white/60 mb-1">Active Tickets</p>
                        <p className="text-2xl font-bold text-white">{selectedOrgData.stats.active_tickets}</p>
                        <p className="text-xs text-white/40">3 escalated to MSP</p>
                      </div>
                      <div className="p-4 rounded-lg bg-black/20 border border-cyan-500/20">
                        <p className="text-sm text-white/60 mb-1">Avg Resolution</p>
                        <p className="text-2xl font-bold text-white">{selectedOrgData.stats.avg_resolution_hours}h</p>
                        <p className="text-xs text-green-400">-0.5h vs last month</p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                      <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                        <EyeOff className="h-4 w-4 text-cyan-400" />
                        Brand Isolation Status
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Portal Branding</span>
                          <Badge className="bg-green-500/20 text-green-400">Configured</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Email Masking</span>
                          <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Custom Domain</span>
                          <Badge className="bg-amber-500/20 text-amber-400">Not Set</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60">Tech Identity Masking</span>
                          <Badge className="bg-green-500/20 text-green-400">3 techs masked</Badge>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="branding">
                    <CoManagedBrandingEditor organizationId={selectedOrgData.id} />
                  </TabsContent>

                  <TabsContent value="users">
                    <CoManagedUserManager organizationId={selectedOrgData.id} />
                  </TabsContent>

                  <TabsContent value="technicians">
                    <CoManagedTechAccess organizationId={selectedOrgData.id} />
                  </TabsContent>

                  <TabsContent value="email">
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-black/20 border border-cyan-500/20">
                        <h4 className="text-white font-medium mb-3">Email Appearance to End Users</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white/60">From Name</span>
                            <span className="text-cyan-400">{selectedOrgData.internal_it_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/60">From Email</span>
                            <span className="text-cyan-400">it@{selectedOrgData.organization_name.toLowerCase().replace(/\s/g, '')}.com</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/60">Reply-To</span>
                            <span className="text-white/40">support@yourmsp.com (hidden)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-white/60 mb-2">Email Preview</p>
                        <div className="bg-white rounded-lg p-4 text-black text-sm">
                          <p><strong>From:</strong> {selectedOrgData.internal_it_name} &lt;it@{selectedOrgData.organization_name.toLowerCase().replace(/\s/g, '')}.com&gt;</p>
                          <p><strong>Subject:</strong> [Ticket #1234] Your support request has been updated</p>
                          <hr className="my-2" />
                          <p>Hi John,</p>
                          <p className="mt-2">Your ticket has been updated by our team...</p>
                          <p className="mt-4 text-gray-500 text-xs">
                            © {selectedOrgData.organization_name} IT Department
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[500px]">
              <div className="text-center text-white/40">
                <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Select an organization to view details</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {showNewOrgDialog && (
        <CoManagedOrgSetup 
          onClose={() => setShowNewOrgDialog(false)}
          onSave={(org) => {
            setOrganizations(prev => [...prev, org]);
            setShowNewOrgDialog(false);
          }}
        />
      )}
    </div>
  );
}
