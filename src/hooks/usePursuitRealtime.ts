import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface RealtimeThreatAlert {
  id: string;
  threatId: string;
  threatName: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  agentName: string | null;
  mitreTechnique: string | null;
  timestamp: Date;
  dismissed: boolean;
}

export function usePursuitRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState<RealtimeThreatAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new threats
    const threatChannel = supabase
      .channel("xdr-threats-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "xdr_threats",
        },
        async (payload) => {
          const threat = payload.new as any;
          
          // Fetch agent name if available
          let agentName = null;
          if (threat.agent_id) {
            const { data: agent } = await supabase
              .from("vanguard_agents")
              .select("name")
              .eq("id", threat.agent_id)
              .single();
            agentName = agent?.name || null;
          }

          const alert: RealtimeThreatAlert = {
            id: `alert-${threat.id}`,
            threatId: threat.id,
            threatName: threat.threat_name,
            severity: threat.severity,
            agentName,
            mitreTechnique: threat.mitre_technique,
            timestamp: new Date(threat.created_at),
            dismissed: false,
          };

          setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50

          // Show toast for critical/high threats
          if (threat.severity === "critical") {
            toast.error(`🚨 CRITICAL: ${threat.threat_name}`, {
              description: agentName ? `On ${agentName}` : undefined,
              duration: 10000,
            });
          } else if (threat.severity === "high") {
            toast.warning(`⚠️ HIGH: ${threat.threat_name}`, {
              description: agentName ? `On ${agentName}` : undefined,
              duration: 8000,
            });
          }

          // Invalidate threat queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["xdr-threats"] });
          queryClient.invalidateQueries({ queryKey: ["xdr-stats"] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    // Subscribe to response action updates
    const actionChannel = supabase
      .channel("xdr-actions-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "xdr_response_actions",
        },
        (payload) => {
          const action = payload.new as any;
          
          if (action.action_status === "completed") {
            toast.success(`✅ Action completed: ${action.action_type}`);
          } else if (action.action_status === "failed") {
            toast.error(`❌ Action failed: ${action.action_type}`, {
              description: action.error_message,
            });
          }

          queryClient.invalidateQueries({ queryKey: ["xdr-response-actions"] });
        }
      )
      .subscribe();

    // Subscribe to ransomware events
    const ransomwareChannel = supabase
      .channel("xdr-ransomware-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "xdr_ransomware_events",
        },
        (payload) => {
          const event = payload.new as any;
          
          toast.error(`🔴 RANSOMWARE DETECTED: ${event.event_type}`, {
            description: `${event.files_affected} files affected`,
            duration: 15000,
          });

          queryClient.invalidateQueries({ queryKey: ["xdr-ransomware-events"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(threatChannel);
      supabase.removeChannel(actionChannel);
      supabase.removeChannel(ransomwareChannel);
    };
  }, [user, queryClient]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a))
    );
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const unreadCount = alerts.filter((a) => !a.dismissed).length;

  return {
    alerts,
    unreadCount,
    isConnected,
    dismissAlert,
    clearAlerts,
  };
}

// Hook for subscribing to specific agent's events
export function useAgentThreatRealtime(agentId: string | null) {
  const queryClient = useQueryClient();
  const [latestThreat, setLatestThreat] = useState<any>(null);

  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel(`agent-threats-${agentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "xdr_threats",
          filter: `agent_id=eq.${agentId}`,
        },
        (payload) => {
          setLatestThreat(payload.new);
          queryClient.invalidateQueries({ queryKey: ["xdr-threats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, queryClient]);

  return latestThreat;
}
