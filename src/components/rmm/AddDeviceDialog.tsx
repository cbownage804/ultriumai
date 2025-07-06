import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Server, 
  Monitor, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Laptop,
  HardDrive,
  Apple
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddDeviceDialogProps {
  trigger?: React.ReactNode;
  onDeviceAdded?: () => void;
}

export const AddDeviceDialog = ({ trigger, onDeviceAdded }: AddDeviceDialogProps) => {
  const [open, setOpen] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceType, setDeviceType] = useState<'server' | 'workstation'>('workstation');
  const [osType, setOsType] = useState<'windows' | 'macos' | 'linux'>('windows');
  const [clientId, setClientId] = useState('');
  const [generatedConfig, setGeneratedConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateAgent = async () => {
    if (!deviceName || !clientId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rmm-agent', {
        body: {
          action: 'register_agent',
          clientId,
          deviceInfo: {
            hostname: deviceName,
            type: deviceType,
            os: osType
          }
        }
      });

      if (error) throw error;

      setGeneratedConfig(data.agentConfig);
      
      toast({
        title: "Agent Configuration Generated",
        description: "Download the installer for your operating system"
      });

      onDeviceAdded?.();
    } catch (error) {
      console.error('Failed to generate agent:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate RMM agent configuration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getOSIcon = (os: string) => {
    switch (os) {
      case 'windows': return <HardDrive className="h-4 w-4" />;
      case 'macos': return <Apple className="h-4 w-4" />;
      case 'linux': return <Laptop className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getDownloadInstructions = (os: string) => {
    const baseUrl = `${window.location.origin}/agent-download`;
    
    switch (os) {
      case 'windows':
        return {
          installer: `${baseUrl}/ultrium-rmm-agent-windows.msi`,
          command: `msiexec /i ultrium-rmm-agent-windows.msi /quiet AGENT_ID="${generatedConfig?.agentId}" CLIENT_ID="${clientId}"`,
          description: "Windows MSI installer with automatic configuration"
        };
      case 'macos':
        return {
          installer: `${baseUrl}/ultrium-rmm-agent-macos.pkg`,
          command: `sudo installer -pkg ultrium-rmm-agent-macos.pkg -target / && sudo /opt/ultrium/configure-agent.sh "${generatedConfig?.agentId}" "${clientId}"`,
          description: "macOS PKG installer with configuration script"
        };
      case 'linux':
        return {
          installer: `${baseUrl}/ultrium-rmm-agent-linux.deb`,
          command: `sudo dpkg -i ultrium-rmm-agent-linux.deb && sudo /opt/ultrium/configure-agent.sh "${generatedConfig?.agentId}" "${clientId}"`,
          description: "Linux DEB package with configuration script"
        };
      default:
        return { installer: '', command: '', description: '' };
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Command copied to clipboard"
    });
  };

  const resetForm = () => {
    setDeviceName('');
    setClientId('');
    setGeneratedConfig(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-primary to-primary/90">
            <Server className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Add New Device to RMM
          </DialogTitle>
          <DialogDescription>
            Register a new device and generate the RMM agent installer for Windows, macOS, or Linux
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configure" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Configure Device</TabsTrigger>
            <TabsTrigger value="download" disabled={!generatedConfig}>Download Agent</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name *</Label>
                <Input
                  id="deviceName"
                  placeholder="e.g., DESKTOP-PC01 or SERVER-01"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID *</Label>
                <Input
                  id="clientId"
                  placeholder="Client identifier"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Device Type</Label>
                <Select value={deviceType} onValueChange={(value: 'server' | 'workstation') => setDeviceType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workstation">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Workstation
                      </div>
                    </SelectItem>
                    <SelectItem value="server">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Server
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operating System</Label>
                <Select value={osType} onValueChange={(value: 'windows' | 'macos' | 'linux') => setOsType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="windows">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Windows
                      </div>
                    </SelectItem>
                    <SelectItem value="macos">
                      <div className="flex items-center gap-2">
                        <Apple className="h-4 w-4" />
                        macOS
                      </div>
                    </SelectItem>
                    <SelectItem value="linux">
                      <div className="flex items-center gap-2">
                        <Laptop className="h-4 w-4" />
                        Linux
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateAgent} disabled={loading}>
                {loading ? "Generating..." : "Generate Agent"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="download" className="space-y-4">
            {generatedConfig && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Agent Configuration Generated
                    </CardTitle>
                    <CardDescription>
                      Agent ID: <Badge variant="outline">{generatedConfig.agentId}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Device Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Name: <strong>{deviceName}</strong></div>
                          <div>Type: <strong>{deviceType}</strong></div>
                          <div>OS: <strong>{osType}</strong></div>
                          <div>Client: <strong>{clientId}</strong></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getOSIcon(osType)}
                      Download & Install Agent
                    </CardTitle>
                    <CardDescription>
                      {getDownloadInstructions(osType).description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => window.open(getDownloadInstructions(osType).installer)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Installer
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => copyToClipboard(getDownloadInstructions(osType).command)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Command
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Installation Command:</Label>
                      <div className="p-3 bg-muted rounded font-mono text-sm">
                        {getDownloadInstructions(osType).command}
                      </div>
                    </div>

                    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800">Installation Instructions:</p>
                          <ol className="list-decimal list-inside mt-1 space-y-1 text-yellow-700">
                            <li>Download the installer for your operating system</li>
                            <li>Run the installer with administrator privileges</li>
                            <li>The agent will automatically connect and begin monitoring</li>
                            <li>Device should appear in your RMM dashboard within 5 minutes</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};