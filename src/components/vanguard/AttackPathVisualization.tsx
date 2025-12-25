import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Network, 
  AlertTriangle, 
  Shield, 
  Server, 
  Database,
  Globe,
  Lock,
  Unlock,
  ArrowRight,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useVanguardAgents } from '@/hooks/useVanguardAgents';

interface AttackNode {
  id: string;
  label: string;
  type: 'entry' | 'asset' | 'target' | 'vulnerability';
  risk: 'critical' | 'high' | 'medium' | 'low';
  x: number;
  y: number;
  details?: {
    vulnerabilities?: string[];
    openPorts?: number[];
    services?: string[];
  };
}

interface AttackPath {
  id: string;
  from: string;
  to: string;
  label: string;
  technique: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
}

const RISK_COLORS = {
  critical: { bg: 'hsl(var(--destructive))', text: 'hsl(var(--destructive-foreground))' },
  high: { bg: 'hsl(var(--warning))', text: 'hsl(var(--warning-foreground))' },
  medium: { bg: 'hsl(var(--secondary))', text: 'hsl(var(--secondary-foreground))' },
  low: { bg: 'hsl(var(--success))', text: 'hsl(var(--success-foreground))' },
};

export function AttackPathVisualization() {
  const { user } = useAuth();
  const { agents } = useVanguardAgents();
  const [nodes, setNodes] = useState<AttackNode[]>([]);
  const [paths, setPaths] = useState<AttackPath[]>([]);
  const [selectedNode, setSelectedNode] = useState<AttackNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [viewFilter, setViewFilter] = useState<'all' | 'critical' | 'high'>('all');

  useEffect(() => {
    if (user) {
      generateAttackPaths();
    }
  }, [user, agents]);

  const generateAttackPaths = useCallback(async () => {
    if (!user || !agents) return;
    
    setIsLoading(true);
    
    try {
      // Fetch vulnerabilities and compliance data
      const { data: vulns } = await supabase
        .from('safenet_vulnerabilities')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'active'])
        .order('severity', { ascending: false })
        .limit(50);

      const { data: complianceResults } = await supabase
        .from('compliance_check_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'fail')
        .limit(50);

      // Build network graph
      const generatedNodes: AttackNode[] = [];
      const generatedPaths: AttackPath[] = [];

      // Entry point (Internet)
      generatedNodes.push({
        id: 'internet',
        label: 'Internet',
        type: 'entry',
        risk: 'medium',
        x: 50,
        y: 200,
      });

      // Add firewall/perimeter
      generatedNodes.push({
        id: 'perimeter',
        label: 'Perimeter Firewall',
        type: 'asset',
        risk: 'low',
        x: 180,
        y: 200,
      });

      generatedPaths.push({
        id: 'path-internet-perimeter',
        from: 'internet',
        to: 'perimeter',
        label: 'External Access',
        technique: 'T1190 - Exploit Public-Facing Application',
        risk: 'medium',
      });

      // Add agents as nodes
      let yOffset = 80;
      const agentNodes: AttackNode[] = [];
      
      for (const agent of agents.slice(0, 6)) {
        const agentVulns = vulns?.filter(v => v.device_id === agent.id) || [];
        const criticalVulns = agentVulns.filter(v => v.severity === 'critical');
        const highVulns = agentVulns.filter(v => v.severity === 'high');
        
        let risk: AttackNode['risk'] = 'low';
        if (criticalVulns.length > 0) risk = 'critical';
        else if (highVulns.length > 0) risk = 'high';
        else if (agentVulns.length > 0) risk = 'medium';

        const node: AttackNode = {
          id: agent.id,
          label: agent.name || agent.device_id,
          type: 'asset',
          risk,
          x: 350,
          y: yOffset,
          details: {
            vulnerabilities: agentVulns.map(v => v.cve_id || v.vulnerability_id || 'Unknown'),
          },
        };
        
        agentNodes.push(node);
        generatedNodes.push(node);

        // Path from perimeter to agent
        if (agent.status === 'online') {
          generatedPaths.push({
            id: `path-perimeter-${agent.id}`,
            from: 'perimeter',
            to: agent.id,
            label: 'Network Access',
            technique: risk === 'critical' || risk === 'high' 
              ? 'T1021 - Remote Services' 
              : 'T1133 - External Remote Services',
            risk: risk === 'critical' || risk === 'high' ? risk : 'medium',
          });
        }

        yOffset += 80;
      }

      // Add critical targets
      generatedNodes.push({
        id: 'database',
        label: 'Database Server',
        type: 'target',
        risk: 'critical',
        x: 520,
        y: 150,
      });

      generatedNodes.push({
        id: 'domain-controller',
        label: 'Domain Controller',
        type: 'target',
        risk: 'critical',
        x: 520,
        y: 250,
      });

      // Connect high-risk agents to targets
      const highRiskAgents = agentNodes.filter(a => a.risk === 'critical' || a.risk === 'high');
      
      for (const agent of highRiskAgents) {
        generatedPaths.push({
          id: `path-${agent.id}-database`,
          from: agent.id,
          to: 'database',
          label: 'Lateral Movement',
          technique: 'T1021.002 - SMB/Windows Admin Shares',
          risk: 'high',
        });

        generatedPaths.push({
          id: `path-${agent.id}-dc`,
          from: agent.id,
          to: 'domain-controller',
          label: 'Privilege Escalation',
          technique: 'T1078 - Valid Accounts',
          risk: 'critical',
        });
      }

      setNodes(generatedNodes);
      setPaths(generatedPaths);
    } catch (error) {
      console.error('Error generating attack paths:', error);
      toast.error('Failed to generate attack paths');
    } finally {
      setIsLoading(false);
    }
  }, [user, agents]);

  const getNodeIcon = (type: AttackNode['type']) => {
    switch (type) {
      case 'entry': return Globe;
      case 'asset': return Server;
      case 'target': return Database;
      case 'vulnerability': return AlertTriangle;
      default: return Shield;
    }
  };

  const filteredPaths = paths.filter(p => {
    if (viewFilter === 'all') return true;
    if (viewFilter === 'critical') return p.risk === 'critical';
    if (viewFilter === 'high') return p.risk === 'critical' || p.risk === 'high';
    return true;
  });

  const criticalPathCount = paths.filter(p => p.risk === 'critical').length;
  const highPathCount = paths.filter(p => p.risk === 'high').length;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Attack Path Analysis
            </CardTitle>
            <CardDescription>Visualize potential attack vectors across your network</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewFilter} onValueChange={(v: 'all' | 'critical' | 'high') => setViewFilter(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Paths</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="high">High & Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={generateAttackPaths}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{nodes.length}</p>
            <p className="text-xs text-muted-foreground">Total Nodes</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold">{paths.length}</p>
            <p className="text-xs text-muted-foreground">Attack Paths</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 text-center">
            <p className="text-2xl font-bold text-destructive">{criticalPathCount}</p>
            <p className="text-xs text-muted-foreground">Critical Paths</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 text-center">
            <p className="text-2xl font-bold text-warning">{highPathCount}</p>
            <p className="text-xs text-muted-foreground">High Risk Paths</p>
          </div>
        </div>

        {/* Visualization Area */}
        <div 
          className="relative bg-muted/30 rounded-lg border overflow-hidden"
          style={{ height: '400px' }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 600 450"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            >
              {/* Draw paths */}
              {filteredPaths.map(path => {
                const fromNode = nodes.find(n => n.id === path.from);
                const toNode = nodes.find(n => n.id === path.to);
                if (!fromNode || !toNode) return null;

                const pathColor = path.risk === 'critical' 
                  ? 'hsl(var(--destructive))' 
                  : path.risk === 'high'
                    ? 'hsl(var(--warning))'
                    : 'hsl(var(--muted-foreground))';

                return (
                  <g key={path.id}>
                    <defs>
                      <marker
                        id={`arrow-${path.id}`}
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={pathColor} />
                      </marker>
                    </defs>
                    <line
                      x1={fromNode.x + 30}
                      y1={fromNode.y}
                      x2={toNode.x - 30}
                      y2={toNode.y}
                      stroke={pathColor}
                      strokeWidth={path.risk === 'critical' ? 3 : 2}
                      strokeDasharray={path.risk === 'low' ? '5,5' : 'none'}
                      markerEnd={`url(#arrow-${path.id})`}
                      opacity={0.7}
                    />
                  </g>
                );
              })}

              {/* Draw nodes */}
              {nodes.map(node => {
                const Icon = getNodeIcon(node.type);
                const isSelected = selectedNode?.id === node.id;
                
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x - 25}, ${node.y - 25})`}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="50"
                      height="50"
                      rx="8"
                      fill={
                        node.risk === 'critical' ? 'hsl(var(--destructive))' :
                        node.risk === 'high' ? 'hsl(var(--warning))' :
                        node.risk === 'medium' ? 'hsl(var(--secondary))' :
                        'hsl(var(--muted))'
                      }
                      stroke={isSelected ? 'hsl(var(--primary))' : 'transparent'}
                      strokeWidth={isSelected ? 3 : 0}
                      opacity={0.9}
                    />
                    <foreignObject x="10" y="10" width="30" height="30">
                      <div className="flex items-center justify-center h-full">
                        {node.type === 'entry' && <Globe className="h-5 w-5 text-background" />}
                        {node.type === 'asset' && <Server className="h-5 w-5 text-background" />}
                        {node.type === 'target' && <Database className="h-5 w-5 text-background" />}
                      </div>
                    </foreignObject>
                    <text
                      x="25"
                      y="65"
                      textAnchor="middle"
                      fontSize="10"
                      fill="currentColor"
                      className="pointer-events-none"
                    >
                      {node.label.substring(0, 12)}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="mt-4 p-4 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center gap-2">
                {selectedNode.type === 'entry' && <Globe className="h-4 w-4" />}
                {selectedNode.type === 'asset' && <Server className="h-4 w-4" />}
                {selectedNode.type === 'target' && <Database className="h-4 w-4" />}
                {selectedNode.label}
              </h4>
              <Badge variant={
                selectedNode.risk === 'critical' ? 'destructive' :
                selectedNode.risk === 'high' ? 'default' : 'secondary'
              }>
                {selectedNode.risk.toUpperCase()} RISK
              </Badge>
            </div>
            
            {selectedNode.details?.vulnerabilities && selectedNode.details.vulnerabilities.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Vulnerabilities:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.details.vulnerabilities.slice(0, 5).map((v, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Attack Paths Through This Node:</p>
              <div className="space-y-1">
                {paths.filter(p => p.from === selectedNode.id || p.to === selectedNode.id).map(path => (
                  <div key={path.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="h-3 w-3" />
                    <span>{path.technique}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive" />
            <span>Critical Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning" />
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-secondary" />
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted" />
            <span>Low Risk</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
