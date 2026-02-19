import { useState, useCallback } from 'react';

export interface Environment {
  id: string;
  name: 'development' | 'staging' | 'production';
  label: string;
  envVars: Record<string, string>;
  databaseUrl?: string;
  isActive: boolean;
  lastDeployed?: Date;
  version?: string;
}

export function useEnvironmentManager() {
  const [environments, setEnvironments] = useState<Environment[]>([
    { id: 'dev', name: 'development', label: 'Development', envVars: {}, isActive: true },
    { id: 'staging', name: 'staging', label: 'Staging', envVars: {}, isActive: false },
    { id: 'prod', name: 'production', label: 'Production', envVars: {}, isActive: false },
  ]);
  const [activeEnv, setActiveEnv] = useState<string>('dev');

  const switchEnvironment = useCallback((envId: string) => {
    setActiveEnv(envId);
    setEnvironments(prev => prev.map(e => ({ ...e, isActive: e.id === envId })));
  }, []);

  const updateEnvVars = useCallback((envId: string, vars: Record<string, string>) => {
    setEnvironments(prev => prev.map(e => e.id === envId ? { ...e, envVars: vars } : e));
  }, []);

  const promote = useCallback((fromId: string, toId: string) => {
    setEnvironments(prev => {
      const from = prev.find(e => e.id === fromId);
      if (!from) return prev;
      return prev.map(e => e.id === toId ? { ...e, version: from.version, lastDeployed: new Date() } : e);
    });
  }, []);

  const getActiveEnvironment = useCallback(() => {
    return environments.find(e => e.id === activeEnv) || environments[0];
  }, [environments, activeEnv]);

  return { environments, activeEnv, switchEnvironment, updateEnvVars, promote, getActiveEnvironment };
}
