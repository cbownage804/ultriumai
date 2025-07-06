import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  Monitor, 
  Apple, 
  Laptop,
  Shield,
  Key,
  Copy,
  CheckCircle
} from "lucide-react";

interface EndpointDownload {
  platform: 'windows' | 'mac' | 'linux';
  version: string;
  download_url: string;
  file_size: number;
  checksum: string;
  download_count: number;
}

export const EndpointAgentDownloads = () => {
  const [downloads, setDownloads] = useState<EndpointDownload[]>([]);
  const [licenseKey, setLicenseKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDownloads();
    generateLicenseKey();
  }, []);

  const loadDownloads = async () => {
    try {
      // Simulate endpoint downloads - in production, these would be real installers
      const mockDownloads: EndpointDownload[] = [
        {
          platform: 'windows',
          version: '1.0.0',
          download_url: '/downloads/SafeShield-Windows-v1.0.0.msi',
          file_size: 45678912,
          checksum: 'sha256:a1b2c3d4e5f6...',
          download_count: 127
        },
        {
          platform: 'mac',
          version: '1.0.0',
          download_url: '/downloads/SafeShield-macOS-v1.0.0.pkg',
          file_size: 52341856,
          checksum: 'sha256:f6e5d4c3b2a1...',
          download_count: 89
        },
        {
          platform: 'linux',
          version: '1.0.0',
          download_url: '/downloads/SafeShield-Linux-v1.0.0.deb',
          file_size: 38945123,
          checksum: 'sha256:123456789abc...',
          download_count: 34
        }
      ];

      setDownloads(mockDownloads);
    } catch (error) {
      console.error('Error loading downloads:', error);
      toast({
        title: "Error",
        description: "Failed to load endpoint agents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLicenseKey = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Generate a unique license key for this MSP
      const userId = user.user.id.replace(/-/g, '').substring(0, 8).toUpperCase();
      const timestamp = Date.now().toString(36).toUpperCase();
      const key = `ULTRIUM-${userId}-${timestamp}`;
      
      setLicenseKey(key);
    } catch (error) {
      console.error('Error generating license key:', error);
    }
  };

  const copyLicenseKey = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast({
        title: "License Key Copied",
        description: "License key copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy license key",
        variant: "destructive",
      });
    }
  };

  const downloadAgent = async (platform: string, downloadUrl: string) => {
    try {
      // In production, this would be a real download
      toast({
        title: "Download Started",
        description: `SafeShield agent for ${platform} is downloading...`,
      });

      // Simulate download tracking
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase.functions.invoke('ultrium-shield-agent', {
          body: { 
            action: 'track_download',
            platform,
            user_id: user.user.id
          }
        });
      }

      // In a real app, you'd trigger the actual file download here
      // window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Error downloading agent:', error);
      toast({
        title: "Error",
        description: "Failed to download agent",
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'windows': return <Monitor className="h-6 w-6" />;
      case 'mac': return <Apple className="h-6 w-6" />;
      case 'linux': return <Laptop className="h-6 w-6" />;
      default: return <Monitor className="h-6 w-6" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'windows': return 'Windows';
      case 'mac': return 'macOS';
      case 'linux': return 'Linux';
      default: return platform;
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
          <Shield className="h-6 w-6" />
          Endpoint Agent Downloads
        </h2>
        <p className="text-muted-foreground">
          Deploy SafeShield agents to protect your client endpoints
        </p>
      </div>

      {/* License Key Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Your MSP License Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <div className="space-y-3">
                <p className="text-sm">
                  Use this license key when installing agents on client endpoints:
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                  <code className="flex-1">{licenseKey}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyLicenseKey}
                    className="shrink-0"
                  >
                    {copiedKey ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This key links all deployed agents to your MSP account and enables centralized management.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {downloads.map((download) => (
          <Card key={download.platform} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getPlatformIcon(download.platform)}
                  <div>
                    <CardTitle className="text-lg">
                      {getPlatformName(download.platform)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Version {download.version}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {download.download_count} downloads
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Size:</span>
                  <span>{formatFileSize(download.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Checksum:</span>
                  <span className="font-mono text-xs truncate max-w-[120px]">
                    {download.checksum}
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

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Installation:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {download.platform === 'windows' && (
                    <>
                      <li>Run as Administrator</li>
                      <li>Enter license key during setup</li>
                      <li>Agent auto-starts after install</li>
                    </>
                  )}
                  {download.platform === 'mac' && (
                    <>
                      <li>Double-click .pkg file</li>
                      <li>Follow installation wizard</li>
                      <li>Grant security permissions</li>
                    </>
                  )}
                  {download.platform === 'linux' && (
                    <>
                      <li>sudo dpkg -i filename.deb</li>
                      <li>Configure /etc/ultrium/config</li>
                      <li>systemctl start ultrium-agent</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Automated Deployment</h4>
              <div className="space-y-2 text-sm">
                <p>For large-scale MSP deployments:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Use Group Policy (Windows)</li>
                  <li>Jamf Pro or similar (macOS)</li>
                  <li>Ansible/Puppet (Linux)</li>
                  <li>Silent install with license key</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Manual Installation</h4>
              <div className="space-y-2 text-sm">
                <p>For individual client setup:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Download appropriate agent</li>
                  <li>Run installer with admin rights</li>
                  <li>Enter MSP license key</li>
                  <li>Verify connection in dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};