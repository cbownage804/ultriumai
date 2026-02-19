import { useState, useCallback } from 'react';

export interface DockerService {
  id: string;
  name: string;
  image: string;
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  dependsOn: string[];
  restart: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  healthcheck?: string;
  enabled: boolean;
}

export interface DockerComposeConfig {
  version: string;
  projectName: string;
  services: DockerService[];
  buildTarget: 'development' | 'production';
  useMultiStage: boolean;
  nodeVersion: string;
}

const PRESETS: Record<string, Omit<DockerService, 'id'>[]> = {
  'react-app': [
    { name: 'app', image: 'node:20-alpine', ports: ['3000:3000'], environment: { NODE_ENV: 'production' }, volumes: ['./:/app', '/app/node_modules'], dependsOn: [], restart: 'unless-stopped', enabled: true },
  ],
  'fullstack': [
    { name: 'app', image: 'node:20-alpine', ports: ['3000:3000'], environment: { NODE_ENV: 'production', DATABASE_URL: 'postgres://postgres:postgres@db:5432/app' }, volumes: ['./:/app'], dependsOn: ['db'], restart: 'unless-stopped', enabled: true },
    { name: 'db', image: 'postgres:16-alpine', ports: ['5432:5432'], environment: { POSTGRES_USER: 'postgres', POSTGRES_PASSWORD: 'postgres', POSTGRES_DB: 'app' }, volumes: ['pgdata:/var/lib/postgresql/data'], dependsOn: [], restart: 'unless-stopped', enabled: true },
  ],
  'fullstack-redis': [
    { name: 'app', image: 'node:20-alpine', ports: ['3000:3000'], environment: { NODE_ENV: 'production', DATABASE_URL: 'postgres://postgres:postgres@db:5432/app', REDIS_URL: 'redis://redis:6379' }, volumes: ['./:/app'], dependsOn: ['db', 'redis'], restart: 'unless-stopped', enabled: true },
    { name: 'db', image: 'postgres:16-alpine', ports: ['5432:5432'], environment: { POSTGRES_USER: 'postgres', POSTGRES_PASSWORD: 'postgres', POSTGRES_DB: 'app' }, volumes: ['pgdata:/var/lib/postgresql/data'], dependsOn: [], restart: 'unless-stopped', enabled: true },
    { name: 'redis', image: 'redis:7-alpine', ports: ['6379:6379'], environment: {}, volumes: ['redisdata:/data'], dependsOn: [], restart: 'unless-stopped', enabled: true },
  ],
  'with-nginx': [
    { name: 'app', image: 'node:20-alpine', ports: [], environment: { NODE_ENV: 'production' }, volumes: ['./:/app'], dependsOn: [], restart: 'unless-stopped', enabled: true },
    { name: 'nginx', image: 'nginx:alpine', ports: ['80:80', '443:443'], environment: {}, volumes: ['./nginx.conf:/etc/nginx/conf.d/default.conf:ro'], dependsOn: ['app'], restart: 'unless-stopped', enabled: true },
  ],
};

export function useDockerComposeGenerator() {
  const [config, setConfig] = useState<DockerComposeConfig>({
    version: '3.9',
    projectName: 'my-app',
    services: PRESETS['react-app'].map(s => ({ ...s, id: crypto.randomUUID() })),
    buildTarget: 'production',
    useMultiStage: true,
    nodeVersion: '20',
  });

  const presetKeys = Object.keys(PRESETS);

  const applyPreset = useCallback((key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setConfig(prev => ({ ...prev, services: preset.map(s => ({ ...s, id: crypto.randomUUID() })) }));
  }, []);

  const addService = useCallback((name: string, image: string) => {
    setConfig(prev => ({
      ...prev,
      services: [...prev.services, { id: crypto.randomUUID(), name, image, ports: [], environment: {}, volumes: [], dependsOn: [], restart: 'unless-stopped', enabled: true }],
    }));
  }, []);

  const removeService = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) }));
  }, []);

  const updateService = useCallback((id: string, updates: Partial<DockerService>) => {
    setConfig(prev => ({ ...prev, services: prev.services.map(s => s.id === id ? { ...s, ...updates } : s) }));
  }, []);

  const generateDockerfile = useCallback((): string => {
    const lines: string[] = [];
    if (config.useMultiStage) {
      lines.push(`# Build stage`);
      lines.push(`FROM node:${config.nodeVersion}-alpine AS builder`);
      lines.push(`WORKDIR /app`);
      lines.push(`COPY package*.json ./`);
      lines.push(`RUN npm ci`);
      lines.push(`COPY . .`);
      lines.push(`RUN npm run build`);
      lines.push(``);
      lines.push(`# Production stage`);
      lines.push(`FROM nginx:alpine AS production`);
      lines.push(`COPY --from=builder /app/dist /usr/share/nginx/html`);
      lines.push(`COPY nginx.conf /etc/nginx/conf.d/default.conf`);
      lines.push(`EXPOSE 80`);
      lines.push(`CMD ["nginx", "-g", "daemon off;"]`);
    } else {
      lines.push(`FROM node:${config.nodeVersion}-alpine`);
      lines.push(`WORKDIR /app`);
      lines.push(`COPY package*.json ./`);
      lines.push(`RUN npm ci --only=production`);
      lines.push(`COPY . .`);
      lines.push(`RUN npm run build`);
      lines.push(`EXPOSE 3000`);
      lines.push(`CMD ["npm", "start"]`);
    }
    return lines.join('\n');
  }, [config]);

  const generateCompose = useCallback((): string => {
    const lines: string[] = [];
    lines.push(`version: '${config.version}'`);
    lines.push(``);
    lines.push(`services:`);
    config.services.filter(s => s.enabled).forEach(svc => {
      lines.push(`  ${svc.name}:`);
      if (svc.name === 'app') {
        lines.push(`    build:`);
        lines.push(`      context: .`);
        lines.push(`      dockerfile: Dockerfile`);
        if (config.useMultiStage) lines.push(`      target: ${config.buildTarget}`);
      } else {
        lines.push(`    image: ${svc.image}`);
      }
      if (svc.ports.length > 0) {
        lines.push(`    ports:`);
        svc.ports.forEach(p => lines.push(`      - "${p}"`));
      }
      if (Object.keys(svc.environment).length > 0) {
        lines.push(`    environment:`);
        Object.entries(svc.environment).forEach(([k, v]) => lines.push(`      ${k}: "${v}"`));
      }
      if (svc.volumes.length > 0) {
        lines.push(`    volumes:`);
        svc.volumes.forEach(v => lines.push(`      - ${v}`));
      }
      if (svc.dependsOn.length > 0) {
        lines.push(`    depends_on:`);
        svc.dependsOn.forEach(d => lines.push(`      - ${d}`));
      }
      lines.push(`    restart: ${svc.restart}`);
      lines.push(``);
    });
    // Named volumes
    const namedVolumes = config.services.flatMap(s => s.volumes).filter(v => !v.startsWith('.') && !v.startsWith('/') && v.includes(':')).map(v => v.split(':')[0]);
    if (namedVolumes.length > 0) {
      lines.push(`volumes:`);
      [...new Set(namedVolumes)].forEach(v => lines.push(`  ${v}:`));
    }
    return lines.join('\n');
  }, [config]);

  const generateNginxConf = useCallback((): string => {
    return `server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://app:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml;
}`;
  }, []);

  return { config, setConfig, presetKeys, applyPreset, addService, removeService, updateService, generateDockerfile, generateCompose, generateNginxConf };
}
