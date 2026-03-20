import { useState, useCallback } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * Wave 17: Deploy Pipeline & DevOps
 * Production readiness checks, environment variable validation,
 * deploy scaffolding, and CI/CD pipeline generation.
 */

export interface ReadinessCheck {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  category: 'security' | 'performance' | 'seo' | 'structure' | 'env';
  autoFixable: boolean;
}

export interface DeployReadiness {
  ready: boolean;
  score: number;
  checks: ReadinessCheck[];
  blockers: ReadinessCheck[];
  warnings: ReadinessCheck[];
  timestamp: number;
}

export interface EnvVariable {
  key: string;
  required: boolean;
  present: boolean;
  source: 'code' | 'config' | 'env';
  file: string;
}

// ── Production readiness checks ──

function checkSecurityIssues(files: ProjectFile[]): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];

  for (const f of files) {
    if (!/\.(tsx?|jsx?|env)$/.test(f.path)) continue;

    // Hardcoded API keys (exclude publishable/anon keys)
    const keyPatterns = /(?:api[_-]?key|secret[_-]?key|private[_-]?key|password)\s*[:=]\s*['"][^'"]{10,}['"]/gi;
    const matches = f.content.match(keyPatterns) || [];
    const realSecrets = matches.filter(m =>
      !/publishable|anon|public|test|demo|example|placeholder/i.test(m)
    );
    if (realSecrets.length > 0) {
      checks.push({
        id: `secret-${f.path}`,
        name: 'Hardcoded secrets detected',
        status: 'fail',
        message: `${realSecrets.length} potential secret(s) in ${f.path}. Move to environment variables.`,
        category: 'security',
        autoFixable: false,
      });
    }

    // Console.log statements
    const consoleLogs = (f.content.match(/console\.(log|debug|info)\(/g) || []).length;
    if (consoleLogs > 5) {
      checks.push({
        id: `console-${f.path}`,
        name: 'Excessive console logs',
        status: 'warning',
        message: `${consoleLogs} console.log calls in ${f.path}. Remove or guard for production.`,
        category: 'security',
        autoFixable: true,
      });
    }
  }

  if (checks.filter(c => c.category === 'security' && c.status === 'fail').length === 0) {
    checks.push({
      id: 'security-pass',
      name: 'No hardcoded secrets',
      status: 'pass',
      message: 'No API keys or secrets found in source code.',
      category: 'security',
      autoFixable: false,
    });
  }

  return checks;
}

function checkSEO(files: ProjectFile[]): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];
  const htmlFile = files.find(f => f.path === 'index.html');

  if (htmlFile) {
    const hasTitle = /<title>[^<]+<\/title>/.test(htmlFile.content);
    const hasMetaDesc = /meta\s+name=["']description["']/.test(htmlFile.content);
    const hasViewport = /meta\s+name=["']viewport["']/.test(htmlFile.content);
    const hasOG = /meta\s+property=["']og:/.test(htmlFile.content);
    const hasFavicon = /link\s+[^>]*rel=["']icon["']/.test(htmlFile.content);

    checks.push({
      id: 'seo-title', name: 'Page title', status: hasTitle ? 'pass' : 'fail',
      message: hasTitle ? 'Title tag present' : 'Missing <title> tag in index.html',
      category: 'seo', autoFixable: true,
    });
    checks.push({
      id: 'seo-desc', name: 'Meta description', status: hasMetaDesc ? 'pass' : 'warning',
      message: hasMetaDesc ? 'Meta description present' : 'Missing meta description for SEO',
      category: 'seo', autoFixable: true,
    });
    checks.push({
      id: 'seo-viewport', name: 'Viewport meta', status: hasViewport ? 'pass' : 'fail',
      message: hasViewport ? 'Viewport configured' : 'Missing viewport meta tag — breaks mobile',
      category: 'seo', autoFixable: true,
    });
    checks.push({
      id: 'seo-og', name: 'Open Graph tags', status: hasOG ? 'pass' : 'warning',
      message: hasOG ? 'OG tags present' : 'Missing og: meta tags for social sharing',
      category: 'seo', autoFixable: true,
    });
    checks.push({
      id: 'seo-favicon', name: 'Favicon', status: hasFavicon ? 'pass' : 'warning',
      message: hasFavicon ? 'Favicon configured' : 'Missing favicon — add for browser tab icon',
      category: 'seo', autoFixable: true,
    });
  }

  return checks;
}

function checkStructure(files: ProjectFile[]): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [];

  const hasMainEntry = files.some(f => /main\.(tsx?|jsx?)$/.test(f.path));
  const hasAppComponent = files.some(f => /App\.(tsx?|jsx?)$/.test(f.path));
  const hasIndexHtml = files.some(f => f.path === 'index.html');
  const hasCSS = files.some(f => /\.(css|scss)$/.test(f.path));
  const hasErrorBoundary = files.some(f => /error.?boundary/i.test(f.path) || f.content.includes('componentDidCatch') || f.content.includes('ErrorBoundary'));

  checks.push({
    id: 'struct-main', name: 'Entry point', status: hasMainEntry ? 'pass' : 'fail',
    message: hasMainEntry ? 'main.tsx entry found' : 'Missing main.tsx — app won\'t start',
    category: 'structure', autoFixable: true,
  });
  checks.push({
    id: 'struct-app', name: 'App component', status: hasAppComponent ? 'pass' : 'fail',
    message: hasAppComponent ? 'App component found' : 'Missing App component',
    category: 'structure', autoFixable: true,
  });
  checks.push({
    id: 'struct-html', name: 'Index HTML', status: hasIndexHtml ? 'pass' : 'fail',
    message: hasIndexHtml ? 'index.html found' : 'Missing index.html shell',
    category: 'structure', autoFixable: true,
  });
  checks.push({
    id: 'struct-css', name: 'Stylesheets', status: hasCSS ? 'pass' : 'warning',
    message: hasCSS ? 'CSS found' : 'No CSS files — app may be unstyled',
    category: 'structure', autoFixable: false,
  });
  checks.push({
    id: 'struct-error', name: 'Error boundary', status: hasErrorBoundary ? 'pass' : 'warning',
    message: hasErrorBoundary ? 'Error boundary present' : 'Consider adding an error boundary for production resilience',
    category: 'structure', autoFixable: true,
  });

  return checks;
}

function detectEnvVariables(files: ProjectFile[]): EnvVariable[] {
  const envVars: Map<string, EnvVariable> = new Map();

  for (const f of files) {
    // import.meta.env.VITE_*
    const viteEnvMatches = f.content.match(/import\.meta\.env\.(\w+)/g) || [];
    for (const match of viteEnvMatches) {
      const key = match.replace('import.meta.env.', '');
      if (!envVars.has(key)) {
        envVars.set(key, {
          key,
          required: true,
          present: key.startsWith('VITE_SUPABASE_') || key === 'DEV' || key === 'PROD' || key === 'MODE',
          source: 'code',
          file: f.path,
        });
      }
    }

    // process.env.*
    const processEnvMatches = f.content.match(/process\.env\.(\w+)/g) || [];
    for (const match of processEnvMatches) {
      const key = match.replace('process.env.', '');
      if (!envVars.has(key)) {
        envVars.set(key, { key, required: true, present: false, source: 'code', file: f.path });
      }
    }

    // Deno.env.get('*')
    const denoEnvMatches = f.content.match(/Deno\.env\.get\(['"](\w+)['"]\)/g) || [];
    for (const match of denoEnvMatches) {
      const key = match.match(/['"](\w+)['"]/)?.[1] || '';
      if (key && !envVars.has(key)) {
        const isBuiltIn = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'].includes(key);
        envVars.set(key, { key, required: true, present: isBuiltIn, source: 'code', file: f.path });
      }
    }
  }

  return [...envVars.values()];
}

// ── CI/CD templates ──
export function generateGitHubActions(): string {
  return `name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Deploy to hosting
        run: echo "Add your deploy step here (Vercel, Netlify, etc.)"
`;
}

export function generateDockerfile(): string {
  return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;
}

export function generateNginxConf(): string {
  return `server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
`;
}

export function useDeployPipeline() {
  const [readiness, setReadiness] = useState<DeployReadiness | null>(null);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const runReadinessChecks = useCallback((files: ProjectFile[]): DeployReadiness => {
    setIsChecking(true);

    const allChecks = [
      ...checkSecurityIssues(files),
      ...checkSEO(files),
      ...checkStructure(files),
    ];

    // Add env variable checks
    const detected = detectEnvVariables(files);
    setEnvVars(detected);

    const missingEnv = detected.filter(v => v.required && !v.present);
    if (missingEnv.length > 0) {
      allChecks.push({
        id: 'env-missing',
        name: 'Missing environment variables',
        status: 'warning',
        message: `${missingEnv.length} env var(s) used in code but may not be configured: ${missingEnv.map(v => v.key).join(', ')}`,
        category: 'env',
        autoFixable: false,
      });
    } else {
      allChecks.push({
        id: 'env-ok',
        name: 'Environment variables',
        status: 'pass',
        message: 'All detected env variables appear configured.',
        category: 'env',
        autoFixable: false,
      });
    }

    const blockers = allChecks.filter(c => c.status === 'fail');
    const warnings = allChecks.filter(c => c.status === 'warning');
    const passCount = allChecks.filter(c => c.status === 'pass').length;
    const score = Math.round((passCount / allChecks.length) * 100);

    const result: DeployReadiness = {
      ready: blockers.length === 0,
      score,
      checks: allChecks,
      blockers,
      warnings,
      timestamp: Date.now(),
    };

    setReadiness(result);
    setIsChecking(false);
    return result;
  }, []);

  const clearReadiness = useCallback(() => {
    setReadiness(null);
    setEnvVars([]);
  }, []);

  return {
    readiness,
    envVars,
    isChecking,
    runReadinessChecks,
    clearReadiness,
    generateGitHubActions,
    generateDockerfile,
    generateNginxConf,
  };
}
