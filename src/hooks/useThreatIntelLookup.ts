import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ThreatIntelResult {
  ioc: string;
  iocType: string;
  source: string;
  malicious: boolean;
  confidence: number;
  categories: string[];
  firstSeen: string | null;
  lastSeen: string | null;
  associatedMalware: string[];
  tags: string[];
  rawData: any;
}

export interface ThreatLookupResponse {
  success: boolean;
  results: ThreatIntelResult[];
  cached: boolean;
  lookupTime: number;
}

// Lookup IOC against threat intelligence feeds
export function useThreatIntelLookup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      ioc: string; 
      iocType?: "hash" | "ip" | "domain" | "url";
      sources?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke("xdr-threat-ingestion", {
        body: {
          action: "lookup",
          ioc: params.ioc,
          iocType: params.iocType || detectIOCType(params.ioc),
          sources: params.sources || ["virustotal", "alienvault", "abuseipdb"],
          userId: user?.id,
        },
      });

      if (error) throw error;
      return data as ThreatLookupResponse;
    },
    onError: (error) => {
      toast.error(`Threat lookup failed: ${error.message}`);
    },
  });
}

// Batch lookup for multiple IOCs
export function useBatchThreatLookup() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (iocs: string[]) => {
      const { data, error } = await supabase.functions.invoke("xdr-threat-ingestion", {
        body: {
          action: "batch_lookup",
          iocs: iocs.map(ioc => ({
            value: ioc,
            type: detectIOCType(ioc),
          })),
          userId: user?.id,
        },
      });

      if (error) throw error;
      return data as { results: ThreatLookupResponse[] };
    },
    onSuccess: (data) => {
      const maliciousCount = data.results.filter(r => 
        r.results.some(result => result.malicious)
      ).length;
      
      if (maliciousCount > 0) {
        toast.warning(`Found ${maliciousCount} malicious IOCs`);
      } else {
        toast.success("No malicious IOCs detected");
      }
    },
  });
}

// Hook to check if an IOC is already known
export function useIOCCheck(ioc: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["ioc-check", ioc],
    queryFn: async () => {
      if (!ioc) return null;

      const { data, error } = await supabase
        .from("xdr_iocs")
        .select("*")
        .eq("ioc_value", ioc)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!ioc,
  });
}

// Enrich threat with intelligence data
export function useEnrichThreat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threatId: string) => {
      const { data, error } = await supabase.functions.invoke("xdr-threat-ingestion", {
        body: {
          action: "enrich_threat",
          threatId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xdr-threats"] });
      toast.success("Threat enriched with intelligence data");
    },
  });
}

// Sync threat feed manually
export function useSyncThreatFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedId: string) => {
      const { data, error } = await supabase.functions.invoke("xdr-threat-ingestion", {
        body: {
          action: "sync_feed",
          feedId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xdr-threat-feeds"] });
      queryClient.invalidateQueries({ queryKey: ["xdr-iocs"] });
      toast.success("Threat feed synced successfully");
    },
    onError: (error) => {
      toast.error(`Failed to sync feed: ${error.message}`);
    },
  });
}

// Helper to detect IOC type from value
function detectIOCType(ioc: string): string {
  // MD5
  if (/^[a-fA-F0-9]{32}$/.test(ioc)) return "hash_md5";
  // SHA1
  if (/^[a-fA-F0-9]{40}$/.test(ioc)) return "hash_sha1";
  // SHA256
  if (/^[a-fA-F0-9]{64}$/.test(ioc)) return "hash_sha256";
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ioc)) return "ip";
  // IPv6
  if (/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ioc)) return "ip";
  // URL
  if (/^https?:\/\//i.test(ioc)) return "url";
  // Domain
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(ioc)) return "domain";
  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ioc)) return "email";
  // Default
  return "unknown";
}

export { detectIOCType };
