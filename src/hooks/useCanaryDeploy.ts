import { useState, useCallback } from 'react';

export interface CanaryDeployment {
  id: string;
  name: string;
  status: 'pending' | 'rolling' | 'monitoring' | 'completed' | 'rolled-back';
  canaryPercentage: number;
  targetPercentage: number;
  stepIncrement: number;
  stepIntervalMin: number;
  currentVersion: string;
  canaryVersion: string;
  startedAt: Date | null;
  completedAt: Date | null;
  errorRateThreshold: number;
  latencyThreshold: number;
}

export interface CanaryMetrics {
  timestamp: Date;
  canaryErrorRate: number;
  stableErrorRate: number;
  canaryLatencyMs: number;
  stableLatencyMs: number;
  canaryRequests: number;
  stableRequests: number;
}

export function useCanaryDeploy() {
  const [deployments, setDeployments] = useState<CanaryDeployment[]>([]);
  const [metrics, setMetrics] = useState<CanaryMetrics[]>([]);
  const [activeDeploymentId, setActiveDeploymentId] = useState<string | null>(null);

  const createDeployment = useCallback((name: string, canaryVersion: string) => {
    const deployment: CanaryDeployment = {
      id: crypto.randomUUID(), name, status: 'pending',
      canaryPercentage: 0, targetPercentage: 100, stepIncrement: 10,
      stepIntervalMin: 5, currentVersion: 'v1.0.0', canaryVersion,
      startedAt: null, completedAt: null, errorRateThreshold: 5, latencyThreshold: 500,
    };
    setDeployments(prev => [...prev, deployment]);
    setActiveDeploymentId(deployment.id);
    return deployment;
  }, []);

  const updateDeployment = useCallback((id: string, update: Partial<CanaryDeployment>) => {
    setDeployments(prev => prev.map(d => d.id === id ? { ...d, ...update } : d));
  }, []);

  const startRollout = useCallback((id: string) => {
    setDeployments(prev => prev.map(d => d.id === id ? {
      ...d, status: 'rolling' as const, canaryPercentage: d.stepIncrement, startedAt: new Date(),
    } : d));
    simulateMetrics();
  }, []);

  const advanceCanary = useCallback((id: string) => {
    setDeployments(prev => prev.map(d => {
      if (d.id !== id) return d;
      const next = Math.min(d.canaryPercentage + d.stepIncrement, d.targetPercentage);
      return { ...d, canaryPercentage: next, status: next >= d.targetPercentage ? 'completed' as const : 'rolling' as const, completedAt: next >= d.targetPercentage ? new Date() : null };
    }));
    simulateMetrics();
  }, []);

  const rollback = useCallback((id: string) => {
    setDeployments(prev => prev.map(d => d.id === id ? { ...d, status: 'rolled-back' as const, canaryPercentage: 0, completedAt: new Date() } : d));
  }, []);

  const simulateMetrics = useCallback(() => {
    const metric: CanaryMetrics = {
      timestamp: new Date(),
      canaryErrorRate: Math.random() * 3,
      stableErrorRate: Math.random() * 1.5,
      canaryLatencyMs: 100 + Math.random() * 200,
      stableLatencyMs: 80 + Math.random() * 150,
      canaryRequests: Math.floor(Math.random() * 500) + 100,
      stableRequests: Math.floor(Math.random() * 2000) + 500,
    };
    setMetrics(prev => [...prev, metric].slice(-50));
  }, []);

  const getActiveDeployment = useCallback(() => deployments.find(d => d.id === activeDeploymentId) || null, [deployments, activeDeploymentId]);

  const shouldAutoRollback = useCallback((id: string): boolean => {
    const deployment = deployments.find(d => d.id === id);
    if (!deployment || metrics.length === 0) return false;
    const latest = metrics[metrics.length - 1];
    return latest.canaryErrorRate > deployment.errorRateThreshold || latest.canaryLatencyMs > deployment.latencyThreshold;
  }, [deployments, metrics]);

  return {
    deployments, metrics, activeDeploymentId, setActiveDeploymentId, getActiveDeployment,
    createDeployment, updateDeployment, startRollout, advanceCanary, rollback,
    simulateMetrics, shouldAutoRollback,
  };
}
