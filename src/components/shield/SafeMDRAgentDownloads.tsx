import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  Shield, 
  Monitor, 
  Smartphone, 
  Server, 
  Copy, 
  CheckCircle, 
  Eye,
  Activity,
  Brain,
  Zap
} from "lucide-react";

interface EDRAgentDownload {
  id: string;
  platform: string;
  version: string;
  download_url: string;
  file_size: number;
  checksum: string;
  download_count: number;
}

export const SafeMDRAgentDownloads = () => {
  const [downloads, setDownloads] = useState<EDRAgentDownload[]>([]);
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAgentDownloads();
    generateLicenseKey();
  }, []);

  const loadAgentDownloads = async () => {
    try {
      // Mock data for SafeMDR agents - in production this would come from database
      const mockDownloads: EDRAgentDownload[] = [
        {
          id: '1',
          platform: 'Windows',
          version: '2.1.0',
          download_url: '/downloads/UltriumEDRAgent-Windows-2.1.0.msi',
          file_size: 45.2,
          checksum: 'sha256:a1b2c3d4e5f6...',
          download_count: 1247
        },
        {
          id: '2', 
          platform: 'macOS',
          version: '2.1.0',
          download_url: '/downloads/UltriumEDRAgent-macOS-2.1.0.pkg',
          file_size: 52.8,
          checksum: 'sha256:f6e5d4c3b2a1...',
          download_count: 423
        },
        {
          id: '3',
          platform: 'Linux',
          version: '2.1.0', 
          download_url: '/downloads/UltriumEDRAgent-Linux-2.1.0.deb',
          file_size: 38.1,
          checksum: 'sha256:1a2b3c4d5e6f...',
          download_count: 892
        }
      ];

      setDownloads(mockDownloads);
    } catch (error) {
      console.error('Error loading EDR agent downloads:', error);
      toast({
        title: "Error",
        description: "Failed to load EDR agent downloads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLicenseKey = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        // Generate a unique license key for SafeMDR
        const key = `SEDR-${user.user.id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        setLicenseKey(key);
      }
    } catch (error) {
      console.error('Error generating license key:', error);
      toast({
        title: "Error",
        description: "Failed to generate license key",
        variant: "destructive",
      });
    }
  };

  const downloadAgent = async (platform: string, downloadUrl: string) => {
    try {
      toast({
        title: "Download Started",
        description: `SafeMDR agent for ${platform} is downloading...`,
      });

      // Simulate download tracking
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        // In production, track download in database
        console.log(`User ${user.user.id} downloaded SafeMDR agent for ${platform}`);
      }

      // In production, this would trigger actual file download
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading agent:', error);
      toast({
        title: "Download Error", 
        description: "Failed to start download",
        variant: "destructive",
      });
    }
  };

  const copyLicenseKey = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopiedKey(true);
    toast({
      title: "License Key Copied",
      description: "License key copied to clipboard",
    });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'windows': return <Monitor className="h-5 w-5" />;
      case 'macos': return <Monitor className="h-5 w-5" />;
      case 'linux': return <Server className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Eye className="h-6 w-6" />
          SafeMDR Agent Downloads
        </h2>
        <p className="text-muted-foreground">
          Deploy AI-powered endpoint detection and response agents to monitor and protect your systems
        </p>
      </div>

      {/* SafeEDR Features */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI-Powered EDR Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Real-time Behavioral Analysis</div>
                <div className="text-sm text-muted-foreground">AI monitors process behavior patterns</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Automated Response</div>
                <div className="text-sm text-muted-foreground">Instant threat containment</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium">Advanced Threat Detection</div>
                <div className="text-sm text-muted-foreground">ML-powered anomaly detection</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            License Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Use this license key when installing SafeMDR agents on your endpoints. 
              This key links agents to your management console and enables AI behavioral analysis.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 font-mono text-sm">{licenseKey}</code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLicenseKey}
              className="shrink-0"
            >
              {copiedKey ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedKey ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agent Downloads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {downloads.map((download) => (
          <Card key={download.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getPlatformIcon(download.platform)}
                <div>
                  <div>{download.platform}</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    Version {download.version}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>File Size:</span>
                  <span>{download.file_size} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Downloads:</span>
                  <Badge variant="secondary">{download.download_count.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Checksum:</span>
                  <span className="font-mono text-xs truncate ml-2" title={download.checksum}>
                    {download.checksum.substring(0, 16)}...
                  </span>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={() => downloadAgent(download.platform, download.download_url)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Agent
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Windows
              </h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Download the .msi installer</li>
                <li>2. Run as Administrator</li>
                <li>3. Enter your license key</li>
                <li>4. Complete installation</li>
                <li>5. Agent starts automatically</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                macOS
              </h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Download the .pkg installer</li>
                <li>2. Double-click to install</li>
                <li>3. Enter license key</li>
                <li>4. Allow system permissions</li>
                <li>5. Service starts automatically</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Linux
              </h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Download the .deb package</li>
                <li>2. Install: <code>sudo dpkg -i *.deb</code></li>
                <li>3. Configure: <code>sudo sedr-config</code></li>
                <li>4. Enter license key</li>
                <li>5. Start: <code>sudo systemctl start sedr</code></li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertDescription>
          <strong>Next Steps:</strong> Once agents are installed, they will automatically begin sending 
          behavioral data to our AI analysis engine. View real-time detections and alerts in the SafeMDR dashboard.
        </AlertDescription>
      </Alert>
    </div>
  );
};