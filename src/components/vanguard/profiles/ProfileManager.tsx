import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  Zap,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Play,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ThresholdProfileEditor, ThresholdProfile } from './ThresholdProfileEditor';
import { AutomationProfileEditor, AutomationProfile } from './AutomationProfileEditor';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileManagerProps {
  onClose?: () => void;
}

export function ProfileManager({ onClose }: ProfileManagerProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [thresholdProfiles, setThresholdProfiles] = useState<ThresholdProfile[]>([]);
  const [automationProfiles, setAutomationProfiles] = useState<AutomationProfile[]>([]);
  const [editingThreshold, setEditingThreshold] = useState<ThresholdProfile | null>(null);
  const [editingAutomation, setEditingAutomation] = useState<AutomationProfile | null>(null);
  const [showNewThreshold, setShowNewThreshold] = useState(false);
  const [showNewAutomation, setShowNewAutomation] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [thresholdRes, automationRes] = await Promise.all([
        supabase
          .from('vanguard_threshold_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('vanguard_automation_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (thresholdRes.data) {
        setThresholdProfiles(thresholdRes.data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          isDefault: p.is_default,
          rules: (p.rules as any[]) || [],
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        })));
      }

      if (automationRes.data) {
        setAutomationProfiles(automationRes.data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          schedule: p.schedule as any,
          tasks: (p.tasks as any[]) || [],
          runOnConnect: p.run_on_connect,
          notifyOnComplete: p.notify_on_complete,
          notifyOnFailure: p.notify_on_failure,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
        })));
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveThreshold = async (profile: Omit<ThresholdProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      if (editingThreshold) {
        const { error } = await supabase
          .from('vanguard_threshold_profiles')
          .update({
            name: profile.name,
            description: profile.description,
            is_default: profile.isDefault,
            rules: profile.rules as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingThreshold.id);

        if (error) throw error;
        toast.success('Threshold profile updated');
      } else {
        const { error } = await supabase
          .from('vanguard_threshold_profiles')
          .insert({
            user_id: user.id,
            name: profile.name,
            description: profile.description,
            is_default: profile.isDefault,
            rules: profile.rules as any,
          });

        if (error) throw error;
        toast.success('Threshold profile created');
      }
      
      setEditingThreshold(null);
      setShowNewThreshold(false);
      fetchProfiles();
    } catch (error) {
      console.error('Error saving threshold profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleSaveAutomation = async (profile: Omit<AutomationProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      if (editingAutomation) {
        const { error } = await supabase
          .from('vanguard_automation_profiles')
          .update({
            name: profile.name,
            description: profile.description,
            schedule: profile.schedule as any,
            tasks: profile.tasks as any,
            run_on_connect: profile.runOnConnect,
            notify_on_complete: profile.notifyOnComplete,
            notify_on_failure: profile.notifyOnFailure,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingAutomation.id);

        if (error) throw error;
        toast.success('Automation profile updated');
      } else {
        const { error } = await supabase
          .from('vanguard_automation_profiles')
          .insert({
            user_id: user.id,
            name: profile.name,
            description: profile.description,
            schedule: profile.schedule as any,
            tasks: profile.tasks as any,
            run_on_connect: profile.runOnConnect,
            notify_on_complete: profile.notifyOnComplete,
            notify_on_failure: profile.notifyOnFailure,
          });

        if (error) throw error;
        toast.success('Automation profile created');
      }
      
      setEditingAutomation(null);
      setShowNewAutomation(false);
      fetchProfiles();
    } catch (error) {
      console.error('Error saving automation profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const deleteThresholdProfile = async (id: string) => {
    if (!confirm('Delete this threshold profile?')) return;
    
    const { error } = await supabase
      .from('vanguard_threshold_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete profile');
    } else {
      toast.success('Profile deleted');
      fetchProfiles();
    }
  };

  const deleteAutomationProfile = async (id: string) => {
    if (!confirm('Delete this automation profile?')) return;
    
    const { error } = await supabase
      .from('vanguard_automation_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete profile');
    } else {
      toast.success('Profile deleted');
      fetchProfiles();
    }
  };

  const duplicateProfile = async (profile: ThresholdProfile | AutomationProfile, type: 'threshold' | 'automation') => {
    if (!user) return;

    try {
      if (type === 'threshold') {
        const p = profile as ThresholdProfile;
        await supabase.from('vanguard_threshold_profiles').insert({
          user_id: user.id,
          name: `${p.name} (Copy)`,
          description: p.description,
          is_default: false,
          rules: p.rules as any,
        });
      } else {
        const p = profile as AutomationProfile;
        await supabase.from('vanguard_automation_profiles').insert({
          user_id: user.id,
          name: `${p.name} (Copy)`,
          description: p.description,
          schedule: p.schedule as any,
          tasks: p.tasks as any,
          run_on_connect: p.runOnConnect,
          notify_on_complete: p.notifyOnComplete,
          notify_on_failure: p.notifyOnFailure,
        });
      }
      toast.success('Profile duplicated');
      fetchProfiles();
    } catch (error) {
      toast.error('Failed to duplicate profile');
    }
  };

  const runAutomationNow = async (profileId: string) => {
    toast.info('Running automation profile...');
    // In production, this would trigger the automation via edge function
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

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
            {thresholdProfiles.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No threshold profiles configured</p>
                <p className="text-sm">Create a profile to define alerting thresholds</p>
              </div>
            )}
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
                        onClick={() => runAutomationNow(profile.id)}
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
            {automationProfiles.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No automation profiles configured</p>
                <p className="text-sm">Create a profile to schedule automated tasks</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
