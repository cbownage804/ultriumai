import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Copy, Check, Loader2, Download, Package, Monitor, Building2, Apple, Terminal,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';
import { getAgentConfig } from '@/hooks/useVanguardAgentConfig';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Supabase Storage bucket for agent downloads
const STORAGE_BASE = 'https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/vanguard-agents';
const AGENT_DOWNLOAD_URLS = {
  windows: `${STORAGE_BASE}/VanguardAgent-setup.exe`,
  windowsMsi: `${STORAGE_BASE}/VanguardAgent.msi`,
  macos: `${STORAGE_BASE}/VanguardAgent.dmg`,
  linux: `${STORAGE_BASE}/vanguard-agent-linux.tar.gz`,
};

type SelectedOS = 'windows' | 'macos' | 'linux';

interface MSPClient {
  id: string;
  company_name: string;
}

export default function VanguardSetup() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [copied, setCopied] = useState<string | null>(null);
  
  // Dynamic agent config from server
  const [agentConfig, setAgentConfig] = useState<{ secretKey: string; apiEndpoint: string } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  
  // OS selection state
  const [selectedOS, setSelectedOS] = useState<SelectedOS>('windows');
  
  // Client selection state
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Advanced section open state
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch agent config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      if (!session?.access_token) {
        setLoadingConfig(false);
        return;
      }
      
      try {
        const config = await getAgentConfig();
        if (config) {
          setAgentConfig({ secretKey: config.secretKey, apiEndpoint: config.apiEndpoint });
        }
      } catch (error) {
        console.error('Failed to fetch agent config:', error);
      } finally {
        setLoadingConfig(false);
      }
    };
    
    fetchConfig();
  }, [session?.access_token]);

  // Fetch MSP clients on mount - first get MSP record, then fetch clients by msp_id
  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.id) return;
      
      try {
        // First, get the MSP record for this user
        const { data: mspData, error: mspError } = await supabase
          .from('msps')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (mspError) throw mspError;
        
        if (!mspData) {
          // No MSP record found for this user
          setClients([]);
          setLoadingClients(false);
          return;
        }
        
        // Query msp_clients where msp_id matches the MSP's id and is_active is true
        const { data, error } = await supabase
          .from('msp_clients')
          .select('id, company_name')
          .eq('msp_id', mspData.id)
          .eq('is_active', true)
          .order('company_name');
        
        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };
    
    fetchClients();
  }, [user?.id]);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    document.title = 'Install Agent | Ultrium Vanguard';
  }, []);

  // Get download URL for selected OS
  const getDownloadUrl = () => {
    switch (selectedOS) {
      case 'windows':
        return AGENT_DOWNLOAD_URLS.windows;
      case 'macos':
        return AGENT_DOWNLOAD_URLS.macos;
      case 'linux':
        return AGENT_DOWNLOAD_URLS.linux;
    }
  };

  // Get installation command for selected OS
  const getInstallCommand = () => {
    const userId = user?.id || 'YOUR_USER_ID';
    const clientIdParam = selectedClientId ? ` CLIENTID="${selectedClientId}"` : '';
    const secretKey = agentConfig?.secretKey || 'YOUR_SECRET_KEY';
    
    switch (selectedOS) {
      case 'windows':
        return `# Silent install (run as Administrator)
msiexec /i VanguardAgent.msi /qn USERID="${userId}" SECRETKEY="${secretKey}"${clientIdParam}

# Or interactive install
.\\VanguardAgent-Setup.exe`;
      case 'macos':
        return `# Mount and install
hdiutil attach VanguardAgent.dmg
sudo installer -pkg /Volumes/VanguardAgent/VanguardAgent.pkg -target /

# Start the service
sudo launchctl load /Library/LaunchDaemons/com.ultriumai.vanguard.plist`;
      case 'linux':
        return `# Extract and install
tar -xzf vanguard-agent-linux.tar.gz
cd vanguard-agent
sudo ./install.sh

# Start the service
sudo systemctl enable vanguard-agent
sudo systemctl start vanguard-agent`;
    }
  };

  const handleCopyInstallCommand = () => {
    const command = getInstallCommand();
    navigator.clipboard.writeText(command);
    setCopied('install-command');
    toast.success('Install command copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDirectDownload = () => {
    const url = getDownloadUrl();
    window.open(url, '_blank');
    toast.success(`Downloading ${selectedOS} agent...`);
  };

  const osLabels = {
    windows: 'Windows',
    macos: 'macOS', 
    linux: 'Linux'
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Install Agent</h1>
        <p className="text-muted-foreground text-sm">
          Deploy Vanguard agents on Windows, macOS, or Linux
        </p>
      </div>

      <div className="space-y-4">
        {/* Main Card - Streamlined */}
        <Card className="border-primary/20">
          <CardContent className="pt-6 space-y-5">
            {/* OS Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Operating System</Label>
              <Tabs value={selectedOS} onValueChange={(v) => setSelectedOS(v as SelectedOS)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="windows" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Windows
                  </TabsTrigger>
                  <TabsTrigger value="macos" className="flex items-center gap-2">
                    <Apple className="h-4 w-4" />
                    macOS
                  </TabsTrigger>
                  <TabsTrigger value="linux" className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Linux
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="windows" className="mt-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">Windows 10/11</Badge>
                    <Badge variant="outline" className="text-xs">Server 2019+</Badge>
                    <Badge variant="outline" className="text-xs">EXE / MSI</Badge>
                  </div>
                </TabsContent>

                <TabsContent value="macos" className="mt-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">macOS 12+</Badge>
                    <Badge variant="outline" className="text-xs">Apple Silicon</Badge>
                    <Badge variant="outline" className="text-xs">Intel</Badge>
                  </div>
                </TabsContent>

                <TabsContent value="linux" className="mt-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">Ubuntu 20.04+</Badge>
                    <Badge variant="outline" className="text-xs">Debian 11+</Badge>
                    <Badge variant="outline" className="text-xs">RHEL 8+</Badge>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Client Selector - Compact */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Assign to Client
                </Label>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => navigate(`${basePath}/customers`)}
                  className="text-xs h-auto p-0"
                >
                  Manage Clients
                </Button>
              </div>
              
              {loadingClients ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading clients...
                </div>
              ) : clients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No active clients. Agent will be added to your default organization.
                </p>
              ) : (
                <Select value={selectedClientId || "__none__"} onValueChange={(v) => setSelectedClientId(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">No client — personal use</span>
                    </SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Download Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleDirectDownload} className="flex-1" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Download {osLabels[selectedOS]} Agent
              </Button>
              {selectedOS === 'windows' && (
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => window.open(AGENT_DOWNLOAD_URLS.windowsMsi, '_blank')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  MSI
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Installation Command - Collapsible */}
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Installation Command</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleCopyInstallCommand}
                className="h-8"
              >
                {copied === 'install-command' ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap">
              {getInstallCommand()}
            </pre>
          </CardContent>
        </Card>

        {/* Advanced Options - Collapsible */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Advanced Options</CardTitle>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {/* API Credentials */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">API Endpoint</Label>
                    <div className="flex gap-2 mt-1">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono truncate">
                        {agentConfig?.apiEndpoint || 'Loading...'}
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(agentConfig?.apiEndpoint || '', 'Endpoint')}
                        disabled={!agentConfig}
                      >
                        {copied === 'Endpoint' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Secret Key</Label>
                    <div className="flex gap-2 mt-1">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono truncate">
                        {agentConfig?.secretKey || 'Loading...'}
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(agentConfig?.secretKey || '', 'Secret')}
                        disabled={!agentConfig}
                      >
                        {copied === 'Secret' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">User ID</Label>
                    <div className="flex gap-2 mt-1">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono truncate">
                        {user?.id || ''}
                      </code>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(user?.id || '', 'User ID')}
                      >
                        {copied === 'User ID' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}
