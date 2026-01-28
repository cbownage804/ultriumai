import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save,
  Loader2,
  Settings,
  User,
  MessageSquare,
  Quote,
  Brain,
  Sliders,
  Shield,
  Volume2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { motion, AnimatePresence } from "framer-motion";
import { GPTConfigGeneral } from "./config/GPTConfigGeneral";
import { GPTConfigPersona } from "./config/GPTConfigPersona";
import { GPTConfigConversation } from "./config/GPTConfigConversation";
import { GPTConfigCitations } from "./config/GPTConfigCitations";
import { GPTConfigIntelligence } from "./config/GPTConfigIntelligence";
import { GPTConfigAdvanced } from "./config/GPTConfigAdvanced";
import { GPTConfigSecurity } from "./config/GPTConfigSecurity";
import { GPTConfigVoice } from "./config/GPTConfigVoice";
import { gptTemplates, getTemplateFullConfig } from "@/data/gptTemplates";

interface GPTConfigurationProps {
  gptId: string;
  gptName: string;
  themeColor: string;
  onUpdate?: () => void;
}

const CONFIG_TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "persona", label: "Persona", icon: User },
  { id: "conversation", label: "Conversation", icon: MessageSquare },
  { id: "citations", label: "Citations", icon: Quote },
  { id: "intelligence", label: "Intelligence", icon: Brain },
  { id: "advanced", label: "Advanced", icon: Sliders },
  { id: "security", label: "Security", icon: Shield },
  { id: "voice", label: "Voice", icon: Volume2 },
];

export function GPTConfiguration({ gptId, gptName, themeColor, onUpdate }: GPTConfigurationProps) {
  const { toast } = useToast();
  const { gpts, updateGPT } = useCustomGPTs();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  const gpt = gpts.find(g => g.id === gptId);
  
  const [formData, setFormData] = useState({
    // General
    name: "",
    description: "",
    avatar_url: "",
    logo_url: "",
    theme_color: "#3b82f6",
    secondary_color: "#3b82f6",
    background_type: "color",
    background_color: "#ffffff",
    background_image: "",
    
    // Persona
    system_prompt: "",
    welcome_message: "",
    communication_style: "",
    expertise_areas: "",
    
    // Conversation
    language: "en",
    placeholder_prompt: "",
    loading_indicator: "dots",
    loading_message: "",
    starter_questions: [] as string[],
    starter_header: "",
    starter_expand_text: "View More",
    starter_collapse_text: "View less",
    message_ending: "",
    error_message: "I'm sorry, I encountered an error. Please try again.",
    conversation_duration: "24h",
    
    // Citations
    idk_message: "I couldn't find specific information about that. Please contact support for assistance.",
    show_citations: "none",
    mention_sources: "yes",
    
    // Intelligence
    capability_mode: "optimal",
    knowledge_source: "data_and_general",
    preferred_model: "gpt-4o",
    enable_web_search: false,
    
    // Advanced
    enable_feedback: true,
    enable_sharing: true,
    enable_export: false,
    remove_branding: false,
    agent_title: "",
    title_color: "#000000",
    spotlight_avatar: false,
    show_user_avatar: false,
    avatar_orientation: "agent_left",
    terms_of_service: "",
    
    // Security
    anti_hallucination: true,
    visibility: "private",
    enable_recaptcha: false,
    whitelisted_domains: "",
    retention_period: "12_months",
    retention_days: 90,
    
    // Voice
    enable_voice_input: false,
    enable_voice_output: false,
    voice: "nova",
    voice_speed: 1,
    voice_autoplay: false,
    
    // Legacy
    category: "general",
  });

  // Get template config if GPT was created from a template
  const templateConfig = useMemo(() => {
    if (!gpt?.template_id) return null;
    const template = gptTemplates.find(t => t.id === gpt.template_id);
    if (!template) return null;
    return getTemplateFullConfig(template.id, template.category, template.config);
  }, [gpt?.template_id]);

  useEffect(() => {
    if (gpt) {
      // Start with template defaults if available
      const templateDefaults = templateConfig || {};
      
      setFormData(prev => ({
        ...prev,
        // Apply template defaults first
        ...templateDefaults,
        // Then override with actual GPT values from database
        // General
        name: gpt.name || "",
        description: gpt.description || "",
        avatar_url: gpt.avatar_url || "",
        logo_url: gpt.logo_url || "",
        theme_color: gpt.theme_color || templateDefaults.theme_color || "#3b82f6",
        secondary_color: gpt.secondary_color || templateDefaults.secondary_color || gpt.theme_color || "#3b82f6",
        background_type: gpt.background_type || "color",
        background_color: gpt.background_color || "#0a0a0a",
        
        // Persona
        system_prompt: gpt.system_prompt || "",
        
        // Conversation
        language: gpt.language || "en",
        placeholder_prompt: gpt.placeholder_prompt || templateDefaults.placeholder_prompt || "",
        loading_indicator: gpt.loading_indicator || "dots",
        loading_message: gpt.custom_loading_message || "",
        starter_questions: (gpt.starter_questions as string[]) || [],
        starter_header: gpt.starter_questions_header || "",
        starter_expand_text: gpt.starter_questions_expand || "View More",
        starter_collapse_text: gpt.starter_questions_collapse || "View less",
        message_ending: gpt.custom_message_ending || templateDefaults.message_ending || "",
        error_message: gpt.error_message || templateDefaults.error_message || "I'm sorry, I encountered an error. Please try again.",
        conversation_duration: gpt.conversation_duration || "24h",
        
        // Citations
        idk_message: gpt.unknown_message || templateDefaults.idk_message || "I couldn't find specific information about that. Please contact support for assistance.",
        show_citations: gpt.show_citations || templateDefaults.show_citations || "none",
        mention_sources: gpt.should_mention_sources ? "yes" : (templateDefaults.mention_sources || "yes"),
        
        // Intelligence
        capability_mode: gpt.agent_capability || templateDefaults.capability_mode || "optimal",
        knowledge_source: gpt.generate_responses_from || templateDefaults.knowledge_source || "data_and_general",
        preferred_model: gpt.preferred_model || templateDefaults.preferred_model || "gpt-4o",
        enable_web_search: gpt.enable_web_search ?? templateDefaults.enable_web_search ?? false,
        
        // Advanced
        enable_feedback: gpt.user_feedback ?? templateDefaults.enable_feedback ?? true,
        enable_sharing: gpt.conversation_sharing ?? templateDefaults.enable_sharing ?? true,
        enable_export: gpt.conversation_exporting ?? templateDefaults.enable_export ?? false,
        remove_branding: gpt.remove_branding ?? false,
        agent_title: gpt.agent_title || "",
        title_color: gpt.title_color || "#000000",
        spotlight_avatar: gpt.spotlight_avatar ?? false,
        show_user_avatar: gpt.user_avatar ?? false,
        avatar_orientation: gpt.avatar_orientations || "agent_left",
        terms_of_service: gpt.terms_of_service || "",
        
        // Security
        anti_hallucination: gpt.anti_hallucination ?? templateDefaults.anti_hallucination ?? true,
        visibility: gpt.agent_visibility || templateDefaults.visibility || "private",
        enable_recaptcha: gpt.recaptcha ?? false,
        whitelisted_domains: gpt.whitelisted_domains || "",
        retention_period: gpt.conversation_retention || "12_months",
        
        // Template-only fields (prefilled from template)
        welcome_message: templateDefaults.welcome_message || "",
        communication_style: templateDefaults.communication_style || "",
        expertise_areas: templateDefaults.expertise_areas || "",
        
        // Legacy
        category: gpt.category || "general",
      }));
      setHasChanges(false);
    }
  }, [gpt, templateConfig]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateGPT(gptId, {
        // General
        name: formData.name,
        description: formData.description,
        avatar_url: formData.avatar_url || null,
        logo_url: formData.logo_url || null,
        theme_color: formData.theme_color,
        primary_color: formData.theme_color,
        secondary_color: formData.secondary_color,
        background_type: formData.background_type,
        background_color: formData.background_color,
        
        // Persona
        system_prompt: formData.system_prompt,
        
        // Conversation
        language: formData.language,
        placeholder_prompt: formData.placeholder_prompt,
        loading_indicator: formData.loading_indicator,
        custom_loading_message: formData.loading_message,
        starter_questions: formData.starter_questions,
        starter_questions_header: formData.starter_header,
        starter_questions_expand: formData.starter_expand_text,
        starter_questions_collapse: formData.starter_collapse_text,
        custom_message_ending: formData.message_ending,
        error_message: formData.error_message,
        conversation_duration: formData.conversation_duration,
        
        // Citations
        unknown_message: formData.idk_message,
        show_citations: formData.show_citations,
        should_mention_sources: formData.mention_sources === "yes",
        
        // Intelligence
        agent_capability: formData.capability_mode,
        generate_responses_from: formData.knowledge_source,
        preferred_model: formData.preferred_model,
        enable_web_search: formData.enable_web_search,
        
        // Advanced
        user_feedback: formData.enable_feedback,
        conversation_sharing: formData.enable_sharing,
        conversation_exporting: formData.enable_export,
        remove_branding: formData.remove_branding,
        agent_title: formData.agent_title,
        title_color: formData.title_color,
        spotlight_avatar: formData.spotlight_avatar,
        user_avatar: formData.show_user_avatar,
        avatar_orientations: formData.avatar_orientation,
        terms_of_service: formData.terms_of_service,
        
        // Security
        anti_hallucination: formData.anti_hallucination,
        agent_visibility: formData.visibility,
        recaptcha: formData.enable_recaptcha,
        whitelisted_domains: formData.whitelisted_domains,
        conversation_retention: formData.retention_period,
        
        // Legacy
        category: formData.category,
      });
      
      toast({
        title: "Configuration saved",
        description: "Your GPT settings have been updated successfully."
      });
      setHasChanges(false);
      onUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personalize Your AI Assistant</h2>
          <p className="text-muted-foreground">Craft the perfect AI experience with advanced customization options</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/50 w-full justify-start">
          {CONFIG_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="general">
          <GPTConfigGeneral formData={formData} onChange={handleChange} themeColor={themeColor} />
        </TabsContent>

        <TabsContent value="persona">
          <GPTConfigPersona formData={formData} onChange={handleChange} themeColor={themeColor} />
        </TabsContent>

        <TabsContent value="conversation">
          <GPTConfigConversation formData={formData} onChange={handleChange} themeColor={themeColor} />
        </TabsContent>

        <TabsContent value="citations">
          <GPTConfigCitations formData={formData} onChange={handleChange} themeColor={themeColor} />
        </TabsContent>

        <TabsContent value="intelligence">
          <GPTConfigIntelligence formData={formData} onChange={handleChange} themeColor={themeColor} />
        </TabsContent>

        <TabsContent value="advanced">
          <GPTConfigAdvanced formData={formData} onChange={handleChange} themeColor={themeColor} />
        </TabsContent>

        <TabsContent value="security">
          <GPTConfigSecurity formData={formData} onChange={handleChange} themeColor={themeColor} />
        </TabsContent>

        <TabsContent value="voice">
          <GPTConfigVoice formData={formData} onChange={handleChange} themeColor={themeColor} />
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
          size="lg"
          style={{ backgroundColor: themeColor }}
          className="px-8"
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
      </div>

      {/* Floating save banner */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-4 px-6 py-3 rounded-full shadow-2xl border bg-background/95 backdrop-blur-xl">
              <span className="text-sm text-muted-foreground">Unsaved changes</span>
              <Button onClick={handleSave} disabled={isSaving} size="sm" style={{ backgroundColor: themeColor }}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
