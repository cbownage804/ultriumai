import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award, Plus, UserCog, Zap, Star, CheckCircle, AlertCircle, TrendingUp, Users, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Skill {
  id: string;
  skill_name: string;
  skill_category: string;
  required_certifications: string[];
  priority_weight: number;
  fallback_to_msp: boolean;
}

interface SkillBasedRoutingProps {
  organizationId?: string;
}

export function SkillBasedRouting({ organizationId }: SkillBasedRoutingProps) {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    skill_category: 'Support',
    priority_weight: 1,
    fallback_to_msp: true,
  });

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any).from('comanaged_skill_routing').select('*').order('skill_name');
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query;
      if (error) throw error;
      setSkills((data || []).map((s: any) => ({
        id: s.id,
        skill_name: s.skill_name,
        skill_category: s.skill_category || 'Support',
        required_certifications: Array.isArray(s.required_certifications) ? s.required_certifications : [],
        priority_weight: s.priority_weight ?? 1,
        fallback_to_msp: s.fallback_to_msp ?? true,
      })));
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { loadSkills(); }, [loadSkills]);

  const handleCreate = async () => {
    if (!newSkill.skill_name) { toast.error('Skill name is required'); return; }
    try {
      const { error } = await (supabase as any).from('comanaged_skill_routing').insert({
        skill_name: newSkill.skill_name,
        skill_category: newSkill.skill_category,
        priority_weight: newSkill.priority_weight,
        fallback_to_msp: newSkill.fallback_to_msp,
        organization_id: organizationId || null,
      });
      if (error) throw error;
      toast.success('Skill created');
      setIsCreateOpen(false);
      setNewSkill({ skill_name: '', skill_category: 'Support', priority_weight: 1, fallback_to_msp: true });
      loadSkills();
    } catch { toast.error('Failed to create skill'); }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Infrastructure': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'Cloud': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'Security': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'Support': return 'bg-green-500/10 text-green-500 border-green-500/30';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />Skill-Based Routing
          </h2>
          <p className="text-muted-foreground">Route tickets based on technician skills</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Skill</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Skill Category</DialogTitle>
              <DialogDescription>Define a skill for ticket routing</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Skill Name</Label>
                <Input value={newSkill.skill_name} onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })} placeholder="e.g., Azure Administration" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newSkill.skill_category} onValueChange={(v) => setNewSkill({ ...newSkill, skill_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="Cloud">Cloud</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority Weight (1-5)</Label>
                <Input type="number" min={1} max={5} value={newSkill.priority_weight} onChange={(e) => setNewSkill({ ...newSkill, priority_weight: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Add Skill</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Skills</p><p className="text-2xl font-bold">{skills.length}</p></div><Award className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">MSP Fallback</p><p className="text-2xl font-bold text-purple-500">{skills.filter(s => s.fallback_to_msp).length}</p></div><CheckCircle className="h-8 w-8 text-purple-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Categories</p><p className="text-2xl font-bold text-blue-500">{new Set(skills.map(s => s.skill_category)).size}</p></div><AlertCircle className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Avg Weight</p><p className="text-2xl font-bold text-green-500">{skills.length ? (skills.reduce((s, sk) => s + sk.priority_weight, 0) / skills.length).toFixed(1) : '0'}</p></div><TrendingUp className="h-8 w-8 text-green-500" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Skill Categories</CardTitle><CardDescription>Define skills for intelligent ticket routing</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Skill</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Certifications</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>MSP Fallback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="font-medium">{skill.skill_name}</TableCell>
                  <TableCell><Badge variant="outline" className={getCategoryColor(skill.skill_category)}>{skill.skill_category}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {skill.required_certifications.map((cert, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{String(cert)}</Badge>
                      ))}
                      {skill.required_certifications.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: skill.priority_weight }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {skill.fallback_to_msp ? (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {skills.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No skills configured</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
