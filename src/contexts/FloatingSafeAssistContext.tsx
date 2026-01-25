/**
 * Context for managing the FloatingSafeAssist widget state
 * Tracks popup visibility, voice session, and voice credits for seamless transitions
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

// Voice minutes by tier
const VOICE_MINUTES_BY_TIER: Record<string, number> = {
  free: 0,
  pro: 10,
  business: 30
};

interface VoiceCredits {
  total: number;
  used: number;
  remaining: number;
  enabled: boolean;
}

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
  voiceCredits: VoiceCredits;
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
  const [voiceCredits, setVoiceCredits] = useState<VoiceCredits>({ total: 0, used: 0, remaining: 0, enabled: false });
  const [voiceStartTime, setVoiceStartTime] = useState<number | null>(null);
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

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

  // Load voice credits based on tier
  const loadVoiceCredits = useCallback(async () => {
    if (!user) {
      setVoiceCredits({ total: 0, used: 0, remaining: 0, enabled: false });
      return;
    }
    
    try {
      // Get user's tier
      const { data: subscription } = await supabase
        .from('safesuite_subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      const tier = subscription?.tier || 'free';
      const totalMinutes = VOICE_MINUTES_BY_TIER[tier] || 0;
      const enabled = totalMinutes > 0;
      
      // Get current month's usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: usage } = await supabase
        .from('safesuite_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('product', 'safeassist_voice')
        .gte('period_start', periodStart)
        .maybeSingle();

      const usedMinutes = usage?.usage_count || 0;
      
      setVoiceCredits({
        total: totalMinutes,
        used: usedMinutes,
        remaining: Math.max(0, totalMinutes - usedMinutes),
        enabled
      });
    } catch (error) {
      console.error('Error loading voice credits:', error);
    }
  }, [user]);

  useEffect(() => {
    loadVoiceCredits();
  }, [loadVoiceCredits]);

  // Track voice session duration
  const trackVoiceUsage = useCallback(async (minutes: number) => {
    if (!user || minutes <= 0) return;
    
    try {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      
      const newUsed = voiceCredits.used + minutes;
      
      await supabase
        .from('safesuite_usage')
        .upsert({
          user_id: user.id,
          product: 'safeassist_voice',
          usage_count: newUsed,
          period_start: periodStart,
          period_end: periodEnd
        }, {
          onConflict: 'user_id,product,period_start'
        });

      setVoiceCredits(prev => ({
        ...prev,
        used: newUsed,
        remaining: Math.max(0, prev.total - newUsed)
      }));
    } catch (error) {
      console.error('Error tracking voice usage:', error);
    }
  }, [user, voiceCredits.used]);

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

  // Track usage when voice session ends
  useEffect(() => {
    if (isVoiceActive && !voiceStartTime) {
      setVoiceStartTime(Date.now());
    } else if (!isVoiceActive && voiceStartTime) {
      const duration = Date.now() - voiceStartTime;
      const minutes = Math.ceil(duration / 60000); // Round up to nearest minute
      trackVoiceUsage(minutes);
      setVoiceStartTime(null);
    }
  }, [isVoiceActive, voiceStartTime, trackVoiceUsage]);

  const openAssistant = useCallback(() => {
    if (!isOnAssistPage) {
      setIsOpen(true);
    }
  }, [isOnAssistPage]);

  const closeAssistant = useCallback(() => setIsOpen(false), []);
  const toggleAssistant = useCallback(() => setIsOpen(prev => !prev), []);

  const startVoice = useCallback(async () => {
    if (isConnecting || isVoiceActive) return;
    
    // Check if voice is enabled for this tier
    if (!voiceCredits.enabled) {
      toast({
        title: "Voice Not Available",
        description: "Upgrade to Pro or Business to use voice conversations.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user has remaining credits
    if (voiceCredits.remaining <= 0) {
      toast({
        title: "Voice Minutes Exhausted",
        description: `You've used all ${voiceCredits.total} voice minutes this month.`,
        variant: "destructive"
      });
      return;
    }
    
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
  }, [conversation, isConnecting, isVoiceActive, toast, voiceCredits]);

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
      voiceCredits,
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
