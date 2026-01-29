import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Settings, 
  Gauge,
  Bell,
  Clock,
  Loader2,
  CheckCircle,
  Shield,
  Cpu,
  HardDrive,
  MemoryStick,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AutomationProfile {
  id: string;
  name: string;
  description: string;
  type: 'threshold' | 'automation';
  rules: Record<string, unknown>;
}

interface AutomationProfileSelectorProps {
  deviceId: string;
  deviceName: string;
  currentProfiles?: {
    threshold_profile_id?: string;
    automation_profile_id?: string;
  };
  onUpdate?: () => void;
  children?: React.ReactNode;
}

export function AutomationProfileSelector({ 
  deviceId, 
  deviceName, 
  currentProfiles,
  onUpdate,
  children 
}: AutomationProfileSelectorProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [thresholdProfiles, setThresholdProfiles] = useState<AutomationProfile[]>([]);
  const [automationProfiles, setAutomationProfiles] = useState<AutomationProfile[]>([]);
  const [selectedThreshold, setSelectedThreshold] = useState<string>(currentProfiles?.threshold_profile_id || '');
  const [selectedAutomation, setSelectedAutomation] = useState<string>(currentProfiles?.automation_profile_id || '');

  useEffect(() => {
    if (open && user) {
      loadProfiles();
    }
  }, [open, user]);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);

      // Load threshold profiles using type assertion to bypass strict typing
      const { data: thresholds } = await (supabase as any)
        .from('threshold_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      // Load automation profiles using type assertion
      const { data: automations } = await (supabase as any)
        .from('automation_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      const thresholdList = (thresholds || []) as Array<{
        id: string;
        profile_name: string;
        description?: string;
        thresholds?: Record<string, unknown>;
      }>;

      const automationList = (automations || []) as Array<{
        id: string;
        profile_name: string;
        description?: string;
        automation_rules?: Record<string, unknown>;
      }>;

      setThresholdProfiles(thresholdList.map(t => ({
        id: t.id,
        name: t.profile_name,
        description: t.description || 'Custom threshold rules',
        type: 'threshold' as const,
        rules: t.thresholds || {},
      })));

      setAutomationProfiles(automationList.map(a => ({
        id: a.id,
        name: a.profile_name,
        description: a.description || 'Automation workflow',
        type: 'automation' as const,
        rules: a.automation_rules || {},
      })));

    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Update the agent's config with selected profiles
      const { error } = await supabase
        .from('vanguard_agents')
        .update({
          config: {
            threshold_profile_id: selectedThreshold || null,
            automation_profile_id: selectedAutomation || null,
          }
        })
        .eq('id', deviceId);

      if (error) throw error;

      toast.success('Profiles updated', {
        description: `${deviceName} profiles have been updated.`,
      });

      setOpen(false);
      onUpdate?.();
    } catch (err: any) {
      toast.error('Failed to update profiles', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedThresholdProfile = thresholdProfiles.find(p => p.id === selectedThreshold);
  const selectedAutomationProfile = automationProfiles.find(p => p.id === selectedAutomation);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Profiles
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-500" />
            Manage Profiles
          </DialogTitle>
          <DialogDescription>
            Assign threshold and automation profiles to {deviceName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Threshold Profile */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-yellow-500" />
                Threshold Profile
              </Label>
              <Select value={selectedThreshold} onValueChange={setSelectedThreshold}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a threshold profile..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No profile</SelectItem>
                  {thresholdProfiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedThresholdProfile && (
                <Card className="bg-muted/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{selectedThresholdProfile.name}</span>
                      <Badge variant="outline">Threshold</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {selectedThresholdProfile.description}
                    </p>
                    <div className="flex gap-4 text-xs">
                      {selectedThresholdProfile.rules.cpu_warning && (
                        <div className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          CPU: {(selectedThresholdProfile.rules as any).cpu_warning}%
                        </div>
                      )}
                      {selectedThresholdProfile.rules.memory_warning && (
                        <div className="flex items-center gap-1">
                          <MemoryStick className="h-3 w-3" />
                          RAM: {(selectedThresholdProfile.rules as any).memory_warning}%
                        </div>
                      )}
                      {selectedThresholdProfile.rules.disk_warning && (
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          Disk: {(selectedThresholdProfile.rules as any).disk_warning}%
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Automation Profile */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Automation Profile
              </Label>
              <Select value={selectedAutomation} onValueChange={setSelectedAutomation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an automation profile..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No profile</SelectItem>
                  {automationProfiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAutomationProfile && (
                <Card className="bg-muted/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{selectedAutomationProfile.name}</span>
                      <Badge variant="outline">Automation</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedAutomationProfile.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {thresholdProfiles.length === 0 && automationProfiles.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No profiles configured yet</p>
                <p className="text-sm">Create profiles in Settings → Profiles</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Profiles
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
