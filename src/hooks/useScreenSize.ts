import { useState, useEffect } from 'react';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

interface ScreenInfo {
  size: ScreenSize;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
}

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

export const useScreenSize = (): ScreenInfo => {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => getScreenInfo());

  useEffect(() => {
    const handleResize = () => {
      setScreenInfo(getScreenInfo());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return screenInfo;
};

function getScreenInfo(): ScreenInfo {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const height = typeof window !== 'undefined' ? window.innerHeight : 768;
  const isTouchDevice = typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  let size: ScreenSize = 'desktop';
  if (width < BREAKPOINTS.mobile) {
    size = 'mobile';
  } else if (width < BREAKPOINTS.tablet) {
    size = 'tablet';
  }

  return {
    size,
    width,
    height,
    isMobile: size === 'mobile',
    isTablet: size === 'tablet',
    isDesktop: size === 'desktop',
    isTouchDevice,
  };
}

// Get responsive position for tooltips/tours
export const getResponsivePosition = (
  preferredPosition: 'top' | 'bottom' | 'left' | 'right' | 'center',
  screenSize: ScreenSize,
  targetRect?: DOMRect | null
): 'top' | 'bottom' | 'left' | 'right' | 'center' => {
  // On mobile, prefer top/bottom positions to avoid off-screen content
  if (screenSize === 'mobile') {
    if (preferredPosition === 'left' || preferredPosition === 'right') {
      // Check if target is in upper or lower half of screen
      if (targetRect) {
        const screenHeight = window.innerHeight;
        return targetRect.top < screenHeight / 2 ? 'bottom' : 'top';
      }
      return 'bottom';
    }
  }

  return preferredPosition;
};

// Check if element would be off-screen with given position
export const wouldBeOffScreen = (
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  position: 'top' | 'bottom' | 'left' | 'right'
): boolean => {
  const padding = 16;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  switch (position) {
    case 'top':
      return targetRect.top - tooltipHeight - padding < 0;
    case 'bottom':
      return targetRect.bottom + tooltipHeight + padding > screenHeight;
    case 'left':
      return targetRect.left - tooltipWidth - padding < 0;
    case 'right':
      return targetRect.right + tooltipWidth + padding > screenWidth;
    default:
      return false;
  }
};

// Get best position that keeps element on screen
export const getBestPosition = (
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  preferredPosition: 'top' | 'bottom' | 'left' | 'right'
): 'top' | 'bottom' | 'left' | 'right' => {
  const positions: ('top' | 'bottom' | 'left' | 'right')[] = [
    preferredPosition,
    'bottom',
    'top',
    'right',
    'left',
  ];

  for (const pos of positions) {
    if (!wouldBeOffScreen(targetRect, tooltipWidth, tooltipHeight, pos)) {
      return pos;
    }
  }

  return 'bottom'; // Fallback
};
