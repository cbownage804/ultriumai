import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { 
  Plus, 
  Eye, 
  EyeOff,
  UserCog,
  Shield,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface CoManagedTechAccessProps {
  organizationId: string;
}

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
  const [technicians, setTechnicians] = useState<TechAccess[]>([
    {
      id: "1",
      technician_name: "Alex Thompson",
      technician_email: "alex@yourmsp.com",
      visibility_mode: 'shadow',
      display_name_override: "Alex T.",
      display_title_override: "IT Support Specialist",
      can_respond_as_internal: true,
      can_view_internal_notes: true,
      can_create_tickets: true,
      can_close_tickets: true,
      can_escalate: true
    },
    {
      id: "2",
      technician_name: "Jordan Lee",
      technician_email: "jordan@yourmsp.com",
      visibility_mode: 'branded',
      display_name_override: "",
      display_title_override: "",
      can_respond_as_internal: false,
      can_view_internal_notes: true,
      can_create_tickets: true,
      can_close_tickets: false,
      can_escalate: true
    }
  ]);

  const [selectedTech, setSelectedTech] = useState<string | null>(technicians[0]?.id);

  const currentTech = technicians.find(t => t.id === selectedTech);

  const updateTech = (id: string, updates: Partial<TechAccess>) => {
    setTechnicians(prev => prev.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
    toast.success("Access settings updated");
  };

  const getVisibilityBadge = (mode: string) => {
    switch (mode) {
      case 'shadow':
        return <Badge className="bg-purple-500/20 text-purple-400"><EyeOff className="h-3 w-3 mr-1" />Shadow</Badge>;
      case 'branded':
        return <Badge className="bg-cyan-500/20 text-cyan-400"><Eye className="h-3 w-3 mr-1" />Branded</Badge>;
      case 'hybrid':
        return <Badge className="bg-amber-500/20 text-amber-400"><UserCog className="h-3 w-3 mr-1" />Hybrid</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-sm">
        <p className="text-purple-400 font-medium mb-1 flex items-center gap-2">
          <EyeOff className="h-4 w-4" />
          Technician Identity Masking
        </p>
        <p className="text-white/70">
          Control how your MSP technicians appear to end-users. In "Shadow" mode, 
          they appear as internal IT staff. In "Branded" mode, they appear as your MSP.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Technician List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium text-sm">Assigned Technicians</h4>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 h-8">
              <Plus className="h-3 w-3 mr-1" />
              Add Tech
            </Button>
          </div>
          
          {technicians.map((tech) => (
            <div
              key={tech.id}
              onClick={() => setSelectedTech(tech.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedTech === tech.id
                  ? 'bg-cyan-500/20 border border-cyan-500/50'
                  : 'bg-black/20 border border-transparent hover:border-cyan-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{tech.technician_name}</p>
                  <p className="text-xs text-white/40">{tech.technician_email}</p>
                </div>
                {getVisibilityBadge(tech.visibility_mode)}
              </div>
              {tech.visibility_mode === 'shadow' && tech.display_name_override && (
                <p className="text-xs text-purple-400 mt-2 flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  Appears as: {tech.display_name_override}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Tech Settings */}
        {currentTech && (
          <Card className="bg-black/20 border-cyan-500/20">
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Visibility Mode</Label>
                <Select
                  value={currentTech.visibility_mode}
                  onValueChange={(value: any) => updateTech(currentTech.id, { visibility_mode: value })}
                >
                  <SelectTrigger className="bg-black/40 border-cyan-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 border-cyan-500/30">
                    <SelectItem value="shadow">
                      <span className="flex items-center gap-2">
                        <EyeOff className="h-4 w-4 text-purple-400" />
                        Shadow Mode - Appear as Internal IT
                      </span>
                    </SelectItem>
                    <SelectItem value="branded">
                      <span className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-cyan-400" />
                        Branded - Appear as MSP
                      </span>
                    </SelectItem>
                    <SelectItem value="hybrid">
                      <span className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-amber-400" />
                        Hybrid - Choose per interaction
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(currentTech.visibility_mode === 'shadow' || currentTech.visibility_mode === 'hybrid') && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white/80">Display Name (to users)</Label>
                    <Input
                      value={currentTech.display_name_override}
                      onChange={(e) => updateTech(currentTech.id, { display_name_override: e.target.value })}
                      className="bg-black/40 border-cyan-500/30 text-white"
                      placeholder="e.g., Alex T."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">Display Title (to users)</Label>
                    <Input
                      value={currentTech.display_title_override}
                      onChange={(e) => updateTech(currentTech.id, { display_title_override: e.target.value })}
                      className="bg-black/40 border-cyan-500/30 text-white"
                      placeholder="e.g., IT Support Specialist"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-cyan-500/20 space-y-3">
                <h5 className="text-white/60 text-sm font-medium">Permissions</h5>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Respond as Internal IT</Label>
                  <Switch
                    checked={currentTech.can_respond_as_internal}
                    onCheckedChange={(checked) => updateTech(currentTech.id, { can_respond_as_internal: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">View Internal IT Notes</Label>
                  <Switch
                    checked={currentTech.can_view_internal_notes}
                    onCheckedChange={(checked) => updateTech(currentTech.id, { can_view_internal_notes: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Create Tickets</Label>
                  <Switch
                    checked={currentTech.can_create_tickets}
                    onCheckedChange={(checked) => updateTech(currentTech.id, { can_create_tickets: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-white/80 text-sm">Close Tickets</Label>
                  <Switch
                    checked={currentTech.can_close_tickets}
                    onCheckedChange={(checked) => updateTech(currentTech.id, { can_close_tickets: checked })}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/40 mb-2">How users see this technician:</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-medium">
                    {(currentTech.display_name_override || currentTech.technician_name).split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {currentTech.visibility_mode === 'shadow' 
                        ? (currentTech.display_name_override || currentTech.technician_name)
                        : currentTech.technician_name
                      }
                    </p>
                    <p className="text-xs text-white/40">
                      {currentTech.visibility_mode === 'shadow'
                        ? (currentTech.display_title_override || 'IT Support')
                        : 'MSP Support Technician'
                      }
                    </p>
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
