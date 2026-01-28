import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Rocket, Sparkles, Target, Zap, Key, ExternalLink, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface GPTConfigIntelligenceProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

const CAPABILITY_OPTIONS = [
  { value: "fastest", label: "Fastest Responses", icon: "🚀", description: "Optimized for speed" },
  { value: "optimal", label: "Optimal Choice", icon: "🎯", description: "Balanced performance" },
  { value: "relevance", label: "Highest Relevance", icon: "🎯", description: "Best accuracy" },
  { value: "complex", label: "Complex Reasoning", icon: "✨", description: "Deep analysis" },
];

const KNOWLEDGE_SOURCES = [
  { value: "data_and_general", label: "My Data + General Knowledge" },
  { value: "data_only", label: "My Data Only" },
  { value: "general_only", label: "General Knowledge Only" },
];

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Vision)", provider: "openai" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "openai" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "anthropic" },
  { value: "claude-3-opus", label: "Claude 3 Opus", provider: "anthropic" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "google" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "google" },
  { value: "mistral-large", label: "Mistral Large", provider: "mistral" },
  { value: "llama-3.3", label: "Llama 3.3", provider: "together" },
];

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", models: "GPT-4, GPT-4o, o1, o3 models", icon: "🤖" },
  { id: "anthropic", name: "Anthropic", models: "Claude 4 Opus, Sonnet, Haiku models", icon: "🎭" },
  { id: "google", name: "Google AI", models: "Gemini 2.5 Pro & Flash models", icon: "✨" },
  { id: "mistral", name: "Mistral AI", models: "Mistral Large & Mixtral models", icon: "🌀" },
  { id: "together", name: "Together AI", models: "Llama 3.3, Llama 3.1 models", icon: "🦙" },
];

export function GPTConfigIntelligence({ formData, onChange, themeColor }: GPTConfigIntelligenceProps) {
  return (
    <div className="space-y-6">
      {/* Agent's Capability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5" />
            Agent's Capability
          </CardTitle>
          <CardDescription>
            Choose the balance between response speed, accuracy, and reasoning complexity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {CAPABILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onChange("capability_mode", option.value)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all hover:border-primary/50",
                  formData.capability_mode === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <p className="text-sm font-medium">{option.label}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate Responses From */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5" />
            Generate Responses From
          </CardTitle>
          <CardDescription>
            Control what knowledge sources your AI uses to generate responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select 
            value={formData.knowledge_source || "data_and_general"} 
            onValueChange={(value) => onChange("knowledge_source", value)}
          >
            <SelectTrigger className="bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KNOWLEDGE_SOURCES.map((source) => (
                <SelectItem key={source.value} value={source.value}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-orange-500">
            Enabling general knowledge can increase chances of hallucination. Use "My Data Only" for maximum accuracy.
          </p>
        </CardContent>
      </Card>

      {/* AI Model */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5" />
            AI Model
          </CardTitle>
          <CardDescription>
            Select the underlying AI model. Add your own API keys in the "API Keys" tab to unlock more models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select 
            value={formData.preferred_model || "gpt-4o"} 
            onValueChange={(value) => onChange("preferred_model", value)}
          >
            <SelectTrigger className="bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Add API keys in the "API Keys" tab to unlock Gemini, Llama, Mistral & more models.
          </p>
        </CardContent>
      </Card>

      {/* AI Provider API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            AI Provider API Keys
          </CardTitle>
          <CardDescription>
            Add your own API keys to unlock additional AI models. Your keys are stored securely and never shared.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {AI_PROVIDERS.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{provider.icon}</div>
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">{provider.models}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Key
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Note: OpenAI models are available by default. Add keys for other providers to access their models.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
