import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Volume2, Mic, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GPTConfigVoiceProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  themeColor: string;
}

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy", description: "Neutral and balanced" },
  { value: "echo", label: "Echo", description: "Warm and conversational" },
  { value: "fable", label: "Fable", description: "British accent" },
  { value: "onyx", label: "Onyx", description: "Deep and authoritative" },
  { value: "nova", label: "Nova", description: "Friendly and expressive" },
  { value: "shimmer", label: "Shimmer", description: "Clear and gentle" },
];

export function GPTConfigVoice({ formData, onChange, themeColor }: GPTConfigVoiceProps) {
  return (
    <div className="space-y-6">
      {/* Enable Voice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5" />
            Voice Capabilities
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
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice Selection */}
      <Card>
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
            value={formData.voice || "nova"} 
            onValueChange={(value) => onChange("voice", value)}
          >
            <SelectTrigger className="bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map((voice) => (
                <SelectItem key={voice.value} value={voice.value}>
                  <div>
                    <span className="font-medium">{voice.label}</span>
                    <span className="text-muted-foreground ml-2">- {voice.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Preview Voice
          </Button>
        </CardContent>
      </Card>

      {/* Voice Speed */}
      <Card>
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
            min={0.5}
            max={2}
            step={0.1}
            className="w-full"
          />
          <p className="text-center text-sm text-muted-foreground">
            {formData.voice_speed || 1}x speed
          </p>
        </CardContent>
      </Card>

      {/* Auto-play */}
      <Card>
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
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="enabled" id="autoplay-enabled" />
              <Label htmlFor="autoplay-enabled">Enabled</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="disabled" id="autoplay-disabled" />
              <Label htmlFor="autoplay-disabled">Disabled</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
