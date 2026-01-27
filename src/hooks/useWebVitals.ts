import { useEffect, useCallback } from 'react';

// Core Web Vitals types
interface WebVitalMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

type ReportHandler = (metric: WebVitalMetric) => void;

// Thresholds based on Google's recommendations
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: keyof typeof thresholds, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Simple performance observer implementation
function observeLCP(callback: ReportHandler) {
  if (!('PerformanceObserver' in window)) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (lastEntry) {
        const value = lastEntry.startTime;
        callback({
          name: 'LCP',
          value,
          rating: getRating('LCP', value),
          delta: value,
          id: `lcp-${Date.now()}`,
          navigationType: 'navigate',
        });
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // Silent fail for unsupported browsers
  }
}

function observeFID(callback: ReportHandler) {
  if (!('PerformanceObserver' in window)) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
        const value = fidEntry.processingStart - fidEntry.startTime;
        callback({
          name: 'FID',
          value,
          rating: getRating('FID', value),
          delta: value,
          id: `fid-${Date.now()}`,
          navigationType: 'navigate',
        });
      });
    });
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    // Silent fail for unsupported browsers
  }
}

function observeCLS(callback: ReportHandler) {
  if (!('PerformanceObserver' in window)) return;
  
  let clsValue = 0;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const clsEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value;
        }
      });
      
      callback({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
        id: `cls-${Date.now()}`,
        navigationType: 'navigate',
      });
    });
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // Silent fail for unsupported browsers
  }
}

function observeFCP(callback: ReportHandler) {
  if (!('PerformanceObserver' in window)) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        const value = fcpEntry.startTime;
        callback({
          name: 'FCP',
          value,
          rating: getRating('FCP', value),
          delta: value,
          id: `fcp-${Date.now()}`,
          navigationType: 'navigate',
        });
      }
    });
    observer.observe({ type: 'paint', buffered: true });
  } catch (e) {
    // Silent fail for unsupported browsers
  }
}

function observeTTFB(callback: ReportHandler) {
  if (!('performance' in window)) return;
  
  try {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const value = navigationEntry.responseStart - navigationEntry.requestStart;
      callback({
        name: 'TTFB',
        value,
        rating: getRating('TTFB', value),
        delta: value,
        id: `ttfb-${Date.now()}`,
        navigationType: 'navigate',
      });
    }
  } catch (e) {
    // Silent fail for unsupported browsers
  }
}

interface UseWebVitalsOptions {
  onReport?: ReportHandler;
  enableLogging?: boolean;
  sendToAnalytics?: boolean;
}

/**
 * Hook to monitor Core Web Vitals
 * 
 * @example
 * ```tsx
 * useWebVitals({
 *   onReport: (metric) => console.log(metric),
 *   enableLogging: process.env.NODE_ENV === 'development',
 * });
 * ```
 */
export function useWebVitals({
  onReport,
  enableLogging = false,
  sendToAnalytics = true,
}: UseWebVitalsOptions = {}) {
  const handleMetric = useCallback((metric: WebVitalMetric) => {
    // Log to console in development
    if (enableLogging) {
      const color = metric.rating === 'good' ? 'green' : metric.rating === 'needs-improvement' ? 'orange' : 'red';
      console.log(
        `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
        `color: ${color}; font-weight: bold;`
      );
    }
    
    // Send to Google Analytics
    if (sendToAnalytics && typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
        metric_rating: metric.rating,
      });
    }
    
    // Custom callback
    if (onReport) {
      onReport(metric);
    }
  }, [onReport, enableLogging, sendToAnalytics]);

  useEffect(() => {
    // Observe all Core Web Vitals
    observeLCP(handleMetric);
    observeFID(handleMetric);
    observeCLS(handleMetric);
    observeFCP(handleMetric);
    observeTTFB(handleMetric);
  }, [handleMetric]);
}

// Export types for external use
export type { WebVitalMetric, ReportHandler };
