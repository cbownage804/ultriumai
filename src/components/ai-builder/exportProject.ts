import JSZip from 'jszip';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import type { SupabaseConfig, StripeConfig, ServiceKey, EnvVar } from './ProjectSettings';
import { SERVICE_CATALOG } from './ProjectSettings';

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-app';

// ── Export Modes ───────────────────────────────────────────

export type ExportMode = 'raw' | 'docker' | 'fullstack' | 'pwa' | 'capacitor';

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
    '---',
    '',
    '## Table of Contents',
    '',
    '- [Quick Start](#quick-start)',
    '- [Project Structure](#project-structure)',
    ...(hasSupabase ? ['- [Supabase Setup](#supabase-setup)'] : []),
    ...(hasStripe ? ['- [Stripe Setup](#stripe-setup)'] : []),
    ...(serviceKeysUsed.length > 0 ? ['- [API Keys Required](#api-keys-required)'] : []),
    ...(edgeFns.length > 0 ? ['- [Edge Functions](#edge-functions)'] : []),
    '- [Deployment](#deployment)',
    '- [Environment Variables](#environment-variables)',
    '- [Security Checklist](#security-checklist)',
    '- [Performance Optimization](#performance-optimization)',
    '- [Troubleshooting](#troubleshooting)',
    '- [Architecture Notes](#architecture-notes)',
    '',
    '---',
    '',
    '## Quick Start',
    '',
    '```bash',
    '# 1. Install dependencies',
    'npm install',
    '',
    '# 2. Set up environment variables',
    'cp .env.example .env',
    '# Edit .env with your actual keys (see sections below)',
    '',
    '# 3. Start development server',
    'npm run dev',
    '```',
    '',
    'The app will be running at **http://localhost:3000**.',
    '',
    '## Project Structure',
    '',
    '```',
    `${slug}/`,
    '├── src/',
    '│   ├── App.jsx              # Main application component',
    '│   ├── main.jsx             # React entry point',
    ...(hasSupabase ? ['│   ├── lib/supabase.js       # Supabase client (auto-configured from .env)'] : []),
    ...(hasStripe ? ['│   ├── lib/stripe.js         # Stripe client helper'] : []),
    '│   ├── user-styles-*.css    # Your application styles',
    '│   └── original/            # Original source files from the builder',
    '├── public/                  # Static assets',
    ...(hasSupabase ? [
      '├── supabase/',
      '│   ├── schema.sql           # Database schema with RLS policies',
      '│   ├── config.toml          # Supabase CLI configuration',
      ...(edgeFns.length > 0 ? ['│   └── functions/           # Edge function source code'] : []),
    ] : []),
    '├── .env.example             # Template for environment variables',
    '├── .env                     # Your actual env values (gitignored)',
    '├── Dockerfile               # Multi-stage production build',
    '├── nginx.conf               # nginx config for SPA routing',
    '├── vite.config.js           # Vite build configuration',
    '└── package.json             # Dependencies and scripts',
    '```',
    '',
  ];

  if (hasSupabase) {
    readmeLines.push(
      '## Supabase Setup',
      '',
      'This app uses [Supabase](https://supabase.com) for backend services (database, auth, storage, edge functions).',
      '',
      '### 1. Create Your Supabase Project',
      '',
      '1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project',
      '2. **Wait for the project to finish provisioning** (this can take 1-2 minutes)',
      '3. Go to **Settings → API** and copy:',
      '   - **Project URL** → paste as `VITE_SUPABASE_URL` in `.env`',
      '   - **anon/public key** → paste as `VITE_SUPABASE_ANON_KEY` in `.env`',
      '',
      '> ⚠️ **Important:** Never expose the `service_role` key in frontend code. The anon key is safe for client-side use because RLS policies protect your data.',
      '',
      '### 2. Import Database Schema',
      '',
      '1. Open the **SQL Editor** in your Supabase dashboard',
      '2. Paste the entire contents of `supabase/schema.sql`',
      '3. Click **Run**',
      '4. Go to **Table Editor** and verify all tables were created',
      '5. Check **Authentication → Policies** to confirm RLS policies are active',
      '',
    );

    if (detectedTables.length > 0) {
      readmeLines.push(
        `> **Detected tables:** \`${detectedTables.join('`, `')}\``,
        '> ',
        '> The schema file includes starter column definitions, RLS policies, and `updated_at` triggers for each table.',
        '> **You should customize the columns** based on your actual data model — the defaults are just scaffolding.',
        '',
      );
    }

    if (storageBuckets.length > 0) {
      readmeLines.push(
        '### 3. Storage Buckets',
        '',
        `The schema creates these storage buckets: **${storageBuckets.join(', ')}**`,
        '',
        '- Storage policies are included — users can only access files in their own folder',
        '- File upload limit is set to 50 MB by default',
        '- To change bucket visibility (public/private), update the `INSERT INTO storage.buckets` statement in `schema.sql`',
        '',
      );
    }

    if (authProviders.length > 0) {
      readmeLines.push(
        '### 4. Authentication Providers',
        '',
        'Configure these in **Authentication → Providers**:',
        '',
      );
      const providerDocs: Record<string, string> = {
        email: '✅ **Email/Password** — enabled by default, no extra setup needed',
        google: '🔗 **Google OAuth** — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google) — requires Google Cloud Console credentials',
        github: '🔗 **GitHub OAuth** — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-github) — create an OAuth App in GitHub settings',
        apple: '🔗 **Apple Sign In** — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-apple) — requires Apple Developer account',
        discord: '🔗 **Discord OAuth** — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-discord)',
        facebook: '🔗 **Facebook OAuth** — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-facebook)',
        twitter: '🔗 **Twitter/X OAuth** — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-twitter)',
        azure: '🔗 **Azure AD** — [Setup guide](https://supabase.com/docs/guides/auth/social-login/auth-azure)',
        magic_link: '✉️ **Magic Link** — enabled via email settings, no extra setup',
        phone: '📱 **Phone/SMS Auth** — [Setup guide](https://supabase.com/docs/guides/auth/phone-login) — requires Twilio account',
      };
      for (const provider of authProviders) {
        const doc = providerDocs[provider] || `- **${provider}** — configure in Auth → Providers`;
        readmeLines.push(`${doc}`);
      }
      readmeLines.push('');
    }

    readmeLines.push(
      '### Supabase CLI (Optional)',
      '',
      'For local development with the Supabase CLI:',
      '',
      '```bash',
      '# Install CLI globally',
      'npm install -g supabase',
      '',
      '# Link to your remote project',
      'npx supabase link --project-ref YOUR_PROJECT_REF',
      '',
      '# Start local Supabase stack (Docker required)',
      'npx supabase start',
      '',
      '# Push schema to remote project',
      'npx supabase db push',
      '',
      '# Pull remote schema changes',
      'npx supabase db pull',
      '```',
      '',
      '> The `supabase/config.toml` file is already configured for this project.',
      '',
    );
  }

  if (hasStripe) {
    readmeLines.push(
      '## Stripe Setup',
      '',
      '1. Go to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)',
      '2. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)',
      '3. Add it to `.env` as `VITE_STRIPE_PUBLISHABLE_KEY`',
      '',
      '> ⚠️ **Test vs Live:** Start with `pk_test_` keys during development. Switch to `pk_live_` only when you\'re ready for real payments.',
      '>',
      '> 🔐 **Secret key:** If your app needs server-side Stripe operations, add `STRIPE_SECRET_KEY` as an edge function secret (never in frontend code).',
      '',
    );
  }

  if (serviceKeysUsed.length > 0) {
    readmeLines.push(
      '## API Keys Required',
      '',
      '| Service | Env Variable | Where to Get It |',
      '|---------|-------------|-----------------|',
    );
    for (const sk of serviceKeysUsed) {
      const catalog = SERVICE_CATALOG.find(s => s.id === sk.serviceId);
      if (catalog) {
        readmeLines.push(`| ${catalog.name} | \`VITE_${catalog.envKeyName}\` | [Get key →](${catalog.helpUrl}) |`);
      }
    }
    readmeLines.push('');
  }

  if (edgeFns.length > 0) {
    readmeLines.push(
      '## Edge Functions',
      '',
      'This project includes Supabase Edge Functions (Deno runtime). Source code is in `supabase/functions/`.',
      '',
      '| Function | Status |',
      '|----------|--------|',
    );
    for (const fn of edgeFns) {
      readmeLines.push(`| \`${fn.name}\` | ${fn.status} |`);
    }
    readmeLines.push(
      '',
      '### Deploying Edge Functions',
      '',
      '```bash',
      '# Deploy all functions',
      'npx supabase functions deploy',
      '',
      '# Deploy a specific function',
      'npx supabase functions deploy my-function',
      '',
      '# Set secrets for edge functions',
      'npx supabase secrets set MY_SECRET_KEY=value',
      '',
      '# View function logs',
      'npx supabase functions logs my-function',
      '```',
      '',
    );
  }

  readmeLines.push(
    '## Deployment',
    '',
    '### Option 1: Vercel (Recommended for beginners)',
    '',
    '```bash',
    '# Install Vercel CLI',
    'npm install -g vercel',
    '',
    '# Deploy (follow the prompts)',
    'vercel',
    '```',
    '',
    '- Add all `.env` variables in the Vercel dashboard under **Settings → Environment Variables**',
    '- Vercel auto-detects Vite and configures the build',
    '- Custom domains: **Settings → Domains → Add**',
    '',
    '### Option 2: Netlify',
    '',
    '```bash',
    'npm run build',
    '# Deploy the dist/ folder via Netlify dashboard or CLI',
    'npx netlify deploy --prod --dir=dist',
    '```',
    '',
    '- Add a `_redirects` file in `public/` with `/* /index.html 200` for SPA routing',
    '',
    '### Option 3: Docker',
    '',
    '```bash',
    '# Build the image',
    `docker build -t ${slug} .`,
    '',
    '# Run with environment variables',
    `docker run -p 8080:80 --env-file .env ${slug}`,
    '',
    '# Or use docker-compose',
    `docker compose up -d`,
    '```',
    '',
    'The included Dockerfile uses a **multi-stage build** (Node → nginx), producing a ~25 MB image.',
    '',
    '### Option 4: GitHub Pages',
    '',
    '1. Push to GitHub',
    '2. Go to **Settings → Pages → Source: GitHub Actions**',
    '3. Note: SPA routing requires a `404.html` (copy of `index.html`)',
    '4. ⚠️ GitHub Pages cannot use environment variables — you\'ll need to inline values at build time',
    '',
    '## Environment Variables',
    '',
    'All required environment variables are documented in `.env.example`.',
    '',
    '| Variable | Required | Description |',
    '|----------|----------|-------------|',
  );

  if (hasSupabase) {
    readmeLines.push(
      '| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |',
      '| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public API key |',
    );
  }
  if (hasStripe) {
    readmeLines.push('| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key |');
  }
  for (const sk of serviceKeysUsed) {
    const catalog = SERVICE_CATALOG.find(s => s.id === sk.serviceId);
    if (catalog) {
      readmeLines.push(`| \`VITE_${catalog.envKeyName}\` | Yes | ${catalog.name} API key |`);
    }
  }
  for (const ev of envVarsUsed) {
    readmeLines.push(`| \`VITE_${ev.key}\` | Yes | Custom variable |`);
  }

  readmeLines.push(
    '',
    '> 💡 **Tip:** Variables prefixed with `VITE_` are exposed to the frontend. Never put secrets (database passwords, API secret keys) in `VITE_` variables.',
    '',
    '## Security Checklist',
    '',
    'Before going to production, review these items:',
    '',
    '- [ ] **RLS policies are active** on all tables — verify in Supabase → Authentication → Policies',
    '- [ ] **No secret keys in frontend code** — only publishable/anon keys should be in `VITE_` vars',
    '- [ ] **CORS configured** — update `Access-Control-Allow-Origin` in edge functions for your domain',
    '- [ ] **Auth redirect URLs** — add your production domain in Supabase → Authentication → URL Configuration',
    '- [ ] **Rate limiting** — consider adding rate limits to edge functions',
    '- [ ] **Input validation** — validate all user input on the server (edge functions)',
    '- [ ] **HTTPS only** — all hosting providers listed above use HTTPS by default',
    '- [ ] **Environment variables** — double-check `.env` is in `.gitignore` and not committed',
    '',
    '## Performance Optimization',
    '',
    'Recommended optimizations for production:',
    '',
    '- **Code splitting:** Add `React.lazy()` and `Suspense` for route-based splitting',
    '- **Image optimization:** Use WebP format and lazy loading (`loading="lazy"`)',
    '- **Bundle analysis:** Run `npx vite-bundle-visualizer` to find large dependencies',
    '- **Caching headers:** The included `nginx.conf` sets 1-year cache for static assets',
    '- **CDN:** Vercel and Netlify include global CDN by default',
    '- **Database indexes:** Add indexes on frequently queried columns in your Supabase tables',
    '',
    '## Troubleshooting',
    '',
    '### Common Issues',
    '',
    '| Problem | Solution |',
    '|---------|----------|',
    '| `npm run dev` fails | Delete `node_modules` and run `npm install` again |',
    '| Blank page after build | Check browser console for errors; ensure all env vars are set |',
    '| CORS errors | Update `Access-Control-Allow-Origin` in edge functions to match your domain |',
    '| Auth not working | Add your domain to Supabase → Auth → URL Configuration |',
    '| 404 on page refresh | Your hosting needs SPA fallback (the nginx.conf handles this for Docker) |',
    '| "relation does not exist" | Run the `schema.sql` in Supabase SQL Editor |',
    '| Edge function 500 errors | Check function logs: `npx supabase functions logs function-name` |',
    '| Styles look different | Ensure all CSS files are imported; check Tailwind purge config |',
    '',
    '### Getting Help',
    '',
    '- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)',
    '- **Vite Docs:** [vitejs.dev/guide](https://vitejs.dev/guide/)',
    '- **React Docs:** [react.dev](https://react.dev)',
    '',
    '## Architecture Notes',
    '',
    'This project was generated as a single-page React application. Here are recommendations for scaling:',
    '',
    '- **Routing:** Add `react-router-dom` for multi-page navigation',
    '- **State management:** For complex state, consider Zustand or TanStack Query',
    '- **Component library:** The app uses vanilla HTML/CSS — consider migrating to shadcn/ui or Radix for accessibility',
    '- **TypeScript:** Convert `.jsx` files to `.tsx` for type safety',
    '- **Testing:** Add Vitest + React Testing Library for unit/integration tests',
    '- **CI/CD:** Set up GitHub Actions for automated build + deploy on push',
    '',
    '---',
    '',
    `*Generated on ${new Date().toISOString().split('T')[0]} by UltriumAI App Builder*`,
    '',
  );

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

  // ── Platform deployment configs ──

  // Vercel
  files['vercel.json'] = JSON.stringify({
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    framework: 'vite',
    rewrites: [{ source: '/(.*)', destination: '/index.html' }],
  }, null, 2);

  // Netlify
  files['netlify.toml'] = `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
`;

  // GitHub Pages workflow
  files['.github/workflows/deploy.yml'] = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

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
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
`;

  // robots.txt
  files['public/robots.txt'] = `User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
`;

  // sitemap.xml placeholder
  files['public/sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
`;

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

// ── PWA Export Files ──────────────────────────────────────
function getPWAFiles(projectName: string, userFiles: ProjectFile[], ctx: ExportContext): Record<string, string> {
  const baseFiles = getFullStackFiles(projectName, userFiles, ctx);
  const slug = slugify(projectName);

  // manifest.json
  baseFiles['public/manifest.json'] = JSON.stringify({
    name: projectName,
    short_name: slug,
    description: `${projectName} — Built with UltriumAI`,
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#06b6d4',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    screenshots: [
      { src: '/icons/screenshot-wide.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide' },
      { src: '/icons/screenshot-narrow.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow' },
    ],
  }, null, 2);

  // Service worker
  baseFiles['public/sw.js'] = `const CACHE_NAME = '${slug}-v1';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Never cache OAuth redirects
  if (e.request.url.includes('/~oauth')) return;
  
  // Network-first for navigations
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for assets
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
`;

  // Update index.html with PWA meta tags and SW registration
  if (baseFiles['index.html']) {
    baseFiles['index.html'] = baseFiles['index.html'].replace(
      '</head>',
      `    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#06b6d4" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${projectName}" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  </head>`
    );
    baseFiles['index.html'] = baseFiles['index.html'].replace(
      '</body>',
      `    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
      }
    </script>
  </body>`
    );
  }

  // PWA install guide
  baseFiles['PWA_INSTALL_GUIDE.md'] = `# ${projectName} — PWA Install Guide

## How Users Install Your App

### On iPhone / iPad (Safari)
1. Open your app URL in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add**

### On Android (Chrome)
1. Open your app URL in Chrome
2. Tap the **three-dot menu** (⋮)
3. Tap **"Install app"** or **"Add to Home Screen"**
4. Tap **Install**

### On Desktop (Chrome / Edge)
1. Open your app URL
2. Click the **install icon** in the address bar
3. Click **Install**

## What You Get
- ✅ Home screen icon (looks like a real app)
- ✅ Full-screen experience (no browser UI)
- ✅ Works offline
- ✅ Fast loading via cache

## Icons
Replace the placeholder icons in \`public/icons/\` with your own:
- \`icon-192.png\` — 192×192px (required)
- \`icon-512.png\` — 512×512px (required)

Use a tool like [maskable.app](https://maskable.app) to create maskable icons.
`;

  return baseFiles;
}

// ── Capacitor Export Files ──────────────────────────────────
function getCapacitorFiles(projectName: string, userFiles: ProjectFile[], ctx: ExportContext): Record<string, string> {
  const baseFiles = getFullStackFiles(projectName, userFiles, ctx);
  const slug = slugify(projectName);
  const appId = `com.${slug.replace(/-/g, '')}.app`;

  // capacitor.config.ts
  baseFiles['capacitor.config.ts'] = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${appId}',
  appName: '${projectName}',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#09090b',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b',
    },
  },
};

export default config;
`;

  // Update package.json to include Capacitor deps
  if (baseFiles['package.json']) {
    try {
      const pkg = JSON.parse(baseFiles['package.json']);
      pkg.dependencies = {
        ...pkg.dependencies,
        '@capacitor/core': '^7.0.0',
        '@capacitor/ios': '^7.0.0',
        '@capacitor/android': '^7.0.0',
        '@capacitor/splash-screen': '^7.0.0',
        '@capacitor/status-bar': '^7.0.0',
        '@capacitor/haptics': '^7.0.0',
      };
      pkg.devDependencies = {
        ...pkg.devDependencies,
        '@capacitor/cli': '^7.0.0',
      };
      pkg.scripts = {
        ...pkg.scripts,
        'cap:sync': 'npx cap sync',
        'cap:run:ios': 'npx cap run ios',
        'cap:run:android': 'npx cap run android',
        'cap:open:ios': 'npx cap open ios',
        'cap:open:android': 'npx cap open android',
      };
      baseFiles['package.json'] = JSON.stringify(pkg, null, 2);
    } catch {}
  }

  // Update viewport for mobile
  if (baseFiles['index.html']) {
    baseFiles['index.html'] = baseFiles['index.html'].replace(
      '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />'
    );
  }

  // .gitignore update
  if (baseFiles['.gitignore']) {
    baseFiles['.gitignore'] += `\n# Capacitor\nios/\nandroid/\n`;
  }

  // Capacitor setup guide
  baseFiles['MOBILE_SETUP_GUIDE.md'] = `# ${projectName} — Mobile App Setup Guide

## Prerequisites

- **Node.js 18+** and **npm**
- **For iOS:** macOS with Xcode 15+ installed
- **For Android:** Android Studio with SDK installed

## Step-by-Step Setup

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Build the Web App
\`\`\`bash
npm run build
\`\`\`

### 3. Add Mobile Platforms
\`\`\`bash
# Add iOS (requires macOS + Xcode)
npx cap add ios

# Add Android (requires Android Studio)
npx cap add android
\`\`\`

### 4. Sync Web Code to Native Projects
\`\`\`bash
npx cap sync
\`\`\`

### 5. Run on Device / Emulator

**iOS:**
\`\`\`bash
npx cap run ios
# Or open in Xcode:
npx cap open ios
\`\`\`

**Android:**
\`\`\`bash
npx cap run android
# Or open in Android Studio:
npx cap open android
\`\`\`

## App Icons & Splash Screens

Replace the default icons in the native projects:

### iOS
- Open \`ios/App/App/Assets.xcassets/AppIcon.appiconset/\`
- Replace icons with your own (1024×1024 master icon recommended)
- Use [appicon.co](https://www.appicon.co/) to generate all sizes

### Android
- Open \`android/app/src/main/res/\`
- Replace icons in \`mipmap-*\` folders
- Use Android Studio → Image Asset Studio for generation

## Publishing to App Stores

### Apple App Store
1. Open the project in Xcode: \`npx cap open ios\`
2. Set your Team & Bundle ID in Signing & Capabilities
3. Archive the app: Product → Archive
4. Upload via App Store Connect

### Google Play Store
1. Open in Android Studio: \`npx cap open android\`
2. Build a signed AAB: Build → Generate Signed Bundle
3. Upload to Google Play Console

## Development Workflow

After making changes in your web code:
\`\`\`bash
npm run build
npx cap sync
npx cap run ios   # or android
\`\`\`

## Capacitor Config

Edit \`capacitor.config.ts\` to customize:
- **appId**: Your unique app identifier (e.g., \`com.yourcompany.appname\`)
- **appName**: Display name on the device
- **plugins**: Configure splash screen, status bar, etc.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No provisioning profile" (iOS) | Set up an Apple Developer account & create a profile in Xcode |
| White screen on device | Run \`npm run build && npx cap sync\` to sync latest code |
| Plugin not found | Run \`npx cap sync\` after installing new Capacitor plugins |
| Build fails on Android | Ensure Android SDK and build tools are up to date |
`;

  return baseFiles;
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
    // Add a basic README for raw exports
    const fileList = files.map(f => `- \`${f.path}\``).join('\n');
    zip.file('README.md', `# ${projectName}\n\nExported from UltriumAI App Builder.\n\n## Files\n\n${fileList}\n\n## Getting Started\n\nOpen \`index.html\` in your browser, or use a local server:\n\n\`\`\`bash\nnpx serve .\n\`\`\`\n`);
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
    for (const file of files) {
      zip.file(`src/original/${file.path}`, file.content);
    }
  } else if (mode === 'pwa') {
    const pwaFiles = getPWAFiles(projectName, files, ctx);
    for (const [path, content] of Object.entries(pwaFiles)) {
      zip.file(path, content);
    }
    for (const file of files) {
      zip.file(`src/original/${file.path}`, file.content);
    }
  } else if (mode === 'capacitor') {
    const capFiles = getCapacitorFiles(projectName, files, ctx);
    for (const [path, content] of Object.entries(capFiles)) {
      zip.file(path, content);
    }
    for (const file of files) {
      zip.file(`src/original/${file.path}`, file.content);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const suffixMap: Record<ExportMode, string> = { raw: '', docker: '-docker', fullstack: '-fullstack', pwa: '-pwa', capacitor: '-mobile' };
  a.download = `${slug}${suffixMap[mode]}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
