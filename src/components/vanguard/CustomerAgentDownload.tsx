/**
 * Customer Agent Download Component
 * Pre-configured agent download for a specific customer context
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Monitor, 
  Server, 
  Shield, 
  CheckCircle,
  Loader2,
  Package,
  Cpu
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { generateWindowsAgentZip } from '@/utils/generateWindowsAgentZip';
import { downloadBlob } from '@/utils/generateVanguardZip';

const API_ENDPOINT = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api';
const VANGUARD_SECRET = 'vgd_sk_7Kx9mPqR3nTwYz2JfL8sHcN6bVdXaE4uGtM1oWpQ5iA';

interface CustomerAgentDownloadProps {
  customerId: string;
  customerName: string;
}

export function CustomerAgentDownload({ customerId, customerName }: CustomerAgentDownloadProps) {
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');

  const handleDownloadAgent = async (platform: 'windows' | 'linux') => {
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
      const blob = await generateWindowsAgentZip({
        userId: user.id,
        apiEndpoint: API_ENDPOINT,
        secretKey: VANGUARD_SECRET,
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
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate download');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadMessage('');
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

        {/* Download Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleDownloadAgent('windows')}
            disabled={isDownloading}
            className="h-auto py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white flex flex-col items-center gap-2"
          >
            {isDownloading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Monitor className="h-6 w-6" />
            )}
            <div className="text-center">
              <div className="font-semibold">Windows Agent</div>
              <div className="text-xs opacity-80">Win 10/11/Server</div>
            </div>
          </Button>

          <Button
            onClick={() => handleDownloadAgent('linux')}
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

        {/* Installation Note */}
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2 text-sm">
            <Package className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-white/70">
              <span className="text-amber-400 font-medium">Zero-config deployment:</span>{' '}
              Extract the ZIP and run <code className="px-1 py-0.5 rounded bg-black/30 text-cyan-400">install.bat</code> as Administrator. 
              The agent will automatically register to <span className="text-white">{customerName}</span>.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
