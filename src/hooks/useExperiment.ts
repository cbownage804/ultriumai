import { useState, useEffect, useCallback, useMemo } from 'react';

interface Experiment {
  id: string;
  name: string;
  variants: string[];
  weights?: number[]; // Optional weights for each variant (default: equal distribution)
}

interface ExperimentResult {
  variant: string;
  isControl: boolean;
  experimentId: string;
}

interface UseExperimentOptions {
  experiments: Experiment[];
  userId?: string;
  onExposure?: (experimentId: string, variant: string) => void;
  storageKey?: string;
}

/**
 * Deterministic hash function for consistent variant assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Select a variant based on userId and experiment configuration
 */
function selectVariant(experiment: Experiment, userId: string): string {
  const hash = hashString(`${experiment.id}-${userId}`);
  const weights = experiment.weights || experiment.variants.map(() => 1 / experiment.variants.length);
  
  // Normalize weights
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);
  
  // Select variant based on hash
  const randomValue = (hash % 1000) / 1000;
  let cumulativeWeight = 0;
  
  for (let i = 0; i < experiment.variants.length; i++) {
    cumulativeWeight += normalizedWeights[i];
    if (randomValue < cumulativeWeight) {
      return experiment.variants[i];
    }
  }
  
  return experiment.variants[0]; // Fallback to first variant
}

/**
 * Generate a random user ID for anonymous users
 */
function generateUserId(): string {
  return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * A/B Testing hook for conversion optimization.
 * Provides deterministic variant assignment based on user ID.
 * 
 * @example
 * ```tsx
 * const { getVariant, trackConversion } = useExperiment({
 *   experiments: [
 *     { id: 'pricing-cta', name: 'Pricing CTA', variants: ['control', 'variant-a', 'variant-b'] },
 *     { id: 'hero-layout', name: 'Hero Layout', variants: ['default', 'minimal'], weights: [0.7, 0.3] },
 *   ],
 *   onExposure: (experimentId, variant) => {
 *     analytics.track('experiment_exposure', { experimentId, variant });
 *   },
 * });
 * 
 * const ctaVariant = getVariant('pricing-cta');
 * if (ctaVariant.variant === 'variant-a') {
 *   // Show variant A
 * }
 * ```
 */
export function useExperiment({
  experiments,
  userId: providedUserId,
  onExposure,
  storageKey = 'ultriumai-experiments',
}: UseExperimentOptions) {
  const [userId, setUserId] = useState<string>(() => {
    if (providedUserId) return providedUserId;
    
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${storageKey}-userId`);
      if (stored) return stored;
      
      const newId = generateUserId();
      localStorage.setItem(`${storageKey}-userId`, newId);
      return newId;
    }
    
    return generateUserId();
  });

  const [exposedExperiments, setExposedExperiments] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`${storageKey}-exposed`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  // Update userId if provided externally
  useEffect(() => {
    if (providedUserId && providedUserId !== userId) {
      setUserId(providedUserId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${storageKey}-userId`, providedUserId);
      }
    }
  }, [providedUserId, userId, storageKey]);

  // Persist exposed experiments
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${storageKey}-exposed`, JSON.stringify([...exposedExperiments]));
    }
  }, [exposedExperiments, storageKey]);

  // Pre-compute all variant assignments
  const variantAssignments = useMemo(() => {
    const assignments: Record<string, ExperimentResult> = {};
    
    for (const experiment of experiments) {
      const variant = selectVariant(experiment, userId);
      assignments[experiment.id] = {
        variant,
        isControl: variant === experiment.variants[0],
        experimentId: experiment.id,
      };
    }
    
    return assignments;
  }, [experiments, userId]);

  /**
   * Get the variant assignment for an experiment
   */
  const getVariant = useCallback((experimentId: string): ExperimentResult => {
    const result = variantAssignments[experimentId];
    
    if (!result) {
      console.warn(`[useExperiment] Unknown experiment: ${experimentId}`);
      return { variant: 'control', isControl: true, experimentId };
    }
    
    // Track exposure (only once per session)
    if (!exposedExperiments.has(experimentId)) {
      setExposedExperiments(prev => new Set([...prev, experimentId]));
      
      if (onExposure) {
        onExposure(experimentId, result.variant);
      }
      
      // Send to analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'experiment_exposure', {
          experiment_id: experimentId,
          variant: result.variant,
        });
      }
    }
    
    return result;
  }, [variantAssignments, exposedExperiments, onExposure]);

  /**
   * Track a conversion event for an experiment
   */
  const trackConversion = useCallback((experimentId: string, conversionType: string = 'conversion', value?: number) => {
    const result = variantAssignments[experimentId];
    
    if (!result) {
      console.warn(`[useExperiment] Cannot track conversion for unknown experiment: ${experimentId}`);
      return;
    }
    
    // Send to analytics
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', `experiment_${conversionType}`, {
        experiment_id: experimentId,
        variant: result.variant,
        value: value,
      });
    }
    
    console.log(`[useExperiment] Conversion tracked: ${experimentId} (${result.variant}) - ${conversionType}`);
  }, [variantAssignments]);

  /**
   * Reset all experiment assignments (useful for testing)
   */
  const resetExperiments = useCallback(() => {
    const newId = generateUserId();
    setUserId(newId);
    setExposedExperiments(new Set());
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${storageKey}-userId`, newId);
      localStorage.removeItem(`${storageKey}-exposed`);
    }
  }, [storageKey]);

  return {
    getVariant,
    trackConversion,
    resetExperiments,
    userId,
    experiments: variantAssignments,
  };
}

// Convenience hook for a single experiment
export function useSingleExperiment(
  experimentId: string,
  variants: string[],
  options?: Omit<UseExperimentOptions, 'experiments'>
): ExperimentResult & { trackConversion: (type?: string, value?: number) => void } {
  const { getVariant, trackConversion } = useExperiment({
    experiments: [{ id: experimentId, name: experimentId, variants }],
    ...options,
  });
  
  const result = getVariant(experimentId);
  
  return {
    ...result,
    trackConversion: (type?: string, value?: number) => trackConversion(experimentId, type, value),
  };
}
