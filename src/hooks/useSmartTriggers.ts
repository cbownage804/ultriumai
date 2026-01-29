import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TriggerCondition {
  type: 'visit_count' | 'time_since_first_visit' | 'action_count' | 'feature_unused';
  threshold: number; // visits, seconds, or action count
}

interface SmartTip {
  id: string;
  featureId: string;
  title: string;
  content: string;
  conditions: TriggerCondition[];
  priority: number; // Higher = more important
}

interface TriggerState {
  featureId: string;
  visitCount: number;
  actionCount: number;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
  tipShown: boolean;
}

// Local storage for unauthenticated users
const LOCAL_TRIGGERS_KEY = 'ultrium_smart_triggers';

export const useSmartTriggers = () => {
  const { user } = useAuth();
  const [triggers, setTriggers] = useState<Map<string, TriggerState>>(new Map());
  const [activeTip, setActiveTip] = useState<SmartTip | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const pendingUpdates = useRef<Map<string, TriggerState>>(new Map());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load triggers from database or localStorage
  const loadTriggers = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await (supabase
          .from('onboarding_triggers') as any)
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        const triggerMap = new Map<string, TriggerState>();
        data?.forEach((item: any) => {
          triggerMap.set(item.feature_id, {
            featureId: item.feature_id,
            visitCount: item.visit_count || 0,
            actionCount: item.action_count || 0,
            firstSeenAt: item.first_seen_at ? new Date(item.first_seen_at) : null,
            lastSeenAt: item.last_seen_at ? new Date(item.last_seen_at) : null,
            tipShown: item.tip_shown || false,
          });
        });
        setTriggers(triggerMap);
      } catch (error) {
        console.error('Failed to load triggers:', error);
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
    setIsLoaded(true);
  }, [user]);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(LOCAL_TRIGGERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const triggerMap = new Map<string, TriggerState>();
        Object.entries(parsed).forEach(([key, value]) => {
          const v = value as TriggerState;
          triggerMap.set(key, {
            ...v,
            firstSeenAt: v.firstSeenAt ? new Date(v.firstSeenAt) : null,
            lastSeenAt: v.lastSeenAt ? new Date(v.lastSeenAt) : null,
          });
        });
        setTriggers(triggerMap);
      }
    } catch (error) {
      console.error('Failed to load triggers from localStorage:', error);
    }
  };

  const saveToLocalStorage = (triggerMap: Map<string, TriggerState>) => {
    try {
      const obj: Record<string, TriggerState> = {};
      triggerMap.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setItem(LOCAL_TRIGGERS_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save triggers to localStorage:', error);
    }
  };

  // Batch update to database (debounced)
  const flushUpdates = useCallback(async () => {
    if (!user || pendingUpdates.current.size === 0) return;

    const updates = Array.from(pendingUpdates.current.values());
    pendingUpdates.current.clear();

    try {
      for (const update of updates) {
        await (supabase
          .from('onboarding_triggers') as any)
          .upsert({
            user_id: user.id,
            trigger_type: 'feature_visit',
            feature_id: update.featureId,
            visit_count: update.visitCount,
            action_count: update.actionCount,
            first_seen_at: update.firstSeenAt?.toISOString() || null,
            last_seen_at: update.lastSeenAt?.toISOString() || null,
            tip_shown: update.tipShown,
          }, {
            onConflict: 'user_id,trigger_type,feature_id',
          });
      }
    } catch (error) {
      console.error('Failed to flush trigger updates:', error);
    }
  }, [user]);

  // Schedule a debounced update
  const scheduleUpdate = useCallback((featureId: string, state: TriggerState) => {
    pendingUpdates.current.set(featureId, state);
    
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      flushUpdates();
    }, 2000); // Debounce for 2 seconds
  }, [flushUpdates]);

  // Track a feature visit
  const trackFeatureVisit = useCallback((featureId: string) => {
    const existing = triggers.get(featureId);
    const now = new Date();
    
    const newState: TriggerState = {
      featureId,
      visitCount: (existing?.visitCount || 0) + 1,
      actionCount: existing?.actionCount || 0,
      firstSeenAt: existing?.firstSeenAt || now,
      lastSeenAt: now,
      tipShown: existing?.tipShown || false,
    };

    const newTriggers = new Map(triggers);
    newTriggers.set(featureId, newState);
    setTriggers(newTriggers);
    saveToLocalStorage(newTriggers);
    scheduleUpdate(featureId, newState);

    return newState;
  }, [triggers, scheduleUpdate]);

  // Track an action within a feature
  const trackFeatureAction = useCallback((featureId: string) => {
    const existing = triggers.get(featureId);
    const now = new Date();
    
    const newState: TriggerState = {
      featureId,
      visitCount: existing?.visitCount || 1,
      actionCount: (existing?.actionCount || 0) + 1,
      firstSeenAt: existing?.firstSeenAt || now,
      lastSeenAt: now,
      tipShown: existing?.tipShown || false,
    };

    const newTriggers = new Map(triggers);
    newTriggers.set(featureId, newState);
    setTriggers(newTriggers);
    saveToLocalStorage(newTriggers);
    scheduleUpdate(featureId, newState);

    return newState;
  }, [triggers, scheduleUpdate]);

  // Check if a tip should be shown based on conditions
  const shouldShowTip = useCallback((tip: SmartTip): boolean => {
    const state = triggers.get(tip.featureId);
    
    // Never show if already shown
    if (state?.tipShown) return false;

    // Check all conditions
    return tip.conditions.every((condition) => {
      switch (condition.type) {
        case 'visit_count':
          return (state?.visitCount || 0) >= condition.threshold;
        
        case 'time_since_first_visit':
          if (!state?.firstSeenAt) return false;
          const secondsSinceFirst = (Date.now() - state.firstSeenAt.getTime()) / 1000;
          return secondsSinceFirst >= condition.threshold;
        
        case 'action_count':
          return (state?.actionCount || 0) >= condition.threshold;
        
        case 'feature_unused':
          // Show tip if visited X times but never used
          return (state?.visitCount || 0) >= condition.threshold && 
                 (state?.actionCount || 0) === 0;
        
        default:
          return false;
      }
    });
  }, [triggers]);

  // Evaluate multiple tips and return the highest priority one to show
  const evaluateTips = useCallback((tips: SmartTip[]): SmartTip | null => {
    const eligibleTips = tips.filter(shouldShowTip);
    if (eligibleTips.length === 0) return null;
    
    // Sort by priority (highest first)
    eligibleTips.sort((a, b) => b.priority - a.priority);
    return eligibleTips[0];
  }, [shouldShowTip]);

  // Mark a tip as shown
  const markTipShown = useCallback(async (featureId: string) => {
    const existing = triggers.get(featureId);
    
    const newState: TriggerState = {
      featureId,
      visitCount: existing?.visitCount || 0,
      actionCount: existing?.actionCount || 0,
      firstSeenAt: existing?.firstSeenAt || null,
      lastSeenAt: existing?.lastSeenAt || null,
      tipShown: true,
    };

    const newTriggers = new Map(triggers);
    newTriggers.set(featureId, newState);
    setTriggers(newTriggers);
    saveToLocalStorage(newTriggers);

    if (user) {
      try {
        await (supabase
          .from('onboarding_triggers') as any)
          .upsert({
            user_id: user.id,
            trigger_type: 'feature_visit',
            feature_id: featureId,
            tip_shown: true,
          }, {
            onConflict: 'user_id,trigger_type,feature_id',
          });
      } catch (error) {
        console.error('Failed to mark tip shown:', error);
      }
    }

    setActiveTip(null);
  }, [user, triggers]);

  // Get trigger state for a feature
  const getTriggerState = useCallback((featureId: string): TriggerState | null => {
    return triggers.get(featureId) || null;
  }, [triggers]);

  // Reset all triggers
  const resetAllTriggers = useCallback(async () => {
    setTriggers(new Map());
    setActiveTip(null);
    localStorage.removeItem(LOCAL_TRIGGERS_KEY);

    if (user) {
      try {
        await (supabase
          .from('onboarding_triggers') as any)
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to reset triggers:', error);
      }
    }
  }, [user]);

  // Load on mount
  useEffect(() => {
    loadTriggers();
  }, [loadTriggers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    isLoaded,
    activeTip,
    setActiveTip,
    trackFeatureVisit,
    trackFeatureAction,
    shouldShowTip,
    evaluateTips,
    markTipShown,
    getTriggerState,
    resetAllTriggers,
  };
};

// Predefined smart tips for features
export const SMART_TIPS: SmartTip[] = [
  {
    id: 'password-generator-unused',
    featureId: 'safesuite-password-check',
    title: 'Try the Password Generator',
    content: 'You\'ve checked a few passwords. Did you know you can generate strong, random passwords with one click?',
    conditions: [
      { type: 'visit_count', threshold: 3 },
      { type: 'feature_unused', threshold: 3 },
    ],
    priority: 2,
  },
  {
    id: 'dark-web-scan-reminder',
    featureId: 'safesuite-dark-web',
    title: 'Check the Dark Web',
    content: 'You haven\'t scanned for breaches yet. Run a dark web scan to see if your credentials have been leaked.',
    conditions: [
      { type: 'visit_count', threshold: 2 },
      { type: 'action_count', threshold: 0 },
    ],
    priority: 3,
  },
  {
    id: 'gpt-template-suggestion',
    featureId: 'ai-studio-create',
    title: 'Start with a Template',
    content: 'Building a GPT from scratch? Check out our template library for pre-built prompts and configurations.',
    conditions: [
      { type: 'visit_count', threshold: 2 },
      { type: 'time_since_first_visit', threshold: 60 }, // 1 minute
    ],
    priority: 1,
  },
  {
    id: 'vanguard-agent-install',
    featureId: 'vanguard-devices',
    title: 'Install Vanguard Agents',
    content: 'You\'re viewing the devices list but haven\'t installed any agents. Deploy agents to start monitoring.',
    conditions: [
      { type: 'visit_count', threshold: 3 },
      { type: 'action_count', threshold: 0 },
    ],
    priority: 4,
  },
  {
    id: 'explore-analytics',
    featureId: 'dashboard-analytics',
    title: 'Explore Your Analytics',
    content: 'You\'ve been using the platform for a while. Check out the analytics to see your security trends.',
    conditions: [
      { type: 'time_since_first_visit', threshold: 300 }, // 5 minutes
      { type: 'visit_count', threshold: 1 },
    ],
    priority: 1,
  },
];
