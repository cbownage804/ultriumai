import { useMemo } from 'react';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
}

export function MiniSparkline({ data, width = 60, height = 20, color = '#22d3ee', fillOpacity = 0.15 }: MiniSparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    
    const points = data.map((v, i) => ({
      x: i * stepX,
      y: height - ((v - min) / range) * (height - 2) - 1,
    }));

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return line;
  }, [data, width, height]);

  const fillPath = useMemo(() => {
    if (data.length < 2) return '';
    return `${path} L${width},${height} L0,${height} Z`;
  }, [path, width, height, data]);

  if (data.length < 2) return null;

  return (
    <svg width={width} height={height} className="inline-block">
      {fillPath && <path d={fillPath} fill={color} opacity={fillOpacity} />}
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
