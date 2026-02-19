import { useState, useCallback } from 'react';

export interface Breakpoint {
  id: string;
  name: string;
  minWidth: number;
  maxWidth: number;
  icon: string;
  color: string;
}

export interface BreakpointOverride {
  id: string;
  breakpointId: string;
  selector: string;
  property: string;
  value: string;
}

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: 'xs', name: 'Mobile S', minWidth: 320, maxWidth: 374, icon: '📱', color: '#f43f5e' },
  { id: 'sm', name: 'Mobile', minWidth: 375, maxWidth: 639, icon: '📱', color: '#f97316' },
  { id: 'md', name: 'Tablet', minWidth: 640, maxWidth: 767, icon: '📋', color: '#eab308' },
  { id: 'lg', name: 'Laptop', minWidth: 768, maxWidth: 1023, icon: '💻', color: '#22c55e' },
  { id: 'xl', name: 'Desktop', minWidth: 1024, maxWidth: 1279, icon: '🖥️', color: '#06b6d4' },
  { id: '2xl', name: 'Wide', minWidth: 1280, maxWidth: 1920, icon: '🖥️', color: '#8b5cf6' },
];

export function useResponsiveBreakpointEditor() {
  const [breakpoints] = useState<Breakpoint[]>(DEFAULT_BREAKPOINTS);
  const [activeBreakpoint, setActiveBreakpoint] = useState<string>('xl');
  const [overrides, setOverrides] = useState<BreakpointOverride[]>([]);
  const [showAllBreakpoints, setShowAllBreakpoints] = useState(false);

  const addOverride = useCallback((breakpointId: string, selector: string, property: string, value: string) => {
    setOverrides(prev => [...prev, { id: crypto.randomUUID(), breakpointId, selector, property, value }]);
  }, []);

  const removeOverride = useCallback((id: string) => {
    setOverrides(prev => prev.filter(o => o.id !== id));
  }, []);

  const generateCSS = useCallback((): string => {
    const grouped = overrides.reduce((acc, o) => {
      const bp = breakpoints.find(b => b.id === o.breakpointId);
      if (!bp) return acc;
      const key = `@media (min-width: ${bp.minWidth}px)`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(`  ${o.selector} { ${o.property}: ${o.value}; }`);
      return acc;
    }, {} as Record<string, string[]>);

    return Object.entries(grouped).map(([media, rules]) => `${media} {\n${rules.join('\n')}\n}`).join('\n\n');
  }, [overrides, breakpoints]);

  const getActiveBreakpoint = useCallback(() => breakpoints.find(b => b.id === activeBreakpoint) || breakpoints[4], [breakpoints, activeBreakpoint]);

  return {
    breakpoints, activeBreakpoint, setActiveBreakpoint, overrides,
    addOverride, removeOverride, generateCSS, getActiveBreakpoint,
    showAllBreakpoints, setShowAllBreakpoints,
    overrideCount: overrides.length,
  };
}
