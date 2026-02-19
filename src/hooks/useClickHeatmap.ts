import { useState, useCallback } from 'react';

export interface ClickPoint {
  id: string;
  x: number;
  y: number;
  path: string;
  target: string;
  timestamp: number;
}

export function useClickHeatmap() {
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(1280);
  const [canvasHeight, setCanvasHeight] = useState(720);
  const [radius, setRadius] = useState(20);
  const [opacity, setOpacity] = useState(0.6);

  const recordClick = useCallback((x: number, y: number, path: string, target: string) => {
    setClicks(prev => [...prev, { id: crypto.randomUUID(), x, y, path, target, timestamp: Date.now() }].slice(-5000));
  }, []);

  const clearClicks = useCallback(() => setClicks([]), []);

  const getHotspots = useCallback((pagePath?: string) => {
    const filtered = pagePath ? clicks.filter(c => c.path === pagePath) : clicks;
    const grid = new Map<string, number>();
    const cellSize = 40;
    for (const c of filtered) {
      const key = `${Math.floor(c.x / cellSize)},${Math.floor(c.y / cellSize)}`;
      grid.set(key, (grid.get(key) || 0) + 1);
    }
    return [...grid.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([key, count]) => {
      const [gx, gy] = key.split(',').map(Number);
      return { x: gx * cellSize + cellSize / 2, y: gy * cellSize + cellSize / 2, count };
    });
  }, [clicks]);

  const generateTrackingScript = useCallback((): string => {
    return `<script>
(function() {
  var clicks = [];
  document.addEventListener('click', function(e) {
    clicks.push({ x: e.clientX, y: e.clientY, path: location.pathname, target: e.target.tagName, ts: Date.now() });
    if (clicks.length >= 50) {
      fetch('/api/heatmap', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clicks) });
      clicks = [];
    }
  });
})();
</script>`;
  }, []);

  const generateOverlayCode = useCallback((): string => {
    return `import { useEffect, useRef } from 'react';

export function HeatmapOverlay({ clicks, width = ${canvasWidth}, height = ${canvasHeight} }: { clicks: { x: number; y: number; count: number }[]; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    const maxCount = Math.max(...clicks.map(c => c.count), 1);

    for (const click of clicks) {
      const intensity = click.count / maxCount;
      const gradient = ctx.createRadialGradient(click.x, click.y, 0, click.x, click.y, ${radius});
      gradient.addColorStop(0, \`rgba(255, 0, 0, \${intensity * ${opacity}})\`);
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(click.x, click.y, ${radius}, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [clicks, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="absolute inset-0 pointer-events-none z-50" />;
}`;
  }, [canvasWidth, canvasHeight, radius, opacity]);

  return { clicks, isRecording, setIsRecording, canvasWidth, setCanvasWidth, canvasHeight, setCanvasHeight, radius, setRadius, opacity, setOpacity, recordClick, clearClicks, getHotspots, generateTrackingScript, generateOverlayCode };
}
