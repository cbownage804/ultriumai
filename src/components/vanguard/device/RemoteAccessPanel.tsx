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
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConnect = async (provider: string, id: string) => {
    setIsConnecting(provider);
    
    try {
      let url = "";
      switch (provider) {
        case "rustdesk":
          url = `rustdesk://${id}`;
          break;
        case "splashtop":
          url = `splashtop://${id}`;
          break;
        case "anydesk":
          url = `anydesk:${id}`;
          break;
        case "teamviewer":
          url = `teamviewer10://control?device=${id}`;
          break;
      }
      
      window.open(url, "_blank");
      toast.success(`Opening ${provider}...`, {
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

  const providers = [
    {
      id: "rustdesk",
      name: "RustDesk",
      color: "bg-orange-500",
      deviceId: rustdeskId,
      description: "Open-source remote desktop",
      icon: "🦀",
    },
    {
      id: "splashtop",
      name: "Splashtop",
      color: "bg-blue-500",
      deviceId: splashtopId,
      description: "Business remote access",
      icon: "💧",
    },
    {
      id: "anydesk",
      name: "AnyDesk",
      color: "bg-red-500",
      deviceId: anydeskId,
      description: "Fast remote desktop",
      icon: "🔴",
    },
    {
      id: "teamviewer",
      name: "TeamViewer",
      color: "bg-cyan-500",
      deviceId: teamviewerId,
      description: "Enterprise remote support",
      icon: "🔵",
    },
  ];

  const configuredProviders = providers.filter((p) => p.deviceId);
  const hasAnyProvider = configuredProviders.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Remote Access
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
                Enter the device IDs for each remote access provider
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {providers.map((provider) => (
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
            <p className="text-sm">No remote access configured</p>
            <p className="text-xs mt-1">Click Configure to add provider IDs</p>
          </div>
        ) : (
          <Tabs defaultValue={configuredProviders[0]?.id} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${configuredProviders.length}, 1fr)` }}>
              {configuredProviders.map((provider) => (
                <TabsTrigger key={provider.id} value={provider.id} className="text-xs">
                  <span className="mr-1">{provider.icon}</span>
                  {provider.name}
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
                        <p className="font-medium text-sm">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {provider.deviceId}
                    </Badge>
                  </div>

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
                      onClick={() => copyToClipboard(provider.deviceId!, provider.name + " ID")}
                    >
                      {copied === provider.name + " ID" ? (
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
