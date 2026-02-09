import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, UserPlus, Search, MoreVertical, Shield, Key, UserX, Edit, Eye, Check, Loader2, Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface InternalTechnician {
  id: string;
  email: string;
  full_name: string;
  job_title: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  invite_accepted_at: string | null;
  can_create_tickets: boolean;
  can_close_tickets: boolean;
  can_assign_tickets: boolean;
  can_escalate_to_msp: boolean;
  can_view_all_tickets: boolean;
  can_manage_users: boolean;
  can_view_reports: boolean;
}

interface InternalTechManagerProps {
  organizationId?: string;
  organizationName?: string;
}

export function InternalTechManager({ organizationId, organizationName }: InternalTechManagerProps) {
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState<InternalTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTech, setNewTech] = useState({ email: "", full_name: "", job_title: "", role: "technician" });

  const loadTechnicians = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('comanaged_internal_technicians')
        .select('*')
        .eq('organization_id', organizationId)
        .order('full_name');
      if (error) throw error;
      setTechnicians((data || []).map((t: any) => ({
        id: t.id,
        email: t.email,
        full_name: t.full_name,
        job_title: t.job_title || '',
        role: t.role || 'technician',
        is_active: t.is_active ?? true,
        last_login_at: t.last_login_at,
        invite_accepted_at: t.invite_accepted_at,
        can_create_tickets: t.can_create_tickets ?? true,
        can_close_tickets: t.can_close_tickets ?? true,
        can_assign_tickets: t.can_assign_tickets ?? false,
        can_escalate_to_msp: t.can_escalate_to_msp ?? true,
        can_view_all_tickets: t.can_view_all_tickets ?? true,
        can_manage_users: t.can_manage_users ?? false,
        can_view_reports: t.can_view_reports ?? false,
      })));
    } catch (err) {
      console.error('Failed to load technicians:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { loadTechnicians(); }, [loadTechnicians]);

  const filteredTechs = technicians.filter(t =>
    t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTech = async () => {
    if (!newTech.email || !newTech.full_name || !organizationId || !user) { toast.error('Name and email required'); return; }
    try {
      const { error } = await (supabase as any).from('comanaged_internal_technicians').insert({
        organization_id: organizationId,
        user_id: user.id,
        email: newTech.email,
        full_name: newTech.full_name,
        job_title: newTech.job_title,
        role: newTech.role,
      });
      if (error) throw error;
      toast.success('Technician added');
      setShowAddDialog(false);
      setNewTech({ email: "", full_name: "", job_title: "", role: "technician" });
      loadTechnicians();
    } catch { toast.error('Failed to add technician'); }
  };

  const handleToggleActive = async (tech: InternalTechnician) => {
    try {
      const { error } = await (supabase as any).from('comanaged_internal_technicians')
        .update({ is_active: !tech.is_active })
        .eq('id', tech.id);
      if (error) throw error;
      setTechnicians(prev => prev.map(t => t.id === tech.id ? { ...t, is_active: !t.is_active } : t));
      toast.success(tech.is_active ? 'Deactivated' : 'Activated');
    } catch { toast.error('Failed to update'); }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-purple-500/20 text-purple-400">Admin</Badge>;
      case 'technician': return <Badge className="bg-cyan-500/20 text-cyan-400">Technician</Badge>;
      case 'viewer': return <Badge className="bg-gray-500/20 text-gray-400">Viewer</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  const getStatusBadge = (tech: InternalTechnician) => {
    if (!tech.invite_accepted_at) return <Badge className="bg-amber-500/20 text-amber-400">Pending</Badge>;
    if (!tech.is_active) return <Badge className="bg-red-500/20 text-red-400">Deactivated</Badge>;
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

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="h-6 w-6 text-cyan-400" />Internal IT Technicians</h2>
          <p className="text-white/60">Manage your client's internal IT staff accounts</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />Add Internal Tech
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-black/40 border-cyan-500/30"><CardContent className="pt-6"><p className="text-sm text-white/60">Total</p><p className="text-3xl font-bold text-white">{technicians.length}</p></CardContent></Card>
        <Card className="bg-black/40 border-cyan-500/30"><CardContent className="pt-6"><p className="text-sm text-white/60">Active</p><p className="text-3xl font-bold text-green-400">{technicians.filter(t => t.is_active && t.invite_accepted_at).length}</p></CardContent></Card>
        <Card className="bg-black/40 border-cyan-500/30"><CardContent className="pt-6"><p className="text-sm text-white/60">Pending</p><p className="text-3xl font-bold text-amber-400">{technicians.filter(t => !t.invite_accepted_at).length}</p></CardContent></Card>
        <Card className="bg-black/40 border-cyan-500/30"><CardContent className="pt-6"><p className="text-sm text-white/60">Admins</p><p className="text-3xl font-bold text-purple-400">{technicians.filter(t => t.role === 'admin').length}</p></CardContent></Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input placeholder="Search technicians..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-black/40 border-cyan-500/30 text-white" />
      </div>

      <Card className="bg-black/40 border-cyan-500/30">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-cyan-500/20 hover:bg-transparent">
                <TableHead className="text-white/60">Technician</TableHead>
                <TableHead className="text-white/60">Role</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Last Active</TableHead>
                <TableHead className="text-white/60 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTechs.map((tech) => (
                <TableRow key={tech.id} className="border-cyan-500/20 hover:bg-cyan-500/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-cyan-500/30">
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400">{tech.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium">{tech.full_name}</p>
                        <p className="text-xs text-white/40">{tech.email}</p>
                        {tech.job_title && <p className="text-xs text-white/30">{tech.job_title}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(tech.role)}</TableCell>
                  <TableCell>{getStatusBadge(tech)}</TableCell>
                  <TableCell><span className="text-white/60 text-sm">{formatLastLogin(tech.last_login_at)}</span></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black/95 border-cyan-500/30">
                        <DropdownMenuItem className="text-white hover:bg-cyan-500/10"><Edit className="h-4 w-4 mr-2" />Edit Permissions</DropdownMenuItem>
                        <DropdownMenuItem className="text-white hover:bg-cyan-500/10"><Eye className="h-4 w-4 mr-2" />View Activity</DropdownMenuItem>
                        {!tech.invite_accepted_at && (
                          <DropdownMenuItem className="text-white hover:bg-cyan-500/10" onClick={() => toast.success(`Invite resent to ${tech.email}`)}><Send className="h-4 w-4 mr-2" />Resend Invite</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-cyan-500/20" />
                        <DropdownMenuItem className={tech.is_active ? "text-red-400 hover:bg-red-500/10" : "text-green-400 hover:bg-green-500/10"} onClick={() => handleToggleActive(tech)}>
                          {tech.is_active ? <><UserX className="h-4 w-4 mr-2" />Deactivate</> : <><Check className="h-4 w-4 mr-2" />Activate</>}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTechs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-white/40 py-8">No technicians found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg bg-black/95 border-cyan-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-cyan-400" />Add Internal IT Technician</DialogTitle>
            <DialogDescription>Create an account for your client's IT staff member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-white/80">Full Name *</Label><Input value={newTech.full_name} onChange={(e) => setNewTech(p => ({ ...p, full_name: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="John Doe" /></div>
              <div className="space-y-2"><Label className="text-white/80">Email *</Label><Input type="email" value={newTech.email} onChange={(e) => setNewTech(p => ({ ...p, email: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="john@client.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-white/80">Job Title</Label><Input value={newTech.job_title} onChange={(e) => setNewTech(p => ({ ...p, job_title: e.target.value }))} className="bg-black/40 border-cyan-500/30 text-white" placeholder="IT Manager" /></div>
              <div className="space-y-2">
                <Label className="text-white/80">Role</Label>
                <Select value={newTech.role} onValueChange={(v) => setNewTech(p => ({ ...p, role: v }))}>
                  <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="technician">Technician</SelectItem><SelectItem value="viewer">Viewer</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddTech} className="bg-cyan-600 hover:bg-cyan-700">Add Technician</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
