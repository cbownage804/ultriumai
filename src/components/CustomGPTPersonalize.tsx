import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Settings, 
  Palette, 
  User, 
  MessageSquare, 
  Quote, 
  Brain, 
  Shield, 
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Crown,
  Volume2,
  Key
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { GPTVoiceControls } from "@/components/voice/GPTVoiceControls";
import { BackToHubButton } from "@/components/shared/BackToHubButton";
import { AIProviderKeyManager } from "@/components/settings/AIProviderKeyManager";
import { useUserAIProviders } from "@/hooks/useUserAIProviders";
import { AI_PROVIDERS } from "@/types/aiProviders";

interface GPTData {
  id?: string;
  name: string;
  description: string;
  system_prompt: string;
  avatar_url: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  background_type: string;
  language: string;
  placeholder_prompt: string;
  loading_indicator: string;
  custom_loading_message: string;
  starter_questions: string[];
  starter_questions_header: string;
  starter_questions_expand: string;
  starter_questions_collapse: string;
  custom_message_ending: string;
  error_message: string;
  conversation_duration: string;
  unknown_message: string;
  show_citations: string;
  should_mention_sources: boolean;
  agent_capability: string;
  generate_responses_from: string;
  ai_model: string;
  user_feedback: boolean;
  conversation_sharing: boolean;
  conversation_exporting: boolean;
  remove_branding: boolean;
  agent_title: string;
  title_color: string;
  spotlight_avatar: boolean;
  user_avatar: boolean;
  avatar_orientations: string;
  terms_of_service: string;
  affiliate_id: string;
  anti_hallucination: boolean;
  agent_visibility: string;
  recaptcha: boolean;
  whitelisted_domains: string;
  conversation_retention: string;
}

const CustomGPTPersonalize = () => {
  const [gptData, setGptData] = useState<GPTData>({
    name: "",
    description: "",
    system_prompt: "",
    avatar_url: "",
    primary_color: "#3b82f6",
    secondary_color: "#3b82f6",
    background_color: "#ffffff",
    background_type: "color",
    language: "english",
    placeholder_prompt: "How can I help you today?",
    loading_indicator: "typing",
    custom_loading_message: "",
    starter_questions: [
      "How do I restart my Windows 365 cloud PC?",
      "My Teams notifications aren't working — can you help?",
      "How do I set up Outlook on a new device?"
    ],
    starter_questions_header: "Welcome! I'm your virtual IT assistant. I can help with common IT issues like email, Teams, Windows 365, or file access. What do you need help with today?",
    starter_questions_expand: "View More",
    starter_questions_collapse: "View less",
    custom_message_ending: "",
    error_message: "I didn't find a walkthrough for that. You can contact the IT Support Team for assistance.",
    conversation_duration: "24hours",
    unknown_message: "I couldn't find a specific answer to that. You may want to contact the IT Support Team for assistance.",
    show_citations: "dont_display",
    should_mention_sources: true,
    agent_capability: "optimal",
    generate_responses_from: "my_data_llm",
    ai_model: "gpt-4.1-2025-04-14",
    user_feedback: true,
    conversation_sharing: true,
    conversation_exporting: false,
    remove_branding: false,
    agent_title: "",
    title_color: "#000000",
    spotlight_avatar: false,
    user_avatar: false,
    avatar_orientations: "agent_left_user_right",
    terms_of_service: "",
    affiliate_id: "",
    anti_hallucination: true,
    agent_visibility: "public",
    recaptcha: false,
    whitelisted_domains: "",
    conversation_retention: "12_months"
  });
  
  const [currentGptId, setCurrentGptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { getAvailableModels, hasProviderKey } = useUserAIProviders();

  // Load existing GPT data
  useEffect(() => {
    loadGPTData();
  }, [user]);

  const loadGPTData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('custom_gpts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading GPT data:', error);
        return;
      }

      if (data) {
        setCurrentGptId(data.id);
        setGptData({
          id: data.id,
          name: data.name || "",
          description: data.description || "",
          system_prompt: data.system_prompt || "",
          avatar_url: data.avatar_url || "",
          primary_color: data.primary_color || "#3b82f6",
          secondary_color: data.secondary_color || "#3b82f6",
          background_color: data.background_color || "#ffffff",
          background_type: data.background_type || "color",
          language: data.language || "english",
          placeholder_prompt: data.placeholder_prompt || "How can I help you today?",
          loading_indicator: data.loading_indicator || "typing",
          custom_loading_message: data.custom_loading_message || "",
          starter_questions: Array.isArray(data.starter_questions) 
            ? data.starter_questions.filter((q): q is string => typeof q === 'string') 
            : [],
          starter_questions_header: data.starter_questions_header || "",
          starter_questions_expand: data.starter_questions_expand || "View More",
          starter_questions_collapse: data.starter_questions_collapse || "View less",
          custom_message_ending: data.custom_message_ending || "",
          error_message: data.error_message || "",
          conversation_duration: data.conversation_duration || "24hours",
          unknown_message: data.unknown_message || "",
          show_citations: data.show_citations || "dont_display",
          should_mention_sources: data.should_mention_sources ?? true,
          agent_capability: data.agent_capability || "optimal",
          generate_responses_from: data.generate_responses_from || "my_data_llm",
          ai_model: data.ai_model || "gpt-4.1-2025-04-14",
          user_feedback: data.user_feedback ?? true,
          conversation_sharing: data.conversation_sharing ?? true,
          conversation_exporting: data.conversation_exporting ?? false,
          remove_branding: data.remove_branding ?? false,
          agent_title: data.agent_title || "",
          title_color: data.title_color || "#000000",
          spotlight_avatar: data.spotlight_avatar ?? false,
          user_avatar: data.user_avatar ?? false,
          avatar_orientations: data.avatar_orientations || "agent_left_user_right",
          terms_of_service: data.terms_of_service || "",
          affiliate_id: data.affiliate_id || "",
          anti_hallucination: data.anti_hallucination ?? true,
          agent_visibility: data.agent_visibility || "public",
          recaptcha: data.recaptcha ?? false,
          whitelisted_domains: data.whitelisted_domains || "",
          conversation_retention: data.conversation_retention || "12_months"
        });
      }
    } catch (error) {
      console.error('Error loading GPT data:', error);
    }
  };

  const isAdvancedFeatureAvailable = (feature: string) => {
    switch (feature) {
      case "documents":
      case "embedding": 
      case "api":
      case "conversation_exporting":
      case "should_mention_sources":
      case "conversation_retention":
        return subscription.subscription_tier !== "free";
      case "branding":
      case "ai_model":
        return subscription.subscription_tier === "enterprise";
      default:
        return true;
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save your GPT configuration.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const gptPayload = {
        name: gptData.name,
        description: gptData.description,
        system_prompt: gptData.system_prompt,
        avatar_url: gptData.avatar_url,
        primary_color: gptData.primary_color,
        secondary_color: gptData.secondary_color,
        background_color: gptData.background_color,
        background_type: gptData.background_type,
        language: gptData.language,
        placeholder_prompt: gptData.placeholder_prompt,
        loading_indicator: gptData.loading_indicator,
        custom_loading_message: gptData.custom_loading_message,
        starter_questions: gptData.starter_questions,
        starter_questions_header: gptData.starter_questions_header,
        starter_questions_expand: gptData.starter_questions_expand,
        starter_questions_collapse: gptData.starter_questions_collapse,
        custom_message_ending: gptData.custom_message_ending,
        error_message: gptData.error_message,
        conversation_duration: gptData.conversation_duration,
        unknown_message: gptData.unknown_message,
        show_citations: gptData.show_citations,
        should_mention_sources: gptData.should_mention_sources,
        agent_capability: gptData.agent_capability,
        generate_responses_from: gptData.generate_responses_from,
        preferred_model: gptData.ai_model,
        user_feedback: gptData.user_feedback,
        conversation_sharing: gptData.conversation_sharing,
        conversation_exporting: gptData.conversation_exporting,
        remove_branding: gptData.remove_branding,
        agent_title: gptData.agent_title,
        title_color: gptData.title_color,
        spotlight_avatar: gptData.spotlight_avatar,
        user_avatar: gptData.user_avatar,
        avatar_orientations: gptData.avatar_orientations,
        terms_of_service: gptData.terms_of_service,
        affiliate_id: gptData.affiliate_id,
        anti_hallucination: gptData.anti_hallucination,
        agent_visibility: gptData.agent_visibility,
        recaptcha: gptData.recaptcha,
        whitelisted_domains: gptData.whitelisted_domains,
        conversation_retention: gptData.conversation_retention,
        user_id: user.id
      };

      let result;
      if (currentGptId) {
        result = await supabase
          .from('custom_gpts')
          .update(gptPayload)
          .eq('id', currentGptId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('custom_gpts')
          .insert(gptPayload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      if (!currentGptId && result.data) {
        setCurrentGptId(result.data.id);
      }

      toast({
        title: "Settings saved",
        description: "Your UltriumGPT configuration has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving GPT data:', error);
      toast({
        title: "Save failed",
        description: "Failed to save your configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${currentGptId || 'temp'}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gpt-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('gpt-logos')
        .getPublicUrl(fileName);

      setGptData(prev => ({ ...prev, avatar_url: data.publicUrl }));
      
      toast({
        title: "Avatar uploaded",
        description: "Your GPT avatar has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const addStarterQuestion = () => {
    setGptData(prev => ({
      ...prev,
      starter_questions: [...prev.starter_questions, ""]
    }));
  };

  const removeStarterQuestion = (index: number) => {
    setGptData(prev => ({
      ...prev,
      starter_questions: prev.starter_questions.filter((_, i) => i !== index)
    }));
  };

  const updateStarterQuestion = (index: number, value: string) => {
    setGptData(prev => ({
      ...prev,
      starter_questions: prev.starter_questions.map((q, i) => i === index ? value : q)
    }));
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-background via-background to-primary/5 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-end mb-4">
          <BackToHubButton />
        </div>
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Settings className="h-4 w-4 mr-2" />
            UltriumGPT Configuration
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            Personalize Your AI Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Craft the perfect AI experience with advanced customization options that reflect your brand and workflow.
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-8">
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b pb-4">
            <TabsList className="grid w-full grid-cols-8 h-14 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="general" className="flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                <Settings className="h-4 w-4" />
                <span className="text-xs">General</span>
              </TabsTrigger>
              <TabsTrigger value="persona" className="flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                <User className="h-4 w-4" />
                <span className="text-xs">Persona</span>
              </TabsTrigger>
              <TabsTrigger value="conversation" className="flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Conversation</span>
              </TabsTrigger>
              <TabsTrigger value="citations" className="flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                <Quote className="h-4 w-4" />
                <span className="text-xs">Citations</span>
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                <Brain className="h-4 w-4" />
                <span className="text-xs">Intelligence</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                <Sliders className="h-4 w-4" />
                <span className="text-xs">Advanced</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Security</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex flex-col items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">
                <Volume2 className="h-4 w-4" />
                <span className="text-xs">Voice</span>
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agent Name
              </CardTitle>
              <CardDescription>
                Choose a name for your AI assistant that reflects its purpose and personality.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g., IT Helper, Support Bot, Company Assistant"
                value={gptData.name}
                onChange={(e) => setGptData(prev => ({ ...prev, name: e.target.value }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Agent Avatar
              </CardTitle>
              <CardDescription>
                Upload a profile picture for your AI assistant. This image will appear in conversations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={gptData.avatar_url} />
                  <AvatarFallback>
                    {gptData.name ? gptData.name.substring(0, 2).toUpperCase() : "GPT"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild disabled={isUploading}>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploading..." : "Change Avatar"}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload square image only. Allowed are JPG, GIF or PNG image up to 800 kb.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Colors
              </CardTitle>
              <CardDescription>
                Customize the color scheme for your AI assistant's interface to match your brand.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={gptData.primary_color}
                      onChange={(e) => setGptData(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={gptData.primary_color}
                      onChange={(e) => setGptData(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#0D599F"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={gptData.secondary_color}
                      onChange={(e) => setGptData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={gptData.secondary_color}
                      onChange={(e) => setGptData(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#0D599F"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Background
              </CardTitle>
              <CardDescription>
                Choose between a solid color or image background for the chat interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={gptData.background_type}
                onValueChange={(value) => setGptData(prev => ({ ...prev, background_type: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="bg-image" />
                  <Label htmlFor="bg-image">Background Image</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="color" id="bg-color" />
                  <Label htmlFor="bg-color">Background Color</Label>
                </div>
              </RadioGroup>
              
              {gptData.background_type === "color" && (
                <Input
                  value={gptData.background_color}
                  onChange={(e) => setGptData(prev => ({ ...prev, background_color: e.target.value }))}
                  placeholder="#FFFFFF"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="persona" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Instructions</CardTitle>
              <CardDescription>
                Customize your agent behavior to control its personality traits and role. Define how your AI should respond, what tone to use, and what expertise it should demonstrate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Act as a helpful IT support assistant. Answer employee questions professionally and provide step-by-step guidance. Always be patient and clear in your explanations..."
                value={gptData.system_prompt}
                onChange={(e) => setGptData(prev => ({ ...prev, system_prompt: e.target.value }))}
                rows={8}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Agent Language
              </CardTitle>
              <CardDescription>
                Select the primary language your AI assistant will use for responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={gptData.language} onValueChange={(value) => setGptData(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English - Worldwide</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Placeholder Prompt
              </CardTitle>
              <CardDescription>
                The text that appears in the message input field before users start typing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={gptData.placeholder_prompt}
                onChange={(e) => setGptData(prev => ({ ...prev, placeholder_prompt: e.target.value }))}
                placeholder="How can I help you today?"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Loading Indicator
              </CardTitle>
              <CardDescription>
                Choose what users see while your AI is generating a response.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={gptData.loading_indicator}
                onValueChange={(value) => setGptData(prev => ({ ...prev, loading_indicator: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="typing" id="typing-dots" />
                  <Label htmlFor="typing-dots">Typing dots animation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom-message" />
                  <Label htmlFor="custom-message">Custom message</Label>
                </div>
              </RadioGroup>
              
              {gptData.loading_indicator === "custom" && (
                <Input
                  value={gptData.custom_loading_message}
                  onChange={(e) => setGptData(prev => ({ ...prev, custom_loading_message: e.target.value }))}
                  placeholder="Hang in there! I'm thinking..."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Starter Questions
              </CardTitle>
              <CardDescription>
                Pre-written questions that help users get started with your AI assistant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gptData.starter_questions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={question}
                    onChange={(e) => updateStarterQuestion(index, e.target.value)}
                    placeholder="Enter a sample question here"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeStarterQuestion(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addStarterQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Starter Questions Header</Label>
                  <Input
                    value={gptData.starter_questions_header}
                    onChange={(e) => setGptData(prev => ({ ...prev, starter_questions_header: e.target.value }))}
                    placeholder="Welcome message that appears above starter questions"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Starter Questions Expand Text</Label>
                  <Input
                    value={gptData.starter_questions_expand}
                    onChange={(e) => setGptData(prev => ({ ...prev, starter_questions_expand: e.target.value }))}
                    placeholder="View More"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Starter Questions Collapse Text</Label>
                  <Input
                    value={gptData.starter_questions_collapse}
                    onChange={(e) => setGptData(prev => ({ ...prev, starter_questions_collapse: e.target.value }))}
                    placeholder="View less"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Custom Message Ending
              </CardTitle>
              <CardDescription>
                Optional text that gets appended to every AI response.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={gptData.custom_message_ending}
                onChange={(e) => setGptData(prev => ({ ...prev, custom_message_ending: e.target.value }))}
                placeholder="e.g., 'Need more help? Contact support at help@company.com'"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Error Message
              </CardTitle>
              <CardDescription>
                Message shown when the AI encounters an error or cannot process a request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={gptData.error_message}
                onChange={(e) => setGptData(prev => ({ ...prev, error_message: e.target.value }))}
                placeholder="I'm sorry, I encountered an error. Please try again."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation Duration
              </CardTitle>
              <CardDescription>
                How long conversations remain active before they timeout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.conversation_duration}
                onValueChange={(value) => setGptData(prev => ({ ...prev, conversation_duration: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="24hours" id="24hours" />
                  <Label htmlFor="24hours">Up to 24 hours</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unlimited" id="unlimited" />
                  <Label htmlFor="unlimited">Unlimited</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                I don't know message
              </CardTitle>
              <CardDescription>
                Response when the AI cannot find relevant information to answer a question.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={gptData.unknown_message}
                onChange={(e) => setGptData(prev => ({ ...prev, unknown_message: e.target.value }))}
                placeholder="I couldn't find specific information about that. Please contact support for assistance."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Show Citations
              </CardTitle>
              <CardDescription>
                Whether to display source references when the AI provides information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={gptData.show_citations} onValueChange={(value) => setGptData(prev => ({ ...prev, show_citations: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dont_display">Don't display citations</SelectItem>
                  <SelectItem value="display">Display citations</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Should the agent mention source names?
              </CardTitle>
              <CardDescription>
                Controls whether the AI can reference specific document or source names in responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!isAdvancedFeatureAvailable("should_mention_sources") && (
                  <Badge variant="secondary" className="mb-4">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium Feature
                  </Badge>
                )}
                <RadioGroup
                  value={gptData.should_mention_sources ? "yes" : "no"}
                  onValueChange={(value) => setGptData(prev => ({ ...prev, should_mention_sources: value === "yes" }))}
                  disabled={!isAdvancedFeatureAvailable("should_mention_sources")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="mention-yes" />
                    <Label htmlFor="mention-yes">Yes, agent can include source names in its answers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="mention-no" />
                    <Label htmlFor="mention-no">No, agent won't mention source names in its answers, even if asked</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Agent's Capability
              </CardTitle>
              <CardDescription>
                Choose the balance between response speed, accuracy, and reasoning complexity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {[
                  { id: "fastest", label: "Fastest Responses", icon: "🚀", description: "Quick replies, basic reasoning" },
                  { id: "optimal", label: "Optimal Choice", icon: "🧠", description: "Best balance of speed and quality" },
                  { id: "highest", label: "Highest Relevance", icon: "🎯", description: "Most accurate responses" },
                  { id: "complex", label: "Complex Reasoning", icon: "🧩", description: "Advanced problem solving" }
                ].map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg cursor-pointer text-center transition-colors ${
                      gptData.agent_capability === option.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setGptData(prev => ({ ...prev, agent_capability: option.id }))}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="text-sm font-medium">{option.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Generate Responses From
              </CardTitle>
              <CardDescription>
                Control what knowledge sources your AI uses to generate responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={gptData.generate_responses_from} onValueChange={(value) => setGptData(prev => ({ ...prev, generate_responses_from: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="my_data_llm">My Data + General Knowledge</SelectItem>
                  <SelectItem value="my_data_only">My Data Only</SelectItem>
                  <SelectItem value="llm_only">General Knowledge Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-destructive mt-2">
                Enabling general knowledge can increase chances of hallucination. Use "My Data Only" for maximum accuracy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model
                {!isAdvancedFeatureAvailable("ai_model") && (
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Enterprise Feature
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Select the underlying AI model. Add your own API keys in the "API Keys" tab to unlock more models.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={gptData.ai_model} 
                onValueChange={(value) => setGptData(prev => ({ ...prev, ai_model: value }))}
                disabled={!isAdvancedFeatureAvailable("ai_model")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* OpenAI Models - Always available */}
                  <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Latest)</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Vision)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                  <SelectItem value="o1-preview">o1-preview (Reasoning)</SelectItem>
                  <SelectItem value="o1-mini">o1-mini (Fast Reasoning)</SelectItem>
                  <SelectItem value="o3-mini">o3-mini (Next-Gen)</SelectItem>
                  {/* Anthropic Models */}
                  {hasProviderKey('anthropic') && (
                    <>
                      <SelectItem value="claude-opus-4-20250514">Claude Opus 4</SelectItem>
                      <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                      <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                    </>
                  )}
                  {/* Google Models */}
                  {hasProviderKey('google') && (
                    <>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (1M context)</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                    </>
                  )}
                  {/* Mistral Models */}
                  {hasProviderKey('mistral') && (
                    <>
                      <SelectItem value="mistral-large-latest">Mistral Large</SelectItem>
                      <SelectItem value="mixtral-8x22b">Mixtral 8x22B</SelectItem>
                    </>
                  )}
                  {/* Together AI / Llama Models */}
                  {hasProviderKey('together') && (
                    <>
                      <SelectItem value="meta-llama/Llama-3.3-70B-Instruct-Turbo">Llama 3.3 70B</SelectItem>
                      <SelectItem value="meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo">Llama 3.1 405B</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Add API keys in the "API Keys" tab to unlock Gemini, Llama, Mistral & more models.
              </p>
            </CardContent>
          </Card>

          {/* API Keys Section */}
          <AIProviderKeyManager />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                User Feedback
              </CardTitle>
              <CardDescription>
                Allow users to rate responses with thumbs up/down to help improve the AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.user_feedback ? "enabled" : "disabled"}
                onValueChange={(value) => setGptData(prev => ({ ...prev, user_feedback: value === "enabled" }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enabled" id="feedback-enabled" />
                  <Label htmlFor="feedback-enabled">Enabled</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disabled" id="feedback-disabled" />
                  <Label htmlFor="feedback-disabled">Disabled</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Conversation Sharing
              </CardTitle>
              <CardDescription>
                Allow users to share conversations with others via shareable links.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.conversation_sharing ? "enabled" : "disabled"}
                onValueChange={(value) => setGptData(prev => ({ ...prev, conversation_sharing: value === "enabled" }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enabled" id="sharing-enabled" />
                  <Label htmlFor="sharing-enabled">Enabled</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disabled" id="sharing-disabled" />
                  <Label htmlFor="sharing-disabled">Disabled</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Conversation Exporting
                {!isAdvancedFeatureAvailable("conversation_exporting") && (
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium Feature
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Allow users to export their conversation history as files (PDF, TXT, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.conversation_exporting ? "enabled" : "disabled"}
                onValueChange={(value) => setGptData(prev => ({ ...prev, conversation_exporting: value === "enabled" }))}
                disabled={!isAdvancedFeatureAvailable("conversation_exporting")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enabled" id="exporting-enabled" />
                  <Label htmlFor="exporting-enabled">Enabled</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disabled" id="exporting-disabled" />
                  <Label htmlFor="exporting-disabled">Disabled</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>
                Customize the branding and appearance of your AI assistant interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm">Remove Branding</Label>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Powered by UltriumGPT</span>
                  <Switch
                    checked={gptData.remove_branding}
                    onCheckedChange={(checked) => setGptData(prev => ({ ...prev, remove_branding: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Agent Title</Label>
                <Input
                  value={gptData.agent_title}
                  onChange={(e) => setGptData(prev => ({ ...prev, agent_title: e.target.value }))}
                  placeholder="Leave blank if you don't want to use title"
                />
              </div>

              <div className="space-y-2">
                <Label>Title Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={gptData.title_color}
                    onChange={(e) => setGptData(prev => ({ ...prev, title_color: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={gptData.title_color}
                    onChange={(e) => setGptData(prev => ({ ...prev, title_color: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Spotlight Avatar</Label>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Highlight the agent avatar</span>
                  <Switch
                    checked={gptData.spotlight_avatar}
                    onCheckedChange={(checked) => setGptData(prev => ({ ...prev, spotlight_avatar: checked }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">User Avatar</Label>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Show user profile pictures</span>
                  <Switch
                    checked={gptData.user_avatar}
                    onCheckedChange={(checked) => setGptData(prev => ({ ...prev, user_avatar: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Avatar Orientations</Label>
                <Select value={gptData.avatar_orientations} onValueChange={(value) => setGptData(prev => ({ ...prev, avatar_orientations: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent_left_user_right">Agent left, User right</SelectItem>
                    <SelectItem value="agent_right_user_left">Agent right, User left</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Terms of Service</Label>
                <Textarea
                  value={gptData.terms_of_service}
                  onChange={(e) => setGptData(prev => ({ ...prev, terms_of_service: e.target.value }))}
                  placeholder="Enter your terms of service text here"
                  rows={3}
                />
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Anti-Hallucination
              </CardTitle>
              <CardDescription>
                Reduces the AI's tendency to make up information when it doesn't know the answer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.anti_hallucination ? "enabled" : "disabled"}
                onValueChange={(value) => setGptData(prev => ({ ...prev, anti_hallucination: value === "enabled" }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enabled" id="anti-hallucination-enabled" />
                  <Label htmlFor="anti-hallucination-enabled">Enabled (Recommended)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disabled" id="anti-hallucination-disabled" />
                  <Label htmlFor="anti-hallucination-disabled">Disabled (not recommended)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Agent Visibility
              </CardTitle>
              <CardDescription>
                Control who can access your AI assistant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.agent_visibility}
                onValueChange={(value) => setGptData(prev => ({ ...prev, agent_visibility: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="visibility-private" />
                  <Label htmlFor="visibility-private">Private (Only you can access)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="visibility-public" />
                  <Label htmlFor="visibility-public">Public (Anyone can access)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Protection</CardTitle>
              <CardDescription>
                Your data security and privacy information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                UltriumGPT is SOC 2 Type II certified and fully GDPR compliant. Your data and your users' data are safe with us.
              </p>
              <p className="text-sm text-muted-foreground">
                More details available at our <span className="text-primary cursor-pointer">Trust Center</span>.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Recaptcha
              </CardTitle>
              <CardDescription>
                Add bot protection to prevent automated abuse of your AI assistant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.recaptcha ? "enabled" : "disabled"}
                onValueChange={(value) => setGptData(prev => ({ ...prev, recaptcha: value === "enabled" }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enabled" id="recaptcha-enabled" />
                  <Label htmlFor="recaptcha-enabled">Enabled</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="disabled" id="recaptcha-disabled" />
                  <Label htmlFor="recaptcha-disabled">Disabled</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Whitelisted Domains
              </CardTitle>
              <CardDescription>
                Restrict access to embedding your agent only on allowed domains. Provide domains list separated by spaces, tabs, new lines or commas. Input domain without scheme (e.g. domain.com). You can use * mark as placeholder which mean any count of chars (e.g. *.domain.com will allow any subdomains in domain.com).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={gptData.whitelisted_domains}
                onChange={(e) => setGptData(prev => ({ ...prev, whitelisted_domains: e.target.value }))}
                placeholder="example.com&#10;*.mycompany.com&#10;app.example.org"
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Conversation Retention Period
                {!isAdvancedFeatureAvailable("conversation_retention") && (
                  <Badge variant="secondary">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium Feature
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                How long conversation data is stored before automatic deletion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.conversation_retention}
                onValueChange={(value) => setGptData(prev => ({ ...prev, conversation_retention: value }))}
                disabled={!isAdvancedFeatureAvailable("conversation_retention")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="retention-custom" />
                  <Label htmlFor="retention-custom">Custom (in days)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12_months" id="retention-12months" />
                  <Label htmlFor="retention-12months">12 months</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="retention-never" />
                  <Label htmlFor="retention-never">Never delete</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Voice Settings
              </CardTitle>
              <CardDescription>
                Add voice capabilities to your GPT using ElevenLabs technology. Users can hear responses spoken aloud and interact using voice commands.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-6 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/25">
                  <div className="text-center mb-4">
                    <Volume2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Voice Configuration</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Configure voice settings for your GPT below. Users can optionally provide their own ElevenLabs API key for unlimited usage.
                    </p>
                  </div>
                  
                  <GPTVoiceControls 
                    gptId={gptData.id}
                    showSettings={true}
                    className="mt-4"
                  />
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Voice Features Include:</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Text-to-speech for AI responses</li>
                      <li>• Multiple voice character options</li>
                      <li>• Adjustable speech rate and settings</li>
                      <li>• Customer API key support</li>
                      <li>• Voice input recognition (coming soon)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">🔑 API Key Options:</h4>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                      <li>• <strong>Default:</strong> Uses your system ElevenLabs API key</li>
                      <li>• <strong>Customer:</strong> Allow users to input their own API key for unlimited usage</li>
                      <li>• <strong>Hybrid:</strong> Fall back to default if customer key fails</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

        <div className="flex justify-center pt-8">
          <Button 
            onClick={handleSave} 
            size="lg" 
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomGPTPersonalize;