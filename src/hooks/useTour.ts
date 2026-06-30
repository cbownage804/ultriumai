/**
 * Tour Management Hook
 * Provides tour state and controls across the application
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MODULE_TOURS, ModuleTourId } from '@/config/moduleTours';

const COMPLETED_TOURS_KEY = 'ultrium_completed_tours';

interface UseTourOptions {
  autoStart?: boolean;
  tourId?: ModuleTourId;
}

// Map routes to tour IDs
const routeToTourMap: Record<string, ModuleTourId> = {
  '/vanguard/app/tickets': 'vanguard-response',
  '/vanguard/app/response': 'vanguard-response',
  '/vanguard/app/devices': 'vanguard-horizon',
  '/vanguard/app/horizon': 'vanguard-horizon',
  '/vanguard/app/alerts': 'vanguard-pursuit',
  '/vanguard/app/pursuit': 'vanguard-pursuit',
  '/vanguard/app/atlas': 'vanguard-atlas',
  '/vanguard/app/cortex': 'vanguard-cortex',
  '/app/vault': 'safesuite-vault',
  '/app/pass': 'safesuite-vault',
  '/app/scan': 'safesuite-scan',
  '/app/breach': 'safesuite-breach',
  '/dashboard': 'ai-studio-builder',
  '/gpt-builder': 'ai-studio-builder',
  '/settings': 'settings',
};

export function useTour(options: UseTourOptions = {}) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Determine current tour ID based on route or explicit option
  const tourId = options.tourId || (() => {
    const path = location.pathname;
    for (const [route, id] of Object.entries(routeToTourMap)) {
      if (path.startsWith(route)) {
        return id;
      }
    }
    return null;
  })();

  // Get tour steps
  const tourSteps = tourId ? MODULE_TOURS[tourId] : null;

  // Check if tour is completed
  const isCompleted = useCallback(() => {
    if (!tourId) return true;
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    return completed.includes(tourId);
  }, [tourId]);

  // Mark tour as completed
  const markCompleted = useCallback(() => {
    if (!tourId) return;
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    if (!completed.includes(tourId)) {
      completed.push(tourId);
      localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(completed));
    }
  }, [tourId]);

  // Reset tour completion
  const resetCompletion = useCallback(() => {
    if (!tourId) return;
    const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
    const updated = completed.filter((id: string) => id !== tourId);
    localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(updated));
  }, [tourId]);

  // Start tour
  const startTour = useCallback(() => {
    if (tourSteps) {
      setIsOpen(true);
    }
  }, [tourSteps]);

  // Close tour
  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Complete tour
  const completeTour = useCallback(() => {
    markCompleted();
    setIsOpen(false);
  }, [markCompleted]);

  // Replay tour (reset and start)
  const replayTour = useCallback(() => {
    resetCompletion();
    setIsOpen(true);
  }, [resetCompletion]);

  // Auto-start tour for first-time visitors
  useEffect(() => {
    if (options.autoStart && tourSteps && !isCompleted() && !hasAutoStarted) {
      // Small delay to let the page render first
      const timeout = setTimeout(() => {
        setIsOpen(true);
        setHasAutoStarted(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [options.autoStart, tourSteps, isCompleted, hasAutoStarted]);

  return {
    tourId,
    tourSteps,
    isOpen,
    isCompleted: isCompleted(),
    startTour,
    closeTour,
    completeTour,
    replayTour,
    resetCompletion,
  };
}

// Get all tour IDs that match a product
export function getToursByProduct(product: 'vanguard' | 'safesuite' | 'ai-studio' | 'settings') {
  const prefixMap = {
    'vanguard': 'vanguard-',
    'safesuite': 'safesuite-',
    'ai-studio': 'ai-studio-',
    'settings': 'settings',
  };

  const prefix = prefixMap[product];
  return Object.keys(MODULE_TOURS).filter(id => id.startsWith(prefix)) as ModuleTourId[];
}

// Check if all tours for a product are completed
export function areAllToursCompleted(product: 'vanguard' | 'safesuite' | 'ai-studio' | 'settings') {
  const tourIds = getToursByProduct(product);
  const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
  return tourIds.every(id => completed.includes(id));
}

// Reset all tours for a product
export function resetProductTours(product: 'vanguard' | 'safesuite' | 'ai-studio' | 'settings') {
  const tourIds = getToursByProduct(product);
  const completed = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || '[]');
  const updated = completed.filter((id: string) => !tourIds.includes(id as ModuleTourId));
  localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(updated));
}
