import JSZip from 'jszip';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import { SERVICE_CATALOG } from './ProjectSettings';

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-app';

// ── Export Modes ───────────────────────────────────────────

export type ExportMode = 'raw' | 'docker' | 'fullstack';

export interface EdgeFunctionMeta {
  name: string;
  status: 'deployed' | 'draft' | 'error';
}

export interface ExportContext {
  supabaseConfig?: SupabaseConfig | null;
  stripeConfig?: StripeConfig | null;
  serviceKeys?: ServiceKey[];
  envVars?: EnvVar[];
  cdnPackages?: Array<{ name: string; version: string }>;
  edgeFunctions?: EdgeFunctionMeta[];
  storageBuckets?: string[];
  authProviders?: string[];
}

// ── Full-Stack Scaffolding ─────────────────────────────────

// ── CDN URL → npm import rewriting ────────────────────────
function rewriteCdnImports(content: string, cdnPkgs: Array<{ name: string; version: string }>): string {
  let result = content;
  // Rewrite esm.sh imports: https://esm.sh/package@version → package
  result = result.replace(/['"]https?:\/\/esm\.sh\/([^@'"]+)(?:@[^'"]*)?['"]/g, (_, pkg) => `'${pkg}'`);
  // Rewrite cdn.jsdelivr.net imports
  result = result.replace(/['"]https?:\/\/cdn\.jsdelivr\.net\/npm\/([^@'"]+)(?:@[^'"]*)?(?:\/[^'"]*)?['"]/g, (_, pkg) => `'${pkg}'`);
  // Rewrite unpkg imports
  result = result.replace(/['"]https?:\/\/unpkg\.com\/([^@'"]+)(?:@[^'"]*)?(?:\/[^'"]*)?['"]/g, (_, pkg) => `'${pkg}'`);
  return result;
}

// ── Extract table names from user code for schema generation ──
function extractTableReferences(files: ProjectFile[]): string[] {
  const tables = new Set<string>();
  const patterns = [
    /\.from\(['"](\w+)['"]\)/g,           // supabase.from('table')
    /\.rpc\(['"](\w+)['"]\)/g,            // supabase.rpc('func')
    /INSERT\s+INTO\s+(?:public\.)?(\w+)/gi,
    /SELECT\s+.*?\s+FROM\s+(?:public\.)?(\w+)/gi,
    /UPDATE\s+(?:public\.)?(\w+)/gi,
    /DELETE\s+FROM\s+(?:public\.)?(\w+)/gi,
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi,
  ];
  for (const file of files) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(file.content)) !== null) {
        const name = match[1].toLowerCase();
        if (!['select', 'from', 'where', 'and', 'or', 'not', 'null', 'true', 'false'].includes(name)) {
          tables.add(name);
        }
      }
    }
  }
  return Array.from(tables);
}

// ── Generate schema SQL with RLS ──────────────────────────
function generateSchemaSQL(projectName: string, tables: string[], storageBuckets: string[]): string {
  const lines: string[] = [
    `-- ============================================`,
    `-- ${projectName} — Supabase Database Schema`,
    `-- ============================================`,
    `--`,
    `-- Run this in your Supabase SQL Editor to set up your database.`,
    `--`,
    `-- Steps:`,
    `-- 1. Go to https://supabase.com/dashboard → your project → SQL Editor`,
    `-- 2. Paste this entire file and click "Run"`,
    `-- 3. Verify tables were created in Table Editor`,
    `-- ============================================`,
    ``,
  ];

  if (tables.length > 0) {
    lines.push(`-- Detected tables used by your app: ${tables.join(', ')}`, ``);
    for (const table of tables) {
      lines.push(
        `-- ── ${table} ──────────────────────────────`,
        `-- Customize this schema based on your app's requirements.`,
        `CREATE TABLE IF NOT EXISTS public.${table} (`,
        `  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,`,
        `  user_id UUID NOT NULL,  -- references auth.users(id)`,
        `  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),`,
        `  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
        `  -- TODO: Add your columns here`,
        `);`,
        ``,
        `-- Enable Row Level Security`,
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`,
        ``,
        `-- RLS Policies: Users can only access their own data`,
        `CREATE POLICY "${table}_select_own" ON public.${table}`,
        `  FOR SELECT USING (auth.uid() = user_id);`,
        ``,
        `CREATE POLICY "${table}_insert_own" ON public.${table}`,
        `  FOR INSERT WITH CHECK (auth.uid() = user_id);`,
        ``,
        `CREATE POLICY "${table}_update_own" ON public.${table}`,
        `  FOR UPDATE USING (auth.uid() = user_id);`,
        ``,
        `CREATE POLICY "${table}_delete_own" ON public.${table}`,
        `  FOR DELETE USING (auth.uid() = user_id);`,
        ``,
        `-- Auto-update updated_at timestamp`,
        `CREATE OR REPLACE FUNCTION public.update_${table}_updated_at()`,
        `RETURNS TRIGGER AS $$`,
        `BEGIN`,
        `  NEW.updated_at = now();`,
        `  RETURN NEW;`,
        `END;`,
        `$$ LANGUAGE plpgsql;`,
        ``,
        `CREATE TRIGGER trg_${table}_updated_at`,
        `  BEFORE UPDATE ON public.${table}`,
        `  FOR EACH ROW EXECUTE FUNCTION public.update_${table}_updated_at();`,
        ``,
      );
    }
  } else {
    lines.push(
      `-- No tables were auto-detected in your code.`,
      `-- Add your CREATE TABLE statements below.`,
      ``,
    );
  }

  // Storage bucket setup
  if (storageBuckets.length > 0) {
    lines.push(
      `-- ── Storage Buckets ──────────────────────────`,
      `-- Create the storage buckets your app uses.`,
      ``,
    );
    for (const bucket of storageBuckets) {
      lines.push(
        `INSERT INTO storage.buckets (id, name, public)`,
        `VALUES ('${bucket}', '${bucket}', false)`,
        `ON CONFLICT (id) DO NOTHING;`,
        ``,
        `-- Storage policies for "${bucket}"`,
        `CREATE POLICY "${bucket}_select" ON storage.objects`,
        `  FOR SELECT USING (bucket_id = '${bucket}' AND auth.uid()::text = (storage.foldername(name))[1]);`,
        ``,
        `CREATE POLICY "${bucket}_insert" ON storage.objects`,
        `  FOR INSERT WITH CHECK (bucket_id = '${bucket}' AND auth.uid()::text = (storage.foldername(name))[1]);`,
        ``,
        `CREATE POLICY "${bucket}_update" ON storage.objects`,
        `  FOR UPDATE USING (bucket_id = '${bucket}' AND auth.uid()::text = (storage.foldername(name))[1]);`,
        ``,
        `CREATE POLICY "${bucket}_delete" ON storage.objects`,
        `  FOR DELETE USING (bucket_id = '${bucket}' AND auth.uid()::text = (storage.foldername(name))[1]);`,
        ``,
      );
    }
  }

  return lines.join('\n');
}

// ── Supabase CLI config.toml ──────────────────────────────
function generateSupabaseConfig(projectName: string): string {
  return `# Supabase CLI configuration for ${projectName}
# See: https://supabase.com/docs/guides/cli/config

[project]
id = "your-project-ref"

[api]
enabled = true
port = 54321
schemas = ["public", "storage"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323
api_url = "http://localhost"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false

[storage]
enabled = true
file_size_limit = "50MiB"
`;
}

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
  const edgeFns = ctx.edgeFunctions || [];
  const storageBuckets = ctx.storageBuckets || [];
  const authProviders = ctx.authProviders || [];

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
      ...(hasSupabase ? {
        'db:push': 'npx supabase db push',
        'db:reset': 'npx supabase db reset',
        'supabase:start': 'npx supabase start',
        'supabase:stop': 'npx supabase stop',
      } : {}),
    },
    dependencies: deps,
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.4',
      vite: '^6.0.0',
      ...(hasSupabase ? { supabase: '^2.0.0' } : {}),
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

  // ── App.jsx (inlines user HTML/CSS/JS with CDN rewrites) ──
  const htmlFile = userFiles.find(f => f.path === 'index.html') || userFiles.find(f => f.language === 'html');
  const cssFiles = userFiles.filter(f => f.language === 'css');
  const jsFiles = userFiles.filter(f => f.language === 'javascript' || f.language === 'typescript');
  const cssImports = cssFiles.map((_, i) => `import './user-styles-${i}.css';`).join('\n');

  // Rewrite CDN URLs in JS files
  const rewrittenScripts = jsFiles.map(f => rewriteCdnImports(f.content, cdnPkgs));

  const appJsx = `import React, { useEffect, useRef } from 'react';
${cssImports}

const USER_HTML = ${JSON.stringify(htmlFile?.content || '<div>No HTML content</div>')};
const USER_SCRIPTS = ${JSON.stringify(rewrittenScripts)};

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

  // ── Extract tables for schema generation ──
  const detectedTables = extractTableReferences(userFiles);

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
      '### 1. Create Your Supabase Project',
      '1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project',
      '2. Go to **Settings → API** and copy your **Project URL** and **anon key**',
      '3. Paste them into your `.env` file',
      '',
      '### 2. Import Database Schema',
      '1. Open the **SQL Editor** in your Supabase dashboard',
      '2. Paste the contents of `supabase/schema.sql` and click **Run**',
      '3. Verify tables were created in **Table Editor**',
      '',
    );

    if (detectedTables.length > 0) {
      readmeLines.push(
        `> **Detected tables:** ${detectedTables.join(', ')}`,
        '> The schema file includes starter definitions with RLS policies for each.',
        '',
      );
    }

    if (storageBuckets.length > 0) {
      readmeLines.push(
        '### 3. Storage Buckets',
        `The schema file will create these storage buckets: **${storageBuckets.join(', ')}**`,
        'Storage policies are included — users can only access files in their own folder.',
        '',
      );
    }

    if (authProviders.length > 0) {
      readmeLines.push(
        '### 4. Authentication Providers',
        'This app uses the following auth methods. Configure them in **Authentication → Providers**:',
        '',
      );
      const providerDocs: Record<string, string> = {
        email: 'Email/Password — enabled by default',
        google: 'Google OAuth — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google)',
        github: 'GitHub OAuth — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-github)',
        apple: 'Apple Sign In — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)',
        discord: 'Discord OAuth — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-discord)',
        facebook: 'Facebook OAuth — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-facebook)',
        twitter: 'Twitter/X OAuth — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-twitter)',
        azure: 'Azure AD — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-azure)',
        magic_link: 'Magic Link — enabled via email settings',
        phone: 'Phone/SMS Auth — [Setup guide](https://supabase.com/docs/guides/auth/phone-login)',
      };
      for (const provider of authProviders) {
        const doc = providerDocs[provider] || `${provider} — configure in Auth → Providers`;
        readmeLines.push(`- ${doc}`);
      }
      readmeLines.push('');
    }

    readmeLines.push(
      '### Supabase CLI (Optional)',
      'For local development with the Supabase CLI:',
      '```bash',
      'npx supabase init          # already done — config.toml is included',
      'npx supabase start         # starts local Supabase stack',
      'npx supabase db push       # pushes schema to remote project',
      '```',
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

  if (edgeFns.length > 0) {
    readmeLines.push(
      '## Edge Functions',
      '',
      'This project includes Supabase Edge Functions (Deno). To deploy them:',
      '',
      '```bash',
      'npx supabase functions deploy   # deploys all functions',
      '```',
      '',
      '| Function | Status |',
      '|----------|--------|',
    );
    for (const fn of edgeFns) {
      readmeLines.push(`| \`${fn.name}\` | ${fn.status} |`);
    }
    readmeLines.push(
      '',
      'Edge function source code is in the `supabase/functions/` directory.',
      '',
    );
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
    files['supabase/schema.sql'] = generateSchemaSQL(projectName, detectedTables, storageBuckets);
    files['supabase/config.toml'] = generateSupabaseConfig(projectName);
  }
  if (hasStripe) {
    files['src/lib/stripe.js'] = stripeHelper;
  }

  // Add user CSS files
  cssFiles.forEach((f, i) => {
    files[`src/user-styles-${i}.css`] = f.content;
  });

  // Add edge function source files
  const edgeFnFiles = userFiles.filter(f => f.path.startsWith('functions/'));
  for (const ef of edgeFnFiles) {
    files[`supabase/${ef.path}`] = rewriteCdnImports(ef.content, cdnPkgs);
  }

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
