import { useState, useCallback } from 'react';

export interface DockerConfig {
  baseImage: string;
  nodeVersion: string;
  port: number;
  envVars: { key: string; value: string; isSecret: boolean }[];
  buildCommand: string;
  startCommand: string;
  enableNginx: boolean;
  enableSSL: boolean;
  enableHealthCheck: boolean;
  volumes: string[];
  exposePort: boolean;
}

export interface ComposeService {
  id: string;
  name: string;
  type: 'app' | 'database' | 'cache' | 'proxy' | 'worker';
  image: string;
  ports: string[];
  envVars: { key: string; value: string }[];
  dependsOn: string[];
  volumes: string[];
}

export function useDockerExport() {
  const [config, setConfig] = useState<DockerConfig>({
    baseImage: 'node:20-alpine', nodeVersion: '20', port: 3000,
    envVars: [], buildCommand: 'npm run build', startCommand: 'npm start',
    enableNginx: true, enableSSL: false, enableHealthCheck: true,
    volumes: [], exposePort: true,
  });
  const [services, setServices] = useState<ComposeService[]>([]);

  const addEnvVar = useCallback((key: string, value: string, isSecret = false) => {
    setConfig(prev => ({ ...prev, envVars: [...prev.envVars, { key, value, isSecret }] }));
  }, []);

  const removeEnvVar = useCallback((key: string) => {
    setConfig(prev => ({ ...prev, envVars: prev.envVars.filter(e => e.key !== key) }));
  }, []);

  const addService = useCallback((name: string, type: ComposeService['type']) => {
    const presets: Record<string, Partial<ComposeService>> = {
      database: { image: 'postgres:16-alpine', ports: ['5432:5432'], envVars: [{ key: 'POSTGRES_DB', value: 'app' }, { key: 'POSTGRES_PASSWORD', value: 'password' }], volumes: ['pgdata:/var/lib/postgresql/data'] },
      cache: { image: 'redis:7-alpine', ports: ['6379:6379'], envVars: [], volumes: [] },
      proxy: { image: 'nginx:alpine', ports: ['80:80', '443:443'], envVars: [], volumes: ['./nginx.conf:/etc/nginx/nginx.conf'] },
      worker: { image: 'node:20-alpine', ports: [], envVars: [], volumes: [] },
    };
    const preset = presets[type] || {};
    const service: ComposeService = {
      id: crypto.randomUUID(), name, type, image: preset.image || 'node:20-alpine',
      ports: preset.ports || [], envVars: preset.envVars || [],
      dependsOn: type !== 'app' ? [] : services.filter(s => s.type === 'database').map(s => s.name),
      volumes: preset.volumes || [],
    };
    setServices(prev => [...prev, service]);
  }, [services]);

  const removeService = useCallback((id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  }, []);

  const generateDockerfile = useCallback((): string => {
    if (config.enableNginx) {
      return `# Stage 1: Build
FROM ${config.baseImage} AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN ${config.buildCommand}

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
${config.enableHealthCheck ? 'HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost/ || exit 1' : ''}
EXPOSE ${config.port}
CMD ["nginx", "-g", "daemon off;"]`;
    }
    return `FROM ${config.baseImage}
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN ${config.buildCommand}
${config.envVars.filter(e => !e.isSecret).map(e => `ENV ${e.key}=${e.value}`).join('\n')}
${config.enableHealthCheck ? `HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:${config.port}/ || exit 1` : ''}
${config.exposePort ? `EXPOSE ${config.port}` : ''}
CMD ["${config.startCommand.split(' ')[0]}", "${config.startCommand.split(' ').slice(1).join('", "')}"]`;
  }, [config]);

  const generateDockerCompose = useCallback((): string => {
    const allServices = [
      { name: 'app', build: '.', ports: [`${config.port}:${config.port}`], envVars: config.envVars.map(e => ({ key: e.key, value: e.value })), dependsOn: services.filter(s => s.type === 'database').map(s => s.name) },
      ...services,
    ];
    return `version: '3.8'

services:
${allServices.map(s => `  ${s.name}:
    ${'build' in s ? `build: ${(s as any).build}` : `image: ${(s as any).image}`}
${s.ports.length > 0 ? `    ports:\n${s.ports.map(p => `      - "${p}"`).join('\n')}` : ''}
${s.envVars.length > 0 ? `    environment:\n${s.envVars.map(e => `      - ${e.key}=${e.value}`).join('\n')}` : ''}
${s.dependsOn && s.dependsOn.length > 0 ? `    depends_on:\n${s.dependsOn.map(d => `      - ${d}`).join('\n')}` : ''}
    restart: unless-stopped`).join('\n\n')}

${services.some(s => s.volumes.length > 0) ? `volumes:\n${[...new Set(services.flatMap(s => s.volumes.map(v => v.split(':')[0])))].filter(v => !v.startsWith('.') && !v.startsWith('/')).map(v => `  ${v}:`).join('\n')}` : ''}`;
  }, [config, services]);

  const generateNginxConf = useCallback((): string => {
    return `server {
  listen ${config.port};
  root /usr/share/nginx/html;
  index index.html;

  # Enable gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml;

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
}`;
  }, [config]);

  return {
    config, setConfig, services,
    addEnvVar, removeEnvVar, addService, removeService,
    generateDockerfile, generateDockerCompose, generateNginxConf,
  };
}
