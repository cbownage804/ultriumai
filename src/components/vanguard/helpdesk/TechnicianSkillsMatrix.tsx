import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Plus, Star, Award, Users, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

const SKILL_CATEGORIES = [
  'networking', 'security', 'hardware', 'software', 'cloud', 'database', 'scripting', 'general'
];

const PROFICIENCY_LABELS = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

interface TechnicianSkill {
  id: string;
  technician_name: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: number;
  certifications: string[];
}

// Mock data for demonstration
const MOCK_SKILLS: TechnicianSkill[] = [
  { id: '1', technician_name: 'John Smith', skill_name: 'Active Directory', skill_category: 'security', proficiency_level: 5, certifications: ['MCSA', 'MCSE'] },
  { id: '2', technician_name: 'John Smith', skill_name: 'Network Troubleshooting', skill_category: 'networking', proficiency_level: 4, certifications: ['CCNA'] },
  { id: '3', technician_name: 'Sarah Johnson', skill_name: 'Azure Administration', skill_category: 'cloud', proficiency_level: 4, certifications: ['AZ-104'] },
  { id: '4', technician_name: 'Sarah Johnson', skill_name: 'PowerShell', skill_category: 'scripting', proficiency_level: 5, certifications: [] },
  { id: '5', technician_name: 'Mike Davis', skill_name: 'Hardware Repair', skill_category: 'hardware', proficiency_level: 3, certifications: ['CompTIA A+'] },
];

export function TechnicianSkillsMatrix() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [skills, setSkills] = useState<TechnicianSkill[]>(MOCK_SKILLS);
  const [newSkill, setNewSkill] = useState({
    technician_name: '',
    skill_name: '',
    skill_category: 'general',
    proficiency_level: 3,
    certifications: ''
  });

  const handleAddSkill = () => {
    const skill: TechnicianSkill = {
      id: crypto.randomUUID(),
      technician_name: newSkill.technician_name,
      skill_name: newSkill.skill_name,
      skill_category: newSkill.skill_category,
      proficiency_level: newSkill.proficiency_level,
      certifications: newSkill.certifications ? newSkill.certifications.split(',').map(c => c.trim()) : []
    };
    setSkills([...skills, skill]);
    setIsAddOpen(false);
    setNewSkill({ technician_name: '', skill_name: '', skill_category: 'general', proficiency_level: 3, certifications: '' });
    toast.success('Skill added successfully');
  };

  // Group skills by technician
  const technicianGroups = skills.reduce((acc, skill) => {
    const name = skill.technician_name;
    if (!acc[name]) acc[name] = [];
    acc[name].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  const filteredGroups = Object.entries(technicianGroups).filter(([name, techSkills]) => {
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      techSkills.some(s => s.skill_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || 
      techSkills.some(s => s.skill_category === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      networking: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      security: 'bg-red-500/20 text-red-400 border-red-500/30',
      hardware: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      software: 'bg-green-500/20 text-green-400 border-green-500/30',
      cloud: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      database: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      scripting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      general: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search technicians or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {SKILL_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Technician Skill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Technician Name</Label>
                <Input
                  value={newSkill.technician_name}
                  onChange={(e) => setNewSkill({ ...newSkill, technician_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Skill Name</Label>
                <Input
                  value={newSkill.skill_name}
                  onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                  placeholder="Active Directory"
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
                    {SKILL_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Proficiency Level: {PROFICIENCY_LABELS[newSkill.proficiency_level - 1]}</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setNewSkill({ ...newSkill, proficiency_level: level })}
                      className={`p-2 rounded-lg border transition-colors ${
                        level <= newSkill.proficiency_level
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted border-border hover:bg-muted/80'
                      }`}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Certifications (comma-separated)</Label>
                <Input
                  value={newSkill.certifications}
                  onChange={(e) => setNewSkill({ ...newSkill, certifications: e.target.value })}
                  placeholder="MCSA, CCNA, CompTIA A+"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleAddSkill}
                disabled={!newSkill.technician_name || !newSkill.skill_name}
              >
                Add Skill
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(technicianGroups).length}</p>
                <p className="text-sm text-muted-foreground">Technicians</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Star className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{skills.length}</p>
                <p className="text-sm text-muted-foreground">Total Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Award className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {skills.filter(s => (s.certifications as string[] || []).length > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">With Certifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Star className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {skills.filter(s => s.proficiency_level >= 4).length}
                </p>
                <p className="text-sm text-muted-foreground">Expert Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Matrix */}
      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No technician skills found. Add your first skill above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(([techName, techSkills]) => (
            <Card key={techName}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {techName}
                </CardTitle>
                <CardDescription>{techSkills.length} skills registered</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Proficiency</TableHead>
                      <TableHead>Certifications</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {techSkills.map((skill) => (
                      <TableRow key={skill.id}>
                        <TableCell className="font-medium">{skill.skill_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getCategoryColor(skill.skill_category || 'general')}>
                            {skill.skill_category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={skill.proficiency_level * 20} className="w-20 h-2" />
                            <span className="text-sm text-muted-foreground">
                              {PROFICIENCY_LABELS[(skill.proficiency_level || 1) - 1]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(skill.certifications as string[] || []).map((cert, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <Award className="h-3 w-3 mr-1" />
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
