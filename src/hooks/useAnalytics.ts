import { useCallback } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    clarity: (...args: any[]) => void;
  }
}

export const useAnalytics = () => {
  const trackEvent = useCallback((action: string, category: string, label?: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  }, []);

  const trackPageView = useCallback((page_title: string, page_location: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_title,
        page_location,
      });
    }
  }, []);

  const trackUserSignup = useCallback((method: string) => {
    trackEvent('sign_up', 'engagement', method);
  }, [trackEvent]);

  const trackUserLogin = useCallback((method: string) => {
    trackEvent('login', 'engagement', method);
  }, [trackEvent]);

  const trackFeatureUse = useCallback((feature: string) => {
    trackEvent('feature_use', 'engagement', feature);
  }, [trackEvent]);

  const trackError = useCallback((error: string, fatal: boolean = false) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error,
        fatal,
      });
    }
  }, []);

  const trackConversion = useCallback((conversionId: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: conversionId,
        value: value,
        currency: 'USD',
      });
    }
  }, []);

  const identifyUser = useCallback((userId: string, traits: Record<string, any> = {}) => {
    // Microsoft Clarity user identification
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('identify', userId, traits);
    }

    // Google Analytics user identification
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: userId,
        custom_map: traits,
      });
    }
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackUserSignup,
    trackUserLogin,
    trackFeatureUse,
    trackError,
    trackConversion,
    identifyUser,
  };
};

export default useAnalytics;