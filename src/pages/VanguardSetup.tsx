import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Copy, Check, Loader2, Download, Package, Monitor, Building2, Apple, Terminal,
  ChevronDown, CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';
import { getAgentConfig } from '@/hooks/useVanguardAgentConfig';
import { generateOneClickInstaller, generateMsiOneLiner } from '@/utils/generateWindowsMsiInstaller';
import { downloadBlob } from '@/utils/generateVanguardZip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const [mspCompanyName, setMspCompanyName] = useState<string>('');
  
  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ token: string; expiresAt: string } | null>(null);
  
  // Tray is always enabled
  const enableTray = true;
  
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

  // Fetch MSP clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      if (!user?.id) return;
      
      try {
        const { data: mspData, error: mspError } = await supabase
          .from('msps')
          .select('id, company_name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (mspError) throw mspError;
        
        if (!mspData) {
          setClients([]);
          setLoadingClients(false);
          return;
        }
        
        setMspCompanyName(mspData.company_name || 'My Organization');
        
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
    document.title = 'Install Agent | Vanguard';
  }, []);

  // Handle Windows download with provisioning token
  const handleWindowsDownload = async () => {
    if (!user?.id) {
      toast.error('Please log in to download the agent');
      return;
    }

    setIsDownloading(true);

    try {
      const clientName = selectedClient?.company_name || 'My Organization';
      
      const result = await generateOneClickInstaller({
        clientId: selectedClientId || undefined,
        clientName,
        enableTray,
        maxUses: 10, // Allow multiple installs from one download
        expiresInDays: 7,
      });
      
      if (!result) {
        throw new Error('Failed to create provisioning token. Please try again.');
      }
      
      // Store token info for display
      setTokenInfo({
        token: result.token,
        expiresAt: result.expiresAt,
      });
      
      // Download the CMD installer (just double-click to run!)
      downloadBlob(result.blob, result.filename);
      
      toast.success('Installer downloaded!', {
        description: 'Just double-click to install. It handles everything automatically!',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate installer');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle other OS downloads (placeholder)
  const handleOtherOSDownload = () => {
    toast.info(`${selectedOS === 'macos' ? 'macOS' : 'Linux'} agent coming soon!`);
  };

  const copyOneLiner = () => {
    if (tokenInfo?.token) {
      const liner = generateMsiOneLiner(tokenInfo.token);
      navigator.clipboard.writeText(liner);
      setCopied('oneliner');
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const formatExpiryDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
        <h1 className="text-2xl font-bold mb-1">Deploy Vanguard Agent</h1>
        <p className="text-muted-foreground text-sm">
          1-click deployment for Windows, macOS, or Linux endpoints
        </p>
      </div>

      <div className="space-y-4">
        {/* Main Card */}
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
                    <Badge variant="outline" className="text-xs">MSI Installer</Badge>
                  </div>
                </TabsContent>

                <TabsContent value="macos" className="mt-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">macOS 12+</Badge>
                    <Badge variant="outline" className="text-xs">Apple Silicon</Badge>
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  </div>
                </TabsContent>

                <TabsContent value="linux" className="mt-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">Ubuntu 20.04+</Badge>
                    <Badge variant="outline" className="text-xs">Debian 11+</Badge>
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Client Selector */}
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
                      <span className="text-muted-foreground">{mspCompanyName || 'My Organization'} (internal)</span>
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


            {/* Download Button */}
            <Button 
              onClick={selectedOS === 'windows' ? handleWindowsDownload : handleOtherOSDownload} 
              className="w-full" 
              size="lg"
              disabled={isDownloading || selectedOS !== 'windows'}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isDownloading ? 'Generating Installer...' : `Download ${osLabels[selectedOS]} Agent`}
            </Button>
            
            {selectedOS !== 'windows' && (
              <p className="text-center text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                {osLabels[selectedOS]} agent is coming soon
              </p>
            )}
          </CardContent>
        </Card>

        {/* Token Info (after download) */}
        {tokenInfo && selectedOS === 'windows' && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">1-Click Installer Ready</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Expires: {formatExpiryDate(tokenInfo.expiresAt)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Quick Deploy Command</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyOneLiner}
                    className="h-7 text-xs"
                  >
                    {copied === 'oneliner' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Copy
                  </Button>
                </div>
                <pre className="p-3 rounded-lg bg-background border text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {generateMsiOneLiner(tokenInfo.token)}
                </pre>
              </div>
              
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="flex items-start gap-2 text-sm">
                  <Package className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                  <div className="text-muted-foreground">
                    <span className="text-cyan-500 font-medium">Just double-click the .cmd file!</span>{' '}
                    It automatically requests admin access, downloads the agent package, 
                    configures credentials, and starts the service. A system tray icon 
                    provides quick access to the customer portal.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Advanced Options */}
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
