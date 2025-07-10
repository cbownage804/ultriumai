import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VoiceSettings {
  voice: string;
  autoSpeak: boolean;
  speechRate: number;
}

export const useVoiceInterface = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>({
    voice: '9BWtsMINqrJLrRacOk9x', // Aria voice
    autoSpeak: true,
    speechRate: 1.0
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    
    try {
      console.log('Converting text to speech:', text.substring(0, 100));
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text: text,
          voice: settings.voice
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
        console.log('Audio started loading');
      };
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        console.log('Audio playback ended');
      };
      
      audioRef.current.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Playback Error",
          description: "Failed to play generated audio",
          variant: "destructive",
        });
      };
      
      await audioRef.current.play();
      console.log('Audio playback started successfully');
      
    } catch (error) {
      console.error('Voice synthesis error:', error);
      toast({
        title: "Voice Synthesis Error",
        description: error instanceof Error ? error.message : 'Failed to generate speech',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [settings, toast]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    speak,
    stopSpeaking,
    isPlaying,
    isLoading,
    settings,
    updateSettings
  };
};