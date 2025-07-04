import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WhiteLabelConfig } from "@/types/whiteLabel";

const defaultConfig: WhiteLabelConfig = {
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
  email_templates: {
    welcome: "Welcome to {{company_name}}! Your account has been created successfully.",
    password_reset: "Click the link below to reset your password for {{company_name}}.",
    invitation: "You've been invited to join {{company_name}}. Click here to get started."
  }
};

export const useWhiteLabelConfig = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<WhiteLabelConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWhiteLabelConfig();
  }, [user]);

  const loadWhiteLabelConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('whitelabel_configs' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const configData = data as unknown as WhiteLabelConfig;
        setConfig({
          ...defaultConfig,
          ...configData,
          email_templates: configData.email_templates || defaultConfig.email_templates
        });
      }
    } catch (error) {
      console.error('Error loading white-label config:', error);
    }
  };

  const saveConfig = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('whitelabel_configs' as any)
        .upsert({
          user_id: user.id,
          ...config
        });

      if (error) throw error;

      toast({
        title: "Configuration saved",
        description: "Your white-label settings have been updated.",
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, type: 'logo' | 'favicon') => {
    if (!user) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('whitelabel-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('whitelabel-assets')
        .getPublicUrl(filePath);

      const field = type === 'logo' ? 'company_logo' : 'favicon_url';
      setConfig(prev => ({
        ...prev,
        [field]: data.publicUrl
      }));

      toast({
        title: "Upload successful",
        description: `${type} has been uploaded.`,
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
    config,
    setConfig,
    loading,
    saveConfig,
    uploadFile,
    loadWhiteLabelConfig
  };
};