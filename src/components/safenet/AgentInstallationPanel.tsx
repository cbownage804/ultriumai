import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Monitor, Shield, Settings, Copy, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AgentInstallationPanelProps {
  selectedDevice: any;
  connectorKey: string;
}

export const AgentInstallationPanel: React.FC<AgentInstallationPanelProps> = ({
  selectedDevice,
  connectorKey
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
    toast({
      title: "Copied!",
      description: "Agent token copied to clipboard",
    });
  };

  const downloadAgent = async (type: 'gui' | 'headless') => {
    setIsDownloading(true);
    try {
      const response = await supabase.functions.invoke('rmm-agent-download', {
        body: {
          agent_type: type,
          connector_key: connectorKey,
          device_ip: selectedDevice?.ip_address,
          device_name: selectedDevice?.device_name || selectedDevice?.hostname
        }
      });

      console.log('Function response:', response);

      if (response.error) {
        console.error('Supabase function error:', response.error);
        throw new Error(response.error.message);
      }

      if (!response.data || response.data.error) {
        console.error('Function returned error:', response.data);
        throw new Error(response.data?.error || 'Unknown error occurred');
      }

      // Create download link
      const fileName = type === 'gui' 
        ? 'UltriumRMMAgent-GUI-Installer.ps1'
        : 'UltriumRMMAgent-Installer.ps1';
      
      const blob = new Blob([response.data.installer_content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Agent Downloaded",
        description: `${type === 'gui' ? 'GUI' : 'Headless'} agent installer downloaded successfully`,
      });
    } catch (error) {
      console.error('Error downloading agent:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download agent installer",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          RMM Agent Installation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <h3 className="font-medium">Current Discovery Status</h3>
            <p className="text-sm text-muted-foreground">
              Basic network scanning only - limited device information
            </p>
          </div>
          <Badge variant="outline">Basic Scan</Badge>
        </div>

        {/* Agent Benefits */}
        <div className="space-y-3">
          <h3 className="font-medium">With RMM Agent You Get:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Real-time monitoring</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Detailed hardware info</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Software inventory</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Security event detection</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Patch management</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Remote management</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Installation Instructions */}
        <div className="space-y-4">
          <h3 className="font-medium">Installation Steps:</h3>
          
          {/* Step 1: Agent Token */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">1. Agent Token</h4>
            <div className="flex items-center gap-2 p-3 bg-muted rounded border">
              <code className="flex-1 text-sm font-mono">{connectorKey}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(connectorKey)}
              >
                {copiedToken ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Step 2: Download Agent */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">2. Download Agent Installer</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={() => downloadAgent('gui')}
                disabled={isDownloading}
                className="h-auto p-4 flex-col items-start"
                variant="outline"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-4 w-4" />
                  <span className="font-medium">GUI Installer</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Interactive installer with system tray
                </span>
              </Button>
              
              <Button
                onClick={() => downloadAgent('headless')}
                disabled={isDownloading}
                className="h-auto p-4 flex-col items-start"
                variant="outline"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Headless Installer</span>
                </div>
                <span className="text-xs text-muted-foreground text-left">
                  Command-line installer for servers
                </span>
              </Button>
            </div>
          </div>

          {/* Step 3: Installation */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">3. Installation</h4>
            <div className="p-3 bg-muted rounded">
              <p className="text-sm mb-2">On the target device ({selectedDevice?.ip_address}):</p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Run PowerShell as Administrator</li>
                <li>Navigate to downloaded file location</li>
                <li>Execute: <code className="bg-background px-1 rounded">PowerShell -ExecutionPolicy Bypass -File UltriumRMMAgent-*.ps1</code></li>
                <li>Enter the agent token when prompted</li>
                <li>Wait for installation to complete</li>
              </ol>
            </div>
          </div>

          {/* Step 4: Verification */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">4. Verification</h4>
            <div className="p-3 bg-muted rounded">
              <p className="text-sm text-muted-foreground">
                The device will appear as "Managed" in your dashboard within 5 minutes after successful installation.
                You'll see detailed hardware information, real-time monitoring data, and security events.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};