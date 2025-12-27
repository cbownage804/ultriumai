import { motion } from "framer-motion";
import { AlertTriangle, Shield, Activity, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThreatNode {
  id: string;
  type: 'source' | 'target' | 'blocked';
  label: string;
  ip?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  x: number;
  y: number;
}

interface ThreatConnection {
  from: string;
  to: string;
  blocked?: boolean;
}

interface CopilotThreatMapProps {
  threats?: Array<{
    source_ip?: string;
    target?: string;
    severity?: string;
    status?: string;
  }>;
  className?: string;
}

export function CopilotThreatMap({ threats = [], className }: CopilotThreatMapProps) {
  // Generate nodes from threats or use demo data
  const nodes: ThreatNode[] = threats.length > 0 
    ? threats.slice(0, 5).map((t, i) => ({
        id: `threat-${i}`,
        type: t.status === 'blocked' ? 'blocked' : 'source',
        label: t.source_ip || 'Unknown',
        ip: t.source_ip,
        severity: (t.severity as any) || 'medium',
        x: 20 + (i % 3) * 30,
        y: 20 + Math.floor(i / 3) * 40,
      }))
    : [
        { id: 'protected', type: 'target', label: 'Your Network', x: 50, y: 50, severity: 'low' },
      ] as ThreatNode[];

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'hsl(var(--threat-critical))';
      case 'high': return 'hsl(var(--threat-high))';
      case 'medium': return 'hsl(var(--threat-medium))';
      case 'low': return 'hsl(var(--copilot-accent))';
      default: return 'hsl(var(--copilot-text-muted))';
    }
  };

  return (
    <div className={cn(
      "relative h-32 rounded-lg overflow-hidden",
      "bg-[hsl(var(--terminal-bg))] border border-[hsl(var(--copilot-border))]",
      className
    )}>
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--copilot-accent) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--copilot-accent) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
      
      {/* Scanning animation */}
      <motion.div
        className="absolute left-0 top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[hsl(var(--copilot-accent))] to-transparent"
        animate={{ y: [0, 128, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Status indicator */}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[hsl(var(--copilot-surface))] border border-[hsl(var(--copilot-border))]">
          {threats.length === 0 ? (
            <>
              <Shield className="h-3 w-3 text-[hsl(var(--copilot-accent))]" />
              <span className="text-[10px] text-[hsl(var(--copilot-accent))]">Protected</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3 text-[hsl(var(--threat-high))]" />
              <span className="text-[10px] text-[hsl(var(--threat-high))]">{threats.length} Active</span>
            </>
          )}
        </div>
      </div>
      
      {/* Network visualization */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Center node (your network) */}
        <motion.g
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <circle
            cx="50%"
            cy="50%"
            r="20"
            fill="none"
            stroke="hsl(var(--copilot-accent))"
            strokeWidth="2"
            className="opacity-50"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="20"
            fill="none"
            stroke="hsl(var(--copilot-accent))"
            strokeWidth="2"
            animate={{ r: [20, 30, 20] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="opacity-30"
          />
          <circle
            cx="50%"
            cy="50%"
            r="8"
            fill="hsl(var(--copilot-accent))"
          />
        </motion.g>
        
        {/* Threat nodes */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            {node.type !== 'target' && (
              <>
                {/* Connection line */}
                <motion.line
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2="50%"
                  y2="50%"
                  stroke={node.type === 'blocked' ? 'hsl(var(--threat-critical))' : getSeverityColor(node.severity)}
                  strokeWidth="1"
                  strokeDasharray={node.type === 'blocked' ? "4 4" : "none"}
                  className="opacity-40"
                />
                {/* Node */}
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r="5"
                  fill={getSeverityColor(node.severity)}
                  className={node.type === 'blocked' ? 'opacity-50' : ''}
                />
                {node.type === 'blocked' && (
                  <text
                    x={`${node.x}%`}
                    y={`${node.y}%`}
                    textAnchor="middle"
                    dy="3"
                    className="text-[8px] fill-[hsl(var(--copilot-text))]"
                  >
                    ✕
                  </text>
                )}
              </>
            )}
          </motion.g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex items-center gap-3 text-[9px] text-[hsl(var(--copilot-text-muted))]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--copilot-accent))]" />
          <span>Protected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--threat-high))]" />
          <span>Threat</span>
        </div>
      </div>
    </div>
  );
}
