import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Cpu,
  Download,
  Check,
  ArrowRight,
  ArrowLeft,
  FileJson,
  Terminal,
  Copy,
  Package,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  RECON_HARDWARE_TIERS,
  RECON_SUBSCRIPTION_TIERS,
} from '@/config/reconPricing';

interface ReconImageBuilderProps {
  /** If provided, limits org selection to this list (admin mode passes all clients) */
  mode?: 'admin' | 'msp';
  onClose?: () => void;
}

const generateActivationKey = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const parts: string[] = [];
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }
  return `VGD-${parts.join('-')}`;
};

const generateSerialNumber = (): string => {
  const prefix = 'RCN';
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

type Step = 'client' | 'hardware' | 'review';

export const ReconImageBuilder = ({ mode = 'msp', onClose }: ReconImageBuilderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('client');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [hardwareTier, setHardwareTier] = useState<'lite' | 'pro'>('pro');
  const [subscriptionTier, setSubscriptionTier] = useState<'essential' | 'professional' | 'enterprise'>('professional');
  const [serialNumber, setSerialNumber] = useState(generateSerialNumber());
  const [notes, setNotes] = useState('');
  const [generatedConfig, setGeneratedConfig] = useState<string | null>(null);
  const [activationKey, setActivationKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch orgs
  const { data: clients = [] } = useQuery({
    queryKey: ['image-builder-clients', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: msp } = await supabase
        .from('msps')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!msp) return [];
      const { data } = await supabase
        .from('msp_clients')
        .select('id, company_name')
        .eq('msp_id', msp.id)
        .eq('is_active', true)
        .order('company_name');
      return data || [];
    },
    enabled: !!user,
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleGenerate = async () => {
    if (!user || !selectedClientId) return;
    setIsGenerating(true);

    try {
      const key = generateActivationKey();
      setActivationKey(key);

      // Insert into recon_inventory
      const { error } = await supabase.from('recon_inventory').insert({
        serial_number: serialNumber,
        hardware_tier: hardwareTier,
        activation_key: key,
        status: 'assigned',
        notes: notes || null,
        provisioned_at: new Date().toISOString(),
        provisioned_by: user.id,
      });

      if (error) throw error;

      // Build config
      const config = {
        activation_key: key,
        serial_number: serialNumber,
        client_id: selectedClientId,
        client_name: selectedClient?.company_name,
        api: {
          base_url: 'https://nsyobmjpdpvesjwdphlh.supabase.co',
          functions_url: 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1',
          activate_endpoint: '/recon-activate',
          heartbeat_endpoint: '/vanguard-heartbeat',
          anon_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI',
        },
        owner_user_id: user.id,
        hardware_tier: hardwareTier,
        subscription_tier: subscriptionTier,
        settings: {
          heartbeat_interval_seconds: 60,
          scan_interval_seconds: subscriptionTier === 'essential' ? 86400 : 3600,
          log_level: 'info',
          auto_update: true,
        },
        features: {
          network_discovery: true,
          vulnerability_scanning: subscriptionTier !== 'essential',
          traffic_analysis: subscriptionTier === 'enterprise' || subscriptionTier === 'professional',
          threat_detection: true,
          compliance_reporting: subscriptionTier === 'enterprise',
        },
        provisioned_at: new Date().toISOString(),
        config_version: '1.0.0',
      };

      setGeneratedConfig(JSON.stringify(config, null, 2));
      setStep('review');
      toast({ title: 'Config generated successfully' });
    } catch (err: any) {
      toast({ title: 'Failed to generate config', description: err.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedConfig) return;
    const blob = new Blob([generatedConfig], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon-config-${serialNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Config downloaded' });
  };

  const handleCopy = () => {
    if (!generatedConfig) return;
    navigator.clipboard.writeText(generatedConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Config copied to clipboard' });
  };

  const steps: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: 'client', label: 'Select Client', icon: Building2 },
    { key: 'hardware', label: 'Configure Hardware', icon: Cpu },
    { key: 'review', label: 'Download Config', icon: Download },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-cyan-500" />
          Build Recon Unit Image
        </CardTitle>
        <CardDescription>
          Configure a new Recon unit with the correct client association and download the config bundle.
        </CardDescription>

        {/* Step indicator */}
        <div className="flex items-center gap-2 pt-4">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  i <= currentStepIndex
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Select Client */}
        {step === 'client' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Client / Organization</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the client site this unit will be assigned to..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {client.company_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The Recon unit will be pre-configured to report to this organization.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                disabled={!selectedClientId}
                onClick={() => setStep('hardware')}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Hardware */}
        {step === 'hardware' && (
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-500" />
              <span className="text-muted-foreground">Client:</span>
              <span className="font-medium">{selectedClient?.company_name}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hardware Tier</Label>
                <Select value={hardwareTier} onValueChange={(v) => setHardwareTier(v as 'lite' | 'pro')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECON_HARDWARE_TIERS).map(([key, tier]) => (
                      <SelectItem key={key} value={key}>
                        {tier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Select value={subscriptionTier} onValueChange={(v) => setSubscriptionTier(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECON_SUBSCRIPTION_TIERS).map(([key, tier]) => (
                      <SelectItem key={key} value={key}>
                        {tier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Serial Number</Label>
              <div className="flex gap-2">
                <Input
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSerialNumber(generateSerialNumber())}
                >
                  Regenerate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Deployment notes, location details, etc."
                rows={2}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('client')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !serialNumber}
                className="gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileJson className="h-4 w-4" />
                )}
                Generate Config
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Download */}
        {step === 'review' && generatedConfig && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Check className="h-6 w-6 text-green-400" />
              <div>
                <p className="font-medium text-green-400">Config Generated</p>
                <p className="text-sm text-muted-foreground">
                  Unit <span className="font-mono">{serialNumber}</span> for {selectedClient?.company_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg font-mono text-sm">
              <span className="text-muted-foreground">Activation Key:</span>
              <span className="flex-1 text-cyan-400">{activationKey}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(activationKey);
                  toast({ title: 'Key copied' });
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-muted/30 border border-border rounded-lg text-xs font-mono overflow-auto max-h-64 text-muted-foreground">
                {generatedConfig}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Download config.json
              </Button>
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Flash Raspberry Pi OS Lite to SD card</li>
                <li>Copy <code className="text-cyan-400">config.json</code> to <code className="text-cyan-400">/opt/vanguard-recon/</code></li>
                <li>Run the installer: <code className="text-cyan-400">sudo bash install.sh</code></li>
                <li>Power on — the unit will auto-activate and appear in the dashboard</li>
              </ol>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('client');
                  setGeneratedConfig(null);
                  setActivationKey('');
                  setSerialNumber(generateSerialNumber());
                  setSelectedClientId('');
                  setNotes('');
                }}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                Build Another
              </Button>
              {onClose && (
                <Button variant="ghost" onClick={onClose}>
                  Done
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
