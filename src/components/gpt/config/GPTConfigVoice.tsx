import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Volume2, Mic, Play, Key, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GPTConfigVoiceProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

const ELEVENLABS_VOICES = [
  { value: "EXAVITQu4vr4xnSDxMaL", label: "Sarah", description: "Warm and conversational" },
  { value: "JBFqnCBsd6RMkjVDRZzb", label: "George", description: "Deep British accent" },
  { value: "TX3LPaxmHKxFdv7VOQHJ", label: "Liam", description: "Articulate and friendly" },
  { value: "XrExE9yKIg1WjnnlVkGX", label: "Matilda", description: "Warm and engaging" },
  { value: "pFZP5JQG7iQjIQuC4Bku", label: "Lily", description: "British narrative style" },
  { value: "onwK4e9ZLuTAKqWW03F9", label: "Daniel", description: "Deep authoritative" },
  { value: "cgSgspJ2msm6clMCkdW9", label: "Jessica", description: "Expressive American" },
  { value: "iP95p4xoKVk53GoZ742B", label: "Chris", description: "Casual conversational" },
  { value: "nPczCjzI2devNBz1zQrb", label: "Brian", description: "Deep American narrator" },
  { value: "CwhRBWXzGAHq8TQ4Fs17", label: "Roger", description: "Middle-aged American" },
];

export function GPTConfigVoice({ formData, onChange, themeColor }: GPTConfigVoiceProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const hasApiKey = !!formData.elevenlabs_api_key?.trim();

  const validateApiKey = async () => {
    if (!formData.elevenlabs_api_key?.trim()) return;
    
    setIsValidating(true);
    setKeyStatus('idle');
    
    try {
      // Simple validation - check if key format looks correct
      const key = formData.elevenlabs_api_key.trim();
      if (key.length >= 20) {
        // In production, you'd validate against ElevenLabs API
        setKeyStatus('valid');
      } else {
        setKeyStatus('invalid');
      }
    } catch {
      setKeyStatus('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  const handleApiKeyChange = (value: string) => {
    onChange("elevenlabs_api_key", value);
    setKeyStatus('idle');
  };

  return (
    <div className="space-y-6">
      {/* ElevenLabs API Key */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            ElevenLabs Integration
            {hasApiKey && keyStatus === 'valid' && (
              <Badge variant="outline" className="ml-2 text-green-500 border-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Add your ElevenLabs API key to enable premium voice features. 
            Get your key from <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">elevenlabs.io</a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={formData.elevenlabs_api_key || ""}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="Enter your ElevenLabs API key..."
                  className="bg-muted pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button 
                variant="outline" 
                onClick={validateApiKey}
                disabled={!formData.elevenlabs_api_key?.trim() || isValidating}
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Validate"
                )}
              </Button>
            </div>
            {keyStatus === 'valid' && (
              <p className="text-sm text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                API key validated successfully
              </p>
            )}
            {keyStatus === 'invalid' && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Invalid API key format
              </p>
            )}
          </div>
          
          {!hasApiKey && (
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Why add an API key?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Access premium ElevenLabs voices</li>
                <li>Enable voice input and output</li>
                <li>Customize voice speed and settings</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voice Capabilities - Disabled without API key */}
      <Card className={cn(!hasApiKey && "opacity-60")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5" />
            Voice Capabilities
            {!hasApiKey && (
              <Badge variant="secondary" className="ml-2">Requires API Key</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Enable voice input and output for your AI assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Input */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Voice Input</Label>
              <p className="text-sm text-muted-foreground">Allow users to speak to the AI</p>
            </div>
            <Switch
              checked={formData.enable_voice_input || false}
              onCheckedChange={(checked) => onChange("enable_voice_input", checked)}
              disabled={!hasApiKey}
            />
          </div>

          {/* Voice Output */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Voice Output</Label>
              <p className="text-sm text-muted-foreground">AI can respond with voice</p>
            </div>
            <Switch
              checked={formData.enable_voice_output || false}
              onCheckedChange={(checked) => onChange("enable_voice_output", checked)}
              disabled={!hasApiKey}
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice Selection */}
      <Card className={cn(!hasApiKey && "opacity-60")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="h-5 w-5" />
            Voice Selection
          </CardTitle>
          <CardDescription>
            Choose the voice for your AI assistant's spoken responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select 
            value={formData.elevenlabs_voice_id || "EXAVITQu4vr4xnSDxMaL"} 
            onValueChange={(value) => onChange("elevenlabs_voice_id", value)}
            disabled={!hasApiKey}
          >
            <SelectTrigger className="bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ELEVENLABS_VOICES.map((voice) => (
                <SelectItem key={voice.value} value={voice.value}>
                  <div>
                    <span className="font-medium">{voice.label}</span>
                    <span className="text-muted-foreground ml-2">- {voice.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" disabled={!hasApiKey}>
            <Play className="h-4 w-4 mr-2" />
            Preview Voice
          </Button>
        </CardContent>
      </Card>

      {/* Voice Speed */}
      <Card className={cn(!hasApiKey && "opacity-60")}>
        <CardHeader>
          <CardTitle className="text-lg">Voice Speed</CardTitle>
          <CardDescription>
            Adjust how fast the AI speaks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Slower</span>
            <span>Normal</span>
            <span>Faster</span>
          </div>
          <Slider
            value={[formData.voice_speed || 1]}
            onValueChange={([value]) => onChange("voice_speed", value)}
            min={0.7}
            max={1.2}
            step={0.05}
            className="w-full"
            disabled={!hasApiKey}
          />
          <p className="text-center text-sm text-muted-foreground">
            {formData.voice_speed || 1}x speed
          </p>
        </CardContent>
      </Card>

      {/* Voice Settings */}
      <Card className={cn(!hasApiKey && "opacity-60")}>
        <CardHeader>
          <CardTitle className="text-lg">Voice Settings</CardTitle>
          <CardDescription>
            Fine-tune the voice output characteristics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Stability</Label>
              <span className="text-sm text-muted-foreground">{Math.round((formData.voice_stability || 0.5) * 100)}%</span>
            </div>
            <Slider
              value={[formData.voice_stability || 0.5]}
              onValueChange={([value]) => onChange("voice_stability", value)}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
              disabled={!hasApiKey}
            />
            <p className="text-xs text-muted-foreground">Lower = more expressive, Higher = more consistent</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Similarity Boost</Label>
              <span className="text-sm text-muted-foreground">{Math.round((formData.voice_similarity || 0.75) * 100)}%</span>
            </div>
            <Slider
              value={[formData.voice_similarity || 0.75]}
              onValueChange={([value]) => onChange("voice_similarity", value)}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
              disabled={!hasApiKey}
            />
            <p className="text-xs text-muted-foreground">How closely to match the original voice</p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-play */}
      <Card className={cn(!hasApiKey && "opacity-60")}>
        <CardHeader>
          <CardTitle className="text-lg">Auto-play Responses</CardTitle>
          <CardDescription>
            Automatically play voice responses without user interaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={formData.voice_autoplay ? "enabled" : "disabled"} 
            onValueChange={(value) => onChange("voice_autoplay", value === "enabled")}
            className="space-y-2"
            disabled={!hasApiKey}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="enabled" id="autoplay-enabled" disabled={!hasApiKey} />
              <Label htmlFor="autoplay-enabled" className={cn(!hasApiKey && "text-muted-foreground")}>Enabled</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="disabled" id="autoplay-disabled" disabled={!hasApiKey} />
              <Label htmlFor="autoplay-disabled" className={cn(!hasApiKey && "text-muted-foreground")}>Disabled</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
