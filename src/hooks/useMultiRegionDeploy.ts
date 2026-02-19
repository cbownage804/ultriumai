import { useState, useCallback } from 'react';

export interface DeployRegion {
  id: string;
  name: string;
  code: string;
  location: string;
  isActive: boolean;
  latencyMs: number;
  healthStatus: 'healthy' | 'degraded' | 'down';
  lastHealthCheck: Date | null;
  isPrimary: boolean;
}

export interface RegionConfig {
  routingStrategy: 'latency' | 'geo' | 'round-robin' | 'failover';
  healthCheckIntervalSec: number;
  healthCheckPath: string;
  failoverThreshold: number;
  enableCDN: boolean;
}

export function useMultiRegionDeploy() {
  const [regions, setRegions] = useState<DeployRegion[]>([]);
  const [config, setConfig] = useState<RegionConfig>({
    routingStrategy: 'latency', healthCheckIntervalSec: 30,
    healthCheckPath: '/health', failoverThreshold: 3, enableCDN: true,
  });

  const AVAILABLE_REGIONS: Omit<DeployRegion, 'id' | 'isActive' | 'latencyMs' | 'healthStatus' | 'lastHealthCheck' | 'isPrimary'>[] = [
    { name: 'US East', code: 'us-east-1', location: 'Virginia, USA' },
    { name: 'US West', code: 'us-west-2', location: 'Oregon, USA' },
    { name: 'EU West', code: 'eu-west-1', location: 'Ireland' },
    { name: 'EU Central', code: 'eu-central-1', location: 'Frankfurt, Germany' },
    { name: 'AP Southeast', code: 'ap-southeast-1', location: 'Singapore' },
    { name: 'AP Northeast', code: 'ap-northeast-1', location: 'Tokyo, Japan' },
    { name: 'SA East', code: 'sa-east-1', location: 'São Paulo, Brazil' },
    { name: 'AU East', code: 'ap-southeast-2', location: 'Sydney, Australia' },
  ];

  const addRegion = useCallback((code: string) => {
    const template = AVAILABLE_REGIONS.find(r => r.code === code);
    if (!template || regions.some(r => r.code === code)) return;
    const region: DeployRegion = {
      id: crypto.randomUUID(), ...template, isActive: true,
      latencyMs: Math.floor(Math.random() * 200) + 20,
      healthStatus: 'healthy', lastHealthCheck: new Date(),
      isPrimary: regions.length === 0,
    };
    setRegions(prev => [...prev, region]);
  }, [regions]);

  const removeRegion = useCallback((id: string) => {
    setRegions(prev => {
      const filtered = prev.filter(r => r.id !== id);
      if (filtered.length > 0 && !filtered.some(r => r.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  }, []);

  const setPrimary = useCallback((id: string) => {
    setRegions(prev => prev.map(r => ({ ...r, isPrimary: r.id === id })));
  }, []);

  const toggleRegion = useCallback((id: string) => {
    setRegions(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }, []);

  const simulateHealthCheck = useCallback(() => {
    setRegions(prev => prev.map(r => ({
      ...r,
      latencyMs: Math.floor(Math.random() * 200) + 20,
      healthStatus: Math.random() > 0.1 ? 'healthy' : Math.random() > 0.5 ? 'degraded' : 'down',
      lastHealthCheck: new Date(),
    })));
  }, []);

  const generateNginxConfig = useCallback((): string => {
    const activeRegions = regions.filter(r => r.isActive);
    return `# Multi-Region Nginx Configuration
upstream backend {
${config.routingStrategy === 'round-robin' ? activeRegions.map(r => `  server ${r.code}.app.example.com;`).join('\n') :
  activeRegions.map(r => `  server ${r.code}.app.example.com${r.isPrimary ? '' : ' backup'};`).join('\n')}
}

server {
  listen 80;
  
  location ${config.healthCheckPath} {
    return 200 'OK';
    add_header Content-Type text/plain;
  }
  
  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_next_upstream error timeout http_500 http_502 http_503;
    proxy_connect_timeout 5s;
  }
}`;
  }, [regions, config]);

  return {
    regions, config, setConfig, AVAILABLE_REGIONS,
    addRegion, removeRegion, setPrimary, toggleRegion,
    simulateHealthCheck, generateNginxConfig,
  };
}
