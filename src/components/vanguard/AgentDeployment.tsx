import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Download,
  Copy,
  Terminal,
  Monitor,
  Server,
  Shield,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const SUPABASE_URL = "https://nsyobmjpdpvesjwdphlh.supabase.co";

export const AgentDeployment: React.FC = () => {
  const { user } = useAuth();
  const [deploymentKey, setDeploymentKey] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateDeploymentKey = async () => {
    setGenerating(true);
    try {
      // Generate a unique deployment key
      const key = `vg-${crypto.randomUUID().split('-').slice(0, 2).join('')}`;
      setDeploymentKey(key);
      
      // Save to database
      await (supabase
        .from('safenet_connectors') as any)
        .insert({
          user_id: user?.id,
          connector_key: key,
          status: 'active',
          connector_type: 'vanguard_agent',
        });

      toast.success('Deployment key generated');
    } catch (error) {
      console.error('Error generating key:', error);
      toast.error('Failed to generate key');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadPowerShellAgent = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/rmm-agent-ps?key=${encodeURIComponent(deploymentKey || 'demo-key')}`
      );

      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VanguardAgent.ps1';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('PowerShell agent downloaded');
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Failed to download agent');
    }
  };

  const windowsOneLineInstall = `powershell -ExecutionPolicy Bypass -Command "& {iwr -useb '${SUPABASE_URL}/functions/v1/rmm-agent-ps?key=${deploymentKey || 'YOUR-KEY'}' | iex; .\\VanguardAgent.ps1 -Install}"`;
  
  const linuxOneLineInstall = `curl -sSL https://raw.githubusercontent.com/vanguard-rmm/agent/main/install.sh | sudo bash -s -- --key "${deploymentKey || 'YOUR-KEY'}"`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Agent Deployment</h2>
        <p className="text-muted-foreground">
          Deploy Vanguard agents to your endpoints for monitoring, compliance scanning, and remote access
        </p>
      </div>

      {/* Deployment Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Deployment Key
          </CardTitle>
          <CardDescription>
            Generate a unique key for agent deployment. This key authenticates agents with your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="key">Your Deployment Key</Label>
              <div className="flex gap-2">
                <Input
                  id="key"
                  value={deploymentKey}
                  readOnly
                  placeholder="Click 'Generate' to create a new key"
                  className="font-mono"
                />
                {deploymentKey && (
                  <Button variant="outline" onClick={() => copyToClipboard(deploymentKey)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Button onClick={generateDeploymentKey} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Key'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Tabs */}
      <Tabs defaultValue="windows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="windows" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Windows
          </TabsTrigger>
          <TabsTrigger value="linux" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Linux/Pi
          </TabsTrigger>
          <TabsTrigger value="macos" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            macOS
          </TabsTrigger>
        </TabsList>

        {/* Windows */}
        <TabsContent value="windows">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Windows Agent</CardTitle>
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Full Support
                </Badge>
              </div>
              <CardDescription>
                PowerShell-based agent with MeshCentral integration, compliance scanning, and remote execution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* One-liner install */}
              <div>
                <Label className="text-sm font-medium">One-Line Install (Run as Administrator)</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-sm break-all">
                  <ScrollArea className="w-full">
                    <code>{windowsOneLineInstall}</code>
                  </ScrollArea>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => copyToClipboard(windowsOneLineInstall)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Command
                </Button>
              </div>

              {/* Manual download */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Manual Installation</Label>
                <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <li>1. Download the PowerShell agent script</li>
                  <li>2. Open PowerShell as Administrator</li>
                  <li>3. Run: <code className="bg-muted px-1">Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process</code></li>
                  <li>4. Run: <code className="bg-muted px-1">.\VanguardAgent.ps1 -Install</code></li>
                </ol>
                <Button onClick={downloadPowerShellAgent} className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download PowerShell Agent
                </Button>
              </div>

              {/* Features */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Included Features</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    'System Monitoring',
                    'CIS Compliance Scanning',
                    'NIST 800-53 Checks',
                    'PCI-DSS Validation',
                    'MeshCentral Integration',
                    'Remote PowerShell',
                    'Process Management',
                    'Service Control',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Linux/Pi */}
        <TabsContent value="linux">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Linux / Raspberry Pi Agent</CardTitle>
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Full Support
                </Badge>
              </div>
              <CardDescription>
                Python-based agent for Ubuntu, Debian, and Raspberry Pi with network scanning capabilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* One-liner install */}
              <div>
                <Label className="text-sm font-medium">One-Line Install (Run as root)</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-sm break-all">
                  <code>{linuxOneLineInstall}</code>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => copyToClipboard(linuxOneLineInstall)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Command
                </Button>
              </div>

              {/* Manual steps */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Manual Installation</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-sm space-y-2">
                  <p># Install dependencies</p>
                  <p>sudo apt update && sudo apt install -y python3 python3-pip python3-venv nmap</p>
                  <p className="mt-2"># Download agent</p>
                  <p>wget https://example.com/vanguard_agent.py</p>
                  <p className="mt-2"># Configure and run</p>
                  <p>python3 vanguard_agent.py --key "{deploymentKey || 'YOUR-KEY'}"</p>
                </div>
              </div>

              {/* Features */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Included Features</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    'System Monitoring',
                    'Network Scanning (nmap)',
                    'Vulnerability Detection',
                    'SSH Management',
                    'Linux Compliance Checks',
                    'Command Execution',
                    'Auto-Update',
                    'Systemd Service',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* macOS */}
        <TabsContent value="macos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>macOS Agent</CardTitle>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                  Monitoring Only
                </Badge>
              </div>
              <CardDescription>
                Python-based monitoring agent for macOS systems.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Installation</Label>
                <div className="mt-2 p-4 bg-muted rounded-lg font-mono text-sm">
                  <p># Install via Homebrew</p>
                  <p>brew install python3</p>
                  <p className="mt-2"># Download and run</p>
                  <p>curl -sSL https://example.com/vanguard_agent.py -o vanguard_agent.py</p>
                  <p>python3 vanguard_agent.py --key "{deploymentKey || 'YOUR-KEY'}"</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Included Features</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    'System Monitoring',
                    'CPU/Memory/Disk Stats',
                    'Process Listing',
                    'Network Info',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="https://docs.vanguard.app/agent-installation"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:bg-muted transition-colors flex items-start gap-3"
            >
              <Terminal className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Installation Guide</h4>
                <p className="text-sm text-muted-foreground">
                  Step-by-step deployment instructions
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
            </a>
            <a
              href="https://docs.vanguard.app/compliance-frameworks"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:bg-muted transition-colors flex items-start gap-3"
            >
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">Compliance Frameworks</h4>
                <p className="text-sm text-muted-foreground">
                  CIS, NIST, PCI-DSS documentation
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
            </a>
            <a
              href="https://meshcentral.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 border rounded-lg hover:bg-muted transition-colors flex items-start gap-3"
            >
              <Monitor className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">MeshCentral Setup</h4>
                <p className="text-sm text-muted-foreground">
                  Configure remote access
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDeployment;
