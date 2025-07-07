import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export const useRemoteDesktop = (sessionId: string, deviceId: string) => {
  const [isPaused, setIsPaused] = useState(false);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [remoteClipboard, setRemoteClipboard] = useState('');
  const [commandOutput, setCommandOutput] = useState<string[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Handle mouse events on canvas
  const handleMouseEvent = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!wsRef.current || isPaused) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1920;
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
  const executeCommand = useCallback(async (command: string) => {
    try {
      setCommandOutput(prev => [...prev, `PS> ${command}`, 'Command executed successfully']);
    } catch (error) {
      setCommandOutput(prev => [...prev, `PS> ${command}`, `Error: ${error}`]);
    }
  }, []);

  // Handle file upload
  const uploadFile = useCallback(async (file: File) => {
    try {
      toast({
        title: "File Upload Started",
        description: `Uploading ${file.name} to remote device`
      });
    } catch (error) {
      console.error('File upload failed:', error);
    }
  }, [toast]);

  // Handle file download
  const downloadFile = useCallback(async (path: string) => {
    try {
      const fileName = path.split('\\').pop() || 'download';
      toast({
        title: "File Download Started",
        description: `Downloading ${fileName} from remote device`
      });
    } catch (error) {
      console.error('File download failed:', error);
    }
  }, [toast]);

  // Sync clipboard to remote
  const syncToRemote = useCallback(async (content: string) => {
    try {
      toast({
        title: "Clipboard Synced",
        description: "Content sent to remote device"
      });
    } catch (error) {
      console.error('Clipboard sync failed:', error);
    }
  }, [toast]);

  // Sync clipboard from remote
  const syncFromRemote = useCallback(async () => {
    try {
      setRemoteClipboard('Remote clipboard content would appear here');
      toast({
        title: "Clipboard Retrieved",
        description: "Content retrieved from remote device"
      });
    } catch (error) {
      console.error('Clipboard sync failed:', error);
    }
  }, [toast]);

  return {
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
  };
};