/**
 * VoiceButton - ElevenLabs voice interaction for SafeAssist
 */

import { useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { devLog } from '@/lib/logger';

interface VoiceButtonProps {
  onTranscript?: (text: string) => void;
  onAgentResponse?: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceButton({ 
  onTranscript, 
  onAgentResponse,
  disabled = false,
  className 
}: VoiceButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      devLog.log('Voice connected');
    },
    onDisconnect: () => {
      devLog.log('Voice disconnected');
    },
    onMessage: (message: any) => {
      // Handle user transcript
      if (message?.user_transcription_event?.user_transcript && onTranscript) {
        onTranscript(message.user_transcription_event.user_transcript);
      }
      // Handle agent response
      if (message?.agent_response_event?.agent_response && onAgentResponse) {
        onAgentResponse(message.agent_response_event.agent_response);
      }
    },
    onError: (error) => {
      devLog.error('Voice error:', error);
      toast({
        title: "Voice Error",
        description: "Failed to connect to voice assistant. Please try again.",
        variant: "destructive"
      });
    },
  });

  const startConversation = useCallback(async () => {
    if (disabled) return;
    
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get conversation token from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token');

      if (error || !data?.token) {
        throw new Error(error?.message || 'No token received');
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
    } catch (error: any) {
      console.error('Failed to start voice conversation:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "Microphone Access Required",
          description: "Please enable microphone access to use voice features.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Voice Connection Failed",
          description: error.message || "Could not start voice conversation.",
          variant: "destructive"
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, disabled, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isActive = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={isActive ? stopConversation : startConversation}
      disabled={disabled || isConnecting}
      className={cn(
        "relative transition-all duration-300",
        isActive && "border-cyan-500 bg-cyan-500/20 text-cyan-400",
        isSpeaking && "border-emerald-500 bg-emerald-500/20 text-emerald-400",
        className
      )}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isActive ? (
        isSpeaking ? (
          <Volume2 className="h-4 w-4 animate-pulse" />
        ) : (
          <MicOff className="h-4 w-4" />
        )
      ) : (
        <Mic className="h-4 w-4" />
      )}
      
      {/* Pulse animation when listening */}
      {isActive && !isSpeaking && (
        <span className="absolute inset-0 rounded-md animate-ping bg-cyan-500/20" />
      )}
    </Button>
  );
}
