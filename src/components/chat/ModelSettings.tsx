import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, Brain, Gauge, DollarSign } from "lucide-react";

export interface ModelParams {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

interface ModelConfig {
  name: string;
  maxTokens: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  contextWindow: number;
  description: string;
  icon: any;
  category: 'flagship' | 'reasoning' | 'fast' | 'standard';
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // OpenAI Models
  'gpt-4.1-2025-04-14': {
    name: 'GPT-4.1 (Latest)',
    maxTokens: 4096,
    inputCostPer1kTokens: 0.01,
    outputCostPer1kTokens: 0.03,
    contextWindow: 128000,
    description: 'The flagship model with superior performance',
    icon: Brain,
    category: 'flagship'
  },
  'gpt-4o': {
    name: 'GPT-4o',
    maxTokens: 4096,
    inputCostPer1kTokens: 0.005,
    outputCostPer1kTokens: 0.015,
    contextWindow: 128000,
    description: 'Advanced multimodal model with vision capabilities',
    icon: Brain,
    category: 'standard'
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    maxTokens: 16384,
    inputCostPer1kTokens: 0.00015,
    outputCostPer1kTokens: 0.0006,
    contextWindow: 128000,
    description: 'Fast and cost-effective for most tasks',
    icon: Zap,
    category: 'fast'
  },
  'o1-preview': {
    name: 'o1-preview',
    maxTokens: 32768,
    inputCostPer1kTokens: 0.015,
    outputCostPer1kTokens: 0.06,
    contextWindow: 128000,
    description: 'Advanced reasoning with chain-of-thought',
    icon: Brain,
    category: 'reasoning'
  },
  'o1-mini': {
    name: 'o1-mini',
    maxTokens: 65536,
    inputCostPer1kTokens: 0.003,
    outputCostPer1kTokens: 0.012,
    contextWindow: 128000,
    description: 'Fast reasoning model',
    icon: Gauge,
    category: 'reasoning'
  },
  // Anthropic Models
  'claude-opus-4-20250514': {
    name: 'Claude Opus 4',
    maxTokens: 4096,
    inputCostPer1kTokens: 0.015,
    outputCostPer1kTokens: 0.075,
    contextWindow: 200000,
    description: 'Most capable Claude model with superior reasoning',
    icon: Brain,
    category: 'flagship'
  },
  'claude-sonnet-4-20250514': {
    name: 'Claude Sonnet 4',
    maxTokens: 4096,
    inputCostPer1kTokens: 0.003,
    outputCostPer1kTokens: 0.015,
    contextWindow: 200000,
    description: 'High-performance Claude model with exceptional efficiency',
    icon: Brain,
    category: 'standard'
  },
  'claude-3-5-haiku-20241022': {
    name: 'Claude 3.5 Haiku',
    maxTokens: 4096,
    inputCostPer1kTokens: 0.001,
    outputCostPer1kTokens: 0.005,
    contextWindow: 200000,
    description: 'Fast and efficient Claude model',
    icon: Gauge,
    category: 'fast'
  },
  // Google Models
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    maxTokens: 8192,
    inputCostPer1kTokens: 0.00125,
    outputCostPer1kTokens: 0.005,
    contextWindow: 1000000,
    description: 'Google flagship with 1M context window',
    icon: Brain,
    category: 'flagship'
  },
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    maxTokens: 8192,
    inputCostPer1kTokens: 0.000075,
    outputCostPer1kTokens: 0.0003,
    contextWindow: 1000000,
    description: 'Fast and cost-effective Google model',
    icon: Zap,
    category: 'fast'
  },
  // Meta Models
  'llama-3.3-70b': {
    name: 'Llama 3.3 70B',
    maxTokens: 8192,
    inputCostPer1kTokens: 0.0008,
    outputCostPer1kTokens: 0.0008,
    contextWindow: 128000,
    description: 'Open-source powerhouse from Meta',
    icon: Brain,
    category: 'standard'
  },
  'llama-3.1-405b': {
    name: 'Llama 3.1 405B',
    maxTokens: 4096,
    inputCostPer1kTokens: 0.003,
    outputCostPer1kTokens: 0.003,
    contextWindow: 128000,
    description: 'Largest open-source model available',
    icon: Brain,
    category: 'flagship'
  },
  // Mistral Models
  'mistral-large': {
    name: 'Mistral Large',
    maxTokens: 4096,
    inputCostPer1kTokens: 0.002,
    outputCostPer1kTokens: 0.006,
    contextWindow: 128000,
    description: 'Enterprise-grade from Mistral AI',
    icon: Brain,
    category: 'flagship'
  },
  'mixtral-8x22b': {
    name: 'Mixtral 8x22B',
    maxTokens: 4096,
    inputCostPer1kTokens: 0.0006,
    outputCostPer1kTokens: 0.0006,
    contextWindow: 64000,
    description: 'Mixture of Experts architecture',
    icon: Gauge,
    category: 'standard'
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'flagship': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'reasoning': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'fast': return 'bg-green-100 text-green-700 border-green-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

interface ModelSettingsProps {
  modelParams: ModelParams;
  onChange: (params: ModelParams) => void;
  disabled?: boolean;
}

export const ModelSettings = ({ modelParams, onChange, disabled = false }: ModelSettingsProps) => {
  const currentModel = MODEL_CONFIGS[modelParams.model] || MODEL_CONFIGS['gpt-4.1-2025-04-14'];
  const Icon = currentModel.icon;

  const updateParam = (key: keyof ModelParams, value: any) => {
    onChange({ ...modelParams, [key]: value });
  };

  const estimatedCost = (inputTokens: number, outputTokens: number) => {
    const inputCost = (inputTokens / 1000) * currentModel.inputCostPer1kTokens;
    const outputCost = (outputTokens / 1000) * currentModel.outputCostPer1kTokens;
    return (inputCost + outputCost).toFixed(6);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Model & Parameters
        </CardTitle>
        <CardDescription>
          Configure AI model and generation parameters for optimal responses
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Model Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">AI Model</Label>
          <Select 
            value={modelParams.model} 
            onValueChange={(value) => updateParam('model', value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODEL_CONFIGS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      <span>{config.name}</span>
                      <Badge variant="outline" className={getCategoryColor(config.category)}>
                        {config.category}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Current Model Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span className="font-medium">{currentModel.name}</span>
              <Badge variant="outline" className={getCategoryColor(currentModel.category)}>
                {currentModel.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{currentModel.description}</p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Max Tokens:</span>
                <span className="ml-1 font-medium">{currentModel.maxTokens.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Context:</span>
                <span className="ml-1 font-medium">{(currentModel.contextWindow / 1000).toFixed(0)}K</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Input:</span>
                <span className="ml-1 font-medium">${currentModel.inputCostPer1kTokens.toFixed(4)}/1K</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Output:</span>
                <span className="ml-1 font-medium">${currentModel.outputCostPer1kTokens.toFixed(4)}/1K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Parameters */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Generation Parameters</h4>
          
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Temperature</Label>
              <span className="text-sm text-muted-foreground">{modelParams.temperature}</span>
            </div>
            <Slider
              value={[modelParams.temperature]}
              onValueChange={([value]) => updateParam('temperature', value)}
              min={0}
              max={2}
              step={0.1}
              disabled={disabled}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness. Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Max Tokens</Label>
              <span className="text-sm text-muted-foreground">{modelParams.max_tokens}</span>
            </div>
            <Slider
              value={[modelParams.max_tokens]}
              onValueChange={([value]) => updateParam('max_tokens', value)}
              min={100}
              max={Math.min(4000, currentModel.maxTokens)}
              step={100}
              disabled={disabled}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum response length in tokens
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Top P</Label>
              <span className="text-sm text-muted-foreground">{modelParams.top_p}</span>
            </div>
            <Slider
              value={[modelParams.top_p]}
              onValueChange={([value]) => updateParam('top_p', value)}
              min={0.1}
              max={1}
              step={0.1}
              disabled={disabled}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls diversity via nucleus sampling
            </p>
          </div>

          {/* Frequency Penalty */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Frequency Penalty</Label>
              <span className="text-sm text-muted-foreground">{modelParams.frequency_penalty}</span>
            </div>
            <Slider
              value={[modelParams.frequency_penalty]}
              onValueChange={([value]) => updateParam('frequency_penalty', value)}
              min={-2}
              max={2}
              step={0.1}
              disabled={disabled}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Reduces repetition of frequent tokens
            </p>
          </div>

          {/* Presence Penalty */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">Presence Penalty</Label>
              <span className="text-sm text-muted-foreground">{modelParams.presence_penalty}</span>
            </div>
            <Slider
              value={[modelParams.presence_penalty]}
              onValueChange={([value]) => updateParam('presence_penalty', value)}
              min={-2}
              max={2}
              step={0.1}
              disabled={disabled}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Encourages talking about new topics
            </p>
          </div>
        </div>

        {/* Cost Estimation */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">Estimated Cost (per 1K tokens)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Input: ${estimatedCost(1000, 0)}</div>
            <div>Output: ${estimatedCost(0, 1000)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};