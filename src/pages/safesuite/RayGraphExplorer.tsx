/**
 * Wrayth · Ray Graph Explorer — /app/graph and /app/graph/:entityId
 *
 * Interactive Security Graph visualization. Radial layout: focused entity in
 * the center, direct relationships around it. Click a node to recenter.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";
import { RayPageHeader } from "@/components/ray/RayPageHeader";
import { PageMotion } from "@/components/ray/PageMotion";
import { Button } from "@/components/ui/button";
import {
  ENTITY_TYPE_LABELS,
  fetchEntityById,
  fetchRelated,
  type RayEntity,
} from "@/lib/ray/graph";
import { supabase } from "@/integrations/supabase/client";

const TYPE_COLOR: Record<string, string> = {
  user: "#8b5cf6",
  device: "#3b82f6",
  account: "#06b6d4",
  mailbox: "#0ea5e9",
  organization: "#a855f7",
  breach: "#ef4444",
  recommendation: "#f59e0b",
  incident: "#f43f5e",
  memory: "#10b981",
  password: "#eab308",
  extension: "#84cc16",
  policy: "#6366f1",
  threat: "#dc2626",
};

function nodeStyle(entity: RayEntity, isFocus: boolean) {
  const color = TYPE_COLOR[entity.type] ?? "#64748b";
  return {
    background: isFocus ? color : "#0b0b12",
    border: `2px solid ${color}`,
    color: isFocus ? "#0b0b12" : "#e5e7eb",
    borderRadius: 12,
    padding: 10,
    fontSize: 12,
    minWidth: 140,
    boxShadow: isFocus ? `0 0 24px ${color}66` : "none",
  } as const;
}

function radialLayout(center: { x: number; y: number }, count: number, radius = 260) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
    positions.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }
  return positions;
}

export default function RayGraphExplorer() {
  const { entityId } = useParams<{ entityId?: string }>();
  const navigate = useNavigate();
  const [focus, setFocus] = useState<RayEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // If no entityId in the URL, pick the first entity we can see so the page
  // is useful out of the box.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (entityId) {
        const e = await fetchEntityById(entityId);
        if (!cancelled) setFocus(e);
      } else {
        const { data } = await supabase
          .from("ray_entities")
          .select("*")
          .in("type", ["user", "organization"])
          .order("last_seen_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled) setFocus((data as RayEntity | null) ?? null);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  // Load related entities and build the flow whenever focus changes.
  useEffect(() => {
    let cancelled = false;
    if (!focus) {
      setNodes([]);
      setEdges([]);
      return;
    }
    (async () => {
      const related = await fetchRelated(focus.id);
      if (cancelled) return;
      const center = { x: 0, y: 0 };
      const positions = radialLayout(center, related.length);
      const focusLabel = ENTITY_TYPE_LABELS[focus.type] ?? focus.type;
      const focusNode: Node = {
        id: focus.id,
        data: { label: `${focusLabel}\n${focus.name}` },
        position: center,
        style: nodeStyle(focus, true),
      };
      const relNodes: Node[] = related.map((r, i) => ({
        id: r.entity.id,
        data: {
          label: `${ENTITY_TYPE_LABELS[r.entity.type] ?? r.entity.type}\n${r.entity.name}`,
        },
        position: positions[i],
        style: nodeStyle(r.entity, false),
      }));
      const relEdges: Edge[] = related.map((r) => ({
        id: `${focus.id}->${r.entity.id}:${r.relationship_type}:${r.direction}`,
        source: r.direction === "outgoing" ? focus.id : r.entity.id,
        target: r.direction === "outgoing" ? r.entity.id : focus.id,
        label: r.relationship_type,
        labelStyle: { fill: "#94a3b8", fontSize: 10 },
        style: { stroke: "#334155", strokeWidth: 1.5 },
        animated: false,
      }));
      setNodes([focusNode, ...relNodes]);
      setEdges(relEdges);
    })();
    return () => {
      cancelled = true;
    };
  }, [focus, setNodes, setEdges]);

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_e, node) => {
      if (!focus || node.id === focus.id) return;
      navigate(`/app/graph/${node.id}`);
    },
    [focus, navigate],
  );

  const title = useMemo(() => {
    if (!focus) return "Graph Explorer";
    const label = ENTITY_TYPE_LABELS[focus.type] ?? focus.type;
    return `${label}: ${focus.name}`;
  }, [focus]);

  return (
    <PageMotion className="container max-w-7xl py-6 sm:py-8">
      <RayPageHeader
        title={title}
        subtitle="Security Graph"
        description="Every entity Ray knows about and how they connect. Click any node to recenter."
      />
      <div className="mt-4 flex gap-2">
        {focus && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/timeline/${focus.type}/${focus.id}`)}
            >
              View timeline
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/app/graph")}>
              Reset
            </Button>
          </>
        )}
      </div>
      <div className="mt-4 h-[70vh] rounded-xl border border-border/60 bg-card/40 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !focus ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No entities yet. Ray's next scan will populate the graph.
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#1e293b" gap={24} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeStrokeWidth={2}
              nodeColor={(n) => {
                const st = n.style as { border?: string } | undefined;
                const border = st?.border ?? "";
                const m = border.match(/#[0-9a-f]{6}/i);
                return m ? m[0] : "#64748b";
              }}
              pannable
              zoomable
              style={{ background: "#0b0b12", border: "1px solid #1e293b" }}
            />
          </ReactFlow>
        )}
      </div>
    </PageMotion>
  );
}
