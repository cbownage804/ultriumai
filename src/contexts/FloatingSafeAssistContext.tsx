/**
 * Context for managing the FloatingSafeAssist widget state
 * Tracks popup visibility and voice session for seamless transitions
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FloatingSafeAssistContextType {
  isOpen: boolean;
  isOnAssistPage: boolean;
  openAssistant: () => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  // Voice state shared between popup and full page
  isVoiceActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isConnecting: boolean;
  startVoice: () => Promise<void>;
  stopVoice: () => Promise<void>;
  onVoiceTranscript?: (text: string) => void;
  setOnVoiceTranscript: (handler: ((text: string) => void) | undefined) => void;
}

const FloatingSafeAssistContext = createContext<FloatingSafeAssistContextType | null>(null);

export function FloatingSafeAssistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptHandler, setTranscriptHandler] = useState<((text: string) => void) | undefined>();
  const [wasOnAssistPage, setWasOnAssistPage] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  // Check if on SafeAssist full page
  const isOnAssistPage = location.pathname.includes('/assist');

  // ElevenLabs voice conversation - shared instance
  const conversation = useConversation({
    onConnect: () => {
      console.log('Voice connected (shared)');
    },
    onDisconnect: () => {
      console.log('Voice disconnected (shared)');
    },
    onMessage: (message: any) => {
      // Handle user transcript
      if (message?.user_transcription_event?.user_transcript && transcriptHandler) {
        transcriptHandler(message.user_transcription_event.user_transcript);
      }
    },
    onError: (error) => {
      console.error('Voice error:', error);
      toast({
        title: "Voice Error",
        description: "Connection issue. Please try again.",
        variant: "destructive"
      });
    },
  });

  const isVoiceActive = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;
  const isListening = isVoiceActive && !isSpeaking;

  // Auto-open popup when leaving SafeAssist page
  useEffect(() => {
    if (wasOnAssistPage && !isOnAssistPage) {
      // Just left the assist page, open popup
      setIsOpen(true);
    }
    setWasOnAssistPage(isOnAssistPage);
  }, [isOnAssistPage, wasOnAssistPage]);

  // Auto-close popup when navigating to SafeAssist page
  useEffect(() => {
    if (isOnAssistPage) {
      setIsOpen(false);
    }
  }, [isOnAssistPage]);

  const openAssistant = useCallback(() => {
    if (!isOnAssistPage) {
      setIsOpen(true);
    }
  }, [isOnAssistPage]);

  const closeAssistant = useCallback(() => setIsOpen(false), []);
  const toggleAssistant = useCallback(() => setIsOpen(prev => !prev), []);

  const startVoice = useCallback(async () => {
    if (isConnecting || isVoiceActive) return;
    
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get conversation token from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token');

      if (error || !data?.token) {
        throw new Error(error?.message || 'Voice not configured');
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
    } catch (error: any) {
      console.error('Failed to start voice:', error);
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "Microphone Access Required",
          description: "Please enable microphone access to use voice.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Voice Unavailable",
          description: error.message || "Could not start voice conversation.",
          variant: "destructive"
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, isConnecting, isVoiceActive, toast]);

  const stopVoice = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const setOnVoiceTranscript = useCallback((handler: ((text: string) => void) | undefined) => {
    setTranscriptHandler(() => handler);
  }, []);

  return (
    <FloatingSafeAssistContext.Provider value={{ 
      isOpen, 
      isOnAssistPage,
      openAssistant, 
      closeAssistant, 
      toggleAssistant,
      isVoiceActive,
      isSpeaking,
      isListening,
      isConnecting,
      startVoice,
      stopVoice,
      onVoiceTranscript: transcriptHandler,
      setOnVoiceTranscript
    }}>
      {children}
    </FloatingSafeAssistContext.Provider>
  );
}

export function useFloatingSafeAssist() {
  const context = useContext(FloatingSafeAssistContext);
  if (!context) {
    throw new Error('useFloatingSafeAssist must be used within FloatingSafeAssistProvider');
  }
  return context;
}
