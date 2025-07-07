import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRemoteAccess } from "@/hooks/useRemoteAccess";
import { useRemoteDesktop } from "@/hooks/useRemoteDesktop";
import { useToast } from "@/hooks/use-toast";
import { RemoteDesktopControls } from "./RemoteDesktopControls";
import { RemoteDesktopCanvas } from "./RemoteDesktopCanvas";
import { RemoteTerminal } from "./RemoteTerminal";
import { RemoteFileTransfer } from "./RemoteFileTransfer";
import { RemoteClipboard } from "./RemoteClipboard";
import { RemoteSettings } from "./RemoteSettings";

interface RemoteDesktopViewerProps {
  sessionId: string;
  deviceId: string;
  deviceName: string;
  onClose: () => void;
}

export const RemoteDesktopViewer = ({ sessionId, deviceId, deviceName, onClose }: RemoteDesktopViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();
  
  const { 
    sessions,
    connectWebSocket,
    endSession 
  } = useRemoteAccess();

  const {
    isPaused,
    setIsPaused,
    quality,
    setQuality,
    remoteClipboard,
    commandOutput,
    wsRef,
    handleMouseEvent,
    handleKeyboardEvent,
    executeCommand,
    uploadFile,
    downloadFile,
    syncToRemote,
    syncFromRemote
  } = useRemoteDesktop(sessionId, deviceId);

  // Initialize WebSocket connection for live screen sharing
  useEffect(() => {
    const connectToSession = async () => {
      try {
        // Get the session token from the sessions data
        let session = sessions.find(s => s.id === sessionId);
        
        if (!session) {
          // Wait a moment and try again in case sessions are still loading
          await new Promise(resolve => setTimeout(resolve, 500));
          session = sessions.find(s => s.id === sessionId);
          
          if (!session) {
            console.log('Session not found after retry, using simulation mode');
            toast({
              title: "Simulation Mode",
              description: "Running in simulation mode - session data not found",
              variant: "default"
            });
            return;
          }
        }

        const sessionToken = session.session_token;
        console.log('Connecting with session token:', sessionToken);
        
        const ws = await connectWebSocket(sessionToken);
        
        if (ws) {
          wsRef.current = ws;
          setupCanvasRendering(ws);
        } else {
          // Fallback: Show simulated interface when WebSocket connection fails
          console.log('WebSocket connection failed, showing simulated interface');
          toast({
            title: "Simulated Mode",
            description: "Remote session running in simulation mode - WebSocket connection unavailable",
            variant: "default",
          });
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
  }, [sessionId, sessions, connectWebSocket, toast]);

  // Setup canvas for displaying remote screen
  const setupCanvasRendering = useCallback((ws: WebSocket) => {
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'screen_frame':
            // This would be handled by the canvas component
            break;
          case 'cursor_position':
            console.log('Cursor position:', message.data);
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
  }, [deviceName, toast]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Toggle pause
  const togglePause = useCallback(() => {
    setIsPaused(!isPaused);
  }, [isPaused, setIsPaused]);

  // Close session
  const handleCloseSession = useCallback(async () => {
    try {
      await endSession(sessionId);
      onClose();
    } catch (error) {
      console.error('Failed to close session:', error);
      onClose(); // Close anyway
    }
  }, [endSession, sessionId, onClose]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <Card className={`${isFullscreen ? 'h-full border-0 rounded-none' : ''}`}>
        <CardHeader className="pb-2">
          <RemoteDesktopControls
            deviceName={deviceName}
            isPaused={isPaused}
            isFullscreen={isFullscreen}
            onTogglePause={togglePause}
            onToggleFullscreen={toggleFullscreen}
            onClose={handleCloseSession}
          />
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

            <TabsContent value="screen" className="p-0">
              <RemoteDesktopCanvas
                deviceName={deviceName}
                quality={quality}
                isPaused={isPaused}
                isFullscreen={isFullscreen}
                onMouseEvent={handleMouseEvent}
                onKeyboardEvent={handleKeyboardEvent}
              />
            </TabsContent>

            <TabsContent value="terminal" className="p-4">
              <RemoteTerminal
                commandOutput={commandOutput}
                onExecuteCommand={executeCommand}
              />
            </TabsContent>

            <TabsContent value="files" className="p-4">
              <RemoteFileTransfer
                onUploadFile={uploadFile}
                onDownloadFile={downloadFile}
              />
            </TabsContent>

            <TabsContent value="clipboard" className="p-4">
              <RemoteClipboard
                onSyncToRemote={syncToRemote}
                onSyncFromRemote={syncFromRemote}
                remoteClipboard={remoteClipboard}
              />
            </TabsContent>

            <TabsContent value="settings" className="p-4">
              <RemoteSettings
                sessionId={sessionId}
                deviceName={deviceName}
                quality={quality}
                isPaused={isPaused}
                onQualityChange={setQuality}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};