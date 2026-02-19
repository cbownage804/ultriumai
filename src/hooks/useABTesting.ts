import { useState, useCallback } from 'react';

export interface ABVariant {
  id: string;
  name: string;
  code: string;
  trafficPercent: number;
  impressions: number;
  conversions: number;
  conversionRate: number;
}

export interface ABTest {
  id: string;
  name: string;
  component: string;
  variants: ABVariant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  winnerVariantId?: string;
  goalEvent: string;
  minSampleSize: number;
}

export function useABTesting() {
  const [tests, setTests] = useState<ABTest[]>([]);

  const createTest = useCallback((name: string, component: string, goalEvent: string) => {
    const test: ABTest = {
      id: crypto.randomUUID(),
      name,
      component,
      variants: [
        { id: crypto.randomUUID(), name: 'Control', code: '', trafficPercent: 50, impressions: 0, conversions: 0, conversionRate: 0 },
        { id: crypto.randomUUID(), name: 'Variant B', code: '', trafficPercent: 50, impressions: 0, conversions: 0, conversionRate: 0 },
      ],
      status: 'draft',
      createdAt: new Date(),
      goalEvent,
      minSampleSize: 100,
    };
    setTests(prev => [test, ...prev]);
    return test;
  }, []);

  const addVariant = useCallback((testId: string, name: string) => {
    setTests(prev => prev.map(t => {
      if (t.id !== testId) return t;
      const newVariant: ABVariant = { id: crypto.randomUUID(), name, code: '', trafficPercent: 0, impressions: 0, conversions: 0, conversionRate: 0 };
      const variants = [...t.variants, newVariant];
      const share = Math.floor(100 / variants.length);
      return { ...t, variants: variants.map((v, i) => ({ ...v, trafficPercent: i === variants.length - 1 ? 100 - share * (variants.length - 1) : share })) };
    }));
  }, []);

  const updateVariantCode = useCallback((testId: string, variantId: string, code: string) => {
    setTests(prev => prev.map(t => t.id === testId ? { ...t, variants: t.variants.map(v => v.id === variantId ? { ...v, code } : v) } : t));
  }, []);

  const startTest = useCallback((testId: string) => {
    setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'running', startedAt: new Date() } : t));
  }, []);

  const pauseTest = useCallback((testId: string) => {
    setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'paused' } : t));
  }, []);

  const completeTest = useCallback((testId: string) => {
    setTests(prev => prev.map(t => {
      if (t.id !== testId) return t;
      const winner = [...t.variants].sort((a, b) => b.conversionRate - a.conversionRate)[0];
      return { ...t, status: 'completed', endedAt: new Date(), winnerVariantId: winner?.id };
    }));
  }, []);

  const recordImpression = useCallback((testId: string, variantId: string) => {
    setTests(prev => prev.map(t => t.id === testId ? {
      ...t, variants: t.variants.map(v => {
        if (v.id !== variantId) return v;
        const impressions = v.impressions + 1;
        return { ...v, impressions, conversionRate: impressions > 0 ? Math.round((v.conversions / impressions) * 10000) / 100 : 0 };
      })
    } : t));
  }, []);

  const recordConversion = useCallback((testId: string, variantId: string) => {
    setTests(prev => prev.map(t => t.id === testId ? {
      ...t, variants: t.variants.map(v => {
        if (v.id !== variantId) return v;
        const conversions = v.conversions + 1;
        return { ...v, conversions, conversionRate: v.impressions > 0 ? Math.round((conversions / v.impressions) * 10000) / 100 : 0 };
      })
    } : t));
  }, []);

  const deleteTest = useCallback((id: string) => setTests(prev => prev.filter(t => t.id !== id)), []);

  const generateABCode = useCallback((test: ABTest): string => {
    return `function ${test.component}AB() {
  const variant = useABVariant('${test.id}');
  ${test.variants.map(v => `if (variant === '${v.id}') return <${test.component}Variant${v.name.replace(/\s/g, '')} />;`).join('\n  ')}
  return <${test.component} />;
}`;
  }, []);

  return { tests, createTest, addVariant, updateVariantCode, startTest, pauseTest, completeTest, recordImpression, recordConversion, deleteTest, generateABCode };
}
