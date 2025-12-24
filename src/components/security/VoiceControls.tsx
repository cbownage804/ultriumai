import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  Mic, 
  MicOff,
  Play,
  Square
} from 'lucide-react';
import { useVoiceInterface } from '@/hooks/useVoiceInterface';

interface VoiceControlsProps {
  onVoiceMessage?: (message: string) => void;
  className?: string;
}

const availableVoices = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Professional female voice' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Authoritative male voice' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Friendly female voice' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Deep male voice' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', description: 'Young male voice' }
];

export const VoiceControls = ({ onVoiceMessage, className }: VoiceControlsProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { speak, stopSpeaking, isPlaying, isLoading, settings, updateSettings } = useVoiceInterface();

  const handleTestVoice = async () => {
    const testMessage = "Hello! This is SafeShield AI. Your security systems are being monitored and protected.";
    await speak(testMessage);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    // Note: Real voice recognition would require Web Speech API or similar
    // For now, just toggle the listening state
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Auto-stop after 5 seconds if no input
      setTimeout(() => setIsListening(false), 5000);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Voice Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={toggleListening}
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          className="flex items-center gap-2"
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening ? 'Stop Listening' : 'Voice Input'}
        </Button>

        <Button
          onClick={isPlaying ? stopSpeaking : handleTestVoice}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? 'Stop' : 'Test Voice'}
        </Button>

        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="ghost"
          size="sm"
        >
          <Settings className="h-4 w-4" />
        </Button>

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
      </div>

      {/* Voice Settings Panel */}
      {showSettings && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Voice Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <label className="text-sm font-medium">Auto-speak responses</label>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};