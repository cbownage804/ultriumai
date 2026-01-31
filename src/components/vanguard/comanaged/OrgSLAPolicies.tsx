/**
 * Per-Organization SLA Policies Manager
 * Configure different SLA targets for each co-managed client
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Clock, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Target,
  AlertTriangle,
  CheckCircle2,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SLAPolicy {
  id: string;
  organization_id: string | null;
  policy_name: string;
  is_default: boolean;
  p1_response_minutes: number;
  p2_response_minutes: number;
  p3_response_minutes: number;
  p4_response_minutes: number;
  p1_resolution_hours: number;
  p2_resolution_hours: number;
  p3_resolution_hours: number;
  p4_resolution_hours: number;
  business_hours_only: boolean;
  business_start_hour: number;
  business_end_hour: number;
  auto_escalate_at_percent: number;
  is_active: boolean;
}

const defaultPolicy: Partial<SLAPolicy> = {
  policy_name: '',
  is_default: false,
  p1_response_minutes: 15,
  p2_response_minutes: 60,
  p3_response_minutes: 240,
  p4_response_minutes: 480,
  p1_resolution_hours: 4,
  p2_resolution_hours: 8,
  p3_resolution_hours: 24,
  p4_resolution_hours: 72,
  business_hours_only: true,
  business_start_hour: 9,
  business_end_hour: 17,
  auto_escalate_at_percent: 75,
  is_active: true
};

export const OrgSLAPolicies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Partial<SLAPolicy> | null>(null);

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id) return;

    const [policiesRes, orgsRes] = await Promise.all([
      supabase
        .from('vanguard_org_sla_policies')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false }),
      supabase
        .from('comanaged_organizations')
        .select('id, name')
        .eq('user_id', user.id)
    ]);

    if (policiesRes.data) setPolicies(policiesRes.data);
    if (orgsRes.data) setOrganizations(orgsRes.data);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user?.id || !editingPolicy?.policy_name) return;

    const payload = {
      policy_name: editingPolicy.policy_name || 'Default SLA',
      user_id: user.id,
      organization_id: editingPolicy.organization_id || null,
      is_default: editingPolicy.is_default ?? false,
      p1_response_minutes: editingPolicy.p1_response_minutes ?? 15,
      p2_response_minutes: editingPolicy.p2_response_minutes ?? 60,
      p3_response_minutes: editingPolicy.p3_response_minutes ?? 240,
      p4_response_minutes: editingPolicy.p4_response_minutes ?? 480,
      p1_resolution_hours: editingPolicy.p1_resolution_hours ?? 4,
      p2_resolution_hours: editingPolicy.p2_resolution_hours ?? 8,
      p3_resolution_hours: editingPolicy.p3_resolution_hours ?? 24,
      p4_resolution_hours: editingPolicy.p4_resolution_hours ?? 72,
      business_hours_only: editingPolicy.business_hours_only ?? true,
      business_start_hour: editingPolicy.business_start_hour ?? 9,
      business_end_hour: editingPolicy.business_end_hour ?? 17,
      auto_escalate_at_percent: editingPolicy.auto_escalate_at_percent ?? 75,
      is_active: editingPolicy.is_active ?? true
    };

    let error;
    if (editingPolicy.id) {
      const { error: e } = await supabase
        .from('vanguard_org_sla_policies')
        .update(payload)
        .eq('id', editingPolicy.id);
      error = e;
    } else {
      const { error: e } = await supabase
        .from('vanguard_org_sla_policies')
        .insert([payload]);
      error = e;
    }

    if (error) {
      toast({ title: "Error", description: "Failed to save policy.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "SLA policy saved successfully." });
      setDialogOpen(false);
      setEditingPolicy(null);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('vanguard_org_sla_policies')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete policy.", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "SLA policy removed." });
      fetchData();
    }
  };

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return 'All Organizations (Default)';
    return organizations.find(o => o.id === orgId)?.name || 'Unknown';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    return `${Math.round(minutes / 60)}h`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Per-Organization SLA Policies</h2>
          <p className="text-white/60">Configure different SLA targets for each client</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setEditingPolicy(defaultPolicy)}
              className="bg-gradient-to-r from-cyan-500 to-purple-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New SLA Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-slate-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingPolicy?.id ? 'Edit' : 'Create'} SLA Policy
              </DialogTitle>
            </DialogHeader>
            {editingPolicy && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/80">Policy Name</Label>
                    <Input
                      value={editingPolicy.policy_name || ''}
                      onChange={(e) => setEditingPolicy({ ...editingPolicy, policy_name: e.target.value })}
                      placeholder="Enterprise SLA"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Organization</Label>
                    <Select 
                      value={editingPolicy.organization_id || 'default'}
                      onValueChange={(v) => setEditingPolicy({ 
                        ...editingPolicy, 
                        organization_id: v === 'default' ? null : v,
                        is_default: v === 'default'
                      })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (All Orgs)</SelectItem>
                        {organizations.map(org => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-white/80">Response Time Targets</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {['P1', 'P2', 'P3', 'P4'].map((priority, i) => (
                      <div key={priority} className="space-y-1">
                        <Label className="text-xs text-white/60">{priority} (minutes)</Label>
                        <Input
                          type="number"
                          value={editingPolicy[`p${i+1}_response_minutes` as keyof SLAPolicy] as number || 0}
                          onChange={(e) => setEditingPolicy({ 
                            ...editingPolicy, 
                            [`p${i+1}_response_minutes`]: parseInt(e.target.value) 
                          })}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-white/80">Resolution Time Targets</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {['P1', 'P2', 'P3', 'P4'].map((priority, i) => (
                      <div key={priority} className="space-y-1">
                        <Label className="text-xs text-white/60">{priority} (hours)</Label>
                        <Input
                          type="number"
                          value={editingPolicy[`p${i+1}_resolution_hours` as keyof SLAPolicy] as number || 0}
                          onChange={(e) => setEditingPolicy({ 
                            ...editingPolicy, 
                            [`p${i+1}_resolution_hours`]: parseInt(e.target.value) 
                          })}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <Label className="text-white/80">Business Hours Only</Label>
                    <Switch
                      checked={editingPolicy.business_hours_only}
                      onCheckedChange={(v) => setEditingPolicy({ ...editingPolicy, business_hours_only: v })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Auto-Escalate at %</Label>
                    <Input
                      type="number"
                      value={editingPolicy.auto_escalate_at_percent || 75}
                      onChange={(e) => setEditingPolicy({ 
                        ...editingPolicy, 
                        auto_escalate_at_percent: parseInt(e.target.value) 
                      })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-white/10" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500" onClick={handleSave}>
                    Save Policy
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="text-white/60">Policy</TableHead>
                <TableHead className="text-white/60">Organization</TableHead>
                <TableHead className="text-white/60">Response (P1-P4)</TableHead>
                <TableHead className="text-white/60">Resolution (P1-P4)</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/60 py-8">
                    Loading policies...
                  </TableCell>
                </TableRow>
              ) : policies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/60 py-8">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No SLA policies configured
                  </TableCell>
                </TableRow>
              ) : (
                policies.map((policy) => (
                  <TableRow key={policy.id} className="border-white/10">
                    <TableCell className="text-white font-medium">
                      <div className="flex items-center gap-2">
                        {policy.policy_name}
                        {policy.is_default && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Default</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white/80">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-white/40" />
                        {getOrgName(policy.organization_id)}
                      </div>
                    </TableCell>
                    <TableCell className="text-white/80 text-sm">
                      {formatTime(policy.p1_response_minutes)} / {formatTime(policy.p2_response_minutes)} / {formatTime(policy.p3_response_minutes)} / {formatTime(policy.p4_response_minutes)}
                    </TableCell>
                    <TableCell className="text-white/80 text-sm">
                      {policy.p1_resolution_hours}h / {policy.p2_resolution_hours}h / {policy.p3_resolution_hours}h / {policy.p4_resolution_hours}h
                    </TableCell>
                    <TableCell>
                      {policy.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                      ) : (
                        <Badge className="bg-white/10 text-white/60">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingPolicy(policy); setDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(policy.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgSLAPolicies;
