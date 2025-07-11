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
      console.log('Starting recording - checking browser support...');
      
      // Check MediaRecorder support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder API not supported in this browser');
      }

      console.log('Browser support confirmed, requesting microphone access...');
      
      // Request microphone access with Firefox-compatible constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      console.log('Microphone access granted, creating MediaRecorder...');

      // Firefox-compatible MediaRecorder options
      let options: MediaRecorderOptions = {};
      
      // Check supported formats and use Firefox-compatible ones
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
        console.log('Using audio/webm;codecs=opus format');
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
        console.log('Using audio/webm format');
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4';
        console.log('Using audio/mp4 format');
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options.mimeType = 'audio/ogg;codecs=opus';
        console.log('Using audio/ogg;codecs=opus format');
      } else {
        console.log('Using default MediaRecorder format');
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      console.log('MediaRecorder created successfully with format:', options.mimeType || 'default');

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        const mimeType = options.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        console.log('Audio blob created:', audioBlob.size, 'bytes, type:', audioBlob.type);
        
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Track stopped:', track.kind);
        });
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        toast({
          title: "Recording Error",
          description: "MediaRecorder encountered an error. Please try again.",
          variant: "destructive",
        });
      };

      // Start recording with smaller timeslice for Firefox compatibility
      mediaRecorder.start(1000); // 1-second timeslices
      setIsRecording(true);
      
      console.log('Recording started successfully');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      
      let errorMessage = "Could not access microphone. Please check permissions.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Microphone access denied. Please allow microphone permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "MediaRecorder not supported in this browser. Please use Chrome, Firefox, or Safari.";
        } else if (error.message.includes('MediaRecorder')) {
          errorMessage = `Browser compatibility issue: ${error.message}`;
        }
      }
      
      toast({
        title: "Recording Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        console.log('MediaRecorder.stop() called');
      }
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      console.log('Processing audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);
      
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log('ArrayBuffer size:', arrayBuffer.byteLength);
      
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      console.log('Base64 audio length:', base64Audio.length);

      // Send to speech-to-text function
      console.log('Sending to speech-to-text function...');
      const { data, error } = await supabase.functions.invoke('ai-voice-stt', {
        body: { audio: base64Audio }
      });

      if (error) {
        console.error('STT function error:', error);
        throw error;
      }

      console.log('STT response:', data);

      if (data.text) {
        console.log('Transcription successful:', data.text);
        onTranscription(data.text);
        toast({
          title: "Speech Recognized",
          description: `Transcribed: "${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"`,
        });
      } else {
        console.warn('No text returned from transcription');
        toast({
          title: "No Speech Detected",
          description: "Could not detect speech in the recording. Please try speaking more clearly.",
          variant: "destructive",
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
        body: { text, voice: 'CwhRBWXzGAHq8TQ4Fs17' } // Roger voice
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