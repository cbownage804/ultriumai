import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save,
  Loader2,
  Sparkles,
  Globe,
  Palette,
  MessageSquare,
  Bot,
  Wand2,
  Plus,
  X,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs, CustomGPT } from "@/hooks/useCustomGPTs";
import { motion, AnimatePresence } from "framer-motion";

interface GPTConfigurationProps {
  gptId: string;
  gptName: string;
  themeColor: string;
  onUpdate?: () => void;
}

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o", description: "Most capable, best quality" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Fast and efficient" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", description: "Balanced performance" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Google's flagship" },
];

const CATEGORIES = [
  { value: "it-support", label: "IT Support" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "development", label: "Development" },
  { value: "business-intelligence", label: "Business Intelligence" },
  { value: "sales", label: "Sales & Marketing" },
  { value: "hr", label: "Human Resources" },
  { value: "legal", label: "Legal & Compliance" },
  { value: "general", label: "General Purpose" },
];

export function GPTConfiguration({ gptId, gptName, themeColor, onUpdate }: GPTConfigurationProps) {
  const { toast } = useToast();
  const { gpts, updateGPT } = useCustomGPTs();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const gpt = gpts.find(g => g.id === gptId);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    system_prompt: "",
    preferred_model: "gpt-4o-mini",
    enable_web_search: false,
    theme_color: "#3b82f6",
    placeholder_prompt: "",
    category: "general",
    starter_questions: [] as string[],
  });

  const [newQuestion, setNewQuestion] = useState("");

  // Load GPT data when component mounts or GPT changes
  useEffect(() => {
    if (gpt) {
      setFormData({
        name: gpt.name || "",
        description: gpt.description || "",
        system_prompt: gpt.system_prompt || "",
        preferred_model: gpt.preferred_model || "gpt-4o-mini",
        enable_web_search: gpt.enable_web_search || false,
        theme_color: gpt.theme_color || "#3b82f6",
        placeholder_prompt: gpt.placeholder_prompt || "",
        category: gpt.category || "general",
        starter_questions: (gpt.starter_questions as string[]) || [],
      });
      setHasChanges(false);
    }
  }, [gpt]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const addStarterQuestion = () => {
    if (newQuestion.trim() && formData.starter_questions.length < 4) {
      handleChange("starter_questions", [...formData.starter_questions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeStarterQuestion = (index: number) => {
    const updated = formData.starter_questions.filter((_, i) => i !== index);
    handleChange("starter_questions", updated);
  };

  const handleSave = async () => {
    if (!gptId) return;
    
    setIsSaving(true);
    try {
      await updateGPT(gptId, {
        name: formData.name,
        description: formData.description,
        system_prompt: formData.system_prompt,
        preferred_model: formData.preferred_model,
        enable_web_search: formData.enable_web_search,
        theme_color: formData.theme_color,
        placeholder_prompt: formData.placeholder_prompt,
        category: formData.category,
        starter_questions: formData.starter_questions,
      });
      
      setHasChanges(false);
      onUpdate?.();
      
      toast({
        title: "Configuration saved",
        description: "Your GPT settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!gpt) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">GPT not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Save Banner */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-0 z-20 bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">You have unsaved changes</span>
            </div>
            <Button onClick={handleSave} disabled={isSaving} size="sm">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Configure the core identity of your GPT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="My Custom GPT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe what your GPT does..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            System Prompt
          </CardTitle>
          <CardDescription>
            Define your GPT's personality, knowledge, and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.system_prompt}
            onChange={(e) => handleChange("system_prompt", e.target.value)}
            placeholder="You are a helpful assistant that..."
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {formData.system_prompt.length} characters
          </p>
        </CardContent>
      </Card>

      {/* Model & Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Model & Capabilities
          </CardTitle>
          <CardDescription>
            Choose the AI model and enable special features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>AI Model</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AI_MODELS.map((model) => (
                <button
                  key={model.value}
                  onClick={() => handleChange("preferred_model", model.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    formData.preferred_model === model.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium">{model.label}</div>
                  <div className="text-xs text-muted-foreground">{model.description}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Web Search
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow your GPT to search the web for real-time information
              </p>
            </div>
            <Switch
              checked={formData.enable_web_search}
              onCheckedChange={(checked) => handleChange("enable_web_search", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your GPT
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme_color">Theme Color</Label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                id="theme_color"
                value={formData.theme_color}
                onChange={(e) => handleChange("theme_color", e.target.value)}
                className="w-12 h-12 rounded-lg border cursor-pointer"
              />
              <Input
                value={formData.theme_color}
                onChange={(e) => handleChange("theme_color", e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
              <div 
                className="w-20 h-12 rounded-lg"
                style={{ backgroundColor: formData.theme_color }}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="placeholder">Input Placeholder</Label>
            <Input
              id="placeholder"
              value={formData.placeholder_prompt}
              onChange={(e) => handleChange("placeholder_prompt", e.target.value)}
              placeholder="Ask me anything..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Starter Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Starter Questions
          </CardTitle>
          <CardDescription>
            Suggest conversation starters for users (max 4)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {formData.starter_questions.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
              >
                <span className="flex-1 text-sm">{question}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStarterQuestion(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>

          {formData.starter_questions.length < 4 && (
            <div className="flex gap-2">
              <Input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Add a starter question..."
                onKeyDown={(e) => e.key === "Enter" && addStarterQuestion()}
              />
              <Button onClick={addStarterQuestion} disabled={!newQuestion.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          size="lg"
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
