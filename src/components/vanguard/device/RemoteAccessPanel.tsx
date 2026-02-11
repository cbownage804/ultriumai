import { useState, useEffect } from "react";
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
  Eye,
  EyeOff,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  REMOTE_ACCESS_PROVIDERS, 
  isRemoteAccessConfigured,
  getRustDeskConnectionUrl 
} from "@/config/vanguardRemoteAccess";
import { launchProtocolUrl } from "@/utils/launchProtocolUrl";

interface RemoteAccessPanelProps {
  agentId: string;
  deviceName: string;
  rustdeskId?: string;
  splashtopId?: string;
  anydeskId?: string;
  teamviewerId?: string;
  onUpdateIds: (ids: {
    rustdeskId?: string;
    splashtopId?: string;
    anydeskId?: string;
    teamviewerId?: string;
  }) => Promise<void>;
}

export function RemoteAccessPanel({
  agentId,
  deviceName,
  rustdeskId,
  splashtopId,
  anydeskId,
  teamviewerId,
  onUpdateIds,
}: RemoteAccessPanelProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    rustdeskId: rustdeskId || "",
    splashtopId: splashtopId || "",
    anydeskId: anydeskId || "",
    teamviewerId: teamviewerId || "",
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [rustdeskPassword, setRustdeskPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Auto-fetch password when RustDesk is configured
  useEffect(() => {
    if (rustdeskId && agentId && !rustdeskPassword) {
      fetchRustDeskPassword(true);
    }
  }, [rustdeskId, agentId]);
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const fetchRustDeskPassword = async (silent = false): Promise<string | null> => {
    if (!agentId) return null;
    
    setLoadingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!silent) toast.error("Please log in to view password");
        return null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://nsyobmjpdpvesjwdphlh.supabase.co'}/functions/v1/vanguard-agent-api?action=get_rustdesk_password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ agent_id: agentId }),
        }
      );

      const data = await response.json();
      if (data.password) {
        setRustdeskPassword(data.password);
        if (!silent) setShowPassword(true);
        return data.password;
      } else if (!silent) {
        toast.info("No unattended password configured yet");
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch password:', err);
      if (!silent) toast.error("Failed to retrieve password");
      return null;
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleConnect = (provider: string, id: string) => {
    setIsConnecting(provider);

    try {
      const providerConfig = REMOTE_ACCESS_PROVIDERS[provider as keyof typeof REMOTE_ACCESS_PROVIDERS];

      const safeId = provider === 'rustdesk' ? String(id || '').replace(/\D/g, '') : id;
      const url = providerConfig
        ? `${providerConfig.protocol}${safeId}`
        : `rustdesk://${safeId}`;

      launchProtocolUrl(url);

      // Optional: for RustDesk, fetch/copy password in the background (no toast)
      if (provider === 'rustdesk') {
        void (async () => {
          try {
            const pw = rustdeskPassword || await fetchRustDeskPassword(true);
            if (pw) await navigator.clipboard.writeText(pw);
          } catch (err) {
            console.error('Failed to fetch/copy RustDesk password:', err);
          }
        })();
      } else {
        toast.success(`Opening ${providerConfig?.name || provider}...`, {
          description: `Connecting to ${deviceName}`,
        });
      }
    } catch (err) {
      toast.error(`Failed to open ${provider}`);
    } finally {
      setTimeout(() => setIsConnecting(null), 1000);
    }
  };

  const handleSaveIds = async () => {
    try {
      await onUpdateIds({
        rustdeskId: formData.rustdeskId || undefined,
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

  // Build provider list with device IDs
  const providers = [
    {
      ...REMOTE_ACCESS_PROVIDERS.rustdesk,
      deviceId: rustdeskId,
    },
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
  const hasRustDesk = Boolean(rustdeskId);
  const hasAnyProvider = configuredProviders.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Remote Access
            {hasRustDesk && (
              <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600 border-green-500/30">
                <Zap className="h-3 w-3 mr-1" />
                Built-in
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
                RustDesk is auto-configured by the Vanguard agent. Other providers can be manually configured.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* RustDesk - Auto-configured notice */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span>🦀</span>
                  RustDesk ID
                  <Badge variant="secondary" className="text-xs">Auto-detected</Badge>
                </Label>
                <Input
                  placeholder="Auto-detected from agent..."
                  value={formData.rustdeskId}
                  onChange={(e) => setFormData({ ...formData, rustdeskId: e.target.value })}
                  className={formData.rustdeskId ? "bg-green-500/5 border-green-500/30" : ""}
                />
                {!formData.rustdeskId && (
                  <p className="text-xs text-muted-foreground">
                    The agent will auto-install and report the RustDesk ID
                  </p>
                )}
              </div>

              {/* Other providers */}
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
        {!hasAnyProvider ? (
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Waiting for RustDesk ID...</p>
            <p className="text-xs mt-1">
              The agent will auto-install RustDesk and report the ID
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
          <Tabs defaultValue={hasRustDesk ? "rustdesk" : configuredProviders[0]?.id} className="w-full">
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

                  {/* RustDesk Password Section */}
                  {provider.isBuiltIn && (
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Key className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Unattended Password</span>
                        </div>
                        {rustdeskPassword ? (
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-slate-800 rounded text-sm font-mono">
                              {showPassword ? rustdeskPassword : '••••••••••••'}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(rustdeskPassword, "Password")}
                            >
                              {copied === "Password" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchRustDeskPassword()}
                            disabled={loadingPassword}
                          >
                            {loadingPassword ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show Password
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Use this password for unattended remote access
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleConnect(provider.id, provider.deviceId!)}
                      disabled={isConnecting === provider.id || !provider.deviceId}
                    >
                      {isConnecting === provider.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : !provider.deviceId ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Waiting for ID...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(provider.deviceId!, provider.name + " ID")}
                    >
                      {copied === provider.name + " ID" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Extra info for built-in RustDesk */}
                  {provider.isBuiltIn && (
                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Vanguard Built-in Remote Access</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        All sessions route through your private relay server. No third-party dependencies.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
