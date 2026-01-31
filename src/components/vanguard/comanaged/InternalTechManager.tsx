import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Mail,
  Shield,
  Key,
  UserX,
  Edit,
  Eye,
  Check,
  X,
  Clock,
  AlertTriangle,
  Building2,
  Send,
  Copy
} from "lucide-react";
import { toast } from "sonner";

interface InternalTechnician {
  id: string;
  organization_id: string;
  organization_name: string;
  email: string;
  full_name: string;
  job_title: string;
  role: 'admin' | 'technician' | 'viewer';
  is_active: boolean;
  last_login_at: string | null;
  invite_accepted_at: string | null;
  permissions: {
    can_create_tickets: boolean;
    can_close_tickets: boolean;
    can_assign_tickets: boolean;
    can_escalate_to_msp: boolean;
    can_view_all_tickets: boolean;
    can_manage_users: boolean;
    can_view_reports: boolean;
  };
  stats: {
    open_tickets: number;
    resolved_today: number;
    avg_resolution_hours: number;
  };
}

interface InternalTechManagerProps {
  organizationId?: string;
  organizationName?: string;
}

export function InternalTechManager({ organizationId, organizationName }: InternalTechManagerProps) {
  const [technicians, setTechnicians] = useState<InternalTechnician[]>([
    {
      id: "1",
      organization_id: "org1",
      organization_name: "Acme Corporation",
      email: "john.doe@acmecorp.com",
      full_name: "John Doe",
      job_title: "IT Manager",
      role: 'admin',
      is_active: true,
      last_login_at: "2026-01-31T09:30:00Z",
      invite_accepted_at: "2026-01-15T14:00:00Z",
      permissions: {
        can_create_tickets: true,
        can_close_tickets: true,
        can_assign_tickets: true,
        can_escalate_to_msp: true,
        can_view_all_tickets: true,
        can_manage_users: true,
        can_view_reports: true
      },
      stats: { open_tickets: 5, resolved_today: 3, avg_resolution_hours: 2.5 }
    },
    {
      id: "2",
      organization_id: "org1",
      organization_name: "Acme Corporation",
      email: "jane.smith@acmecorp.com",
      full_name: "Jane Smith",
      job_title: "IT Support Specialist",
      role: 'technician',
      is_active: true,
      last_login_at: "2026-01-31T10:15:00Z",
      invite_accepted_at: "2026-01-20T09:00:00Z",
      permissions: {
        can_create_tickets: true,
        can_close_tickets: true,
        can_assign_tickets: false,
        can_escalate_to_msp: true,
        can_view_all_tickets: true,
        can_manage_users: false,
        can_view_reports: false
      },
      stats: { open_tickets: 8, resolved_today: 5, avg_resolution_hours: 1.8 }
    },
    {
      id: "3",
      organization_id: "org1",
      organization_name: "Acme Corporation",
      email: "bob.wilson@acmecorp.com",
      full_name: "Bob Wilson",
      job_title: "Junior IT Support",
      role: 'technician',
      is_active: true,
      last_login_at: null,
      invite_accepted_at: null,
      permissions: {
        can_create_tickets: true,
        can_close_tickets: false,
        can_assign_tickets: false,
        can_escalate_to_msp: false,
        can_view_all_tickets: false,
        can_manage_users: false,
        can_view_reports: false
      },
      stats: { open_tickets: 0, resolved_today: 0, avg_resolution_hours: 0 }
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTech, setSelectedTech] = useState<InternalTechnician | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [newTech, setNewTech] = useState({
    email: "",
    full_name: "",
    job_title: "",
    role: "technician" as const,
    permissions: {
      can_create_tickets: true,
      can_close_tickets: true,
      can_assign_tickets: false,
      can_escalate_to_msp: true,
      can_view_all_tickets: true,
      can_manage_users: false,
      can_view_reports: false
    }
  });

  const filteredTechs = technicians.filter(tech =>
    tech.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTech = () => {
    const tech: InternalTechnician = {
      id: Date.now().toString(),
      organization_id: organizationId || "org1",
      organization_name: organizationName || "Acme Corporation",
      ...newTech,
      is_active: true,
      last_login_at: null,
      invite_accepted_at: null,
      stats: { open_tickets: 0, resolved_today: 0, avg_resolution_hours: 0 }
    };
    setTechnicians(prev => [...prev, tech]);
    setShowAddDialog(false);
    setNewTech({
      email: "",
      full_name: "",
      job_title: "",
      role: "technician",
      permissions: {
        can_create_tickets: true,
        can_close_tickets: true,
        can_assign_tickets: false,
        can_escalate_to_msp: true,
        can_view_all_tickets: true,
        can_manage_users: false,
        can_view_reports: false
      }
    });
    toast.success("Technician added. Invitation email sent!");
  };

  const handleResendInvite = (tech: InternalTechnician) => {
    toast.success(`Invitation resent to ${tech.email}`);
  };

  const handleToggleActive = (tech: InternalTechnician) => {
    setTechnicians(prev => prev.map(t => 
      t.id === tech.id ? { ...t, is_active: !t.is_active } : t
    ));
    toast.success(tech.is_active ? "Technician deactivated" : "Technician activated");
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-500/20 text-purple-400">Admin</Badge>;
      case 'technician':
        return <Badge className="bg-cyan-500/20 text-cyan-400">Technician</Badge>;
      case 'viewer':
        return <Badge className="bg-gray-500/20 text-gray-400">Viewer</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const getStatusBadge = (tech: InternalTechnician) => {
    if (!tech.invite_accepted_at) {
      return <Badge className="bg-amber-500/20 text-amber-400">Pending Invite</Badge>;
    }
    if (!tech.is_active) {
      return <Badge className="bg-red-500/20 text-red-400">Deactivated</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
  };

  const formatLastLogin = (date: string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-400" />
            Internal IT Technicians
          </h2>
          <p className="text-white/60">
            Manage your client's internal IT staff accounts
          </p>
        </div>
        <Button 
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Internal Tech
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-black/40 border-cyan-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Total Technicians</p>
            <p className="text-3xl font-bold text-white">{technicians.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Active Today</p>
            <p className="text-3xl font-bold text-green-400">
              {technicians.filter(t => t.last_login_at && new Date(t.last_login_at).toDateString() === new Date().toDateString()).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Pending Invites</p>
            <p className="text-3xl font-bold text-amber-400">
              {technicians.filter(t => !t.invite_accepted_at).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-white/60">Open Tickets (All)</p>
            <p className="text-3xl font-bold text-white">
              {technicians.reduce((sum, t) => sum + t.stats.open_tickets, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search technicians..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/40 border-cyan-500/30 text-white"
          />
        </div>
      </div>

      {/* Technician Table */}
      <Card className="bg-black/40 border-cyan-500/30">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-cyan-500/20 hover:bg-transparent">
                <TableHead className="text-white/60">Technician</TableHead>
                <TableHead className="text-white/60">Role</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Last Active</TableHead>
                <TableHead className="text-white/60">Tickets</TableHead>
                <TableHead className="text-white/60 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTechs.map((tech) => (
                <TableRow key={tech.id} className="border-cyan-500/20 hover:bg-cyan-500/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-cyan-500/30">
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                          {tech.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{tech.full_name}</p>
                        <p className="text-xs text-white/40">{tech.email}</p>
                        <p className="text-xs text-white/30">{tech.job_title}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(tech.role)}</TableCell>
                  <TableCell>{getStatusBadge(tech)}</TableCell>
                  <TableCell>
                    <span className="text-white/60 text-sm">
                      {formatLastLogin(tech.last_login_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-white">{tech.stats.open_tickets}</span>
                      <span className="text-white/40"> open</span>
                      {tech.stats.resolved_today > 0 && (
                        <span className="text-green-400 ml-2">+{tech.stats.resolved_today} today</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/95 border-cyan-500/30">
                        <DropdownMenuItem 
                          className="text-white hover:bg-cyan-500/10"
                          onClick={() => {
                            setSelectedTech(tech);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-white hover:bg-cyan-500/10">
                          <Eye className="h-4 w-4 mr-2" />
                          View Activity
                        </DropdownMenuItem>
                        {!tech.invite_accepted_at && (
                          <DropdownMenuItem 
                            className="text-white hover:bg-cyan-500/10"
                            onClick={() => handleResendInvite(tech)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Resend Invite
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-white hover:bg-cyan-500/10">
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-cyan-500/20" />
                        <DropdownMenuItem 
                          className={tech.is_active ? "text-red-400 hover:bg-red-500/10" : "text-green-400 hover:bg-green-500/10"}
                          onClick={() => handleToggleActive(tech)}
                        >
                          {tech.is_active ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Technician Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg bg-black/95 border-cyan-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-400" />
              Add Internal IT Technician
            </DialogTitle>
            <DialogDescription>
              Create an account for your client's IT staff member
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm">
              <p className="text-cyan-400 font-medium mb-1">📧 Invitation Email</p>
              <p className="text-white/70">
                They'll receive an email to set up their password and access their IT portal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/80">Full Name *</Label>
                <Input
                  value={newTech.full_name}
                  onChange={(e) => setNewTech(prev => ({ ...prev, full_name: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Email *</Label>
                <Input
                  type="email"
                  value={newTech.email}
                  onChange={(e) => setNewTech(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white"
                  placeholder="john@client.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/80">Job Title</Label>
                <Input
                  value={newTech.job_title}
                  onChange={(e) => setNewTech(prev => ({ ...prev, job_title: e.target.value }))}
                  className="bg-black/40 border-cyan-500/30 text-white"
                  placeholder="IT Support Specialist"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Role</Label>
                <Select
                  value={newTech.role}
                  onValueChange={(value: any) => setNewTech(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-cyan-500/30">
                    <SelectItem value="admin">Admin - Full Access</SelectItem>
                    <SelectItem value="technician">Technician - Standard</SelectItem>
                    <SelectItem value="viewer">Viewer - Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-cyan-500/20">
              <Label className="text-white/80">Permissions</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'can_create_tickets', label: 'Create Tickets' },
                  { key: 'can_close_tickets', label: 'Close Tickets' },
                  { key: 'can_assign_tickets', label: 'Assign Tickets' },
                  { key: 'can_escalate_to_msp', label: 'Escalate to MSP' },
                  { key: 'can_view_all_tickets', label: 'View All Tickets' },
                  { key: 'can_view_reports', label: 'View Reports' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-white/60 text-sm">{label}</Label>
                    <Switch
                      checked={newTech.permissions[key as keyof typeof newTech.permissions]}
                      onCheckedChange={(checked) => setNewTech(prev => ({
                        ...prev,
                        permissions: { ...prev.permissions, [key]: checked }
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-cyan-500/30">
                Cancel
              </Button>
              <Button 
                onClick={handleAddTech}
                disabled={!newTech.email || !newTech.full_name}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      {selectedTech && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-lg bg-black/95 border-cyan-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                Edit Permissions - {selectedTech.full_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-cyan-500/20">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                    {selectedTech.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium">{selectedTech.full_name}</p>
                  <p className="text-sm text-white/40">{selectedTech.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Role</Label>
                <Select defaultValue={selectedTech.role}>
                  <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-cyan-500/30">
                    <SelectItem value="admin">Admin - Full Access</SelectItem>
                    <SelectItem value="technician">Technician - Standard</SelectItem>
                    <SelectItem value="viewer">Viewer - Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2 border-t border-cyan-500/20">
                <Label className="text-white/80">Permissions</Label>
                <div className="space-y-2">
                  {[
                    { key: 'can_create_tickets', label: 'Create new tickets' },
                    { key: 'can_close_tickets', label: 'Close/resolve tickets' },
                    { key: 'can_assign_tickets', label: 'Assign tickets to others' },
                    { key: 'can_escalate_to_msp', label: 'Escalate tickets to MSP' },
                    { key: 'can_view_all_tickets', label: 'View all organization tickets' },
                    { key: 'can_manage_users', label: 'Manage end users' },
                    { key: 'can_view_reports', label: 'Access reports & analytics' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded bg-black/20">
                      <Label className="text-white/80 text-sm">{label}</Label>
                      <Switch
                        defaultChecked={selectedTech.permissions[key as keyof typeof selectedTech.permissions]}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-cyan-500/30">
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    toast.success("Permissions updated");
                    setShowEditDialog(false);
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
