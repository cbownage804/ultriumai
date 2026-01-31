import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  Plus,
  UserCog,
  Zap,
  Star,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface Skill {
  id: string;
  skill_name: string;
  skill_category: string;
  required_certifications: string[];
  priority_weight: number;
  fallback_to_msp: boolean;
  technicians_count: number;
}

interface TechnicianSkill {
  id: string;
  technician_name: string;
  technician_type: 'msp' | 'internal';
  skills: Array<{
    skill_name: string;
    proficiency_level: 'beginner' | 'intermediate' | 'expert';
    certified: boolean;
  }>;
  tickets_routed: number;
  success_rate: number;
}

export function SkillBasedRouting() {
  const [skills, setSkills] = useState<Skill[]>([
    { id: '1', skill_name: 'Network Administration', skill_category: 'Infrastructure', required_certifications: ['CCNA', 'CompTIA Network+'], priority_weight: 3, fallback_to_msp: true, technicians_count: 5 },
    { id: '2', skill_name: 'Windows Server', skill_category: 'Infrastructure', required_certifications: ['MCSA'], priority_weight: 2, fallback_to_msp: true, technicians_count: 8 },
    { id: '3', skill_name: 'Office 365 Admin', skill_category: 'Cloud', required_certifications: ['MS-900', 'MS-100'], priority_weight: 2, fallback_to_msp: false, technicians_count: 12 },
    { id: '4', skill_name: 'Cybersecurity', skill_category: 'Security', required_certifications: ['Security+', 'CEH'], priority_weight: 4, fallback_to_msp: true, technicians_count: 3 },
    { id: '5', skill_name: 'Helpdesk Support', skill_category: 'Support', required_certifications: ['A+'], priority_weight: 1, fallback_to_msp: false, technicians_count: 15 },
  ]);

  const [technicians] = useState<TechnicianSkill[]>([
    {
      id: '1',
      technician_name: 'John Smith',
      technician_type: 'msp',
      skills: [
        { skill_name: 'Network Administration', proficiency_level: 'expert', certified: true },
        { skill_name: 'Cybersecurity', proficiency_level: 'intermediate', certified: true },
        { skill_name: 'Windows Server', proficiency_level: 'expert', certified: true },
      ],
      tickets_routed: 156,
      success_rate: 94,
    },
    {
      id: '2',
      technician_name: 'Sarah Johnson',
      technician_type: 'internal',
      skills: [
        { skill_name: 'Office 365 Admin', proficiency_level: 'expert', certified: true },
        { skill_name: 'Helpdesk Support', proficiency_level: 'expert', certified: true },
      ],
      tickets_routed: 234,
      success_rate: 89,
    },
    {
      id: '3',
      technician_name: 'Mike Brown',
      technician_type: 'internal',
      skills: [
        { skill_name: 'Windows Server', proficiency_level: 'intermediate', certified: false },
        { skill_name: 'Helpdesk Support', proficiency_level: 'intermediate', certified: true },
      ],
      tickets_routed: 89,
      success_rate: 82,
    },
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    skill_category: 'Support',
    priority_weight: 1,
    fallback_to_msp: true,
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Infrastructure': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'Cloud': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'Security': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'Support': return 'bg-green-500/10 text-green-500 border-green-500/30';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'beginner': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCreate = () => {
    if (!newSkill.skill_name) {
      toast.error('Skill name is required');
      return;
    }

    const skill: Skill = {
      id: Date.now().toString(),
      ...newSkill,
      required_certifications: [],
      technicians_count: 0,
    };

    setSkills([...skills, skill]);
    setNewSkill({ skill_name: '', skill_category: 'Support', priority_weight: 1, fallback_to_msp: true });
    setIsCreateOpen(false);
    toast.success('Skill created');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Skill-Based Routing
          </h2>
          <p className="text-muted-foreground">
            Route tickets to technicians based on their skills and certifications
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Skill Category</DialogTitle>
              <DialogDescription>
                Define a skill for ticket routing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Skill Name</Label>
                <Input
                  value={newSkill.skill_name}
                  onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                  placeholder="e.g., Azure Administration"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newSkill.skill_category}
                  onValueChange={(v) => setNewSkill({ ...newSkill, skill_category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={newSkill.priority_weight}
                  onChange={(e) => setNewSkill({ ...newSkill, priority_weight: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground">Higher weight = prioritize finding skilled tech over speed</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Add Skill</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Skills</p>
                <p className="text-2xl font-bold">{skills.length}</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certified Techs</p>
                <p className="text-2xl font-bold text-green-500">12</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Skill Gaps</p>
                <p className="text-2xl font-bold text-orange-500">3</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Routing Accuracy</p>
                <p className="text-2xl font-bold text-blue-500">91%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Skill Categories</TabsTrigger>
          <TabsTrigger value="technicians">Technician Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Skill Categories</CardTitle>
              <CardDescription>Define skills for intelligent ticket routing</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Technicians</TableHead>
                    <TableHead>MSP Fallback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skills.map((skill) => (
                    <TableRow key={skill.id}>
                      <TableCell className="font-medium">{skill.skill_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getCategoryColor(skill.skill_category)}>
                          {skill.skill_category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {skill.required_certifications.map((cert, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
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
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {skill.technicians_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {skill.fallback_to_msp ? (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technicians" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Technician Skills Matrix</CardTitle>
              <CardDescription>View and manage technician skill assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {technicians.map((tech) => (
                  <div key={tech.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCog className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{tech.technician_name}</p>
                          <Badge variant={tech.technician_type === 'msp' ? 'default' : 'secondary'}>
                            {tech.technician_type === 'msp' ? 'MSP' : 'Internal IT'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{tech.tickets_routed}</p>
                          <p className="text-muted-foreground">Tickets Routed</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-green-500">{tech.success_rate}%</p>
                          <p className="text-muted-foreground">Success Rate</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {tech.skills.map((skill, i) => (
                        <div key={i} className="border rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{skill.skill_name}</span>
                            {skill.certified && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getProficiencyColor(skill.proficiency_level)}`} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {skill.proficiency_level}
                            </span>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" className="border-dashed h-auto">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Skill
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
