import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { GitBranch, AlertTriangle, X } from 'lucide-react';
import type { GraphNode, GraphEdge, CircularDep } from '@/hooks/useDependencyGraph';

interface DependencyGraphPanelProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  circularDeps: CircularDep[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  layout: 'force' | 'tree' | 'radial';
  setLayout: (l: 'force' | 'tree' | 'radial') => void;
  getSelectedNode: () => GraphNode | null;
  getNodeDependencies: (id: string) => { imports: string[]; importedBy: string[] };
  getStats: () => { totalFiles: number; totalEdges: number; circularCount: number; components: number; hooks: number; pages: number; orphans: number };
  analyzeFiles: (files: Record<string, string>) => void;
  onClose: () => void;
}

const typeColors: Record<string, string> = {
  component: 'bg-blue-500/20 text-blue-400',
  hook: 'bg-purple-500/20 text-purple-400',
  page: 'bg-green-500/20 text-green-400',
  util: 'bg-gray-500/20 text-gray-400',
  store: 'bg-orange-500/20 text-orange-400',
  type: 'bg-cyan-500/20 text-cyan-400',
};

export function DependencyGraphPanel({
  nodes, edges, circularDeps, selectedNodeId, setSelectedNodeId,
  layout, setLayout, getSelectedNode, getNodeDependencies, getStats, onClose,
}: DependencyGraphPanelProps) {
  const selected = getSelectedNode();
  const stats = getStats();
  const deps = selected ? getNodeDependencies(selected.id) : null;

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Dependency Graph</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="p-3 border-b border-border">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><p className="text-lg font-bold">{stats.totalFiles}</p><p className="text-[10px] text-muted-foreground">Files</p></div>
          <div><p className="text-lg font-bold">{stats.totalEdges}</p><p className="text-[10px] text-muted-foreground">Edges</p></div>
          <div><p className="text-lg font-bold text-red-400">{stats.circularCount}</p><p className="text-[10px] text-muted-foreground">Circular</p></div>
          <div><p className="text-lg font-bold text-yellow-400">{stats.orphans}</p><p className="text-[10px] text-muted-foreground">Orphans</p></div>
        </div>
      </div>

      <div className="p-3 border-b border-border">
        <Label className="text-xs">Layout</Label>
        <Select value={layout} onValueChange={v => setLayout(v as typeof layout)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="force">Force</SelectItem><SelectItem value="tree">Tree</SelectItem><SelectItem value="radial">Radial</SelectItem></SelectContent>
        </Select>
      </div>

      {circularDeps.length > 0 && (
        <div className="p-3 border-b border-border">
          <Label className="text-xs font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /> Circular Dependencies</Label>
          {circularDeps.map(c => (
            <div key={c.id} className="mt-1 p-2 bg-yellow-500/10 rounded text-xs">
              {c.cycle.map(f => f.split('/').pop()).join(' → ')}
            </div>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1 p-3">
        {selected ? (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedNodeId(null)}>← Back</Button>
            <div>
              <p className="font-medium text-sm">{selected.label}</p>
              <p className="text-xs text-muted-foreground">{selected.filePath}</p>
              <Badge className={`mt-1 text-[10px] ${typeColors[selected.type]}`}>{selected.type}</Badge>
            </div>
            <div><Label className="text-xs">Imports ({deps?.imports.length})</Label>
              {deps?.imports.map(i => (
                <div key={i} className="text-xs p-1 hover:bg-muted rounded cursor-pointer" onClick={() => setSelectedNodeId(i)}>{i.split('/').pop()}</div>
              ))}
            </div>
            <div><Label className="text-xs">Imported By ({deps?.importedBy.length})</Label>
              {deps?.importedBy.map(i => (
                <div key={i} className="text-xs p-1 hover:bg-muted rounded cursor-pointer" onClick={() => setSelectedNodeId(i)}>{i.split('/').pop()}</div>
              ))}
            </div>
          </div>
        ) : (
          nodes.map(n => (
            <div key={n.id} className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer mb-1" onClick={() => setSelectedNodeId(n.id)}>
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] ${typeColors[n.type]}`}>{n.type}</Badge>
                <span className="text-sm">{n.label}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-[10px] text-muted-foreground">{n.importCount}↓ {n.exportCount}↑</span>
                {edges.some(e => e.isCircular && (e.source === n.id || e.target === n.id)) && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
              </div>
            </div>
          ))
        )}
        {nodes.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Run analysis to view dependency graph.</p>}
      </ScrollArea>
    </div>
  );
}
