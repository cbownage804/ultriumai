/**
 * Customer Agent Download Component
 * Pre-configured agent download for a specific customer context
 * Uses provisioning tokens for true 1-click MSI deployment
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Download, 
  Monitor, 
  Server, 
  Shield, 
  CheckCircle,
  Loader2,
  Package,
  FileCode,
  Copy,
  Check,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { generateWindowsAgentZip } from '@/utils/generateWindowsAgentZip';
import { downloadBlob } from '@/utils/generateVanguardZip';
import { getAgentConfig } from '@/hooks/useVanguardAgentConfig';
import { generateOneClickInstaller, generateMsiOneLiner } from '@/utils/generateWindowsMsiInstaller';

interface CustomerAgentDownloadProps {
  customerId: string;
  customerName: string;
}

export function CustomerAgentDownload({ customerId, customerName }: CustomerAgentDownloadProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ token: string; expiresAt: string } | null>(null);

  const handleDownloadAgent = async (platform: 'windows' | 'linux', format: 'msi' | 'zip' = 'msi') => {
    if (!user?.id) {
      toast.error('Please log in to download the agent');
      return;
    }

    if (platform === 'linux') {
      toast.info('Linux agent coming soon!');
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadMessage('Initializing...');

    try {
      if (format === 'msi') {
        // Generate 1-click MSI installer with provisioning token
        setDownloadMessage('Creating provisioning token...');
        setDownloadProgress(20);
        
        const result = await generateOneClickInstaller({
          clientId: customerId,
          clientName: customerName,
          enableTray: true,
          maxUses: 1,
          expiresInDays: 7,
        });
        
        if (!result) {
          throw new Error('Failed to create provisioning token. Please try again.');
        }
        
        setDownloadProgress(80);
        setDownloadMessage('Generating installer...');
        
        // Use filename from result (now .cmd format)
        downloadBlob(result.blob, result.filename);
        
        // Store token info for display
        setTokenInfo({
          token: result.token,
          expiresAt: result.expiresAt,
        });
        
        setDownloadProgress(100);
        toast.success(`1-Click installer downloaded for ${customerName}`, {
          description: 'Just double-click the .cmd file to install!',
        });
      } else {
        // Generate ZIP package (legacy method with embedded credentials)
        setDownloadMessage('Fetching agent configuration...');
        const agentConfig = await getAgentConfig();
        
        if (!agentConfig) {
          throw new Error('Failed to fetch agent configuration. Please try again.');
        }

        const blob = await generateWindowsAgentZip({
          userId: agentConfig.userId,
          apiEndpoint: agentConfig.apiEndpoint,
          secretKey: agentConfig.secretKey,
          deviceName: `${customerName.replace(/[^a-zA-Z0-9]/g, '-')}-Device`,
          clientId: customerId,
          clientName: customerName,
          onProgress: (progress, message) => {
            setDownloadProgress(progress);
            setDownloadMessage(message);
          },
        });

        const filename = `vanguard-agent-${customerName.replace(/[^a-zA-Z0-9]/g, '-')}-windows.zip`;
        downloadBlob(blob, filename);
        
        toast.success(`Agent downloaded for ${customerName}`, {
          description: 'The agent is pre-configured to register to this customer automatically.',
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate download');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadMessage('');
    }
  };

  const copyOneLiner = () => {
    if (tokenInfo?.token) {
      const liner = generateMsiOneLiner(tokenInfo.token);
      navigator.clipboard.writeText(liner);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
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

  return (
    <Card className="bg-black/40 border-cyan-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Deploy Vanguard Agent</CardTitle>
              <CardDescription className="text-white/60">
                Download a pre-configured agent for {customerName}
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-cyan-500/30">
            XDR Enabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Features */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-white/5 border border-cyan-500/10">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Auto-registers to {customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Real-time threat detection</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>AI-powered remediation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>1-click secure deployment</span>
          </div>
        </div>

        {/* Download Progress */}
        {isDownloading && (
          <div className="space-y-2 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cyan-400">{downloadMessage}</span>
              <span className="text-white/60">{downloadProgress}%</span>
            </div>
            <Progress value={downloadProgress} className="h-2" />
          </div>
        )}

        {/* Download Options Tabs */}
        <Tabs defaultValue="msi" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="msi" className="data-[state=active]:bg-cyan-500/20">
              <Package className="h-4 w-4 mr-2" />
              1-Click MSI
            </TabsTrigger>
            <TabsTrigger value="zip" className="data-[state=active]:bg-cyan-500/20">
              <FileCode className="h-4 w-4 mr-2" />
              ZIP Package
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="msi" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleDownloadAgent('windows', 'msi')}
                disabled={isDownloading}
                className="h-auto py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white flex flex-col items-center gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Monitor className="h-6 w-6" />
                )}
                <div className="text-center">
                  <div className="font-semibold">Windows MSI</div>
                  <div className="text-xs opacity-80">1-Click Install</div>
                </div>
              </Button>

              <Button
                onClick={() => handleDownloadAgent('linux', 'msi')}
                disabled={isDownloading}
                variant="outline"
                className="h-auto py-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-2"
              >
                <Server className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Linux Agent</div>
                  <div className="text-xs opacity-80">Coming Soon</div>
                </div>
              </Button>
            </div>
            
            {/* Token info display */}
            {tokenInfo && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-400">Provisioning token created</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/60">
                    <Clock className="h-3 w-3" />
                    Expires: {formatExpiryDate(tokenInfo.expiresAt)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Quick Deploy (1 use, expires in 7 days):</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyOneLiner}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
                <pre className="p-3 rounded-lg bg-black/50 border border-cyan-500/20 text-xs text-cyan-400 overflow-x-auto whitespace-pre-wrap">
                  {generateMsiOneLiner(tokenInfo.token)}
                </pre>
              </div>
            )}
            
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-start gap-2 text-sm">
                <Package className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                <div className="text-white/70">
                  <span className="text-purple-400 font-medium">Just double-click the .cmd file!</span>{' '}
                  It automatically requests admin access, downloads the agent package, configures credentials, and starts the service.
                  A system tray icon provides quick access to the customer portal.
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="zip" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleDownloadAgent('windows', 'zip')}
                disabled={isDownloading}
                className="h-auto py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white flex flex-col items-center gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Monitor className="h-6 w-6" />
                )}
                <div className="text-center">
                  <div className="font-semibold">Windows ZIP</div>
                  <div className="text-xs opacity-80">Manual Install</div>
                </div>
              </Button>

              <Button
                onClick={() => handleDownloadAgent('linux', 'zip')}
                disabled={isDownloading}
                variant="outline"
                className="h-auto py-4 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 flex flex-col items-center gap-2"
              >
                <Server className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Linux Agent</div>
                  <div className="text-xs opacity-80">Coming Soon</div>
                </div>
              </Button>
            </div>
            
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2 text-sm">
                <FileCode className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="text-white/70">
                  <span className="text-amber-400 font-medium">Manual deployment:</span>{' '}
                  Extract the ZIP and run <code className="px-1 py-0.5 rounded bg-black/30 text-cyan-400">install.bat</code> as Administrator.
                  Credentials embedded in config.json.
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
