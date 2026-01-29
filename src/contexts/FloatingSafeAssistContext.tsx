/**
 * Context for managing the FloatingSafeAssist widget state
 * Tracks popup visibility, voice session, and voice credits for seamless transitions
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { devLog } from '@/lib/logger';

// Voice minutes by tier (conservative limits)
const VOICE_MINUTES_BY_TIER: Record<string, number> = {
  free: 0,
  pro: 2,
  business: 5
};

interface VoiceCredits {
  tierMinutes: number;      // Minutes from subscription tier
  tierUsed: number;         // Minutes used from tier
  purchasedMinutes: number; // Purchased minutes remaining
  total: number;            // Combined total remaining
  enabled: boolean;         // Can use voice (has any credits)
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
  openPurchaseDialog: () => void;
  refreshCredits: () => Promise<void>;
}

const FloatingSafeAssistContext = createContext<FloatingSafeAssistContextType | null>(null);

export function FloatingSafeAssistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptHandler, setTranscriptHandler] = useState<((text: string) => void) | undefined>();
  const [wasOnAssistPage, setWasOnAssistPage] = useState(false);
  const [voiceCredits, setVoiceCredits] = useState<VoiceCredits>({ 
    tierMinutes: 0, tierUsed: 0, purchasedMinutes: 0, total: 0, enabled: false 
  });
  const [voiceStartTime, setVoiceStartTime] = useState<number | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if on SafeAssist full page
  const isOnAssistPage = location.pathname.includes('/assist');

  // ElevenLabs voice conversation - shared instance
  const conversation = useConversation({
    onConnect: () => {
      devLog.log('Voice connected (shared)');
    },
    onDisconnect: () => {
      devLog.log('Voice disconnected (shared)');
    },
    onMessage: (message: any) => {
      // Handle user transcript
      if (message?.user_transcription_event?.user_transcript && transcriptHandler) {
        transcriptHandler(message.user_transcription_event.user_transcript);
      }
    },
    onError: (error) => {
      devLog.error('Voice error:', error);
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

  // Load voice credits based on tier + purchased
  const loadVoiceCredits = useCallback(async () => {
    if (!user) {
      setVoiceCredits({ tierMinutes: 0, tierUsed: 0, purchasedMinutes: 0, total: 0, enabled: false });
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
      const tierMinutes = VOICE_MINUTES_BY_TIER[tier] || 0;
      
      // Get current month's tier usage
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { data: usage } = await supabase
        .from('safesuite_usage')
        .select('usage_count')
        .eq('user_id', user.id)
        .eq('product', 'safeassist_voice')
        .gte('period_start', periodStart)
        .maybeSingle();

      const tierUsed = usage?.usage_count || 0;
      const tierRemaining = Math.max(0, tierMinutes - tierUsed);
      
      // Get purchased credits remaining
      const { data: purchases } = await supabase
        .from('voice_credit_purchases')
        .select('minutes_remaining')
        .eq('user_id', user.id)
        .gt('minutes_remaining', 0);

      const purchasedMinutes = purchases?.reduce((sum, p) => sum + p.minutes_remaining, 0) || 0;
      
      const total = tierRemaining + purchasedMinutes;
      const enabled = tierMinutes > 0 || purchasedMinutes > 0;
      
      setVoiceCredits({
        tierMinutes,
        tierUsed,
        purchasedMinutes,
        total,
        enabled
      });
    } catch (error) {
      console.error('Error loading voice credits:', error);
    }
  }, [user]);

  useEffect(() => {
    loadVoiceCredits();
  }, [loadVoiceCredits]);

  // Track voice session duration - uses tier first, then purchased
  const trackVoiceUsage = useCallback(async (minutes: number) => {
    if (!user || minutes <= 0) return;
    
    try {
      let remainingToDeduct = minutes;
      const tierRemaining = voiceCredits.tierMinutes - voiceCredits.tierUsed;
      
      // First deduct from tier allowance
      if (tierRemaining > 0) {
        const tierDeduction = Math.min(remainingToDeduct, tierRemaining);
        remainingToDeduct -= tierDeduction;
        
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
        
        const newTierUsed = voiceCredits.tierUsed + tierDeduction;
        
        await supabase
          .from('safesuite_usage')
          .upsert({
            user_id: user.id,
            product: 'safeassist_voice',
            usage_count: newTierUsed,
            period_start: periodStart,
            period_end: periodEnd
          }, {
            onConflict: 'user_id,product,period_start'
          });
      }
      
      // Then deduct from purchased credits (FIFO - oldest first)
      if (remainingToDeduct > 0 && voiceCredits.purchasedMinutes > 0) {
        const { data: purchases } = await supabase
          .from('voice_credit_purchases')
          .select('id, minutes_remaining')
          .eq('user_id', user.id)
          .gt('minutes_remaining', 0)
          .order('created_at', { ascending: true });

        for (const purchase of purchases || []) {
          if (remainingToDeduct <= 0) break;
          
          const deduction = Math.min(remainingToDeduct, purchase.minutes_remaining);
          remainingToDeduct -= deduction;
          
          await supabase
            .from('voice_credit_purchases')
            .update({ minutes_remaining: purchase.minutes_remaining - deduction })
            .eq('id', purchase.id);
        }
      }

      // Refresh credits after usage
      loadVoiceCredits();
    } catch (error) {
      console.error('Error tracking voice usage:', error);
    }
  }, [user, voiceCredits, loadVoiceCredits]);

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
    
    // Check if voice is enabled (has tier or purchased credits)
    if (!voiceCredits.enabled) {
      toast({
        title: "Voice Not Available",
        description: "Upgrade to Pro or Business, or purchase voice minutes.",
        variant: "destructive"
      });
      setShowPurchaseDialog(true);
      return;
    }
    
    // Check if user has remaining credits (tier + purchased)
    if (voiceCredits.total <= 0) {
      toast({
        title: "Voice Minutes Exhausted",
        description: "Purchase more voice minutes to continue.",
        variant: "destructive"
      });
      setShowPurchaseDialog(true);
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

  const openPurchaseDialog = useCallback(() => setShowPurchaseDialog(true), []);
  const refreshCredits = useCallback(() => loadVoiceCredits(), [loadVoiceCredits]);

  // Verify purchase after returning from checkout
  useEffect(() => {
    if (searchParams.get('purchase') === 'success') {
      supabase.functions.invoke('voice-credits-verify').then(({ data }) => {
        if (data?.creditsAdded > 0) {
          toast({
            title: "Purchase Complete!",
            description: `Added ${data.creditsAdded} voice minutes to your account.`,
          });
          loadVoiceCredits();
        }
      });
    }
  }, [searchParams, loadVoiceCredits, toast]);

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
      setOnVoiceTranscript,
      openPurchaseDialog,
      refreshCredits
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

export { VoiceCreditPurchaseDialog } from '@/components/safeassist/VoiceCreditPurchaseDialog';
