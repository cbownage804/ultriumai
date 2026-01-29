import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Zap,
  Shield,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Play,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { ThresholdProfileEditor, ThresholdProfile } from './ThresholdProfileEditor';
import { AutomationProfileEditor, AutomationProfile } from './AutomationProfileEditor';

interface ProfileManagerProps {
  onClose?: () => void;
}

// Demo profiles
const demoThresholdProfiles: ThresholdProfile[] = [
  {
    id: '1',
    name: 'Production Servers',
    description: 'Strict monitoring for production workloads',
    isDefault: true,
    rules: [
      { id: '1', metric: 'cpu', operator: 'above', value: 85, duration: 5, severity: 'critical', enabled: true },
      { id: '2', metric: 'memory', operator: 'above', value: 80, duration: 5, severity: 'critical', enabled: true },
      { id: '3', metric: 'disk', operator: 'above', value: 90, duration: 0, severity: 'critical', enabled: true },
    ],
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 0, 15),
  },
  {
    id: '2',
    name: 'Development Workstations',
    description: 'Relaxed thresholds for dev machines',
    rules: [
      { id: '1', metric: 'cpu', operator: 'above', value: 95, duration: 15, severity: 'warning', enabled: true },
      { id: '2', metric: 'disk', operator: 'above', value: 95, duration: 0, severity: 'warning', enabled: true },
    ],
    createdAt: new Date(2024, 0, 5),
    updatedAt: new Date(2024, 0, 5),
  },
];

const demoAutomationProfiles: AutomationProfile[] = [
  {
    id: '1',
    name: 'Weekly Maintenance',
    description: 'Patch installation and cleanup every Sunday',
    schedule: { type: 'weekly', time: '02:00', daysOfWeek: [0], enabled: true },
    tasks: [
      { id: '1', name: 'Install Security Patches', type: 'patch', config: { categories: ['security', 'critical'] }, order: 0, enabled: true },
      { id: '2', name: 'Disk Cleanup', type: 'cleanup', config: { tempFiles: true, recyclingBin: true }, order: 1, enabled: true },
    ],
    runOnConnect: true,
    notifyOnComplete: true,
    notifyOnFailure: true,
    createdAt: new Date(2024, 0, 1),
    updatedAt: new Date(2024, 0, 10),
  },
  {
    id: '2',
    name: 'Daily Health Check',
    description: 'Run diagnostics script daily',
    schedule: { type: 'daily', time: '06:00', enabled: true },
    tasks: [
      { id: '1', name: 'Health Check Script', type: 'script', config: { shell: 'powershell', script: 'Get-ComputerInfo' }, order: 0, enabled: true },
    ],
    runOnConnect: false,
    notifyOnComplete: false,
    notifyOnFailure: true,
    createdAt: new Date(2024, 0, 8),
    updatedAt: new Date(2024, 0, 8),
  },
];

export function ProfileManager({ onClose }: ProfileManagerProps) {
  const [thresholdProfiles, setThresholdProfiles] = useState<ThresholdProfile[]>(demoThresholdProfiles);
  const [automationProfiles, setAutomationProfiles] = useState<AutomationProfile[]>(demoAutomationProfiles);
  const [editingThreshold, setEditingThreshold] = useState<ThresholdProfile | null>(null);
  const [editingAutomation, setEditingAutomation] = useState<AutomationProfile | null>(null);
  const [showNewThreshold, setShowNewThreshold] = useState(false);
  const [showNewAutomation, setShowNewAutomation] = useState(false);

  const handleSaveThreshold = (profile: Omit<ThresholdProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingThreshold) {
      setThresholdProfiles(prev => prev.map(p => 
        p.id === editingThreshold.id 
          ? { ...p, ...profile, updatedAt: new Date() }
          : p
      ));
      toast.success('Threshold profile updated');
    } else {
      const newProfile: ThresholdProfile = {
        ...profile,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setThresholdProfiles(prev => [...prev, newProfile]);
      toast.success('Threshold profile created');
    }
    setEditingThreshold(null);
    setShowNewThreshold(false);
  };

  const handleSaveAutomation = (profile: Omit<AutomationProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingAutomation) {
      setAutomationProfiles(prev => prev.map(p => 
        p.id === editingAutomation.id 
          ? { ...p, ...profile, updatedAt: new Date() }
          : p
      ));
      toast.success('Automation profile updated');
    } else {
      const newProfile: AutomationProfile = {
        ...profile,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setAutomationProfiles(prev => [...prev, newProfile]);
      toast.success('Automation profile created');
    }
    setEditingAutomation(null);
    setShowNewAutomation(false);
  };

  const deleteThresholdProfile = (id: string) => {
    if (!confirm('Delete this threshold profile?')) return;
    setThresholdProfiles(prev => prev.filter(p => p.id !== id));
    toast.success('Profile deleted');
  };

  const deleteAutomationProfile = (id: string) => {
    if (!confirm('Delete this automation profile?')) return;
    setAutomationProfiles(prev => prev.filter(p => p.id !== id));
    toast.success('Profile deleted');
  };

  const duplicateProfile = (profile: ThresholdProfile | AutomationProfile, type: 'threshold' | 'automation') => {
    const copy = {
      ...profile,
      id: crypto.randomUUID(),
      name: `${profile.name} (Copy)`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    if (type === 'threshold') {
      setThresholdProfiles(prev => [...prev, copy as ThresholdProfile]);
    } else {
      setAutomationProfiles(prev => [...prev, copy as AutomationProfile]);
    }
    toast.success('Profile duplicated');
  };

  // If editing, show editor
  if (editingThreshold || showNewThreshold) {
    return (
      <ThresholdProfileEditor
        profile={editingThreshold || undefined}
        onSave={handleSaveThreshold}
        onCancel={() => {
          setEditingThreshold(null);
          setShowNewThreshold(false);
        }}
      />
    );
  }

  if (editingAutomation || showNewAutomation) {
    return (
      <AutomationProfileEditor
        profile={editingAutomation || undefined}
        onSave={handleSaveAutomation}
        onCancel={() => {
          setEditingAutomation(null);
          setShowNewAutomation(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="threshold">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="threshold" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Threshold Profiles
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Zap className="h-4 w-4" />
            IT Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="threshold" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Threshold Profiles</h3>
              <p className="text-sm text-muted-foreground">Configure alerting thresholds for device monitoring</p>
            </div>
            <Button onClick={() => setShowNewThreshold(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Profile
            </Button>
          </div>

          <div className="grid gap-4">
            {thresholdProfiles.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{profile.name}</h4>
                        {profile.isDefault && <Badge>Default</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{profile.rules.length} rules</span>
                        <span>{profile.rules.filter(r => r.severity === 'critical').length} critical</span>
                        <span>{profile.rules.filter(r => r.severity === 'warning').length} warning</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingThreshold(profile)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateProfile(profile, 'threshold')}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteThresholdProfile(profile.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automation" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">IT Automation Profiles</h3>
              <p className="text-sm text-muted-foreground">Schedule automated maintenance tasks</p>
            </div>
            <Button onClick={() => setShowNewAutomation(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Profile
            </Button>
          </div>

          <div className="grid gap-4">
            {automationProfiles.map((profile) => (
              <Card key={profile.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{profile.name}</h4>
                        {profile.schedule.enabled && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="capitalize">{profile.schedule.type} at {profile.schedule.time}</span>
                        <span>{profile.tasks.length} tasks</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast.info('Running profile now...')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Run Now
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingAutomation(profile)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateProfile(profile, 'automation')}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteAutomationProfile(profile.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
