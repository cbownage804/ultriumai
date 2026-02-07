import JSZip from 'jszip';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import { SERVICE_CATALOG } from './ProjectSettings';

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-app';

// ── Export Modes ───────────────────────────────────────────

export type ExportMode = 'raw' | 'docker' | 'fullstack';

export interface ExportContext {
  supabaseConfig?: SupabaseConfig | null;
  stripeConfig?: StripeConfig | null;
  serviceKeys?: ServiceKey[];
  envVars?: EnvVar[];
  cdnPackages?: Array<{ name: string; version: string }>;
}

// ── Full-Stack Scaffolding ─────────────────────────────────

function getFullStackFiles(
  projectName: string,
  userFiles: ProjectFile[],
  ctx: ExportContext
): Record<string, string> {
  const slug = slugify(projectName);
  const hasSupabase = !!ctx.supabaseConfig;
  const hasStripe = !!ctx.stripeConfig;
  const serviceKeysUsed = ctx.serviceKeys?.filter(sk => sk.apiKey) || [];
  const envVarsUsed = ctx.envVars?.filter(ev => ev.key && ev.value) || [];
  const cdnPkgs = ctx.cdnPackages || [];

  // ── package.json ──
  const deps: Record<string, string> = {
    react: '^18.3.1',
    'react-dom': '^18.3.1',
  };
  if (hasSupabase) deps['@supabase/supabase-js'] = '^2.50.0';
  if (hasStripe) deps['@stripe/stripe-js'] = '^4.0.0';
  for (const pkg of cdnPkgs) {
    deps[pkg.name] = pkg.version || 'latest';
  }

  const packageJson = JSON.stringify({
    name: slug,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: deps,
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.4',
      vite: '^6.0.0',
    },
  }, null, 2);

  // ── .env.example ──
  const envLines: string[] = [
    '# ============================================',
    `# ${projectName} — Environment Configuration`,
    '# ============================================',
    '# Copy this file to .env and fill in your values.',
    '# NEVER commit your .env file to version control.',
    '',
  ];

  if (hasSupabase) {
    envLines.push(
      '# ── Supabase ──',
      '# Create a free project at https://supabase.com/dashboard',
      '# Then go to Settings → API to find these values.',
      'VITE_SUPABASE_URL=your-supabase-project-url',
      'VITE_SUPABASE_ANON_KEY=your-supabase-anon-key',
      '',
    );
  }

  if (hasStripe) {
    envLines.push(
      '# ── Stripe ──',
      '# Get your publishable key at https://dashboard.stripe.com/apikeys',
      'VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...',
      '',
    );
  }

  for (const sk of serviceKeysUsed) {
    const catalog = SERVICE_CATALOG.find(s => s.id === sk.serviceId);
    if (catalog) {
      envLines.push(
        `# ── ${catalog.name} ──`,
        `# Get your key at ${catalog.helpUrl}`,
        `VITE_${catalog.envKeyName}=${catalog.placeholder}`,
        '',
      );
    }
  }

  for (const ev of envVarsUsed) {
    envLines.push(`VITE_${ev.key}=your-value-here`);
  }

  // ── .env (pre-filled with current values for convenience) ──
  const envActualLines: string[] = [
    '# Auto-generated from your App Builder configuration.',
    '# Review and update these values for your own hosting.',
    '',
  ];
  if (hasSupabase) {
    envActualLines.push(
      `VITE_SUPABASE_URL=${ctx.supabaseConfig!.url}`,
      `VITE_SUPABASE_ANON_KEY=${ctx.supabaseConfig!.anonKey}`,
      '',
    );
  }
  if (hasStripe) {
    envActualLines.push(`VITE_STRIPE_PUBLISHABLE_KEY=${ctx.stripeConfig!.publishableKey}`, '');
  }
  for (const sk of serviceKeysUsed) {
    const catalog = SERVICE_CATALOG.find(s => s.id === sk.serviceId);
    if (catalog) {
      envActualLines.push(`VITE_${catalog.envKeyName}=${sk.apiKey}`);
    }
  }
  for (const ev of envVarsUsed) {
    envActualLines.push(`VITE_${ev.key}=${ev.value}`);
  }

  // ── Supabase client helper ──
  let supabaseClient = '';
  if (hasSupabase) {
    supabaseClient = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase config. Copy .env.example to .env and add your project URL + anon key.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
`;
  }

  // ── Stripe helper ──
  let stripeHelper = '';
  if (hasStripe) {
    stripeHelper = `import { loadStripe } from '@stripe/stripe-js';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripeKey) {
  console.error(
    'Missing Stripe publishable key. Copy .env.example to .env and add your key.'
  );
}

export const stripePromise = loadStripe(stripeKey || '');
`;
  }

  // ── vite.config.js ──
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000 },
});
`;

  // ── index.html ──
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

  // ── main.jsx ──
  const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

  // ── App.jsx (inlines user HTML/CSS/JS) ──
  const htmlFile = userFiles.find(f => f.path === 'index.html') || userFiles.find(f => f.language === 'html');
  const cssFiles = userFiles.filter(f => f.language === 'css');
  const jsFiles = userFiles.filter(f => f.language === 'javascript' || f.language === 'typescript');
  const cssImports = cssFiles.map((_, i) => `import './user-styles-${i}.css';`).join('\n');

  const appJsx = `import React, { useEffect, useRef } from 'react';
${cssImports}

const USER_HTML = ${JSON.stringify(htmlFile?.content || '<div>No HTML content</div>')};
const USER_SCRIPTS = ${JSON.stringify(jsFiles.map(f => f.content))};

export default function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    for (const script of USER_SCRIPTS) {
      try {
        const fn = new Function(script);
        fn();
      } catch (e) {
        console.warn('Script error:', e);
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: USER_HTML }}
    />
  );
}
`;

  // ── Dockerfile ──
  const dockerfile = `# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

  const nginxConf = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
`;

  const dockerIgnore = `node_modules
dist
.git
.gitignore
*.md
.env
`;

  // ── .gitignore ──
  const gitignore = `node_modules/
dist/
.env
.DS_Store
`;

  // ── README ──
  const readmeLines = [
    `# ${projectName}`,
    '',
    `Built with [UltriumAI App Builder](https://ultriumai.com).`,
    '',
    '## Quick Start',
    '',
    '```bash',
    'npm install',
    'cp .env.example .env   # then edit .env with your keys',
    'npm run dev',
    '```',
    '',
  ];

  if (hasSupabase) {
    readmeLines.push(
      '## Supabase Setup',
      '',
      'This app uses [Supabase](https://supabase.com) for backend services.',
      '',
      '1. Create a free Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard)',
      '2. Go to **Settings → API** and copy your **Project URL** and **anon key**',
      '3. Paste them into your `.env` file',
      '4. If this project uses database tables, import the schema:',
      '   - Open the **SQL Editor** in your Supabase dashboard',
      '   - Paste the contents of `supabase/schema.sql` and run it',
      '5. If this project uses **Storage**, create the required buckets in **Storage → New Bucket**',
      '6. If this project uses **Auth**, configure your providers in **Authentication → Providers**',
      '',
      '> **Note:** The `supabase/schema.sql` file contains the table definitions used by this app.',
      '> Review and customize it for your own project.',
      '',
    );
  }

  if (hasStripe) {
    readmeLines.push(
      '## Stripe Setup',
      '',
      '1. Get your publishable key from [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)',
      '2. Add it to your `.env` as `VITE_STRIPE_PUBLISHABLE_KEY`',
      '',
    );
  }

  if (serviceKeysUsed.length > 0) {
    readmeLines.push(
      '## API Keys Required',
      '',
      '| Service | Env Variable | Get Key |',
      '|---------|-------------|---------|',
    );
    for (const sk of serviceKeysUsed) {
      const catalog = SERVICE_CATALOG.find(s => s.id === sk.serviceId);
      if (catalog) {
        readmeLines.push(`| ${catalog.name} | \`VITE_${catalog.envKeyName}\` | [${catalog.helpUrl}](${catalog.helpUrl}) |`);
      }
    }
    readmeLines.push('');
  }

  readmeLines.push(
    '## Deployment',
    '',
    '### Vercel / Netlify',
    '```bash',
    'npm run build',
    '# Deploy the dist/ folder',
    '```',
    '',
    '### Docker',
    '```bash',
    `docker build -t ${slug} .`,
    `docker run -p 8080:80 ${slug}`,
    '```',
    '',
    'Then open http://localhost:8080',
    '',
  );

  // ── Supabase schema placeholder ──
  let schemaSQL = '';
  if (hasSupabase) {
    schemaSQL = `-- ============================================
-- ${projectName} — Supabase Database Schema
-- ============================================
-- 
-- This file contains the database tables used by your app.
-- Run this in your Supabase SQL Editor to set up your database.
--
-- Steps:
-- 1. Go to https://supabase.com/dashboard → your project → SQL Editor
-- 2. Paste this entire file and click "Run"
-- 3. Verify tables were created in Table Editor
--
-- IMPORTANT: Review and customize the schema below.
-- Add Row Level Security (RLS) policies for production use.
-- ============================================

-- Example: Enable RLS on all tables you create
-- ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own data"
--   ON your_table FOR SELECT
--   USING (auth.uid() = user_id);

-- Add your table definitions below:
-- (If your app created tables during development, paste those schemas here)

`;
  }

  // ── Assemble files map ──
  const files: Record<string, string> = {
    'package.json': packageJson,
    'vite.config.js': viteConfig,
    'index.html': indexHtml,
    'src/main.jsx': mainJsx,
    'src/App.jsx': appJsx,
    '.env.example': envLines.join('\n'),
    '.env': envActualLines.join('\n'),
    '.gitignore': gitignore,
    'Dockerfile': dockerfile,
    'nginx.conf': nginxConf,
    '.dockerignore': dockerIgnore,
    'README.md': readmeLines.join('\n'),
  };

  if (hasSupabase) {
    files['src/lib/supabase.js'] = supabaseClient;
    files['supabase/schema.sql'] = schemaSQL;
  }
  if (hasStripe) {
    files['src/lib/stripe.js'] = stripeHelper;
  }

  // Add user CSS files
  cssFiles.forEach((f, i) => {
    files[`src/user-styles-${i}.css`] = f.content;
  });

  return files;
}

/** Generate scaffolding files for a Docker-ready React+Vite project (legacy) */
function getScaffoldingFiles(projectName: string, userFiles: ProjectFile[]): Record<string, string> {
  const slug = slugify(projectName);

  const packageJson = JSON.stringify({
    name: slug,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.4',
      vite: '^6.0.0',
    },
  }, null, 2);

  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000 },
});
`;

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

  const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

  const htmlFile = userFiles.find(f => f.path === 'index.html') || userFiles.find(f => f.language === 'html');
  const cssFiles = userFiles.filter(f => f.language === 'css');
  const jsFiles = userFiles.filter(f => f.language === 'javascript' || f.language === 'typescript');
  const cssImports = cssFiles.map((_, i) => `import './user-styles-${i}.css';`).join('\n');

  const appJsx = `import React, { useEffect, useRef } from 'react';
${cssImports}

const USER_HTML = ${JSON.stringify(htmlFile?.content || '<div>No HTML content</div>')};
const USER_SCRIPTS = ${JSON.stringify(jsFiles.map(f => f.content))};

export default function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    for (const script of USER_SCRIPTS) {
      try {
        const fn = new Function(script);
        fn();
      } catch (e) {
        console.warn('Script error:', e);
      }
    }
  }, []);

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: USER_HTML }}
    />
  );
}
`;

  const dockerfile = `# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

  const nginxConf = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
`;

  const dockerIgnore = `node_modules
dist
.git
.gitignore
*.md
`;

  const readme = `# ${projectName}

Generated by AI App Builder.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Docker Deployment

\`\`\`bash
docker build -t ${slug} .
docker run -p 8080:80 ${slug}
\`\`\`

Then open http://localhost:8080
`;

  const files: Record<string, string> = {
    'package.json': packageJson,
    'vite.config.js': viteConfig,
    'index.html': indexHtml,
    'src/main.jsx': mainJsx,
    'src/App.jsx': appJsx,
    'Dockerfile': dockerfile,
    'nginx.conf': nginxConf,
    '.dockerignore': dockerIgnore,
    'README.md': readme,
  };

  cssFiles.forEach((f, i) => {
    files[`src/user-styles-${i}.css`] = f.content;
  });

  return files;
}

export async function exportProject(
  projectName: string,
  files: ProjectFile[],
  mode: ExportMode,
  ctx: ExportContext = {}
): Promise<void> {
  const zip = new JSZip();
  const slug = slugify(projectName);

  if (mode === 'raw') {
    for (const file of files) {
      zip.file(file.path, file.content);
    }
  } else if (mode === 'docker') {
    const scaffolding = getScaffoldingFiles(projectName, files);
    for (const [path, content] of Object.entries(scaffolding)) {
      zip.file(path, content);
    }
    for (const file of files) {
      zip.file(`src/original/${file.path}`, file.content);
    }
  } else if (mode === 'fullstack') {
    const fullStackFiles = getFullStackFiles(projectName, files, ctx);
    for (const [path, content] of Object.entries(fullStackFiles)) {
      zip.file(path, content);
    }
    // Also include original source files
    for (const file of files) {
      zip.file(`src/original/${file.path}`, file.content);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const suffixMap: Record<ExportMode, string> = { raw: '', docker: '-docker', fullstack: '-fullstack' };
  a.download = `${slug}${suffixMap[mode]}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
