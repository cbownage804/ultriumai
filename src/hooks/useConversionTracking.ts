/**
 * Conversion Funnel Tracking Hook
 * Tracks user journey through key conversion funnels
 */

import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { devLog } from '@/lib/logger';

// Funnel definitions with ordered steps
export const FUNNELS = {
  signup: {
    name: 'signup',
    steps: ['landing_view', 'signup_click', 'signup_form_view', 'signup_submit', 'signup_complete', 'onboarding_start', 'onboarding_complete'],
  },
  pricing: {
    name: 'pricing',
    steps: ['pricing_view', 'plan_select', 'checkout_start', 'payment_submit', 'subscription_active'],
  },
  demo_request: {
    name: 'demo_request',
    steps: ['product_view', 'demo_click', 'demo_form_view', 'demo_submit', 'demo_scheduled'],
  },
  ai_studio: {
    name: 'ai_studio',
    steps: ['ai_studio_view', 'gpt_create_click', 'gpt_configure', 'gpt_publish', 'gpt_first_message'],
  },
  safesuite: {
    name: 'safesuite',
    steps: ['safesuite_view', 'feature_explore', 'trial_start', 'trial_active', 'subscription_convert'],
  },
  vanguard: {
    name: 'vanguard',
    steps: ['vanguard_view', 'feature_explore', 'agent_download', 'agent_install', 'agent_active'],
  },
} as const;

export type FunnelName = keyof typeof FUNNELS;
export type FunnelStep<T extends FunnelName> = typeof FUNNELS[T]['steps'][number];

// Generate unique session ID
const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('conversion_session_id');
  if (stored) return stored;
  
  const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  sessionStorage.setItem('conversion_session_id', newId);
  return newId;
};

export interface ConversionGoal {
  name: string;
  value?: number;
  product?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export const useConversionTracking = () => {
  const { user } = useAuth();
  const sessionId = useRef(generateSessionId());

  const trackFunnelStep = useCallback(async <T extends FunnelName>(
    funnelName: T,
    stepName: FunnelStep<T>,
    options?: {
      product?: string;
      metadata?: Record<string, unknown>;
    }
  ) => {
    const funnel = FUNNELS[funnelName];
    const stepOrder = (funnel.steps as readonly string[]).indexOf(stepName as string);
    
    if (stepOrder === -1) {
      devLog.warn(`Invalid step "${stepName}" for funnel "${funnelName}"`);
      return;
    }

    try {
      // Use type assertion for new tables not yet in generated types
      const { error } = await (supabase as any)
        .from('funnel_events')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId.current,
          funnel_name: funnelName,
          step_name: stepName as string,
          step_order: stepOrder,
          product: options?.product || null,
          metadata: options?.metadata || {},
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });

      if (error) {
        devLog.error('Funnel tracking error:', error);
      } else {
        devLog.log(`Funnel: ${funnelName} → ${stepName} (step ${stepOrder + 1})`);
      }
    } catch (err) {
      devLog.error('Failed to track funnel step:', err);
    }
  }, [user]);

  const trackConversion = useCallback(async (goal: ConversionGoal) => {
    try {
      // Use type assertion for new tables not yet in generated types
      const { error } = await (supabase as any)
        .from('conversion_goals')
        .insert({
          user_id: user?.id || null,
          session_id: sessionId.current,
          goal_name: goal.name,
          goal_value: goal.value || 0,
          product: goal.product || null,
          source: goal.source || null,
          metadata: goal.metadata || {},
        });

      if (error) {
        devLog.error('Conversion tracking error:', error);
      } else {
        devLog.log(`Conversion: ${goal.name} ($${goal.value || 0})`);
      }
    } catch (err) {
      devLog.error('Failed to track conversion:', err);
    }
  }, [user]);

  // Common conversion shortcuts
  const trackSignupStart = useCallback(() => {
    trackFunnelStep('signup', 'signup_click');
  }, [trackFunnelStep]);

  const trackSignupComplete = useCallback((method: string) => {
    trackFunnelStep('signup', 'signup_complete', { metadata: { method } });
    trackConversion({ name: 'signup', source: method });
  }, [trackFunnelStep, trackConversion]);

  const trackPricingView = useCallback((product?: string) => {
    trackFunnelStep('pricing', 'pricing_view', { product });
  }, [trackFunnelStep]);

  const trackPlanSelect = useCallback((plan: string, product?: string) => {
    trackFunnelStep('pricing', 'plan_select', { product, metadata: { plan } });
  }, [trackFunnelStep]);

  const trackCheckoutStart = useCallback((plan: string, amount: number, product?: string) => {
    trackFunnelStep('pricing', 'checkout_start', { product, metadata: { plan, amount } });
  }, [trackFunnelStep]);

  const trackSubscriptionActive = useCallback((plan: string, amount: number, product?: string) => {
    trackFunnelStep('pricing', 'subscription_active', { product, metadata: { plan } });
    trackConversion({ name: 'subscription', value: amount, product, source: plan });
  }, [trackFunnelStep, trackConversion]);

  const trackDemoRequest = useCallback((product?: string) => {
    trackFunnelStep('demo_request', 'demo_submit', { product });
    trackConversion({ name: 'demo_request', product });
  }, [trackFunnelStep, trackConversion]);

  const trackProductView = useCallback((product: string) => {
    if (product === 'ai_studio') {
      trackFunnelStep('ai_studio', 'ai_studio_view', { product });
    } else if (product === 'safesuite') {
      trackFunnelStep('safesuite', 'safesuite_view', { product });
    } else if (product === 'vanguard') {
      trackFunnelStep('vanguard', 'vanguard_view', { product });
    }
  }, [trackFunnelStep]);

  return {
    trackFunnelStep,
    trackConversion,
    trackSignupStart,
    trackSignupComplete,
    trackPricingView,
    trackPlanSelect,
    trackCheckoutStart,
    trackSubscriptionActive,
    trackDemoRequest,
    trackProductView,
    sessionId: sessionId.current,
  };
};

export default useConversionTracking;
