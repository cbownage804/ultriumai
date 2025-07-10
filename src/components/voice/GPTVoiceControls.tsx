import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  Mic, 
  MicOff,
  Play,
  Square,
  Save,
  Key,
  ExternalLink
} from 'lucide-react';
import { useGPTVoice } from '@/hooks/useGPTVoice';

interface GPTVoiceControlsProps {
  gptId?: string;
  userId?: string;
  onVoiceMessage?: (message: string) => void;
  className?: string;
  showSettings?: boolean;
  initialSettings?: any;
}

const availableVoices = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Professional female voice' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Authoritative male voice' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Friendly female voice' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Warm female voice' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Young male voice' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Deep male voice' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Young male voice' }
];

export const GPTVoiceControls = ({ 
  gptId, 
  userId, 
  onVoiceMessage, 
  className, 
  showSettings = false,
  initialSettings 
}: GPTVoiceControlsProps) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  
  const { 
    speak, 
    stopSpeaking, 
    isPlaying, 
    isLoading, 
    settings, 
    updateSettings, 
    saveSettings 
  } = useGPTVoice({ gptId, userId, initialSettings });

  const handleTestVoice = async () => {
    const testMessage = "Hello! This is a test of your custom GPT voice. Your responses can now be spoken aloud using ElevenLabs technology.";
    await speak(testMessage);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // Voice recognition would be implemented here
    if (onVoiceMessage && !isListening) {
      // Simulated voice input for demo
      setTimeout(() => {
        onVoiceMessage("Hello, please help me with my question");
        setIsListening(false);
      }, 2000);
    }
  };

  if (!settings.enabled && !showSettings) {
    return null; // Don't show controls if voice is not enabled
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Voice Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={toggleListening}
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          className="flex items-center gap-2"
          disabled={!settings.enabled}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening ? 'Stop Listening' : 'Voice Input'}
        </Button>

        <Button
          onClick={isPlaying ? stopSpeaking : handleTestVoice}
          variant="outline"
          size="sm"
          disabled={isLoading || !settings.enabled}
          className="flex items-center gap-2"
        >
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? 'Stop' : 'Test Voice'}
        </Button>

        {showSettings && (
          <Button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            variant="ghost"
            size="sm"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}

        {/* Status Badges */}
        {isListening && (
          <Badge variant="destructive" className="animate-pulse">
            Listening...
          </Badge>
        )}
        
        {isPlaying && (
          <Badge variant="default" className="animate-pulse">
            Speaking...
          </Badge>
        )}
        
        {isLoading && (
          <Badge variant="secondary">
            Processing...
          </Badge>
        )}

        {settings.apiKey && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Key className="h-3 w-3" />
            Custom API
          </Badge>
        )}
      </div>

      {/* Voice Settings Panel */}
      {showSettings && showAdvancedSettings && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Voice Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable Voice */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Enable Voice</label>
                <p className="text-xs text-muted-foreground">Allow this GPT to speak responses</p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSettings({ enabled: checked })}
              />
            </div>

            {settings.enabled && (
              <>
                {/* Voice Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice Character</label>
                  <Select 
                    value={settings.voice} 
                    onValueChange={(value) => updateSettings({ voice: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div>
                            <div className="font-medium">{voice.name}</div>
                            <div className="text-xs text-muted-foreground">{voice.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-speak Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-speak responses</label>
                    <p className="text-xs text-muted-foreground">Automatically speak AI responses</p>
                  </div>
                  <Switch
                    checked={settings.autoSpeak}
                    onCheckedChange={(checked) => updateSettings({ autoSpeak: checked })}
                  />
                </div>

                {/* Speech Rate */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Speech Rate: {settings.speechRate}x</label>
                  <Slider
                    value={[settings.speechRate]}
                    onValueChange={([value]) => updateSettings({ speechRate: value })}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Customer API Key */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">ElevenLabs API Key (Optional)</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open('https://elevenlabs.io/app/settings/api-keys', '_blank')}
                      className="h-auto p-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use your own API key for unlimited voice generation
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type={apiKeyVisible ? "text" : "password"}
                      placeholder="sk-..."
                      value={settings.apiKey || ''}
                      onChange={(e) => updateSettings({ apiKey: e.target.value })}
                      className="text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    >
                      {apiKeyVisible ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Save Button */}
            <Button onClick={saveSettings} className="w-full" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Voice Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};