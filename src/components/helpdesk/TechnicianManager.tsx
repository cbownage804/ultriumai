import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Plus, 
  Edit,
  Trash2,
  Award,
  Clock,
  Ticket,
  Star
} from "lucide-react";
import { toast } from "sonner";

const SPECIALIZATIONS = [
  'network', 'security', 'hardware', 'software', 'email', 
  'printer', 'mobile', 'account', 'data', 'firewall', 'microsoft365'
];

const AVAILABILITY_STATUSES = ['available', 'busy', 'away', 'offline'];

export function TechnicianManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    specializations: [] as string[],
    skill_levels: {} as Record<string, number>,
    certifications: "",
    max_concurrent_tickets: 10,
    availability_status: "available",
    is_active: true,
  });

  const { data: technicians, isLoading } = useQuery({
    queryKey: ['technicians-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('helpdesk_technicians')
        .select('*')
        .order('display_name');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('helpdesk_technicians').insert({
        user_id: crypto.randomUUID(), // Placeholder - should be linked to real user
        display_name: data.display_name,
        email: data.email,
        specializations: data.specializations,
        skill_levels: data.skill_levels,
        certifications: data.certifications ? data.certifications.split(',').map(c => c.trim()) : [],
        max_concurrent_tickets: data.max_concurrent_tickets,
        availability_status: data.availability_status,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians-admin'] });
      toast.success('Technician added successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to add technician: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('helpdesk_technicians')
        .update({
          display_name: data.display_name,
          email: data.email,
          specializations: data.specializations,
          skill_levels: data.skill_levels,
          certifications: data.certifications ? data.certifications.split(',').map(c => c.trim()) : [],
          max_concurrent_tickets: data.max_concurrent_tickets,
          availability_status: data.availability_status,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians-admin'] });
      toast.success('Technician updated successfully');
      setEditingTech(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update technician: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('helpdesk_technicians').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians-admin'] });
      toast.success('Technician removed');
    },
    onError: (error) => {
      toast.error('Failed to remove technician: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      display_name: "",
      email: "",
      specializations: [],
      skill_levels: {},
      certifications: "",
      max_concurrent_tickets: 10,
      availability_status: "available",
      is_active: true,
    });
  };

  const handleEdit = (tech: any) => {
    setEditingTech(tech);
    setFormData({
      display_name: tech.display_name,
      email: tech.email || "",
      specializations: tech.specializations || [],
      skill_levels: tech.skill_levels || {},
      certifications: tech.certifications?.join(', ') || "",
      max_concurrent_tickets: tech.max_concurrent_tickets || 10,
      availability_status: tech.availability_status || "available",
      is_active: tech.is_active,
    });
  };

  const toggleSpecialization = (spec: string) => {
    const current = formData.specializations;
    if (current.includes(spec)) {
      setFormData({
        ...formData,
        specializations: current.filter(s => s !== spec),
        skill_levels: { ...formData.skill_levels, [spec]: undefined }
      });
    } else {
      setFormData({
        ...formData,
        specializations: [...current, spec],
        skill_levels: { ...formData.skill_levels, [spec]: 3 }
      });
    }
  };

  const handleSubmit = () => {
    if (editingTech) {
      updateMutation.mutate({ id: editingTech.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Technicians</h2>
        </div>
        <Dialog open={isCreateOpen || !!editingTech} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingTech(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Technician
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTech ? 'Edit Technician' : 'Add New Technician'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Alex Chen"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specializations</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map(spec => (
                    <Badge
                      key={spec}
                      variant={formData.specializations.includes(spec) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSpecialization(spec)}
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {formData.specializations.length > 0 && (
                <div className="space-y-2">
                  <Label>Skill Levels (1-5)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {formData.specializations.map(spec => (
                      <div key={spec} className="flex items-center gap-2">
                        <span className="text-sm w-24">{spec}</span>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          value={formData.skill_levels[spec] || 3}
                          onChange={(e) => setFormData({
                            ...formData,
                            skill_levels: {
                              ...formData.skill_levels,
                              [spec]: parseInt(e.target.value) || 3
                            }
                          })}
                          className="w-16"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Certifications (comma-separated)</Label>
                <Input
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  placeholder="CCNA, Security+, MCSE"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Concurrent Tickets</Label>
                  <Input
                    type="number"
                    value={formData.max_concurrent_tickets}
                    onChange={(e) => setFormData({ ...formData, max_concurrent_tickets: parseInt(e.target.value) || 10 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Availability Status</Label>
                  <Select
                    value={formData.availability_status}
                    onValueChange={(value) => setFormData({ ...formData, availability_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingTech ? 'Update Technician' : 'Add Technician'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Technicians Grid */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading technicians...</div>
      ) : technicians?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No technicians found. Add your first technician!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {technicians?.map((tech) => (
            <Card key={tech.id} className={!tech.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {tech.display_name?.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getAvailabilityColor(tech.availability_status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{tech.display_name}</h3>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(tech)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(tech.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{tech.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {(tech.specializations as string[])?.slice(0, 4).map((spec: string) => (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                  {(tech.specializations as string[])?.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{(tech.specializations as string[]).length - 4}
                    </Badge>
                  )}
                </div>

                {(tech.certifications as string[])?.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Award className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">
                      {(tech.certifications as string[]).slice(0, 2).join(', ')}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="p-2 rounded bg-muted/50">
                    <Ticket className="h-3 w-3 mx-auto text-muted-foreground" />
                    <p className="text-xs mt-1">{tech.current_ticket_count || 0}/{tech.max_concurrent_tickets}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <Clock className="h-3 w-3 mx-auto text-muted-foreground" />
                    <p className="text-xs mt-1">{tech.avg_resolution_time_minutes || '-'}m</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50">
                    <Star className="h-3 w-3 mx-auto text-muted-foreground" />
                    <p className="text-xs mt-1">{tech.avg_satisfaction_rating || '-'}</p>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Workload</span>
                    <span>{Math.round(((tech.current_ticket_count || 0) / (tech.max_concurrent_tickets || 10)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={((tech.current_ticket_count || 0) / (tech.max_concurrent_tickets || 10)) * 100} 
                    className="h-1.5" 
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
