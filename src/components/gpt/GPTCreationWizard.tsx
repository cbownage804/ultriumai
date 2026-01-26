import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, ArrowRight, ArrowLeft, Check, Bot, Palette, Brain, 
  MessageSquare, Globe, Mic, Settings, Wand2, Loader2, Zap,
  Shield, Target, Users, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useToast } from "@/hooks/use-toast";

interface GPTCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<GPTFormData>;
}

interface GPTFormData {
  name: string;
  description: string;
  systemPrompt: string;
  category: string;
  primaryColor: string;
  aiModel: string;
  enableWebSearch: boolean;
  enableVoice: boolean;
  voiceId: string;
  starterQuestions: string[];
  placeholderPrompt: string;
  antiHallucination: boolean;
  visibility: "public" | "private";
}

const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", description: "Most capable, best for complex tasks", tier: "premium" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and efficient, great balance", tier: "standard" },
  { id: "gpt-4.1-2025-04-14", name: "GPT-4.1", description: "Latest model with enhanced reasoning", tier: "premium" },
  { id: "claude-3-opus", name: "Claude 3 Opus", description: "Excellent for nuanced responses", tier: "premium" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", description: "Smart and cost-effective", tier: "standard" },
  { id: "gemini-pro", name: "Gemini Pro", description: "Google's advanced model", tier: "standard" },
];

const CATEGORIES = [
  { id: "IT & Infrastructure", icon: Settings, color: "#2563eb" },
  { id: "Cybersecurity", icon: Shield, color: "#dc2626" },
  { id: "Software Development", icon: FileText, color: "#7c3aed" },
  { id: "Business Intelligence", icon: Target, color: "#059669" },
  { id: "Sales & Marketing", icon: Users, color: "#ea580c" },
  { id: "HR & Operations", icon: Users, color: "#0891b2" },
  { id: "Custom", icon: Sparkles, color: "#8b5cf6" },
];

const VOICE_OPTIONS = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and engaging" },
  { id: "fable", name: "Fable", description: "Expressive storyteller" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Friendly and upbeat" },
  { id: "shimmer", name: "Shimmer", description: "Soft and calming" },
];

const PRESET_PROMPTS = [
  { 
    name: "Helpful Assistant", 
    prompt: "You are a helpful, friendly assistant. Provide clear, accurate, and concise answers. If you're unsure, say so honestly.",
    icon: "🤝"
  },
  { 
    name: "Expert Advisor", 
    prompt: "You are an expert advisor in your domain. Provide detailed, professional guidance backed by best practices. Always explain your reasoning.",
    icon: "🎓"
  },
  { 
    name: "Creative Partner", 
    prompt: "You are a creative brainstorming partner. Generate innovative ideas, think outside the box, and help explore possibilities. Be enthusiastic and supportive.",
    icon: "💡"
  },
  { 
    name: "Technical Guide", 
    prompt: "You are a technical expert. Provide step-by-step instructions, code examples when relevant, and troubleshooting guidance. Be precise and thorough.",
    icon: "⚙️"
  },
];

const steps = [
  { id: 1, name: "Basics", icon: Bot },
  { id: 2, name: "Personality", icon: Brain },
  { id: 3, name: "Appearance", icon: Palette },
  { id: 4, name: "Capabilities", icon: Zap },
  { id: 5, name: "Review", icon: Check },
];

export function GPTCreationWizard({ open, onOpenChange, initialData }: GPTCreationWizardProps) {
  const navigate = useNavigate();
  const { createGPT } = useCustomGPTs();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<GPTFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    systemPrompt: initialData?.systemPrompt || "",
    category: initialData?.category || "",
    primaryColor: initialData?.primaryColor || "#3b82f6",
    aiModel: initialData?.aiModel || "gpt-4o-mini",
    enableWebSearch: initialData?.enableWebSearch || false,
    enableVoice: initialData?.enableVoice || false,
    voiceId: initialData?.voiceId || "alloy",
    starterQuestions: initialData?.starterQuestions || ["", "", ""],
    placeholderPrompt: initialData?.placeholderPrompt || "How can I help you today?",
    antiHallucination: initialData?.antiHallucination ?? true,
    visibility: initialData?.visibility || "private",
  });

  const updateForm = (updates: Partial<GPTFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const progress = (currentStep / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0 && formData.description.trim().length > 0;
      case 2:
        return formData.systemPrompt.trim().length > 0;
      case 3:
        return formData.category.length > 0;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const newGPT = {
        name: formData.name,
        description: formData.description,
        system_prompt: formData.systemPrompt,
        category: formData.category,
        primary_color: formData.primaryColor,
        preferred_model: formData.aiModel,
        enable_web_search: formData.enableWebSearch,
        placeholder_prompt: formData.placeholderPrompt,
        starter_questions: formData.starterQuestions.filter(q => q.trim()),
        anti_hallucination: formData.antiHallucination,
        agent_visibility: formData.visibility,
      };

      const result = await createGPT(newGPT);
      
      if (result) {
        toast({
          title: "GPT Created!",
          description: `${formData.name} is ready to use.`,
        });
        onOpenChange(false);
        navigate(`/ai-studio/chat/${result.id}`);
      }
    } catch (error) {
      toast({
        title: "Creation failed",
        description: "Failed to create GPT. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wand2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Create Custom GPT</DialogTitle>
              <DialogDescription>
                Build your AI assistant in a few simple steps
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="py-4">
          <div className="flex justify-between mb-2">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div 
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                    currentStep > step.id 
                      ? "bg-primary border-primary text-primary-foreground"
                      : currentStep === step.id
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden sm:inline">{step.name}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Basics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">GPT Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., IT Support Assistant"
                  value={formData.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your GPT does and who it's for..."
                  value={formData.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <Card
                      key={cat.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50",
                        formData.category === cat.id && "border-primary ring-1 ring-primary"
                      )}
                      onClick={() => updateForm({ category: cat.id, primaryColor: cat.color })}
                    >
                      <CardContent className="p-3 flex items-center gap-2">
                        <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                        <span className="text-xs">{cat.id}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Personality */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Quick Start Presets</Label>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_PROMPTS.map((preset) => (
                    <Card
                      key={preset.name}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50",
                        formData.systemPrompt === preset.prompt && "border-primary"
                      )}
                      onClick={() => updateForm({ systemPrompt: preset.prompt })}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{preset.icon}</span>
                          <span className="font-medium text-sm">{preset.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {preset.prompt}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt *</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Define your GPT's personality, expertise, and behavior..."
                  value={formData.systemPrompt}
                  onChange={(e) => updateForm({ systemPrompt: e.target.value })}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This defines how your GPT responds. Be specific about tone, expertise, and constraints.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Starter Questions</Label>
                <div className="space-y-2">
                  {formData.starterQuestions.map((q, i) => (
                    <Input
                      key={i}
                      placeholder={`Starter question ${i + 1}`}
                      value={q}
                      onChange={(e) => {
                        const updated = [...formData.starterQuestions];
                        updated[i] = e.target.value;
                        updateForm({ starterQuestions: updated });
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Appearance */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Theme Color</Label>
                <div className="flex gap-3">
                  {["#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#22c55e", "#06b6d4", "#6366f1"].map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-10 h-10 rounded-full transition-all",
                        formData.primaryColor === color && "ring-2 ring-offset-2 ring-primary"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => updateForm({ primaryColor: color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">Chat Placeholder</Label>
                <Input
                  id="placeholder"
                  placeholder="How can I help you today?"
                  value={formData.placeholderPrompt}
                  onChange={(e) => updateForm({ placeholderPrompt: e.target.value })}
                />
              </div>

              {/* Preview */}
              <Card className="border-2" style={{ borderColor: formData.primaryColor }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${formData.primaryColor}20` }}
                    >
                      <Bot className="h-6 w-6" style={{ color: formData.primaryColor }} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{formData.name || "Your GPT"}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formData.description || "Your description here"}
                      </p>
                    </div>
                  </div>
                  <div 
                    className="rounded-lg p-3 text-sm"
                    style={{ backgroundColor: `${formData.primaryColor}10` }}
                  >
                    <p className="text-muted-foreground">{formData.placeholderPrompt}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Capabilities */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>AI Model</Label>
                <div className="grid gap-2">
                  {AI_MODELS.map((model) => (
                    <Card
                      key={model.id}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50",
                        formData.aiModel === model.id && "border-primary ring-1 ring-primary"
                      )}
                      onClick={() => updateForm({ aiModel: model.id })}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium text-sm">{model.name}</div>
                            <div className="text-xs text-muted-foreground">{model.description}</div>
                          </div>
                        </div>
                        <Badge variant={model.tier === "premium" ? "default" : "secondary"}>
                          {model.tier}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Web Search</Label>
                    <p className="text-xs text-muted-foreground">Allow GPT to search the web for current information</p>
                  </div>
                  <Switch
                    checked={formData.enableWebSearch}
                    onCheckedChange={(checked) => updateForm({ enableWebSearch: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Anti-Hallucination</Label>
                    <p className="text-xs text-muted-foreground">Reduce false or made-up information</p>
                  </div>
                  <Switch
                    checked={formData.antiHallucination}
                    onCheckedChange={(checked) => updateForm({ antiHallucination: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Voice Enabled</Label>
                    <p className="text-xs text-muted-foreground">Enable voice interactions (coming soon)</p>
                  </div>
                  <Switch
                    checked={formData.enableVoice}
                    onCheckedChange={(checked) => updateForm({ enableVoice: checked })}
                    disabled
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Visibility</Label>
                  <p className="text-xs text-muted-foreground">Who can access this GPT</p>
                </div>
                <Select 
                  value={formData.visibility}
                  onValueChange={(value: "public" | "private") => updateForm({ visibility: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <Card className="border-2" style={{ borderColor: formData.primaryColor }}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${formData.primaryColor}20` }}
                    >
                      <Bot className="h-8 w-8" style={{ color: formData.primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{formData.name}</h3>
                      <p className="text-muted-foreground">{formData.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge style={{ backgroundColor: formData.primaryColor }}>
                          {formData.category || "Custom"}
                        </Badge>
                        <Badge variant="outline">{formData.aiModel}</Badge>
                        <Badge variant="secondary">{formData.visibility}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-1">System Prompt</h4>
                      <p className="text-muted-foreground bg-muted rounded p-2 text-xs">
                        {formData.systemPrompt.slice(0, 200)}
                        {formData.systemPrompt.length > 200 && "..."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Globe className={cn("h-4 w-4", formData.enableWebSearch ? "text-green-500" : "text-muted-foreground")} />
                        <span>Web Search</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className={cn("h-4 w-4", formData.antiHallucination ? "text-green-500" : "text-muted-foreground")} />
                        <span>Anti-Hallucination</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mic className={cn("h-4 w-4", formData.enableVoice ? "text-green-500" : "text-muted-foreground")} />
                        <span>Voice</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center text-muted-foreground text-sm">
                Everything looks good? Click Create to bring your GPT to life!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {currentStep < steps.length ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              style={{ backgroundColor: formData.primaryColor }}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Create GPT
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
