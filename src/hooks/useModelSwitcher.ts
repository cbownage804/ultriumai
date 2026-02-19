import { useState, useCallback, useMemo } from 'react';
import { AI_PROVIDERS, type AIModelConfig } from '@/types/aiProviders';

export interface ModelCostEstimate {
  inputCostPer1k: number;
  outputCostPer1k: number;
  estimatedCost: number;
  speed: 'fast' | 'medium' | 'slow';
  quality: 'standard' | 'high' | 'premium';
  bestFor: string[];
}

const MODEL_COSTS: Record<string, ModelCostEstimate> = {
  'gpt-4o': { inputCostPer1k: 0.005, outputCostPer1k: 0.015, estimatedCost: 0.03, speed: 'medium', quality: 'high', bestFor: ['general', 'code', 'analysis'] },
  'gpt-4o-mini': { inputCostPer1k: 0.00015, outputCostPer1k: 0.0006, estimatedCost: 0.002, speed: 'fast', quality: 'standard', bestFor: ['quick edits', 'chat', 'simple tasks'] },
  'gpt-4.1-2025-04-14': { inputCostPer1k: 0.005, outputCostPer1k: 0.015, estimatedCost: 0.03, speed: 'medium', quality: 'premium', bestFor: ['complex code', 'architecture', 'debugging'] },
  'o1-preview': { inputCostPer1k: 0.015, outputCostPer1k: 0.06, estimatedCost: 0.12, speed: 'slow', quality: 'premium', bestFor: ['reasoning', 'math', 'complex logic'] },
  'o1-mini': { inputCostPer1k: 0.003, outputCostPer1k: 0.012, estimatedCost: 0.03, speed: 'medium', quality: 'high', bestFor: ['reasoning', 'code review'] },
  'o3-mini': { inputCostPer1k: 0.003, outputCostPer1k: 0.012, estimatedCost: 0.03, speed: 'medium', quality: 'premium', bestFor: ['next-gen reasoning'] },
  'claude-opus-4-20250514': { inputCostPer1k: 0.015, outputCostPer1k: 0.075, estimatedCost: 0.15, speed: 'slow', quality: 'premium', bestFor: ['long-form code', 'analysis', 'creative'] },
  'claude-sonnet-4-20250514': { inputCostPer1k: 0.003, outputCostPer1k: 0.015, estimatedCost: 0.03, speed: 'medium', quality: 'high', bestFor: ['balanced tasks', 'code gen', 'review'] },
  'claude-3-5-haiku-20241022': { inputCostPer1k: 0.001, outputCostPer1k: 0.005, estimatedCost: 0.01, speed: 'fast', quality: 'standard', bestFor: ['quick edits', 'chat'] },
  'gemini-2.5-pro': { inputCostPer1k: 0.00125, outputCostPer1k: 0.01, estimatedCost: 0.02, speed: 'medium', quality: 'high', bestFor: ['large codebases', 'long context'] },
  'gemini-2.5-flash': { inputCostPer1k: 0.000075, outputCostPer1k: 0.0003, estimatedCost: 0.001, speed: 'fast', quality: 'standard', bestFor: ['fast iteration', 'simple edits'] },
  'mistral-large-latest': { inputCostPer1k: 0.003, outputCostPer1k: 0.009, estimatedCost: 0.02, speed: 'medium', quality: 'high', bestFor: ['code', 'multilingual'] },
  'mixtral-8x22b': { inputCostPer1k: 0.001, outputCostPer1k: 0.003, estimatedCost: 0.008, speed: 'fast', quality: 'standard', bestFor: ['code', 'general'] },
  'meta-llama/Llama-3.3-70B-Instruct-Turbo': { inputCostPer1k: 0.0009, outputCostPer1k: 0.0009, estimatedCost: 0.004, speed: 'fast', quality: 'standard', bestFor: ['open source', 'code'] },
  'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': { inputCostPer1k: 0.005, outputCostPer1k: 0.005, estimatedCost: 0.02, speed: 'slow', quality: 'high', bestFor: ['complex tasks', 'open source'] },
};

type TaskType = 'ui' | 'backend' | 'fix' | 'refactor' | 'test' | 'general';

function detectTaskType(prompt: string): TaskType {
  const lower = prompt.toLowerCase();
  if (/\b(fix|bug|error|broken|crash|issue)\b/.test(lower)) return 'fix';
  if (/\b(test|spec|coverage|vitest|jest)\b/.test(lower)) return 'test';
  if (/\b(refactor|clean|simplify|optimize|improve)\b/.test(lower)) return 'refactor';
  if (/\b(api|database|supabase|edge function|backend|auth|migration)\b/.test(lower)) return 'backend';
  if (/\b(button|page|layout|design|ui|component|style|css|tailwind|responsive)\b/.test(lower)) return 'ui';
  return 'general';
}

const TASK_MODEL_RECOMMENDATIONS: Record<TaskType, string[]> = {
  ui: ['gpt-4o-mini', 'gemini-2.5-flash', 'claude-3-5-haiku-20241022'],
  backend: ['gpt-4o', 'claude-sonnet-4-20250514', 'gemini-2.5-pro'],
  fix: ['gpt-4o', 'claude-sonnet-4-20250514', 'o1-mini'],
  refactor: ['claude-sonnet-4-20250514', 'gpt-4o', 'gemini-2.5-pro'],
  test: ['gpt-4o-mini', 'claude-3-5-haiku-20241022', 'gemini-2.5-flash'],
  general: ['gpt-4o', 'claude-sonnet-4-20250514', 'gemini-2.5-pro'],
};

export function useModelSwitcher() {
  const [selectedModelId, setSelectedModelId] = useState('gpt-4o-mini');

  const allModels = useMemo(() => AI_PROVIDERS.flatMap(p => p.models), []);

  const getModelCost = useCallback((modelId: string): ModelCostEstimate | null => {
    return MODEL_COSTS[modelId] || null;
  }, []);

  const recommendModel = useCallback((prompt: string): { modelId: string; reason: string } => {
    const taskType = detectTaskType(prompt);
    const recommended = TASK_MODEL_RECOMMENDATIONS[taskType];
    const bestModel = recommended[0];
    const reasons: Record<TaskType, string> = {
      ui: 'Fast model for UI tasks — quick iterations',
      backend: 'Capable model for backend logic & architecture',
      fix: 'Strong reasoning for bug fixes',
      refactor: 'Great at understanding code patterns',
      test: 'Fast model for test generation',
      general: 'Balanced model for general tasks',
    };
    return { modelId: bestModel, reason: reasons[taskType] };
  }, []);

  const getModelsByCategory = useCallback(() => {
    const categories = {
      fast: allModels.filter(m => MODEL_COSTS[m.id]?.speed === 'fast'),
      balanced: allModels.filter(m => MODEL_COSTS[m.id]?.speed === 'medium'),
      premium: allModels.filter(m => MODEL_COSTS[m.id]?.quality === 'premium'),
    };
    return categories;
  }, [allModels]);

  return {
    selectedModelId,
    setSelectedModelId,
    allModels,
    getModelCost,
    recommendModel,
    getModelsByCategory,
    MODEL_COSTS,
  };
}
