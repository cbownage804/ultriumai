import { Building2, ChevronRight, ChevronDown, Users, Shield } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OrgNode {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  children?: OrgNode[];
}

interface OrgHierarchyTreeProps {
  hierarchy: OrgNode[];
  onRefresh: () => void;
}

export const OrgHierarchyTree = ({ hierarchy, onRefresh }: OrgHierarchyTreeProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: OrgNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`
            flex items-center gap-2 p-3 rounded-lg cursor-pointer
            hover:bg-cyan-500/10 transition-colors
            ${depth > 0 ? 'ml-6 border-l-2 border-cyan-500/20' : ''}
          `}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-cyan-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-cyan-400" />
            )
          ) : (
            <div className="w-4" />
          )}
          
          <Building2 className="h-5 w-5 text-cyan-400" />
          
          <div className="flex-1">
            <span className="text-white font-medium">{node.name}</span>
          </div>
          
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
            Level {node.level}
          </Badge>
          
          {hasChildren && (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
              {node.children!.length} sub-org{node.children!.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="pl-4">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (hierarchy.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-cyan-400/50 mb-4" />
        <p className="text-white/60 mb-2">No organization hierarchy</p>
        <p className="text-white/40 text-sm">Create sub-organizations to build your hierarchy</p>
        <Button onClick={onRefresh} variant="outline" className="mt-4 border-cyan-500/30 text-white/80">
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <div className="text-white/60 text-sm">
          {hierarchy.length} root organization{hierarchy.length > 1 ? 's' : ''}
        </div>
        <Button onClick={onRefresh} variant="ghost" size="sm" className="text-cyan-400 hover:bg-cyan-500/10">
          Refresh
        </Button>
      </div>
      
      <div className="border border-cyan-500/20 rounded-lg p-4 bg-black/40">
        {hierarchy.map(node => renderNode(node))}
      </div>
    </div>
  );
};
