import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceControlsProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({ 
  onTranscription, 
  disabled = false 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send to speech-to-text function
      const { data, error } = await supabase.functions.invoke('ai-voice-stt', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data.text) {
        onTranscription(data.text);
        toast({
          title: "Speech Recognized",
          description: `Transcribed: "${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"`,
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Speech Recognition Failed",
        description: "Could not process audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  const speakText = async (text: string) => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);

      // Send to ElevenLabs text-to-speech function
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, voice: '9BWtsMINqrJLrRacOk9x' } // Aria voice
      });

      if (error) throw error;

      // Play the audio
      const audioData = `data:audio/mp3;base64,${data.audioContent}`;
      const audio = new Audio(audioData);
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        throw new Error('Audio playback failed');
      };

      await audio.play();
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsPlaying(false);
      toast({
        title: "Text-to-Speech Failed",
        description: "Could not generate speech. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={isRecording ? "destructive" : "outline"}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        {isRecording ? (
          <>
            <MicOff className="h-4 w-4" />
            Stop
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Record
          </>
        )}
      </Button>
      
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Recording...
        </div>
      )}
      
      {isPlaying && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Volume2 className="h-4 w-4 animate-pulse" />
          Playing...
        </div>
      )}
    </div>
  );
};

export default VoiceControls;