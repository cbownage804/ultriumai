import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GPTVoiceSettings {
  voice: string;
  autoSpeak: boolean;
  speechRate: number;
  enabled: boolean;
  apiKey?: string; // Customer's ElevenLabs API key
  apiKeyType?: 'customer' | 'default';
}

interface UseGPTVoiceProps {
  gptId?: string;
  userId?: string;
  initialSettings?: Partial<GPTVoiceSettings>;
}

export const useGPTVoice = ({ gptId, userId, initialSettings }: UseGPTVoiceProps = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<GPTVoiceSettings>({
    voice: '9BWtsMINqrJLrRacOk9x', // Aria voice as default
    autoSpeak: false, // Disabled by default for GPTs
    speechRate: 1.0,
    enabled: false, // Disabled by default
    apiKeyType: 'default',
    ...initialSettings
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const speak = useCallback(async (text: string, customVoice?: string) => {
    if (!text.trim() || !settings.enabled) return;
    
    setIsLoading(true);
    
    try {
      console.log('GPT Voice: Converting text to speech');
      
      const { data, error } = await supabase.functions.invoke('gpt-voice-tts', {
        body: {
          text: text,
          voice: customVoice || settings.voice,
          apiKey: settings.apiKey,
          userId: userId,
          gptId: gptId
        }
      });

      if (error) {
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      // Create audio from base64
      const audioBlob = new Blob([
        Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Create new audio element
      audioRef.current = new Audio(audioUrl);
      audioRef.current.playbackRate = settings.speechRate;
      
      audioRef.current.onloadstart = () => {
        setIsPlaying(true);
        console.log('GPT Voice: Audio started loading');
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        console.log('GPT Voice: Audio playback ended');
      };
      
      audioRef.current.onerror = (e) => {
        console.error('GPT Voice: Audio playback error:', e);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Voice Playback Error",
          description: "Failed to play generated audio",
          variant: "destructive",
        });
      };
      
      await audioRef.current.play();
      console.log('GPT Voice: Audio playback started successfully');
      
      // Show success message for customer API key usage
      if (data.apiKeyType === 'customer') {
        toast({
          title: "Voice Generated",
          description: "Using your ElevenLabs API key",
          duration: 2000,
        });
      }
      
    } catch (error) {
      console.error('GPT Voice synthesis error:', error);
      
      // Handle customer API key errors gracefully
      if (error instanceof Error && error.message.includes('Invalid customer API key')) {
        toast({
          title: "API Key Error",
          description: "Invalid ElevenLabs API key. Please check your settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Voice Error",
          description: error instanceof Error ? error.message : 'Failed to generate speech',
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [settings, userId, gptId, toast]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<GPTVoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const saveSettings = useCallback(async () => {
    if (!gptId) return;
    
    try {
      // Save voice settings to the custom GPT configuration
      const { error } = await supabase
        .from('custom_gpts')
        .update({
          integration_settings: {
            voice: {
              enabled: settings.enabled,
              voice: settings.voice,
              autoSpeak: settings.autoSpeak,
              speechRate: settings.speechRate,
              apiKey: settings.apiKey ? '***ENCRYPTED***' : null // Don't store actual key
            }
          }
        })
        .eq('id', gptId);

      if (error) throw error;

      toast({
        title: "Voice Settings Saved",
        description: "Your GPT voice configuration has been updated",
      });
    } catch (error) {
      console.error('Error saving voice settings:', error);
      toast({
        title: "Save Error",
        description: "Failed to save voice settings",
        variant: "destructive",
      });
    }
  }, [gptId, settings, toast]);

  return {
    speak,
    stopSpeaking,
    isPlaying,
    isLoading,
    settings,
    updateSettings,
    saveSettings
  };
};