import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Eye, EyeOff, UserCog, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CoManagedTechAccessProps { organizationId: string; }

interface TechAccess {
  id: string;
  technician_name: string;
  technician_email: string;
  visibility_mode: 'shadow' | 'branded' | 'hybrid';
  display_name_override: string;
  display_title_override: string;
  can_respond_as_internal: boolean;
  can_view_internal_notes: boolean;
  can_create_tickets: boolean;
  can_close_tickets: boolean;
  can_escalate: boolean;
}

export function CoManagedTechAccess({ organizationId }: CoManagedTechAccessProps) {
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState<TechAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  useEffect(() => {
    if (organizationId) loadTechs();
  }, [organizationId]);

  const loadTechs = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('comanaged_msp_tech_assignments')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const techs: TechAccess[] = (data || []).map((t: any) => ({
        id: t.id,
        technician_name: t.technician_name || '',
        technician_email: t.technician_email || '',
        visibility_mode: t.visibility_mode || 'shadow',
        display_name_override: t.display_name_override || '',
        display_title_override: t.display_title_override || '',
        can_respond_as_internal: t.can_respond_as_internal ?? true,
        can_view_internal_notes: t.can_view_internal_notes ?? true,
        can_create_tickets: t.can_create_tickets ?? true,
        can_close_tickets: t.can_close_tickets ?? true,
        can_escalate: t.can_escalate ?? true,
      }));

      setTechnicians(techs);
      if (techs.length > 0) setSelectedTech(techs[0].id);
    } catch (err) {
      console.error('Failed to load tech assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateTech = async (id: string, updates: Partial<TechAccess>) => {
    try {
      const { error } = await (supabase as any)
        .from('comanaged_msp_tech_assignments')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      setTechnicians(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success("Access settings updated");
    } catch { toast.error("Failed to update"); }
  };

  const currentTech = technicians.find(t => t.id === selectedTech);

  const getVisibilityBadge = (mode: string) => {
    switch (mode) {
      case 'shadow': return <Badge className="bg-purple-500/20 text-purple-400"><EyeOff className="h-3 w-3 mr-1" />Shadow</Badge>;
      case 'branded': return <Badge className="bg-cyan-500/20 text-cyan-400"><Eye className="h-3 w-3 mr-1" />Branded</Badge>;
      case 'hybrid': return <Badge className="bg-amber-500/20 text-amber-400"><UserCog className="h-3 w-3 mr-1" />Hybrid</Badge>;
      default: return null;
    }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm">
        <p className="text-purple-400 font-medium mb-1 flex items-center gap-2"><EyeOff className="h-4 w-4" />Technician Identity Masking</p>
        <p className="text-white/70">Control how your MSP technicians appear to end-users.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium text-sm">Assigned Technicians</h4>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 h-8"><Plus className="h-3 w-3 mr-1" />Add Tech</Button>
          </div>
          {technicians.map((tech) => (
            <div key={tech.id} onClick={() => setSelectedTech(tech.id)} className={`p-3 rounded-lg cursor-pointer transition-all ${selectedTech === tech.id ? 'bg-cyan-500/20 border border-cyan-500/50' : 'bg-black/20 border border-transparent hover:border-cyan-500/30'}`}>
              <div className="flex items-center justify-between">
                <div><p className="text-white font-medium">{tech.technician_name}</p><p className="text-xs text-white/40">{tech.technician_email}</p></div>
                {getVisibilityBadge(tech.visibility_mode)}
              </div>
              {tech.visibility_mode === 'shadow' && tech.display_name_override && (
                <p className="text-xs text-purple-400 mt-2 flex items-center gap-1"><EyeOff className="h-3 w-3" />Appears as: {tech.display_name_override}</p>
              )}
            </div>
          ))}
          {technicians.length === 0 && <p className="text-center text-white/40 py-4 text-sm">No technicians assigned</p>}
        </div>

        {currentTech && (
          <Card className="bg-black/20 border-cyan-500/20">
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Visibility Mode</Label>
                <Select value={currentTech.visibility_mode} onValueChange={(value: any) => updateTech(currentTech.id, { visibility_mode: value })}>
                  <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-black/90 border-cyan-500/30">
                    <SelectItem value="shadow"><span className="flex items-center gap-2"><EyeOff className="h-4 w-4 text-purple-400" />Shadow Mode</span></SelectItem>
                    <SelectItem value="branded"><span className="flex items-center gap-2"><Eye className="h-4 w-4 text-cyan-400" />Branded</span></SelectItem>
                    <SelectItem value="hybrid"><span className="flex items-center gap-2"><UserCog className="h-4 w-4 text-amber-400" />Hybrid</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(currentTech.visibility_mode === 'shadow' || currentTech.visibility_mode === 'hybrid') && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white/80">Display Name</Label>
                    <Input value={currentTech.display_name_override} onChange={(e) => updateTech(currentTech.id, { display_name_override: e.target.value })} className="bg-black/40 border-cyan-500/30 text-white" placeholder="e.g., Alex T." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Display Title</Label>
                    <Input value={currentTech.display_title_override} onChange={(e) => updateTech(currentTech.id, { display_title_override: e.target.value })} className="bg-black/40 border-cyan-500/30 text-white" placeholder="IT Support Specialist" />
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-cyan-500/20 space-y-3">
                <h5 className="text-white/60 text-sm font-medium">Permissions</h5>
                {[
                  { key: 'can_respond_as_internal', label: 'Respond as Internal IT' },
                  { key: 'can_view_internal_notes', label: 'View Internal IT Notes' },
                  { key: 'can_create_tickets', label: 'Create Tickets' },
                  { key: 'can_close_tickets', label: 'Close Tickets' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-white/80 text-sm">{label}</Label>
                    <Switch checked={(currentTech as any)[key]} onCheckedChange={(checked) => updateTech(currentTech.id, { [key]: checked })} />
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/40 mb-2">How users see this technician:</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-medium">
                    {(currentTech.display_name_override || currentTech.technician_name).split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-white font-medium">{currentTech.visibility_mode === 'shadow' ? (currentTech.display_name_override || currentTech.technician_name) : currentTech.technician_name}</p>
                    <p className="text-xs text-white/40">{currentTech.visibility_mode === 'shadow' ? (currentTech.display_title_override || 'IT Support') : 'MSP Support Technician'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
