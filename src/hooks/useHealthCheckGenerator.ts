import { useState, useCallback } from 'react';

export interface HealthDependency {
  id: string;
  name: string;
  type: 'database' | 'redis' | 'api' | 'storage' | 'custom';
  enabled: boolean;
  endpoint: string;
  timeoutMs: number;
  critical: boolean;
}

export interface HealthCheckConfig {
  path: string;
  includeVersion: boolean;
  includeUptime: boolean;
  includeMemory: boolean;
  dependencies: HealthDependency[];
  format: 'simple' | 'detailed';
}

const DEFAULT_DEPS: Omit<HealthDependency, 'id'>[] = [
  { name: 'Database', type: 'database', enabled: true, endpoint: 'postgres://...', timeoutMs: 3000, critical: true },
  { name: 'Redis', type: 'redis', enabled: false, endpoint: 'redis://localhost:6379', timeoutMs: 2000, critical: false },
  { name: 'External API', type: 'api', enabled: false, endpoint: 'https://api.example.com/health', timeoutMs: 5000, critical: false },
  { name: 'Storage', type: 'storage', enabled: false, endpoint: 's3://bucket/health-check', timeoutMs: 3000, critical: false },
];

export function useHealthCheckGenerator() {
  const [config, setConfig] = useState<HealthCheckConfig>({
    path: '/health',
    includeVersion: true,
    includeUptime: true,
    includeMemory: true,
    dependencies: DEFAULT_DEPS.map(d => ({ ...d, id: crypto.randomUUID() })),
    format: 'detailed',
  });

  const addDependency = useCallback((name: string, type: HealthDependency['type']) => {
    setConfig(prev => ({
      ...prev,
      dependencies: [...prev.dependencies, { id: crypto.randomUUID(), name, type, enabled: true, endpoint: '', timeoutMs: 3000, critical: false }],
    }));
  }, []);

  const removeDependency = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, dependencies: prev.dependencies.filter(d => d.id !== id) }));
  }, []);

  const toggleDependency = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, dependencies: prev.dependencies.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d) }));
  }, []);

  const updateDependency = useCallback((id: string, updates: Partial<HealthDependency>) => {
    setConfig(prev => ({ ...prev, dependencies: prev.dependencies.map(d => d.id === id ? { ...d, ...updates } : d) }));
  }, []);

  const generateEdgeFunction = useCallback((): string => {
    const c = config;
    const enabledDeps = c.dependencies.filter(d => d.enabled);
    const lines: string[] = [];
    lines.push(`// Health Check Edge Function`);
    lines.push(`// Endpoint: ${c.path}`);
    lines.push(`import { serve } from "https://deno.land/std@0.168.0/http/server.ts";`);
    if (enabledDeps.some(d => d.type === 'database')) {
      lines.push(`import { createClient } from "https://esm.sh/@supabase/supabase-js@2";`);
    }
    lines.push(``);
    lines.push(`const startTime = Date.now();`);
    lines.push(``);

    lines.push(`interface CheckResult {`);
    lines.push(`  name: string;`);
    lines.push(`  status: 'healthy' | 'unhealthy' | 'degraded';`);
    lines.push(`  responseMs: number;`);
    lines.push(`  error?: string;`);
    lines.push(`}`);
    lines.push(``);

    enabledDeps.forEach(dep => {
      const fnName = `check${dep.name.replace(/[^a-zA-Z0-9]/g, '')}`;
      lines.push(`async function ${fnName}(): Promise<CheckResult> {`);
      lines.push(`  const start = Date.now();`);
      lines.push(`  try {`);
      if (dep.type === 'database') {
        lines.push(`    const supabase = createClient(`);
        lines.push(`      Deno.env.get("SUPABASE_URL") ?? "",`);
        lines.push(`      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""`);
        lines.push(`    );`);
        lines.push(`    const { error } = await supabase.from("_health").select("*").limit(1);`);
        lines.push(`    if (error && !error.message.includes('does not exist')) throw error;`);
      } else if (dep.type === 'api') {
        lines.push(`    const controller = new AbortController();`);
        lines.push(`    const timeout = setTimeout(() => controller.abort(), ${dep.timeoutMs});`);
        lines.push(`    const res = await fetch("${dep.endpoint}", { signal: controller.signal });`);
        lines.push(`    clearTimeout(timeout);`);
        lines.push(`    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);`);
      } else {
        lines.push(`    // Custom check for ${dep.name}`);
        lines.push(`    await new Promise(r => setTimeout(r, 10));`);
      }
      lines.push(`    return { name: "${dep.name}", status: "healthy", responseMs: Date.now() - start };`);
      lines.push(`  } catch (err) {`);
      lines.push(`    return { name: "${dep.name}", status: "unhealthy", responseMs: Date.now() - start, error: String(err) };`);
      lines.push(`  }`);
      lines.push(`}`);
      lines.push(``);
    });

    lines.push(`serve(async (_req) => {`);
    lines.push(`  const checks = await Promise.all([`);
    enabledDeps.forEach(dep => {
      const fnName = `check${dep.name.replace(/[^a-zA-Z0-9]/g, '')}`;
      lines.push(`    ${fnName}(),`);
    });
    lines.push(`  ]);`);
    lines.push(``);
    lines.push(`  const criticalDeps = ${JSON.stringify(enabledDeps.filter(d => d.critical).map(d => d.name))};`);
    lines.push(`  const criticalFailed = checks.some(c => criticalDeps.includes(c.name) && c.status === 'unhealthy');`);
    lines.push(`  const anyUnhealthy = checks.some(c => c.status === 'unhealthy');`);
    lines.push(`  const overallStatus = criticalFailed ? 'unhealthy' : anyUnhealthy ? 'degraded' : 'healthy';`);
    lines.push(``);
    lines.push(`  const response: Record<string, unknown> = {`);
    lines.push(`    status: overallStatus,`);
    if (c.includeVersion) lines.push(`    version: Deno.env.get("APP_VERSION") ?? "1.0.0",`);
    if (c.includeUptime) lines.push(`    uptimeMs: Date.now() - startTime,`);
    if (c.includeMemory) lines.push(`    // memory: Deno.memoryUsage(), // Uncomment if available`);
    if (c.format === 'detailed') lines.push(`    checks,`);
    lines.push(`    timestamp: new Date().toISOString(),`);
    lines.push(`  };`);
    lines.push(``);
    lines.push(`  return new Response(JSON.stringify(response, null, 2), {`);
    lines.push(`    status: overallStatus === 'unhealthy' ? 503 : 200,`);
    lines.push(`    headers: { "Content-Type": "application/json" },`);
    lines.push(`  });`);
    lines.push(`});`);
    return lines.join('\n');
  }, [config]);

  const generateReactComponent = useCallback((): string => {
    return `import { useState, useEffect } from 'react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'loading';
  checks?: { name: string; status: string; responseMs: number; error?: string }[];
  uptimeMs?: number;
  version?: string;
}

export function HealthStatusBadge({ endpoint = '${config.path}' }: { endpoint?: string }) {
  const [health, setHealth] = useState<HealthStatus>({ status: 'loading' });

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        setHealth(data);
      } catch {
        setHealth({ status: 'unhealthy' });
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [endpoint]);

  const colors = { healthy: 'bg-green-500', degraded: 'bg-yellow-500', unhealthy: 'bg-red-500', loading: 'bg-gray-400' };

  return (
    <div className="flex items-center gap-2">
      <div className={\`h-2 w-2 rounded-full \${colors[health.status]}\`} />
      <span className="text-xs text-muted-foreground capitalize">{health.status}</span>
    </div>
  );
}`;
  }, [config.path]);

  return { config, setConfig, addDependency, removeDependency, toggleDependency, updateDependency, generateEdgeFunction, generateReactComponent };
}
