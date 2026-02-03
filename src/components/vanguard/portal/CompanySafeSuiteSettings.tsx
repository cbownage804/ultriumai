import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, Search, Globe, MapPin, Loader2, Save, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CompanySafeSuiteSettingsProps {
  clientId: string;
  companyName: string;
}

interface SafeSuiteSettings {
  safepass_enabled: boolean;
  safescan_enabled: boolean;
  safeweb_enabled: boolean;
  safetrack_enabled: boolean;
}

export function CompanySafeSuiteSettings({ clientId, companyName }: CompanySafeSuiteSettingsProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SafeSuiteSettings>({
    safepass_enabled: false,
    safescan_enabled: false,
    safeweb_enabled: false,
    safetrack_enabled: false,
  });

  useEffect(() => {
    fetchSettings();
  }, [clientId]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_safesuite_settings')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          safepass_enabled: data.safepass_enabled ?? false,
          safescan_enabled: data.safescan_enabled ?? false,
          safeweb_enabled: data.safeweb_enabled ?? false,
          safetrack_enabled: data.safetrack_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch SafeSuite settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('company_safesuite_settings')
        .upsert({
          client_id: clientId,
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'client_id'
        });

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: `SafeSuite access for ${companyName} has been updated`,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save SafeSuite settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tools = [
    {
      key: 'safepass_enabled' as const,
      name: 'SafePass',
      description: 'Password vault and credential management',
      icon: Key,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      key: 'safescan_enabled' as const,
      name: 'SafeScan',
      description: 'Antivirus and malware protection',
      icon: Search,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      key: 'safeweb_enabled' as const,
      name: 'SafeWeb',
      description: 'Web filtering and safe browsing',
      icon: Globe,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      key: 'safetrack_enabled' as const,
      name: 'SafeTrack',
      description: 'Device tracking and asset management',
      icon: MapPin,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
  ];

  const enabledCount = Object.values(settings).filter(Boolean).length;

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-cyan-500/30">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-cyan-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-white">SafeSuite Portal Access</CardTitle>
              <CardDescription>
                Configure which SafeSuite tools are available to {companyName}'s portal users
              </CardDescription>
            </div>
          </div>
          <Badge 
            className={enabledCount > 0 
              ? 'bg-cyan-500/20 text-cyan-400' 
              : 'bg-slate-500/20 text-slate-400'
            }
          >
            {enabledCount}/4 enabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {tools.map((tool) => (
            <div
              key={tool.key}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                settings[tool.key]
                  ? 'bg-slate-800/50 border-cyan-500/30'
                  : 'bg-slate-900/30 border-slate-700/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                  <tool.icon className={`h-4 w-4 ${tool.color}`} />
                </div>
                <div>
                  <Label className="text-white font-medium">{tool.name}</Label>
                  <p className="text-xs text-white/50">{tool.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[tool.key]}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, [tool.key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-300">
            Enabled tools will appear in the customer portal and Vanguard Agent taskbar 
            for all contacts with portal access at this company.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save SafeSuite Settings
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
