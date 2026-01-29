import { useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingPersistence } from './useOnboardingPersistence';

export type Variant = 'A' | 'B' | 'C';

interface ABTestConfig {
  testId: string;
  variants: Variant[];
  weights?: number[]; // Optional weights for each variant (defaults to equal)
}

interface VariantContent<T> {
  A: T;
  B: T;
  C?: T;
}

// Hash function for deterministic variant assignment
const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

export const useOnboardingABTest = () => {
  const { user } = useAuth();
  const { getVariant, trackEvent } = useOnboardingPersistence();

  // Get a stable user identifier (user ID or generated anonymous ID)
  const userId = useMemo(() => {
    if (user?.id) return user.id;
    
    // Generate and persist an anonymous ID
    let anonId = localStorage.getItem('ultrium_anon_id');
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem('ultrium_anon_id', anonId);
    }
    return anonId;
  }, [user]);

  // Deterministically assign a variant based on user ID and test ID
  const assignVariant = useCallback((config: ABTestConfig): Variant => {
    const { testId, variants, weights } = config;
    
    // Check if user already has a variant assigned
    const existingVariant = getVariant('tour', testId) as Variant | null;
    if (existingVariant && variants.includes(existingVariant)) {
      return existingVariant;
    }

    // Generate a deterministic hash
    const hash = hashString(`${userId}:${testId}`);
    
    if (weights && weights.length === variants.length) {
      // Weighted assignment
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const normalizedWeights = weights.map(w => w / totalWeight);
      const threshold = (hash % 10000) / 10000;
      
      let cumulative = 0;
      for (let i = 0; i < variants.length; i++) {
        cumulative += normalizedWeights[i];
        if (threshold < cumulative) {
          return variants[i];
        }
      }
      return variants[variants.length - 1];
    } else {
      // Equal distribution
      const index = hash % variants.length;
      return variants[index];
    }
  }, [userId, getVariant]);

  // Get content for the user's variant
  const getVariantContent = useCallback(<T>(
    config: ABTestConfig,
    content: VariantContent<T>
  ): { variant: Variant; content: T } => {
    const variant = assignVariant(config);
    return {
      variant,
      content: content[variant] || content.A,
    };
  }, [assignVariant]);

  // Track conversion for A/B test
  const trackConversion = useCallback((testId: string, variant: Variant, conversionType: string) => {
    trackEvent({
      event_type: 'tour_completed',
      item_id: testId,
      variant,
      action_taken: 'complete',
      metadata: { conversion_type: conversionType },
    });
  }, [trackEvent]);

  // Track engagement metrics
  const trackEngagement = useCallback((
    testId: string,
    variant: Variant,
    engagementMs: number,
    action: 'click' | 'dismiss' | 'complete' | 'skip'
  ) => {
    trackEvent({
      event_type: 'tip_clicked',
      item_id: testId,
      variant,
      engagement_ms: engagementMs,
      action_taken: action,
    });
  }, [trackEvent]);

  return {
    assignVariant,
    getVariantContent,
    trackConversion,
    trackEngagement,
  };
};

// Pre-defined A/B tests for onboarding
export const ONBOARDING_TESTS: Record<string, ABTestConfig> = {
  welcomeTourStyle: {
    testId: 'welcome-tour-style',
    variants: ['A', 'B'],
    weights: [0.5, 0.5],
  },
  tipDisplayMode: {
    testId: 'tip-display-mode',
    variants: ['A', 'B', 'C'],
    weights: [0.4, 0.4, 0.2],
  },
  checklistPosition: {
    testId: 'checklist-position',
    variants: ['A', 'B'],
    weights: [0.5, 0.5],
  },
};

// Variant content examples
export const WELCOME_TOUR_VARIANTS: VariantContent<{ title: string; description: string; style: 'minimal' | 'detailed' }> = {
  A: {
    title: 'Welcome to Ultrium',
    description: 'Let\'s take a quick tour of the platform.',
    style: 'minimal',
  },
  B: {
    title: 'Welcome to Your Security Command Center',
    description: 'We\'ll guide you through each feature to help you get the most out of Ultrium. This tour takes about 2 minutes.',
    style: 'detailed',
  },
};

export const TIP_DISPLAY_VARIANTS: VariantContent<{ 
  showIcon: boolean; 
  showProgress: boolean; 
  animationStyle: 'subtle' | 'prominent' | 'playful' 
}> = {
  A: {
    showIcon: true,
    showProgress: false,
    animationStyle: 'subtle',
  },
  B: {
    showIcon: true,
    showProgress: true,
    animationStyle: 'prominent',
  },
  C: {
    showIcon: false,
    showProgress: true,
    animationStyle: 'playful',
  },
};
