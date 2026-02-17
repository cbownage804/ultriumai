import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApiEndpoint {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  base_path: string;
  source_table: string;
  allowed_methods: string[];
  is_active: boolean;
  requires_auth: boolean;
  rate_limit_rpm: number | null;
  rate_limit_rpd: number | null;
  allowed_fields: string[] | null;
  hidden_fields: string[] | null;
  filter_config: Record<string, any>;
  pagination_config: Record<string, any>;
  transform_config: Record<string, any>;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useApiEndpoints() {
  const queryClient = useQueryClient();

  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ["api-endpoints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_endpoints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ApiEndpoint[];
    },
  });

  const createEndpoint = useMutation({
    mutationFn: async (endpoint: Partial<ApiEndpoint>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("api_endpoints")
        .insert({ ...endpoint, user_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-endpoints"] });
      toast.success("API endpoint created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateEndpoint = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ApiEndpoint> & { id: string }) => {
      const { data, error } = await supabase
        .from("api_endpoints")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-endpoints"] });
      toast.success("Endpoint updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteEndpoint = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_endpoints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-endpoints"] });
      toast.success("Endpoint deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return { endpoints, isLoading, createEndpoint, updateEndpoint, deleteEndpoint };
}
