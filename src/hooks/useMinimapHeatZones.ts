/**
 * Phase 110: Minimap with Heat Zones
 * Tracks recently changed areas, AI-modified blocks, and error-prone sections.
 */
import { useCallback, useRef, useState } from 'react';

export interface HeatZone {
  filePath: string;
  startLine: number;
  endLine: number;
  intensity: number; // 0-1
  type: 'recent-change' | 'ai-modified' | 'error-prone' | 'high-churn';
  label: string;
  timestamp: Date;
}

interface ChangeRecord {
  filePath: string;
  startLine: number;
  endLine: number;
  timestamp: number;
  source: 'user' | 'ai';
}

export function useMinimapHeatZones() {
  const changesRef = useRef<ChangeRecord[]>([]);
  const [heatZones, setHeatZones] = useState<HeatZone[]>([]);
  const errorLinesRef = useRef<Map<string, Set<number>>>(new Map());

  const recordChange = useCallback((filePath: string, startLine: number, endLine: number, source: 'user' | 'ai' = 'user') => {
    changesRef.current.push({ filePath, startLine, endLine, timestamp: Date.now(), source });
    // Keep last 500 changes
    if (changesRef.current.length > 500) changesRef.current = changesRef.current.slice(-500);
  }, []);

  const recordAIModification = useCallback((filePath: string, lineCount: number) => {
    changesRef.current.push({ filePath, startLine: 1, endLine: lineCount, timestamp: Date.now(), source: 'ai' });
  }, []);

  const recordErrorLine = useCallback((filePath: string, line: number) => {
    if (!errorLinesRef.current.has(filePath)) errorLinesRef.current.set(filePath, new Set());
    errorLinesRef.current.get(filePath)!.add(line);
  }, []);

  const computeHeatZones = useCallback((filePath: string): HeatZone[] => {
    const now = Date.now();
    const fiveMinAgo = now - 5 * 60_000;
    const zones: HeatZone[] = [];

    // Recent user changes (last 5 min)
    const recentUserChanges = changesRef.current.filter(
      c => c.filePath === filePath && c.source === 'user' && c.timestamp > fiveMinAgo
    );
    for (const change of recentUserChanges) {
      const age = (now - change.timestamp) / (5 * 60_000);
      zones.push({
        filePath, startLine: change.startLine, endLine: change.endLine,
        intensity: 1 - age, type: 'recent-change',
        label: 'Recently edited', timestamp: new Date(change.timestamp),
      });
    }

    // AI-modified blocks
    const aiChanges = changesRef.current.filter(
      c => c.filePath === filePath && c.source === 'ai' && c.timestamp > fiveMinAgo
    );
    for (const change of aiChanges) {
      const age = (now - change.timestamp) / (5 * 60_000);
      zones.push({
        filePath, startLine: change.startLine, endLine: change.endLine,
        intensity: 1 - age, type: 'ai-modified',
        label: 'AI modified', timestamp: new Date(change.timestamp),
      });
    }

    // Error-prone sections
    const errors = errorLinesRef.current.get(filePath);
    if (errors) {
      for (const line of errors) {
        zones.push({
          filePath, startLine: line, endLine: line + 1,
          intensity: 0.8, type: 'error-prone',
          label: 'Error reported here', timestamp: new Date(),
        });
      }
    }

    // High-churn detection (same area changed 3+ times)
    const churnMap = new Map<string, number>();
    changesRef.current.filter(c => c.filePath === filePath).forEach(c => {
      const key = `${Math.floor(c.startLine / 10)}`;
      churnMap.set(key, (churnMap.get(key) || 0) + 1);
    });
    for (const [block, count] of churnMap) {
      if (count >= 3) {
        const start = parseInt(block) * 10;
        zones.push({
          filePath, startLine: start, endLine: start + 10,
          intensity: Math.min(1, count / 6), type: 'high-churn',
          label: `Changed ${count}x`, timestamp: new Date(),
        });
      }
    }

    setHeatZones(zones);
    return zones;
  }, []);

  const getZoneColor = useCallback((zone: HeatZone): string => {
    switch (zone.type) {
      case 'recent-change': return `rgba(6, 182, 212, ${zone.intensity * 0.3})`;
      case 'ai-modified': return `rgba(139, 92, 246, ${zone.intensity * 0.3})`;
      case 'error-prone': return `rgba(239, 68, 68, ${zone.intensity * 0.3})`;
      case 'high-churn': return `rgba(245, 158, 11, ${zone.intensity * 0.3})`;
      default: return 'transparent';
    }
  }, []);

  return {
    heatZones,
    recordChange,
    recordAIModification,
    recordErrorLine,
    computeHeatZones,
    getZoneColor,
    clearErrors: useCallback(() => errorLinesRef.current.clear(), []),
  };
}
