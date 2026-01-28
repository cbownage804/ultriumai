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
  AlertCircle,
  Check,
  Zap,
  Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomGPTs, CustomGPT } from "@/hooks/useCustomGPTs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GPTConfigurationProps {
  gptId: string;
  gptName: string;
  themeColor: string;
  onUpdate?: () => void;
}

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o", description: "Most capable, best quality", icon: "🧠", badge: "Pro" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", description: "Fast and efficient", icon: "⚡" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", description: "Balanced performance", icon: "🎭" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Google's flagship", icon: "💎" },
];

const CATEGORIES = [
  { value: "it-support", label: "IT Support", icon: "🔧" },
  { value: "cybersecurity", label: "Cybersecurity", icon: "🛡️" },
  { value: "development", label: "Development", icon: "💻" },
  { value: "business-intelligence", label: "Business Intelligence", icon: "📊" },
  { value: "sales", label: "Sales & Marketing", icon: "📈" },
  { value: "hr", label: "Human Resources", icon: "👥" },
  { value: "legal", label: "Legal & Compliance", icon: "⚖️" },
  { value: "general", label: "General Purpose", icon: "✨" },
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
        title: "Changes saved",
        description: "Your GPT configuration has been updated.",
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
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">GPT not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Save Banner */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div 
              className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl"
              style={{ 
                backgroundColor: 'hsl(var(--background) / 0.9)',
                boxShadow: `0 20px 60px -15px ${themeColor}30`
              }}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </div>
              <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Basic Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${themeColor}20` }}
              >
                <Bot className="h-5 w-5" style={{ color: themeColor }} />
              </div>
              <div>
                <CardTitle>Identity</CardTitle>
                <CardDescription>Define your GPT's core identity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="My Custom GPT"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select value={formData.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          {cat.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe what your GPT does and who it helps..."
                rows={3}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* System Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${themeColor}20` }}
              >
                <Wand2 className="h-5 w-5" style={{ color: themeColor }} />
              </div>
              <div className="flex-1">
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>Define personality, knowledge, and behavior</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {formData.system_prompt.length} chars
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Textarea
              value={formData.system_prompt}
              onChange={(e) => handleChange("system_prompt", e.target.value)}
              placeholder="You are a helpful assistant that..."
              rows={10}
              className="font-mono text-sm resize-none bg-muted/30 border-0 focus-visible:ring-1"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Model Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${themeColor}20` }}
              >
                <Brain className="h-5 w-5" style={{ color: themeColor }} />
              </div>
              <div>
                <CardTitle>AI Model</CardTitle>
                <CardDescription>Choose the underlying AI engine</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AI_MODELS.map((model) => (
                <button
                  key={model.value}
                  onClick={() => handleChange("preferred_model", model.value)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02]",
                    formData.preferred_model === model.value
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  {formData.preferred_model === model.value && (
                    <div className="absolute top-3 right-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: themeColor }}
                      >
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{model.label}</span>
                        {model.badge && (
                          <Badge variant="secondary" className="text-xs">{model.badge}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{model.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Separator className="my-6" />

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${themeColor}20` }}
                >
                  <Globe className="h-5 w-5" style={{ color: themeColor }} />
                </div>
                <div>
                  <p className="font-medium">Web Search</p>
                  <p className="text-sm text-muted-foreground">
                    Access real-time information from the web
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.enable_web_search}
                onCheckedChange={(checked) => handleChange("enable_web_search", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${themeColor}20` }}
              >
                <Palette className="h-5 w-5" style={{ color: themeColor }} />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Theme Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.theme_color}
                    onChange={(e) => handleChange("theme_color", e.target.value)}
                    className="w-14 h-14 rounded-xl border-2 cursor-pointer overflow-hidden"
                  />
                  <Input
                    value={formData.theme_color}
                    onChange={(e) => handleChange("theme_color", e.target.value)}
                    placeholder="#3b82f6"
                    className="w-32 font-mono"
                  />
                </div>
              </div>
              
              <div 
                className="flex-1 h-20 rounded-xl flex items-center justify-center gap-3"
                style={{ backgroundColor: `${formData.theme_color}15` }}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: formData.theme_color }}
                >
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium" style={{ color: formData.theme_color }}>
                  Preview
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="placeholder" className="text-sm font-medium">Input Placeholder</Label>
              <Input
                id="placeholder"
                value={formData.placeholder_prompt}
                onChange={(e) => handleChange("placeholder_prompt", e.target.value)}
                placeholder="Ask me anything..."
                className="h-12"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Starter Questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${themeColor}20` }}
              >
                <MessageSquare className="h-5 w-5" style={{ color: themeColor }} />
              </div>
              <div className="flex-1">
                <CardTitle>Starter Questions</CardTitle>
                <CardDescription>Suggest conversation starters (max 4)</CardDescription>
              </div>
              <Badge variant="outline">
                {formData.starter_questions.length}/4
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <AnimatePresence>
              {formData.starter_questions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl group"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                  >
                    {index + 1}
                  </div>
                  <span className="flex-1 text-sm">{question}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStarterQuestion(index)}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>

            {formData.starter_questions.length < 4 && (
              <div className="flex gap-3">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Add a starter question..."
                  className="h-12"
                  onKeyDown={(e) => e.key === "Enter" && addStarterQuestion()}
                />
                <Button 
                  onClick={addStarterQuestion} 
                  disabled={!newQuestion.trim()}
                  size="lg"
                  className="h-12 px-6"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
