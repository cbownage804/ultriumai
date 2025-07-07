import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Monitor,
  MousePointer,
  Keyboard,
  Upload,
  Download,
  Copy,
  ClipboardCopy,
  Terminal,
  Settings,
  Maximize2,
  Minimize2,
  X,
  Pause,
  Play,
  Volume2
} from "lucide-react";
import { useRemoteAccess } from "@/hooks/useRemoteAccess";
import { useToast } from "@/hooks/use-toast";

interface RemoteDesktopViewerProps {
  sessionId: string;
  deviceId: string;
  deviceName: string;
  onClose: () => void;
}

export const RemoteDesktopViewer = ({ sessionId, deviceId, deviceName, onClose }: RemoteDesktopViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [remoteClipboard, setRemoteClipboard] = useState('');
  const [localClipboard, setLocalClipboard] = useState('');
  const [commandInput, setCommandInput] = useState('');
  const [commandOutput, setCommandOutput] = useState<string[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [downloadPath, setDownloadPath] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const { 
    activeWebSocket, 
    executeCommand, 
    transferFile, 
    syncClipboard, 
    connectWebSocket,
    endSession 
  } = useRemoteAccess();

  // Initialize WebSocket connection for live screen sharing
  useEffect(() => {
    const connectToSession = async () => {
      try {
        // Get session token from your session management
        const sessionToken = sessionId; // In real implementation, get actual token
        const ws = await connectWebSocket(sessionToken);
        
        if (ws) {
          wsRef.current = ws;
          setupCanvasRendering(ws);
        }
      } catch (error) {
        console.error('Failed to connect to remote session:', error);
        toast({
          title: "Connection Failed",
          description: "Could not establish remote desktop connection",
          variant: "destructive"
        });
      }
    };

    connectToSession();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  // Setup canvas for displaying remote screen
  const setupCanvasRendering = (ws: WebSocket) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'screen_frame':
            // Render screen frame to canvas
            renderScreenFrame(ctx, message.data);
            break;
          case 'cursor_position':
            // Update cursor position
            updateCursorPosition(message.data);
            break;
          case 'session_ready':
            toast({
              title: "Remote Desktop Connected",
              description: `Connected to ${deviceName}`,
            });
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };
  };

  // Render screen frame on canvas
  const renderScreenFrame = (ctx: CanvasRenderingContext2D, frameData: any) => {
    if (frameData.imageData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
      };
      img.src = `data:image/jpeg;base64,${frameData.imageData}`;
    }
  };

  // Update cursor position
  const updateCursorPosition = (position: { x: number; y: number }) => {
    // Update visual cursor on canvas
    console.log('Cursor position:', position);
  };

  // Handle mouse events on canvas
  const handleMouseEvent = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!wsRef.current || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1920; // Assuming 1920x1080 remote resolution
    const y = ((event.clientY - rect.top) / rect.height) * 1080;

    const mouseEvent = {
      type: 'mouse_event',
      data: {
        x: Math.round(x),
        y: Math.round(y),
        button: event.button,
        eventType: event.type,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    wsRef.current.send(JSON.stringify(mouseEvent));
  }, [isPaused]);

  // Handle keyboard events
  const handleKeyboardEvent = useCallback((event: React.KeyboardEvent) => {
    if (!wsRef.current || isPaused) return;

    const keyEvent = {
      type: 'keyboard_event',
      data: {
        key: event.key,
        code: event.code,
        keyCode: event.keyCode,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        metaKey: event.metaKey,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    wsRef.current.send(JSON.stringify(keyEvent));
    event.preventDefault();
  }, [isPaused]);

  // Execute remote command
  const handleExecuteCommand = async () => {
    if (!commandInput.trim()) return;

    try {
      const result = await executeCommand(deviceId, commandInput, 'powershell', sessionId);
      if (result) {
        setCommandOutput(prev => [...prev, `PS> ${commandInput}`, 'Command executed successfully']);
        setCommandInput('');
      }
    } catch (error) {
      setCommandOutput(prev => [...prev, `PS> ${commandInput}`, `Error: ${error}`]);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!fileToUpload) return;

    try {
      await transferFile(
        deviceId, 
        'upload', 
        `/temp/${fileToUpload.name}`,
        `C:\\Uploads\\${fileToUpload.name}`,
        fileToUpload.name,
        fileToUpload.size,
        sessionId
      );
      
      toast({
        title: "File Upload Started",
        description: `Uploading ${fileToUpload.name} to remote device`
      });
      
      setFileToUpload(null);
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  // Handle file download
  const handleFileDownload = async () => {
    if (!downloadPath.trim()) return;

    try {
      const fileName = downloadPath.split('\\').pop() || 'download';
      await transferFile(
        deviceId,
        'download',
        `/downloads/${fileName}`,
        downloadPath,
        fileName,
        0, // Size unknown for downloads
        sessionId
      );
      
      toast({
        title: "File Download Started",
        description: `Downloading ${fileName} from remote device`
      });
      
      setDownloadPath('');
    } catch (error) {
      console.error('File download failed:', error);
    }
  };

  // Sync clipboard to remote
  const handleSyncToRemote = async () => {
    if (!localClipboard.trim()) return;

    try {
      await syncClipboard(deviceId, localClipboard, 'to_remote', sessionId);
      toast({
        title: "Clipboard Synced",
        description: "Content sent to remote device"
      });
    } catch (error) {
      console.error('Clipboard sync failed:', error);
    }
  };

  // Sync clipboard from remote
  const handleSyncFromRemote = async () => {
    try {
      // In real implementation, this would fetch clipboard from remote
      // For now, simulate receiving clipboard content
      setRemoteClipboard('Remote clipboard content would appear here');
      
      toast({
        title: "Clipboard Retrieved",
        description: "Content retrieved from remote device"
      });
    } catch (error) {
      console.error('Clipboard sync failed:', error);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Close session
  const handleCloseSession = async () => {
    try {
      await endSession(sessionId);
      onClose();
    } catch (error) {
      console.error('Failed to close session:', error);
      onClose(); // Close anyway
    }
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <Card className={`${isFullscreen ? 'h-full border-0 rounded-none' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <CardTitle className="text-lg">Remote Desktop - {deviceName}</CardTitle>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseSession}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs defaultValue="screen" className="h-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="screen">Screen</TabsTrigger>
              <TabsTrigger value="terminal">Terminal</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="clipboard">Clipboard</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Remote Screen Tab */}
            <TabsContent value="screen" className="p-0">
              <div className="relative bg-black">
                <canvas
                  ref={canvasRef}
                  width={1920}
                  height={1080}
                  className={`w-full ${isFullscreen ? 'h-screen' : 'h-96'} object-contain cursor-crosshair`}
                  onMouseDown={handleMouseEvent}
                  onMouseUp={handleMouseEvent}
                  onMouseMove={handleMouseEvent}
                  onClick={handleMouseEvent}
                  onDoubleClick={handleMouseEvent}
                  onKeyDown={handleKeyboardEvent}
                  onKeyUp={handleKeyboardEvent}
                  tabIndex={0}
                />
                
                {isPaused && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Pause className="h-12 w-12 mx-auto mb-2" />
                      <p>Remote session paused</p>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                  {deviceName} • {quality} quality • {isPaused ? 'Paused' : 'Live'}
                </div>
              </div>
            </TabsContent>

            {/* Terminal Tab */}
            <TabsContent value="terminal" className="p-4">
              <div className="space-y-4">
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                  {commandOutput.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter PowerShell command..."
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleExecuteCommand()}
                    className="font-mono"
                  />
                  <Button onClick={handleExecuteCommand}>
                    <Terminal className="h-4 w-4 mr-2" />
                    Execute
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* File Transfer Tab */}
            <TabsContent value="files" className="p-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload File to Remote
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                    />
                    <Button onClick={handleFileUpload} disabled={!fileToUpload}>
                      Upload
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download File from Remote
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="C:\path\to\file.txt"
                      value={downloadPath}
                      onChange={(e) => setDownloadPath(e.target.value)}
                    />
                    <Button onClick={handleFileDownload}>
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Clipboard Tab */}
            <TabsContent value="clipboard" className="p-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    Send to Remote Clipboard
                  </h3>
                  <Textarea
                    placeholder="Enter text to send to remote clipboard..."
                    value={localClipboard}
                    onChange={(e) => setLocalClipboard(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={handleSyncToRemote}>
                    <Copy className="h-4 w-4 mr-2" />
                    Send to Remote
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ClipboardCopy className="h-4 w-4" />
                    Remote Clipboard Content
                  </h3>
                  <Textarea
                    value={remoteClipboard}
                    readOnly
                    rows={4}
                    className="bg-muted"
                  />
                  <Button onClick={handleSyncFromRemote}>
                    <ClipboardCopy className="h-4 w-4 mr-2" />
                    Get from Remote
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="p-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Display Settings
                  </h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video Quality</label>
                    <select 
                      value={quality} 
                      onChange={(e) => setQuality(e.target.value as any)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="high">High (Best quality, more bandwidth)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="low">Low (Faster, less bandwidth)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Session Info</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Device:</strong> {deviceName}</p>
                    <p><strong>Session ID:</strong> {sessionId}</p>
                    <p><strong>Quality:</strong> {quality}</p>
                    <p><strong>Status:</strong> {isPaused ? 'Paused' : 'Active'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};