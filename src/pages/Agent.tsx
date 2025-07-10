import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Monitor, Wifi, HardDrive, Cpu, Activity, Shield } from "lucide-react";

interface SystemInfo {
  hostname: string;
  os: string;
  browser: string;
  screen: string;
  memory: string;
  connection: string;
}

export const Agent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [agentId, setAgentId] = useState<string>('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Generate or retrieve agent ID
  useEffect(() => {
    let storedAgentId = localStorage.getItem('rmm_agent_id');
    if (!storedAgentId) {
      storedAgentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rmm_agent_id', storedAgentId);
    }
    setAgentId(storedAgentId);
  }, []);

  // Collect system information
  useEffect(() => {
    const collectSystemInfo = async (): Promise<SystemInfo> => {
      const nav = navigator as any;
      const screen = window.screen;
      
      // Get memory info if available
      let memoryInfo = 'Unknown';
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryInfo = `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used`;
      }

      // Get connection info
      let connectionInfo = 'Unknown';
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        connectionInfo = `${conn.effectiveType} (${conn.downlink}Mbps)`;
      }

      return {
        hostname: window.location.hostname,
        os: nav.platform || nav.userAgentData?.platform || 'Unknown',
        browser: `${nav.userAgent.split(' ').slice(-2).join(' ')}`,
        screen: `${screen.width}x${screen.height} (${screen.colorDepth}bit)`,
        memory: memoryInfo,
        connection: connectionInfo
      };
    };

    collectSystemInfo().then(setSystemInfo);
  }, []);

  // Connect to RMM server
  const connectToServer = async () => {
    try {
      const wsUrl = `wss://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/rmm-realtime?agent_id=${agentId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        toast({
          title: "Connected to RMM Server",
          description: "Agent is now online and ready for management",
        });

        // Register this device
        ws.send(JSON.stringify({
          type: 'device_registration',
          data: {
            agent_id: agentId,
            system_info: systemInfo,
            timestamp: Date.now()
          }
        }));
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await handleRemoteCommand(message);
      };

      ws.onclose = () => {
        setIsConnected(false);
        toast({
          title: "Disconnected from RMM Server",
          description: "Attempting to reconnect...",
          variant: "destructive"
        });
        
        // Attempt reconnection after 5 seconds
        setTimeout(connectToServer, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to RMM server",
          variant: "destructive"
        });
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Could not establish connection to RMM server",
        variant: "destructive"
      });
    }
  };

  // Handle remote commands from RMM server
  const handleRemoteCommand = async (message: any) => {
    switch (message.type) {
      case 'start_screen_share':
        await startScreenShare();
        break;
      case 'stop_screen_share':
        stopScreenShare();
        break;
      case 'execute_command':
        executeSystemCommand(message.data.command);
        break;
      case 'system_info_request':
        sendSystemInfo();
        break;
      case 'ping':
        sendPong();
        break;
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      streamRef.current = stream;
      setIsStreaming(true);

      // Send stream data via WebSocket (simplified)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.createElement('video');
      
      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const captureFrame = () => {
          if (!isStreaming || !ctx) return;
          
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.5);
          
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'screen_frame',
              data: imageData,
              timestamp: Date.now()
            }));
          }
          
          setTimeout(captureFrame, 100); // 10 FPS
        };

        captureFrame();
      };

      toast({
        title: "Screen Sharing Started",
        description: "Your screen is now being shared",
      });

    } catch (error) {
      console.error('Screen share failed:', error);
      toast({
        title: "Screen Share Failed",
        description: "Could not start screen sharing",
        variant: "destructive"
      });
    }
  };

  // Stop screen sharing
  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    
    toast({
      title: "Screen Sharing Stopped",
      description: "Screen sharing has been disabled",
    });
  };

  // Execute system commands (limited to web context)
  const executeSystemCommand = (command: string) => {
    let result = '';
    
    try {
      // Limited command execution in browser context
      switch (command.toLowerCase()) {
        case 'systeminfo':
        case 'info':
          result = JSON.stringify(systemInfo, null, 2);
          break;
        case 'clear':
          result = 'Console cleared';
          break;
        case 'date':
          result = new Date().toString();
          break;
        case 'whoami':
          result = 'Web Agent User';
          break;
        default:
          result = `Command "${command}" not supported in web context`;
      }
    } catch (error) {
      result = `Error executing command: ${error}`;
    }

    // Send result back to server
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'command_result',
        data: {
          command,
          result,
          timestamp: Date.now()
        }
      }));
    }
  };

  // Send system information
  const sendSystemInfo = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'system_info_response',
        data: systemInfo,
        timestamp: Date.now()
      }));
    }
  };

  // Send pong response
  const sendPong = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }));
    }
  };

  // Send heartbeat every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'heartbeat',
          data: { agent_id: agentId },
          timestamp: Date.now()
        }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [agentId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Ultrium RMM Agent
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Agent ID: <code className="font-mono">{agentId}</code>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
                {isStreaming && (
                  <Badge variant="secondary">
                    <Activity className="h-3 w-3 mr-1" />
                    Streaming
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                onClick={connectToServer} 
                disabled={isConnected}
              >
                {isConnected ? "Connected" : "Connect to Server"}
              </Button>
              <Button 
                variant="outline" 
                onClick={startScreenShare}
                disabled={!isConnected || isStreaming}
              >
                Start Screen Share
              </Button>
              <Button 
                variant="outline" 
                onClick={stopScreenShare}
                disabled={!isStreaming}
              >
                Stop Screen Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        {systemInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Platform</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.os}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Screen</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.screen}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Browser Memory</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.memory}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Connection</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.connection}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              1. Click "Connect to Server" to register this device with the RMM platform
            </p>
            <p className="text-sm text-muted-foreground">
              2. Once connected, administrators can remotely manage this device
            </p>
            <p className="text-sm text-muted-foreground">
              3. Screen sharing allows remote viewing and support sessions
            </p>
            <p className="text-sm text-muted-foreground">
              4. Keep this page open for continuous monitoring
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};