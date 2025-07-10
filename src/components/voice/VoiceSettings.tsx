import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Volume2, Mic, Play, Pause, Save } from 'lucide-react';
import { useVoiceInterface } from '@/hooks/useVoiceInterface';
import { cn } from '@/lib/utils';

const VOICE_OPTIONS = [
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Deep, professional male voice' },
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Clear, friendly female voice' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Warm, conversational female voice' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Calm, soothing female voice' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Energetic, upbeat male voice' },
];

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettings = ({ isOpen, onClose }: VoiceSettingsProps) => {
  const { settings, updateSettings, speak, stopSpeaking, isPlaying, isLoading } = useVoiceInterface();
  const [tempSettings, setTempSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(tempSettings);
    // Save to localStorage for persistence
    localStorage.setItem('voiceSettings', JSON.stringify(tempSettings));
    onClose();
  };

  const handleTestVoice = async () => {
    if (isPlaying) {
      stopSpeaking();
    } else {
      const testMessage = "Hello! This is a test of the SafeShield AI voice assistant. How does this voice sound to you?";
      // Temporarily use the test settings
      updateSettings(tempSettings);
      await speak(testMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-b from-gray-900 to-black border-red-500/20 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-red-500/20 bg-gradient-to-r from-red-900/20 to-red-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-red-400" />
              <CardTitle className="text-white">Voice Assistant Settings</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Voice Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-red-400" />
              <Label className="text-white font-medium">Voice Selection</Label>
              <Badge variant="secondary" className="bg-red-600/20 text-red-300 border-red-500/30">
                Premium Voices
              </Badge>
            </div>
            <Select
              value={tempSettings.voice}
              onValueChange={(value) => setTempSettings(prev => ({ ...prev, voice: value }))}
            >
              <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {VOICE_OPTIONS.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id} className="text-white hover:bg-gray-700">
                    <div className="flex flex-col">
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-sm text-gray-400">{voice.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestVoice}
              disabled={isLoading}
              className="bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/30"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Test
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {isLoading ? 'Loading...' : 'Test Voice'}
                </>
              )}
            </Button>
          </div>

          {/* Speech Rate */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-red-400" />
              <Label className="text-white font-medium">Speech Rate</Label>
              <Badge variant="outline" className="text-xs">
                {tempSettings.speechRate}x
              </Badge>
            </div>
            <Slider
              value={[tempSettings.speechRate]}
              onValueChange={([value]) => setTempSettings(prev => ({ ...prev, speechRate: value }))}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>Slow (0.5x)</span>
              <span>Normal (1.0x)</span>
              <span>Fast (2.0x)</span>
            </div>
          </div>

          {/* Auto-speak */}
          <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <div className="space-y-1">
              <Label className="text-white font-medium">Auto-speak Responses</Label>
              <p className="text-sm text-gray-400">
                Automatically speak AI responses when received
              </p>
            </div>
            <Switch
              checked={tempSettings.autoSpeak}
              onCheckedChange={(checked) => setTempSettings(prev => ({ ...prev, autoSpeak: checked }))}
            />
          </div>

          {/* Voice Commands */}
          <div className="space-y-3">
            <Label className="text-white font-medium">Quick Voice Commands</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                '"Show security status"',
                '"List recent threats"',
                '"Check system health"',
                '"Generate report"',
                '"Show incidents"',
                '"Clear all alerts"'
              ].map((command, index) => (
                <div key={index} className="p-2 bg-gray-800/30 rounded border border-gray-700 text-gray-300">
                  {command}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <Button
              onClick={handleSave}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};