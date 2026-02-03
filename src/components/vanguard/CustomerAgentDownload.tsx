/**
 * Customer Agent Download Component
 * Pre-configured agent download for a specific customer context
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
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { generateWindowsAgentZip } from '@/utils/generateWindowsAgentZip';
import { downloadBlob } from '@/utils/generateVanguardZip';
import { getAgentConfig } from '@/hooks/useVanguardAgentConfig';
import { generateMsiInstallerBlob, generateMsiOneLiner } from '@/utils/generateWindowsMsiInstaller';

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
  const [oneLiner, setOneLiner] = useState<string | null>(null);

  const handleDownloadAgent = async (platform: 'windows' | 'linux', format: 'zip' | 'msi' = 'zip') => {
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
      // Fetch config dynamically from server
      setDownloadMessage('Fetching agent configuration...');
      const agentConfig = await getAgentConfig();
      
      if (!agentConfig) {
        throw new Error('Failed to fetch agent configuration. Please try again.');
      }

      if (format === 'msi') {
        // Generate PowerShell installer script
        setDownloadMessage('Generating MSI installer script...');
        setDownloadProgress(50);
        
        const blob = generateMsiInstallerBlob({
          userId: agentConfig.userId,
          secretKey: agentConfig.secretKey,
          clientId: customerId,
          clientName: customerName,
          enableTray: true,
        });
        
        const filename = `Install-VanguardAgent-${customerName.replace(/[^a-zA-Z0-9]/g, '-')}.ps1`;
        downloadBlob(blob, filename);
        
        // Also generate the one-liner for display
        const liner = generateMsiOneLiner({
          userId: agentConfig.userId,
          secretKey: agentConfig.secretKey,
          clientId: customerId,
          enableTray: true,
        });
        setOneLiner(liner);
        
        setDownloadProgress(100);
        toast.success(`MSI installer downloaded for ${customerName}`, {
          description: 'Run the PowerShell script as Administrator to install.',
        });
      } else {
        // Generate ZIP package
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
      toast.error('Failed to generate download');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadMessage('');
    }
  };

  const copyOneLiner = () => {
    if (oneLiner) {
      navigator.clipboard.writeText(oneLiner);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
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
            <span>Network isolation capability</span>
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
              MSI Installer
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
                  <div className="text-xs opacity-80">Enterprise Deployment</div>
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
            
            {/* One-liner display */}
            {oneLiner && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Quick Deploy Command:</span>
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
                <pre className="p-3 rounded-lg bg-black/50 border border-cyan-500/20 text-xs text-cyan-400 overflow-x-auto">
                  {oneLiner}
                </pre>
              </div>
            )}
            
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-start gap-2 text-sm">
                <Package className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                <div className="text-white/70">
                  <span className="text-purple-400 font-medium">Enterprise-ready:</span>{' '}
                  Downloads a PowerShell script that fetches the official MSI and installs with embedded credentials. 
                  Compatible with Intune, SCCM, and GPO.
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
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
