import { useRef, useEffect, useCallback } from "react";
import { Pause, Play } from "lucide-react";

interface RemoteDesktopCanvasProps {
  deviceName: string;
  quality: 'high' | 'medium' | 'low';
  isPaused: boolean;
  isFullscreen: boolean;
  onMouseEvent: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onKeyboardEvent: (event: React.KeyboardEvent) => void;
  onScreenFrame?: (frameData: any) => void;
}

export const RemoteDesktopCanvas = ({ 
  deviceName, 
  quality, 
  isPaused, 
  isFullscreen,
  onMouseEvent,
  onKeyboardEvent,
  onScreenFrame
}: RemoteDesktopCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render screen frame on canvas
  const renderScreenFrame = useCallback((ctx: CanvasRenderingContext2D, frameData: any) => {
    if (frameData.imageData) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
      };
      img.src = `data:image/jpeg;base64,${frameData.imageData}`;
    }
  }, []);

  // Setup canvas for displaying remote screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // This would be connected to the WebSocket message handler
    if (onScreenFrame) {
      onScreenFrame((frameData: any) => renderScreenFrame(ctx, frameData));
    }
  }, [renderScreenFrame, onScreenFrame]);

  return (
    <div className="relative bg-black">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className={`w-full ${isFullscreen ? 'h-screen' : 'h-96'} object-contain cursor-crosshair`}
        onMouseDown={onMouseEvent}
        onMouseUp={onMouseEvent}
        onMouseMove={onMouseEvent}
        onClick={onMouseEvent}
        onDoubleClick={onMouseEvent}
        onKeyDown={onKeyboardEvent}
        onKeyUp={onKeyboardEvent}
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
  );
};