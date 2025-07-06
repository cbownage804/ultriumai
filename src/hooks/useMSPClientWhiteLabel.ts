import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MSPClientWhiteLabelConfig, WhiteLabelChangeRequest } from "@/types/whiteLabel";

const defaultMSPClientConfig: Omit<MSPClientWhiteLabelConfig, 'client_id' | 'client_name'> = {
  company_name: "",
  company_logo: "",
  primary_color: "#3b82f6",
  secondary_color: "#8b5cf6",
  background_color: "#ffffff",
  text_color: "#000000",
  custom_domain: "",
  favicon_url: "",
  custom_css: "",
  footer_text: "Powered by UltriumGPT",
  hide_powered_by: false,
  custom_login_page: false,
  co_management_enabled: true,
  client_can_edit: false,
  msp_approval_required: true,
  is_active: true,
  email_templates: {
    welcome: "Welcome to {{company_name}}! Your account has been created successfully.",
    password_reset: "Click the link below to reset your password for {{company_name}}.",
    invitation: "You've been invited to join {{company_name}}. Click here to get started."
  }
};

export const useMSPClientWhiteLabel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<MSPClientWhiteLabelConfig[]>([]);
  const [changeRequests, setChangeRequests] = useState<WhiteLabelChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadClientConfigs();
      loadChangeRequests();
    }
  }, [user]);

  const loadClientConfigs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('msp_client_whitelabel_configs')
        .select('*')
        .eq('msp_user_id', user.id)
        .order('client_name');

      if (error) throw error;
      
      const typedConfigs = (data || []).map(config => ({
        ...config,
        email_templates: typeof config.email_templates === 'object' 
          ? config.email_templates 
          : defaultMSPClientConfig.email_templates
      })) as MSPClientWhiteLabelConfig[];
      
      setConfigs(typedConfigs);
    } catch (error) {
      console.error('Error loading client configs:', error);
    }
  };

  const loadChangeRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('whitelabel_change_requests')
        .select(`
          *,
          msp_client_whitelabel_configs!inner(client_name)
        `)
        .eq('msp_client_whitelabel_configs.msp_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedRequests = (data || []).map(request => ({
        ...request,
        request_type: request.request_type as 'client_update' | 'msp_update',
        changes: request.changes as Record<string, any>
      })) as WhiteLabelChangeRequest[];
      
      setChangeRequests(typedRequests);
    } catch (error) {
      console.error('Error loading change requests:', error);
    }
  };

  const createClientConfig = async (clientId: string, clientName: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const config = {
        ...defaultMSPClientConfig,
        msp_user_id: user.id,
        client_id: clientId,
        client_name: clientName,
        company_name: clientName
      };

      const { data, error } = await supabase
        .from('msp_client_whitelabel_configs')
        .insert(config)
        .select()
        .single();

      if (error) throw error;

      const typedData = {
        ...data,
        email_templates: typeof data.email_templates === 'object' 
          ? data.email_templates 
          : defaultMSPClientConfig.email_templates
      } as MSPClientWhiteLabelConfig;
      
      setConfigs(prev => [...prev, typedData]);
      toast({
        title: "Client branding created",
        description: `White-label configuration created for ${clientName}`,
      });
      
      return data;
    } catch (error) {
      console.error('Error creating client config:', error);
      toast({
        title: "Error",
        description: "Failed to create client branding configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClientConfig = async (configId: string, updates: Partial<MSPClientWhiteLabelConfig>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('msp_client_whitelabel_configs')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', configId)
        .eq('msp_user_id', user.id);

      if (error) throw error;

      setConfigs(prev => prev.map(config => 
        config.id === configId ? { ...config, ...updates } : config
      ));

      toast({
        title: "Configuration updated",
        description: "Client branding has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating client config:', error);
      toast({
        title: "Error",
        description: "Failed to update client configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveChangeRequest = async (requestId: string, approved: boolean, notes?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('whitelabel_change_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', requestId);

      if (error) throw error;

      // If approved, apply changes to the config
      if (approved) {
        const request = changeRequests.find(r => r.id === requestId);
        if (request) {
          await updateClientConfig(request.config_id, request.changes);
        }
      }

      await loadChangeRequests();
      toast({
        title: approved ? "Request approved" : "Request rejected",
        description: `Change request has been ${approved ? 'approved' : 'rejected'}.`,
      });
    } catch (error) {
      console.error('Error processing change request:', error);
      toast({
        title: "Error",
        description: "Failed to process change request.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadClientFile = async (configId: string, file: File, type: 'logo' | 'favicon') => {
    if (!user) return;

    try {
      const config = configs.find(c => c.id === configId);
      if (!config) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${config.client_id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `client-branding/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('whitelabel-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('whitelabel-assets')
        .getPublicUrl(filePath);

      const field = type === 'logo' ? 'company_logo' : 'favicon_url';
      await updateClientConfig(configId, { [field]: data.publicUrl });

      toast({
        title: "Upload successful",
        description: `${type} has been uploaded for ${config.client_name}.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: `Failed to upload ${type}.`,
        variant: "destructive",
      });
    }
  };

  return {
    configs,
    changeRequests,
    loading,
    createClientConfig,
    updateClientConfig,
    approveChangeRequest,
    uploadClientFile,
    loadClientConfigs,
    loadChangeRequests
  };
};