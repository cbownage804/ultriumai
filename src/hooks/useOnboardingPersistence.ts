import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ProgressType = 'tour' | 'tip' | 'tutorial' | 'checklist';
export type EventType = 'tip_shown' | 'tip_clicked' | 'tip_dismissed' | 'tour_started' | 'tour_completed' | 'tour_step' | 'tour_skipped' | 'tutorial_started' | 'tutorial_completed';
export type ActionType = 'dismiss' | 'next' | 'skip' | 'complete' | 'interact' | 'click';

interface OnboardingProgress {
  id: string;
  progress_type: ProgressType;
  item_id: string;
  completed: boolean;
  completed_at: string | null;
  dismissed: boolean;
  step_reached: number;
  variant: string | null;
  metadata: Record<string, unknown>;
}

interface AnalyticsEvent {
  event_type: EventType;
  item_id: string;
  variant?: string;
  step_number?: number;
  engagement_ms?: number;
  action_taken?: ActionType;
  metadata?: Record<string, unknown>;
}

// Local storage fallback for unauthenticated users
const LOCAL_STORAGE_KEY = 'ultrium_onboarding_progress';

export const useOnboardingPersistence = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Map<string, OnboardingProgress>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate a unique key for an item
  const getItemKey = (type: ProgressType, itemId: string) => `${type}:${itemId}`;

  // Load progress from database or localStorage
  const loadProgress = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await (supabase
          .from('onboarding_progress') as any)
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        const progressMap = new Map<string, OnboardingProgress>();
        data?.forEach((item: any) => {
          progressMap.set(getItemKey(item.progress_type as ProgressType, item.item_id), item as OnboardingProgress);
        });
        setProgress(progressMap);
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
        loadFromLocalStorage();
      }
    } else {
      loadFromLocalStorage();
    }
    setIsLoaded(true);
  }, [user]);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const progressMap = new Map<string, OnboardingProgress>();
        Object.entries(parsed).forEach(([key, value]) => {
          progressMap.set(key, value as OnboardingProgress);
        });
        setProgress(progressMap);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  };

  const saveToLocalStorage = (progressMap: Map<string, OnboardingProgress>) => {
    try {
      const obj: Record<string, OnboardingProgress> = {};
      progressMap.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  // Check if an item has been seen/completed
  const hasCompleted = useCallback((type: ProgressType, itemId: string): boolean => {
    const key = getItemKey(type, itemId);
    const item = progress.get(key);
    return item?.completed || item?.dismissed || false;
  }, [progress]);

  // Get current step for multi-step items
  const getStepReached = useCallback((type: ProgressType, itemId: string): number => {
    const key = getItemKey(type, itemId);
    return progress.get(key)?.step_reached || 0;
  }, [progress]);

  // Get variant for A/B testing
  const getVariant = useCallback((type: ProgressType, itemId: string): string | null => {
    const key = getItemKey(type, itemId);
    return progress.get(key)?.variant || null;
  }, [progress]);

  // Mark item as completed
  const markCompleted = useCallback(async (
    type: ProgressType,
    itemId: string,
    variant?: string,
    metadata?: Record<string, unknown>
  ) => {
    const key = getItemKey(type, itemId);
    const existing = progress.get(key);
    
    const newProgress: OnboardingProgress = {
      id: existing?.id || crypto.randomUUID(),
      progress_type: type,
      item_id: itemId,
      completed: true,
      completed_at: new Date().toISOString(),
      dismissed: false,
      step_reached: existing?.step_reached || 0,
      variant: variant || existing?.variant || null,
      metadata: { ...existing?.metadata, ...metadata },
    };

    const newProgressMap = new Map(progress);
    newProgressMap.set(key, newProgress);
    setProgress(newProgressMap);
    saveToLocalStorage(newProgressMap);

    if (user) {
      try {
        await (supabase
          .from('onboarding_progress') as any)
          .upsert({
            user_id: user.id,
            progress_type: type,
            item_id: itemId,
            completed: true,
            completed_at: new Date().toISOString(),
            variant: variant || null,
            metadata: metadata || {},
          }, {
            onConflict: 'user_id,progress_type,item_id',
          });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  }, [user, progress]);

  // Mark item as dismissed
  const markDismissed = useCallback(async (
    type: ProgressType,
    itemId: string,
    variant?: string
  ) => {
    const key = getItemKey(type, itemId);
    const existing = progress.get(key);
    
    const newProgress: OnboardingProgress = {
      id: existing?.id || crypto.randomUUID(),
      progress_type: type,
      item_id: itemId,
      completed: false,
      completed_at: null,
      dismissed: true,
      step_reached: existing?.step_reached || 0,
      variant: variant || existing?.variant || null,
      metadata: existing?.metadata || {},
    };

    const newProgressMap = new Map(progress);
    newProgressMap.set(key, newProgress);
    setProgress(newProgressMap);
    saveToLocalStorage(newProgressMap);

    if (user) {
      try {
        await (supabase
          .from('onboarding_progress') as any)
          .upsert({
            user_id: user.id,
            progress_type: type,
            item_id: itemId,
            dismissed: true,
            variant: variant || null,
          }, {
            onConflict: 'user_id,progress_type,item_id',
          });
      } catch (error) {
        console.error('Failed to save dismissal:', error);
      }
    }
  }, [user, progress]);

  // Update step progress
  const updateStepProgress = useCallback(async (
    type: ProgressType,
    itemId: string,
    step: number,
    variant?: string
  ) => {
    const key = getItemKey(type, itemId);
    const existing = progress.get(key);
    
    const newProgress: OnboardingProgress = {
      id: existing?.id || crypto.randomUUID(),
      progress_type: type,
      item_id: itemId,
      completed: existing?.completed || false,
      completed_at: existing?.completed_at || null,
      dismissed: existing?.dismissed || false,
      step_reached: step,
      variant: variant || existing?.variant || null,
      metadata: existing?.metadata || {},
    };

    const newProgressMap = new Map(progress);
    newProgressMap.set(key, newProgress);
    setProgress(newProgressMap);
    saveToLocalStorage(newProgressMap);

    if (user) {
      try {
        await (supabase
          .from('onboarding_progress') as any)
          .upsert({
            user_id: user.id,
            progress_type: type,
            item_id: itemId,
            step_reached: step,
            variant: variant || null,
          }, {
            onConflict: 'user_id,progress_type,item_id',
          });
      } catch (error) {
        console.error('Failed to update step:', error);
      }
    }
  }, [user, progress]);

  // Track analytics event
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!user) return;

    try {
      await (supabase
        .from('onboarding_analytics') as any)
        .insert({
          user_id: user.id,
          event_type: event.event_type,
          item_id: event.item_id,
          variant: event.variant || null,
          step_number: event.step_number || null,
          engagement_ms: event.engagement_ms || null,
          action_taken: event.action_taken || null,
          metadata: event.metadata || {},
        });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [user]);

  // Reset all progress (for testing/settings)
  const resetAllProgress = useCallback(async () => {
    setProgress(new Map());
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    if (user) {
      try {
        await (supabase
          .from('onboarding_progress') as any)
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Failed to reset progress:', error);
      }
    }
  }, [user]);

  // Load on mount and when user changes
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    isLoaded,
    hasCompleted,
    getStepReached,
    getVariant,
    markCompleted,
    markDismissed,
    updateStepProgress,
    trackEvent,
    resetAllProgress,
  };
};
