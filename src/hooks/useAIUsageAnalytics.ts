import { useState, useCallback } from 'react';

export interface AIUsageEntry {
  id: string;
  timestamp: Date;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  category: 'generation' | 'edit' | 'review' | 'test' | 'query' | 'other';
  success: boolean;
  duration: number;
}

export interface AIUsageSummary {
  totalPrompts: number;
  totalTokens: number;
  totalCost: number;
  avgTokensPerPrompt: number;
  successRate: number;
  byModel: { model: string; count: number; tokens: number; cost: number }[];
  byCategory: { category: string; count: number; cost: number }[];
  dailyUsage: { date: string; prompts: number; cost: number }[];
  topModels: string[];
}

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'claude-3.5-sonnet': { input: 0.003, output: 0.015 },
  'gemini-pro': { input: 0.00025, output: 0.0005 },
};

export function useAIUsageAnalytics() {
  const [entries, setEntries] = useState<AIUsageEntry[]>([]);

  const trackUsage = useCallback((model: string, promptTokens: number, completionTokens: number, category: AIUsageEntry['category'], success: boolean, duration: number) => {
    const costs = MODEL_COSTS[model] || { input: 0.001, output: 0.002 };
    const cost = Math.round(((promptTokens / 1000) * costs.input + (completionTokens / 1000) * costs.output) * 10000) / 10000;
    const entry: AIUsageEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      cost,
      category,
      success,
      duration,
    };
    setEntries(prev => [entry, ...prev].slice(0, 5000));
    return entry;
  }, []);

  const getSummary = useCallback((days = 30): AIUsageSummary => {
    const cutoff = new Date(Date.now() - days * 86400000);
    const filtered = entries.filter(e => e.timestamp >= cutoff);
    const totalTokens = filtered.reduce((s, e) => s + e.totalTokens, 0);
    const totalCost = Math.round(filtered.reduce((s, e) => s + e.cost, 0) * 100) / 100;
    const successCount = filtered.filter(e => e.success).length;

    const modelMap = new Map<string, { count: number; tokens: number; cost: number }>();
    const catMap = new Map<string, { count: number; cost: number }>();
    const dateMap = new Map<string, { prompts: number; cost: number }>();

    for (const e of filtered) {
      const m = modelMap.get(e.model) || { count: 0, tokens: 0, cost: 0 };
      modelMap.set(e.model, { count: m.count + 1, tokens: m.tokens + e.totalTokens, cost: Math.round((m.cost + e.cost) * 10000) / 10000 });

      const c = catMap.get(e.category) || { count: 0, cost: 0 };
      catMap.set(e.category, { count: c.count + 1, cost: Math.round((c.cost + e.cost) * 10000) / 10000 });

      const d = e.timestamp.toISOString().slice(0, 10);
      const day = dateMap.get(d) || { prompts: 0, cost: 0 };
      dateMap.set(d, { prompts: day.prompts + 1, cost: Math.round((day.cost + e.cost) * 10000) / 10000 });
    }

    return {
      totalPrompts: filtered.length,
      totalTokens,
      totalCost,
      avgTokensPerPrompt: filtered.length > 0 ? Math.round(totalTokens / filtered.length) : 0,
      successRate: filtered.length > 0 ? Math.round((successCount / filtered.length) * 100) : 100,
      byModel: [...modelMap.entries()].map(([model, v]) => ({ model, ...v })).sort((a, b) => b.count - a.count),
      byCategory: [...catMap.entries()].map(([category, v]) => ({ category, ...v })).sort((a, b) => b.count - a.count),
      dailyUsage: [...dateMap.entries()].sort().map(([date, v]) => ({ date, ...v })),
      topModels: [...modelMap.entries()].sort((a, b) => b[1].count - a[1].count).map(([m]) => m),
    };
  }, [entries]);

  const getEstimatedMonthlyCost = useCallback(() => {
    const last7 = entries.filter(e => e.timestamp >= new Date(Date.now() - 7 * 86400000));
    const weekCost = last7.reduce((s, e) => s + e.cost, 0);
    return Math.round(weekCost * 4.3 * 100) / 100;
  }, [entries]);

  return { entries, trackUsage, getSummary, getEstimatedMonthlyCost };
}
