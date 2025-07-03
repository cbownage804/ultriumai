import { useState } from "react";
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
  Info,
  Crown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CustomGPTPersonalize = () => {
  const [gptData, setGptData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    avatarUrl: "",
    themeColor: "#3b82f6",
    primaryColor: "#3b82f6",
    secondaryColor: "#3b82f6",
    backgroundColor: "#ffffff",
    backgroundType: "color",
    language: "english",
    placeholderPrompt: "How can I help you today?",
    loadingIndicator: "typing",
    customLoadingMessage: "",
    starterQuestions: [
      "How do I restart my Windows 365 cloud PC?",
      "My Teams notifications aren't working — can you help?",
      "How do I set up Outlook on a new device?"
    ],
    starterQuestionsHeader: "Welcome! I'm ChatKWC — your virtual IT assistant. I can help with common IT issues like email, Teams, Windows 365, or file access. What do you need help with today?",
    starterQuestionsExpand: "View More",
    starterQuestionsCollapse: "View less",
    customMessageEnding: "",
    errorMessage: "I didn't find a walkthrough for that. You can contact the KWC IT Support Team for assistance.",
    conversationDuration: "24hours",
    unknownMessage: "I couldn't find a specific answer to that. You may want to contact the KWC IT Support Team for assistance.",
    showCitations: "dont_display",
    shouldMentionSources: true,
    agentCapability: "optimal",
    generateResponsesFrom: "my_data_llm",
    aiModel: "gpt-4o",
    userFeedback: true,
    conversationSharing: true,
    conversationExporting: false,
    removeBranding: false,
    agentTitle: "",
    titleColor: "#000000",
    spotlightAvatar: false,
    userAvatar: false,
    avatarOrientations: "agent_left_user_right",
    termsOfService: "",
    affiliateId: "",
    antiHallucination: true,
    agentVisibility: "public",
    recaptcha: false,
    whitelistedDomains: "",
    conversationRetention: "12_months"
  });
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your Custom GPT configuration has been updated",
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setGptData(prev => ({ ...prev, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const colorOptions = [
    "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b", 
    "#10b981", "#06b6d4", "#ec4899", "#6366f1"
  ];

  const addStarterQuestion = () => {
    setGptData(prev => ({
      ...prev,
      starterQuestions: [...prev.starterQuestions, ""]
    }));
  };

  const removeStarterQuestion = (index: number) => {
    setGptData(prev => ({
      ...prev,
      starterQuestions: prev.starterQuestions.filter((_, i) => i !== index)
    }));
  };

  const updateStarterQuestion = (index: number, value: string) => {
    setGptData(prev => ({
      ...prev,
      starterQuestions: prev.starterQuestions.map((q, i) => i === index ? value : q)
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Personalize Your GPT</h1>
        <p className="text-muted-foreground mt-2">
          Settings here apply to all deployment options.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="persona" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Persona
          </TabsTrigger>
          <TabsTrigger value="conversation" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="citations" className="flex items-center gap-1">
            <Quote className="h-4 w-4" />
            Citations
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            Intelligence
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-1">
            <Sliders className="h-4 w-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Agent Name
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="ChatKWC"
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={gptData.avatarUrl} />
                  <AvatarFallback>
                    {gptData.name ? gptData.name.substring(0, 2).toUpperCase() : "GPT"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Change Avatar
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={gptData.primaryColor}
                      onChange={(e) => setGptData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={gptData.primaryColor}
                      onChange={(e) => setGptData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#0D599F"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={gptData.secondaryColor}
                      onChange={(e) => setGptData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={gptData.secondaryColor}
                      onChange={(e) => setGptData(prev => ({ ...prev, secondaryColor: e.target.value }))}
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
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={gptData.backgroundType}
                onValueChange={(value) => setGptData(prev => ({ ...prev, backgroundType: value }))}
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
              
              {gptData.backgroundType === "color" && (
                <Input
                  value={gptData.backgroundColor}
                  onChange={(e) => setGptData(prev => ({ ...prev, backgroundColor: e.target.value }))}
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
                Customize your agent behavior to control its personality traits and role to fit your use case. Use our handy Persona Generator tool to get started!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Act as the internal helpdesk assistant for KWC. Answer employee questions using the uploaded helpdesk flows..."
                value={gptData.systemPrompt}
                onChange={(e) => setGptData(prev => ({ ...prev, systemPrompt: e.target.value }))}
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={gptData.language} onValueChange={(value) => setGptData(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English - Worldwide(English)</SelectItem>
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={gptData.placeholderPrompt}
                onChange={(e) => setGptData(prev => ({ ...prev, placeholderPrompt: e.target.value }))}
                placeholder="How can I help you today?"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Loading Indicator
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={gptData.loadingIndicator}
                onValueChange={(value) => setGptData(prev => ({ ...prev, loadingIndicator: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="typing" id="typing-dots" />
                  <Label htmlFor="typing-dots">Typing dots</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom-message" />
                  <Label htmlFor="custom-message">Custom message</Label>
                </div>
              </RadioGroup>
              
              {gptData.loadingIndicator === "custom" && (
                <Input
                  value={gptData.customLoadingMessage}
                  onChange={(e) => setGptData(prev => ({ ...prev, customLoadingMessage: e.target.value }))}
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gptData.starterQuestions.map((question, index) => (
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
                    value={gptData.starterQuestionsHeader}
                    onChange={(e) => setGptData(prev => ({ ...prev, starterQuestionsHeader: e.target.value }))}
                    placeholder="Welcome message"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Starter Questions Expand</Label>
                  <Input
                    value={gptData.starterQuestionsExpand}
                    onChange={(e) => setGptData(prev => ({ ...prev, starterQuestionsExpand: e.target.value }))}
                    placeholder="View More"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Starter Questions Collapse</Label>
                  <Input
                    value={gptData.starterQuestionsCollapse}
                    onChange={(e) => setGptData(prev => ({ ...prev, starterQuestionsCollapse: e.target.value }))}
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={gptData.customMessageEnding}
                onChange={(e) => setGptData(prev => ({ ...prev, customMessageEnding: e.target.value }))}
                placeholder=""
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Error Message
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={gptData.errorMessage}
                onChange={(e) => setGptData(prev => ({ ...prev, errorMessage: e.target.value }))}
                placeholder="Error message"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation Duration
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.conversationDuration}
                onValueChange={(value) => setGptData(prev => ({ ...prev, conversationDuration: value }))}
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={gptData.unknownMessage}
                onChange={(e) => setGptData(prev => ({ ...prev, unknownMessage: e.target.value }))}
                placeholder="Unknown message"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Show Citations
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={gptData.showCitations} onValueChange={(value) => setGptData(prev => ({ ...prev, showCitations: value }))}>
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Badge variant="secondary" className="mb-4">
                  <Crown className="w-3 h-3 mr-1" />
                  Unlock Feature
                </Badge>
                <RadioGroup
                  value={gptData.shouldMentionSources ? "yes" : "no"}
                  onValueChange={(value) => setGptData(prev => ({ ...prev, shouldMentionSources: value === "yes" }))}
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {[
                  { id: "fastest", label: "Fastest Responses", icon: "🚀" },
                  { id: "optimal", label: "Optimal Choice", icon: "🧠", selected: true },
                  { id: "highest", label: "Highest Relevance", icon: "🎯" },
                  { id: "complex", label: "Complex Reasoning", icon: "🧩" }
                ].map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg cursor-pointer text-center ${
                      gptData.agentCapability === option.id ? 'border-primary bg-primary/5' : 'border-muted'
                    }`}
                    onClick={() => setGptData(prev => ({ ...prev, agentCapability: option.id }))}
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={gptData.generateResponsesFrom} onValueChange={(value) => setGptData(prev => ({ ...prev, generateResponsesFrom: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="my_data_llm">My Data + LLM</SelectItem>
                  <SelectItem value="my_data_only">My Data Only</SelectItem>
                  <SelectItem value="llm_only">LLM Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-destructive mt-2">
                Enabling general LLM knowledge significantly increases chances of hallucination and reduces the effectiveness of CustomGPT.ai system and Persona you have set up. Use this feature with caution.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model
                <Badge variant="secondary">
                  <Crown className="w-3 h-3 mr-1" />
                  Unlock Feature
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={gptData.aiModel} onValueChange={(value) => setGptData(prev => ({ ...prev, aiModel: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                User Feedback
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.userFeedback ? "enabled" : "disabled"}
                onValueChange={(value) => setGptData(prev => ({ ...prev, userFeedback: value === "enabled" }))}
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.conversationSharing ? "enabled" : "disabled"}
                onValueChange={(value) => setGptData(prev => ({ ...prev, conversationSharing: value === "enabled" }))}
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
                <Badge variant="secondary">
                  <Crown className="w-3 h-3 mr-1" />
                  Unlock Feature
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.conversationExporting ? "enabled" : "disabled"}
                onValueChange={(value) => setGptData(prev => ({ ...prev, conversationExporting: value === "enabled" }))}
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
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm">Remove Branding</Label>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Powered by CustomGPT.ai</span>
                  <Switch
                    checked={gptData.removeBranding}
                    onCheckedChange={(checked) => setGptData(prev => ({ ...prev, removeBranding: checked }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Agent Title</Label>
                <Input
                  value={gptData.agentTitle}
                  onChange={(e) => setGptData(prev => ({ ...prev, agentTitle: e.target.value }))}
                  placeholder="Leave blank if you don't want to use title"
                />
              </div>

              <div className="space-y-2">
                <Label>Title Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={gptData.titleColor}
                    onChange={(e) => setGptData(prev => ({ ...prev, titleColor: e.target.value }))}
                    className="w-16 h-10"
                  />
                  <Input
                    value={gptData.titleColor}
                    onChange={(e) => setGptData(prev => ({ ...prev, titleColor: e.target.value }))}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">Spotlight Avatar</Label>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Disabled</span>
                  <Switch
                    checked={gptData.spotlightAvatar}
                    onCheckedChange={(checked) => setGptData(prev => ({ ...prev, spotlightAvatar: checked }))}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm">User Avatar</Label>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Disabled</span>
                  <Switch
                    checked={gptData.userAvatar}
                    onCheckedChange={(checked) => setGptData(prev => ({ ...prev, userAvatar: checked }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Avatar Orientations</Label>
                <Select value={gptData.avatarOrientations} onValueChange={(value) => setGptData(prev => ({ ...prev, avatarOrientations: value }))}>
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
                  value={gptData.termsOfService}
                  onChange={(e) => setGptData(prev => ({ ...prev, termsOfService: e.target.value }))}
                  placeholder="Enter your text here"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Affiliate ID
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Label>
                <Input
                  value={gptData.affiliateId}
                  onChange={(e) => setGptData(prev => ({ ...prev, affiliateId: e.target.value }))}
                  placeholder="Enter your Affiliate ID here"
                />
                <p className="text-sm text-muted-foreground">
                  Don't have Affiliate ID? <span className="text-primary cursor-pointer">Become A Partner</span>
                </p>
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
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.antiHallucination ? "enabled" : "disabled"}
                onValueChange={(value) => setGptData(prev => ({ ...prev, antiHallucination: value === "enabled" }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enabled" id="anti-hallucination-enabled" />
                  <Label htmlFor="anti-hallucination-enabled">Enabled</Label>
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.agentVisibility}
                onValueChange={(value) => setGptData(prev => ({ ...prev, agentVisibility: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="visibility-private" />
                  <Label htmlFor="visibility-private">Private</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="visibility-public" />
                  <Label htmlFor="visibility-public">Public</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                CustomGPT.ai is SOC 2 Type II certified and fully GDPR compliant. Your data and your users' data are safe with us.
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
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
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={gptData.whitelistedDomains}
                onChange={(e) => setGptData(prev => ({ ...prev, whitelistedDomains: e.target.value }))}
                placeholder=""
                rows={4}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Conversation Retention Period
                <Badge variant="secondary">
                  <Crown className="w-3 h-3 mr-1" />
                  Unlock Feature
                </Badge>
                <Info className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={gptData.conversationRetention}
                onValueChange={(value) => setGptData(prev => ({ ...prev, conversationRetention: value }))}
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
                  <Label htmlFor="retention-never">Never</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default CustomGPTPersonalize;