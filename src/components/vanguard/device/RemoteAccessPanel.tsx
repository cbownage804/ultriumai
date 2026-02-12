import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Monitor,
  ExternalLink,
  Settings,
  Copy,
  Check,
  Loader2,
  Zap,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { REMOTE_ACCESS_PROVIDERS } from "@/config/vanguardRemoteAccess";
import { openMeshCentralSession } from "@/config/vanguardMeshCentral";
import { launchProtocolUrl } from "@/utils/launchProtocolUrl";
import { ModuleIntroBanner } from "@/components/vanguard/shared/ModuleInstructions";

interface RemoteAccessPanelProps {
  agentId: string;
  deviceName: string;
  splashtopId?: string;
  anydeskId?: string;
  teamviewerId?: string;
  meshcentralNodeId?: string;
  onUpdateIds: (ids: {
    splashtopId?: string;
    anydeskId?: string;
    teamviewerId?: string;
  }) => Promise<void>;
}

export function RemoteAccessPanel({
  agentId,
  deviceName,
  splashtopId,
  anydeskId,
  teamviewerId,
  meshcentralNodeId,
  onUpdateIds,
}: RemoteAccessPanelProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    splashtopId: splashtopId || "",
    anydeskId: anydeskId || "",
    teamviewerId: teamviewerId || "",
  });
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConnect = async (provider: string, id: string) => {
    setIsConnecting(provider);

    try {
      // MeshCentral: open browser-based session (no client needed)
      if (provider === 'meshcentral') {
        toast.info('Opening MeshCentral remote desktop...');
        const success = await openMeshCentralSession(id);
        if (success) {
          toast.success('MeshCentral session opened in new tab');
        } else {
          toast.error('MeshCentral not available', {
            description: 'Check that MeshCentral server is configured.',
          });
        }
        return;
      }

      const providerConfig = REMOTE_ACCESS_PROVIDERS[provider as keyof typeof REMOTE_ACCESS_PROVIDERS];
      const url = providerConfig
        ? `${providerConfig.protocol}${id}`
        : id;

      launchProtocolUrl(url);
      toast.success(`Opening ${providerConfig?.name || provider}...`, {
        description: `Connecting to ${deviceName}`,
      });
    } catch (err) {
      toast.error(`Failed to open ${provider}`);
    } finally {
      setTimeout(() => setIsConnecting(null), 1000);
    }
  };

  const handleSaveIds = async () => {
    try {
      await onUpdateIds({
        splashtopId: formData.splashtopId || undefined,
        anydeskId: formData.anydeskId || undefined,
        teamviewerId: formData.teamviewerId || undefined,
      });
      setEditDialogOpen(false);
      toast.success("Remote access IDs updated");
    } catch (err) {
      toast.error("Failed to save IDs");
    }
  };

  // Build provider list — MeshCentral first as primary
  const providers = [
    ...(meshcentralNodeId ? [{
      ...REMOTE_ACCESS_PROVIDERS.meshcentral,
      deviceId: meshcentralNodeId,
    }] : []),
    {
      ...REMOTE_ACCESS_PROVIDERS.anydesk,
      deviceId: anydeskId,
    },
    {
      ...REMOTE_ACCESS_PROVIDERS.teamviewer,
      deviceId: teamviewerId,
    },
    {
      ...REMOTE_ACCESS_PROVIDERS.splashtop,
      deviceId: splashtopId,
    },
  ];

  const configuredProviders = providers.filter((p) => p.deviceId);
  const hasMeshCentral = Boolean(meshcentralNodeId);
  const hasAnyProvider = configuredProviders.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Remote Access
            {hasMeshCentral && (
              <Badge variant="outline" className="ml-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                <Zap className="h-3 w-3 mr-1" />
                Zero-touch
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Connect to {deviceName} via remote desktop
          </CardDescription>
        </div>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Remote Access</DialogTitle>
              <DialogDescription>
                MeshCentral is auto-configured by the Vanguard agent. Other providers can be manually configured.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {[
                REMOTE_ACCESS_PROVIDERS.anydesk,
                REMOTE_ACCESS_PROVIDERS.teamviewer,
                REMOTE_ACCESS_PROVIDERS.splashtop,
              ].map((provider) => (
                <div key={provider.id} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>{provider.icon}</span>
                    {provider.name} ID
                  </Label>
                  <Input
                    placeholder={`Enter ${provider.name} ID...`}
                    value={formData[`${provider.id}Id` as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [`${provider.id}Id`]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveIds}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {hasMeshCentral && (
          <ModuleIntroBanner
            title="MeshCentral — Zero-Touch Remote Access"
            description="Click Connect to open a browser-based remote desktop session. No client software needed on your computer."
            features={["Browser-based", "No passwords to paste", "Unattended access"]}
            docsUrl="https://meshcentral.com"
            docsLabel="About MeshCentral"
            storageKey="meshcentral-primary-notice"
            accentColor="green"
          />
        )}
        {!hasAnyProvider ? (
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Waiting for agent setup...</p>
            <p className="text-xs mt-1">
              The agent will install MeshCentral automatically for zero-touch remote access
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => setEditDialogOpen(true)}
            >
              Configure Manually
            </Button>
          </div>
        ) : (
          <Tabs defaultValue={hasMeshCentral ? "meshcentral" : configuredProviders[0]?.id} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${configuredProviders.length}, 1fr)` }}>
              {configuredProviders.map((provider) => (
                <TabsTrigger key={provider.id} value={provider.id} className="text-xs">
                  <span className="mr-1">{provider.icon}</span>
                  {provider.name}
                  {provider.isBuiltIn && (
                    <Zap className="h-3 w-3 ml-1 text-green-500" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {configuredProviders.map((provider) => (
              <TabsContent key={provider.id} value={provider.id} className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${provider.color}`} />
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          {provider.name}
                          {provider.isBuiltIn && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                              <Shield className="h-3 w-3 mr-1" />
                              Vanguard-hosted
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {provider.deviceId}
                    </Badge>
                  </div>

                  {/* Vanguard Built-in info */}
                  {provider.isBuiltIn && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <p className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Vanguard Built-in Remote Access
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        All sessions route through your private relay server. No third-party dependencies.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleConnect(provider.id, provider.deviceId!)}
                      disabled={isConnecting === provider.id}
                    >
                      {isConnecting === provider.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Connect
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(provider.deviceId!, `${provider.name} ID`)}
                    >
                      {copied === `${provider.name} ID` ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
