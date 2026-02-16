import { useState, useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Zap,
  Shield,
  Bot,
  Code,
  Users,
  CreditCard,
  Palette,
  BarChart3,
  Server,
  Cpu,
  FileText,
  Lock,
  Globe,
  Headphones,
  MonitorSmartphone,
  Layers,
  Eye,
  Target,
  Radar,
  Scale,
  Brain,
  Network,
  ClipboardCheck,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import vanguardLogo from "@/assets/vanguard-logo.png";
import aiStudioLogo from "@/assets/ai-studio-logo.png";
import { safesuiteLogo } from "@/components/safesuite/SafeSuiteProductIcons";

// ── Content Types ──────────────────────────────────────────────

interface DocArticle {
  id: string;
  title: string;
  content: string; // markdown-ish plain text
  tags?: string[];
}

interface DocCategory {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  articles: DocArticle[];
}

interface DocSection {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  logo?: string;
  color?: string;
  categories: DocCategory[];
}

// ── Documentation Content ──────────────────────────────────────

const DOC_SECTIONS: DocSection[] = [
  // ─── Platform ──────────────────────────────────────────────
  {
    id: "platform",
    label: "Platform",
    icon: BookOpen,
    color: "text-primary",
    categories: [
      {
        id: "getting-started",
        label: "Getting Started",
        icon: Zap,
        articles: [
          {
            id: "quick-start",
            title: "Quick Start Guide",
            content:
              "Welcome to UltriumAI — the unified platform for AI-powered IT operations, security, and compliance.\n\n## Create Your Account\n1. Click **Sign In** → **Sign Up**\n2. Verify your email address\n3. Complete your profile\n\n## Choose Your Product\n- **AI Studio** — Build and deploy governed AI assistants for your business\n- **Vanguard** — All-in-one RMM, PSA, XDR, and compliance platform for MSPs & IT teams\n- **SafeSuite** — Consumer/SMB security tools: password vault, breach monitoring, threat scanning\n\nAll three products are accessible from the **Product Hub** after sign-in.",
          },
          {
            id: "how-it-fits-together",
            title: "How UltriumAI Fits Together",
            content:
              "UltriumAI is a single platform with three purpose-built products under one roof. You sign up once, manage billing in one place, and share a single identity across everything.\n\n## The Three Products\n\n### AI Studio\nFor teams that want to put AI to work — build custom assistants, automate data tasks, and embed intelligent chat on your website or internal tools. Best for: operations leads, marketing teams, support managers, and developers integrating AI into workflows.\n\n### Vanguard\nThe IT operations and security platform for managed service providers (MSPs) and internal IT departments. It consolidates endpoint management, ticketing, threat detection, documentation, compliance, and reporting into one system. Best for: MSP owners, IT directors, SOC analysts, and field technicians.\n\n### SafeSuite\nPersonal and small-business cybersecurity tools — password management, breach monitoring, threat scanning, and asset tracking. Best for: individuals, families, freelancers, and small teams without dedicated IT staff.\n\n## What They Share\n- **One account** — Your login works across all three products\n- **One billing hub** — Manage all subscriptions and invoices from a single portal\n- **Shared identity** — Profile, team members, and organization settings carry across products\n- **AI backbone** — Cortex AI powers intelligence features in Vanguard, SafeAssist in SafeSuite, and the full builder experience in AI Studio\n\n## How to Think About It\nUltriumAI is the platform. AI Studio, Vanguard, and SafeSuite are the products you use inside it. Pick the ones that match your role, and ignore the rest — they stay out of your way until you need them.",
          },
          {
            id: "account-setup",
            title: "Account & Profile",
            content:
              "## Profile Settings\n- Upload avatar, set display name and bio\n- Configure notification preferences (email, in-app, push)\n- Set timezone and language\n\n## Security\n- Enable two-factor authentication (TOTP)\n- Generate backup codes\n- Review active sessions and login history\n- Configure session timeout duration\n\n## Organizations\n- Create or join an organization\n- Each org gets its own billing, users, and data isolation",
          },
          {
            id: "product-hub",
            title: "Product Hub & Navigation",
            content:
              "The **Product Hub** (`/hub`) is your central launch point.\n\n- **AI Studio** — Click to enter the AI assistant builder\n- **Vanguard** — Click to open the MSP/IT operations platform\n- **SafeSuite** — Click to access consumer security tools\n\nEach product has its own navigation, dashboard, and settings. You can switch between products at any time via the global Products menu.",
          },
        ],
      },
      {
        id: "choose-your-path",
        label: "Choose Your Path",
        icon: Users,
        articles: [
          {
            id: "path-msp-owner",
            title: "MSP Owner / Founder",
            content:
              "You run a managed service provider. You need a platform that handles clients, endpoints, tickets, security, and billing — without stitching together five vendors.\n\n## Start Here\n1. **Vanguard Overview** — Understand the 9 modules and how they map to your stack\n2. **Vanguard Plans** — Review per-technician pricing and add-on bundles\n3. **Horizon (RMM)** — Set up sites, deploy agents, manage your fleet\n4. **Response (Service Desk)** — Configure ticketing, SLAs, and client portal\n5. **Atlas (Documentation)** — Migrate or build your IT documentation\n6. **Ledger (Reporting)** — Generate executive reports for QBRs\n\n## Also Relevant\n- **AI Studio** — Build client-facing AI assistants or internal automation bots\n- **MSP Partner Program** — Volume discounts and white-label options\n- **Comply** — Add compliance management to your service offering",
          },
          {
            id: "path-it-director",
            title: "Internal IT / IT Director",
            content:
              "You manage technology for a single organization. You need visibility into your endpoints, a way to handle service requests, and assurance that your environment is secure and compliant.\n\n## Start Here\n1. **Vanguard Overview** — See how the platform replaces your current RMM/PSA stack\n2. **Horizon (RMM)** — Deploy agents across your environment\n3. **Response (Service Desk)** — Set up internal helpdesk and SLA tracking\n4. **Comply** — Map your controls to SOC 2, HIPAA, or ISO 27001\n5. **Sentinel** — Monitor your M365 or Google Workspace tenant\n\n## Also Relevant\n- **Recon** — Run vulnerability assessments on your network\n- **AI Studio** — Automate repetitive IT tasks with AI agents\n- **SafeSuite** — Offer employees password management and breach monitoring",
          },
          {
            id: "path-technician",
            title: "Technician",
            content:
              "You're on the front line — resolving tickets, patching endpoints, and responding to alerts. You need fast access to devices, documentation, and AI-assisted troubleshooting.\n\n## Start Here\n1. **Horizon (RMM)** — Navigate sites, access devices, run scripts\n2. **Response (Service Desk)** — Work your ticket queue, log time, escalate\n3. **Atlas (Documentation)** — Search runbooks and SOPs mid-ticket\n4. **Cortex (AI Hub)** — Use AI Ticket Analyzer and Smart Router\n\n## Daily Workflows\n- Open Horizon → Select a site → View device alerts\n- Open Response → Work assigned tickets → Log resolution time\n- Open Atlas → Search for relevant runbook → Follow steps\n- Use Cortex → Summarize a ticket → Get suggested KB articles",
          },
          {
            id: "path-end-user",
            title: "End User",
            content:
              "You're not in IT — you just want to stay safe online, manage your passwords, and know if your data has been compromised.\n\n## Start Here\n1. **SafeSuite Overview** — Understand the five tools available to you\n2. **SafePass** — Set up your password vault and import existing passwords\n3. **SafeWeb** — Monitor your email addresses for data breaches\n4. **SafeScan** — Scan suspicious emails, links, or files\n5. **SafeAssist** — Ask security questions in plain English\n\n## No Technical Background Required\nSafeSuite is designed for everyday users. Every tool uses plain language, guided workflows, and clear risk scores.",
          },
          {
            id: "path-developer",
            title: "Developer / Integrator",
            content:
              "You're building on top of UltriumAI — embedding AI into your product, integrating with your existing stack, or extending the platform with custom workflows.\n\n## Start Here\n1. **API Overview** — Authentication, endpoints, rate limits, and webhooks\n2. **AI Studio: Embedding Your GPT** — Chat widget, inline embed, and REST API\n3. **Third-Party Integrations** — ConnectWise, Autotask, Slack, Teams, Jira, and more\n4. **Action Template Library** — 22 pre-built actions for custom GPTs\n\n## Key Integration Points\n- **REST API** — Full CRUD for tickets, devices, contacts, and AI conversations\n- **Webhooks** — Real-time event notifications with HMAC verification\n- **Embed SDK** — Drop-in chat widget with custom branding\n- **SSO/SAML** — Enterprise identity provider integration",
          },
        ],
      },
      {
        id: "billing",
        label: "Billing & Plans",
        icon: CreditCard,
        articles: [
          {
            id: "billing-overview",
            title: "Billing Overview",
            content:
              "UltriumAI uses product-specific billing — each product (AI Studio, Vanguard, SafeSuite) has its own subscription and Stripe Customer Portal.\n\n## Key Concepts\n- Subscriptions are managed per-product\n- Plan upgrades are prorated (you only pay the difference)\n- Annual billing provides ~20% savings across all products\n- Enterprise plans include custom SLAs and dedicated support",
          },
          {
            id: "ai-studio-plans",
            title: "AI Studio Plans",
            content:
              "AI Studio uses **AI Capacity** — a simple, predictable way to manage your organization's AI usage across all features.\n\n### What's Included\nEvery plan includes a monthly AI capacity allocation that covers all AI-powered actions: conversations, code generation, image creation, browser testing, document analysis, and web search.\n\n### MSPs & IT Firms\n| Plan | Price | Highlights |\n|------|-------|------------|\n| MSP Starter | $149/mo | Client allocation, 5 GPTs |\n| MSP Pro | $479/mo | 25 GPTs, API access, priority support |\n| MSP Elite | $899/mo | Unlimited GPTs, dedicated manager |\n| Platform Pro | $1,799/mo | Maximum capacity, custom integrations |\n\n### Internal Business Teams\n| Plan | Price | Highlights |\n|------|-------|------------|\n| Free | $0/mo | 1 GPT, basic features |\n| Team Basic | $59/mo | 3 GPTs, 5 team members, image gen |\n| Team Plus | $239/mo | 10 GPTs, 20 members, API access |\n\n### Website / Embedded AI\n| Plan | Price | Highlights |\n|------|-------|------------|\n| Website Basic | $39/mo | 250 conversations/mo, lead capture |\n| Website Pro | $59/mo | 1,000 conversations/mo, custom branding |\n\nAll plans include a usage dashboard so you always know where you stand. Capacity does not roll over (except Enterprise).",
          },
          {
            id: "vanguard-plans",
            title: "Vanguard Plans",
            content:
              "Vanguard uses **per-technician pricing** with unlimited endpoints.\n\n### IT Departments\n| Plan | Monthly | Annual |\n|------|---------|--------|\n| Professional | $149/tech | $129/tech |\n| Expert ⭐ | $209/tech | $169/tech |\n| Master | $249/tech | $199/tech |\n| Enterprise | Custom | Custom |\n\n### MSPs\n| Plan | Monthly | Annual |\n|------|---------|--------|\n| Pro | $119/tech | $109/tech |\n| Growth ⭐ | $169/tech | $159/tech |\n| Power | $229/tech | $189/tech |\n| Superpower | Custom | Custom |\n\nAll plans include ticketing, helpdesk, patch management, reports, and 24/7 chat support.\n\nSee [Vanguard Pricing](/pricing/vanguard) for add-ons and bundles.",
          },
          {
            id: "safesuite-plans",
            title: "SafeSuite Plans",
            content:
              "SafeSuite offers three tiers:\n\n| Plan | Price |\n|------|-------|\n| Pro | $9.99/mo |\n| Business | $15/mo |\n| Enterprise | $45/mo |\n\nIncludes SafePass (password vault), SafeScan (threat scanner), SafeWeb (breach monitoring), SafeTrack (asset management), and SafeAssist (AI assistant).",
          },
        ],
      },
      {
        id: "api-reference",
        label: "API & Integrations",
        icon: Code,
        articles: [
          {
            id: "api-overview",
            title: "API Overview",
            content:
              "UltriumAI provides REST APIs for all platform capabilities.\n\n## Authentication\n- API keys (created in Dashboard → API Keys)\n- Bearer token authentication\n- Rate limiting: configurable per key (RPM/RPD)\n- IP whitelisting available on Enterprise plans\n\n## Endpoints\n- `/api/v1/chat` — AI Studio conversation API\n- `/api/v1/security/*` — SafeSuite scanning APIs\n- `/api/v1/vanguard/*` — Vanguard management APIs\n\n## Webhooks\nAll products support webhook notifications for real-time events:\n- Security alerts, ticket updates, AI completions\n- Configurable retry policies and HMAC signature verification",
          },
          {
            id: "integrations",
            title: "Third-Party Integrations",
            content:
              "## Vanguard Integrations\n- **PSA**: ConnectWise, Autotask (bi-directional sync)\n- **Documentation**: IT Glue (via Atlas)\n- **BCDR**: Veeam, Acronis, Datto\n- **Remote Access**: RustDesk (built-in), TeamViewer, ScreenConnect\n- **Accounting**: QuickBooks Online, Xero\n- **Identity**: Azure AD, SSO (SAML/OIDC)\n\n## AI Studio Integrations\n- **Communication**: Slack, Microsoft Teams\n- **Ticketing**: Jira, ServiceNow, Zendesk\n- **Data**: Web search, URL scraping, document parsing\n\n## SafeSuite Integrations\n- **Browsers**: Chrome/Edge extension for SafePass\n- **Mobile**: iOS & Android apps\n- **Email**: Automated breach notifications",
          },
        ],
      },
      {
        id: "team-management",
        label: "Team & Collaboration",
        icon: Users,
        articles: [
          {
            id: "team-setup",
            title: "Team Management",
            content:
              "## Roles\n- **Owner** — Full admin access, billing management\n- **Admin** — User management, configuration\n- **Technician** — Standard platform access (Vanguard)\n- **Member** — Standard access (AI Studio/SafeSuite)\n- **Viewer** — Read-only access\n\n## Invitations\n1. Go to Settings → Team\n2. Click Invite → Enter email(s)\n3. Assign role and product access\n4. Users receive email invitation with onboarding link\n\n## Multi-Tenant (Vanguard)\nVanguard supports full multi-tenant isolation per client site with RBAC, ensuring technicians only see their assigned sites.",
          },
        ],
      },
      {
        id: "white-label",
        label: "White-Label & Branding",
        icon: Palette,
        articles: [
          {
            id: "white-label-overview",
            title: "White-Label Setup",
            content:
              "Available on Vanguard Platinum partner tier and AI Studio Platform Pro.\n\n## Customization Options\n- Custom logo, favicon, and color scheme\n- Custom domain with SSL\n- Branded login page and service portal\n- Custom email templates (from your domain)\n- Footer text and \"Powered by\" toggle\n\n## Setup\n1. Navigate to Settings → White Label\n2. Upload brand assets\n3. Configure color theme\n4. Set custom domain (DNS CNAME required)\n5. Preview and publish",
          },
        ],
      },
    ],
  },

  // ─── AI Studio ──────────────────────────────────────────────
  {
    id: "ai-studio",
    label: "AI Studio",
    logo: aiStudioLogo,
    color: "text-primary",
    categories: [
      {
        id: "ai-studio-overview",
        label: "Overview",
        icon: Bot,
        articles: [
          {
            id: "ai-studio-intro",
            title: "What is AI Studio?",
            content:
              "AI Studio is the **Business AI Control Plane** — build, deploy, and govern custom AI assistants without writing code.\n\n## What You Can Build\n- A customer support bot trained on your knowledge base\n- An internal IT assistant that searches your documentation\n- A website chat widget that qualifies leads\n- An AI agent that auto-enriches database records on a schedule\n- A workflow that summarizes, classifies, and routes incoming data\n\n## Key Capabilities\n- Create custom GPTs with system prompts, knowledge bases, and actions\n- Deploy assistants on your website, Slack, Teams, or via API\n- Full usage analytics and credit governance\n- 22 pre-built action templates (security scanning, ticket escalation, web search, etc.)\n- White-label embedding for MSP resale",
          },
          {
            id: "custom-gpts",
            title: "Creating Custom GPTs",
            content:
              "## How to Build a Custom GPT\n1. Go to **AI Studio → Create New GPT**\n2. Set a name, avatar, and system prompt that defines the assistant's role\n3. Upload knowledge documents (PDF, DOCX, TXT, MD, CSV, PPTX) or crawl a website URL\n4. Attach actions from the template library (e.g., \"Search Web\", \"Create Ticket\")\n5. Test in the sandbox — send messages and refine the system prompt\n6. Deploy — choose embed widget, API endpoint, or Slack/Teams integration\n\n## Configuration Options\n- **Model**: Choose between available LLMs\n- **Temperature**: Lower = precise and consistent, Higher = creative and varied\n- **Max tokens**: Set response length limits\n- **Knowledge retrieval**: RAG-based — the GPT searches your documents before answering\n- **Action permissions**: Control exactly which APIs the GPT can call\n\n## Tips\n- Start with a narrow scope (\"Answer questions about our refund policy\") before going broad\n- Upload your most common support docs first — they have the highest impact\n- Use the sandbox to test edge cases before deploying to customers",
          },
        ],
      },
      {
        id: "ai-studio-actions",
        label: "Actions & Templates",
        icon: Zap,
        articles: [
          {
            id: "action-templates",
            title: "Action Template Library",
            content:
              "## How to Add Actions to Your GPT\n1. Open your GPT → go to the **Actions** tab\n2. Browse the template library (22 pre-built actions)\n3. Click **Add** on any template — it auto-configures the input schema\n4. Test the action in the sandbox to confirm it works\n\n## Available Action Categories\n\n### SafeSuite Security\n- Scan a URL for threats\n- Check an email for breaches\n- Analyze password strength\n\n### Support Operations\n- Escalate a ticket to a technician\n- Send a Slack or Teams notification\n- Dispatch an email from a template\n\n### Productivity\n- Create a calendar event\n- Add a task to a project board\n- Summarize a meeting transcript\n\n### Data Operations\n- Search the web and return structured results\n- Extract data from a webpage\n- Parse a document and return key fields\n- Generate a CSV from query results\n\nEach template includes a pre-defined JSON input schema. No API configuration required.",
          },
        ],
      },
      {
        id: "ai-studio-app-builder",
        label: "App Builder",
        icon: Code,
        articles: [
          {
            id: "app-builder-overview",
            title: "App Builder Overview",
            content:
              "The **App Builder** is a full-featured in-browser IDE for building web applications with AI assistance.\n\n## Key Features\n- **AI Chat & Agent modes** — Describe what you want, the AI generates code\n- **Live preview** — See changes instantly in a sandboxed iframe\n- **File explorer** — Full file tree with Monaco editor\n- **Integrations** — Supabase (auth, database, storage), Stripe, 13+ AI providers\n- **Edge Functions** — Write and manage Deno serverless functions\n- **Export** — Download your project as a fully portable ZIP\n\n## Workflow\n1. Describe your app in the chat panel\n2. The AI generates HTML, CSS, and JavaScript files\n3. Preview updates in real-time\n4. Configure integrations (Supabase, Stripe, API keys)\n5. Export or deploy when ready",
          },
          {
            id: "export-guide",
            title: "Exporting Your Project",
            content:
              "## Export Modes\n\n### Full-Stack Export (Recommended)\nA complete, production-ready React + Vite project:\n- **package.json** with all dependencies mapped from CDN imports\n- **.env + .env.example** with pre-filled and documented environment variables\n- **src/lib/supabase.js** — Ready-to-use Supabase client\n- **src/lib/stripe.js** — Stripe.js loader (if configured)\n- **supabase/schema.sql** — Auto-detected database tables with RLS policies, triggers, and storage bucket setup\n- **supabase/config.toml** — Supabase CLI configuration for local development\n- **supabase/functions/** — Edge function source code\n- **Dockerfile + nginx.conf** — Multi-stage Docker build for production\n- **README.md** — Step-by-step setup guide with all integration instructions\n\n### Docker-Ready Export\nReact + Vite scaffolding with Dockerfile and nginx config. Good for quick containerized deployments without backend integration setup.\n\n### Raw ZIP\nJust your source files — HTML, CSS, JS. No scaffolding or build tools.\n\n## How to Export\n1. Click the **Export** button in the top toolbar\n2. Choose your export mode\n3. A ZIP file downloads automatically\n4. Extract, run `npm install`, and you're ready to go",
          },
          {
            id: "supabase-portability",
            title: "Making Supabase Portable",
            content:
              "When you export a project that uses Supabase, the Full-Stack Export includes everything needed to recreate the backend on a new Supabase project.\n\n## What's Included\n- **Schema SQL** — Table definitions auto-detected from your code (`.from('table')` calls, SQL statements)\n- **RLS Policies** — Row Level Security policies generated for each table (users can only access their own data)\n- **Triggers** — `updated_at` auto-update triggers for all detected tables\n- **Storage Buckets** — Bucket creation SQL with folder-scoped access policies\n- **Auth Provider Docs** — Documentation for which auth methods your app uses\n\n## Setup Steps\n1. Create a new Supabase project at [supabase.com](https://supabase.com)\n2. Copy your **Project URL** and **anon key** from Settings → API\n3. Paste into your `.env` file\n4. Open the SQL Editor and run `supabase/schema.sql`\n5. Configure auth providers in Authentication → Providers\n6. Deploy edge functions: `npx supabase functions deploy`\n\n## Supabase CLI (Optional)\nThe export includes `supabase/config.toml` for local development:\n```bash\nnpx supabase start    # Local Supabase stack\nnpx supabase db push  # Push schema to remote\n```",
          },
          {
            id: "docker-deployment",
            title: "Docker Deployment",
            content:
              "Both the **Full-Stack** and **Docker-Ready** exports include a production Dockerfile.\n\n## How It Works\nThe Dockerfile uses a **multi-stage build**:\n1. **Stage 1 (Build)**: Node.js 20 installs dependencies and runs `vite build`\n2. **Stage 2 (Serve)**: nginx Alpine serves the static `dist/` output\n\nThe final image is ~25 MB.\n\n## Commands\n```bash\n# Build\ndocker build -t my-app .\n\n# Run\ndocker run -p 8080:80 my-app\n\n# With environment variables\ndocker run -p 8080:80 --env-file .env my-app\n\n# Docker Compose (create docker-compose.yml)\nversion: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - '8080:80'\n    env_file: .env\n```\n\n## nginx Configuration\nThe included `nginx.conf` handles:\n- SPA routing (all paths → `index.html`)\n- Static asset caching (1 year for JS/CSS/images)\n- Gzip compression\n\n## Production Tips\n- Use a reverse proxy (Cloudflare, Traefik) for SSL termination\n- Set `server_name` in nginx.conf to your domain\n- Add health check endpoint for container orchestration\n- Use Docker Compose for multi-service setups (app + database)",
          },
          {
            id: "hosting-options",
            title: "Hosting Options",
            content:
              "After exporting, you can deploy your app anywhere.\n\n## Vercel\n1. Push to GitHub (use the **Push to GitHub** button)\n2. Import the repo at [vercel.com/new](https://vercel.com/new)\n3. Add environment variables in Vercel dashboard\n4. Deploy — Vercel auto-detects Vite\n\n## Netlify\n1. Push to GitHub\n2. Import at [app.netlify.com](https://app.netlify.com)\n3. Build command: `npm run build`\n4. Publish directory: `dist`\n\n## Docker / VPS\nUse the included Dockerfile (see Docker Deployment guide).\n\n## GitHub Pages\n1. Run `npm run build`\n2. Deploy the `dist/` folder\n3. Add a `404.html` that redirects to `index.html` for SPA routing\n\n## Cloudflare Pages\n1. Push to GitHub\n2. Connect at [dash.cloudflare.com](https://dash.cloudflare.com)\n3. Framework preset: Vite\n4. Build output: `dist`\n\n## Railway / Render\nBoth support Docker deployments. Push your repo and they'll auto-detect the Dockerfile.",
          },
        ],
      },
      {
        id: "ai-studio-embedding",
        label: "Embedding & Deployment",
        icon: Globe,
        articles: [
          {
            id: "embed-options",
            title: "Embedding Your GPT",
            content:
              "## How to Embed Your GPT on a Website\n1. Open your GPT → go to the **Deploy** tab\n2. Select **Chat Widget**\n3. Customize branding (colors, avatar, welcome message)\n4. Copy the script tag\n5. Paste it into your website's `<head>` or before `</body>`\n6. The widget appears as a floating chat bubble\n\n## Other Deployment Options\n- **Inline Embed** — Full-page or section embed via iframe. Use for dedicated support pages.\n- **API** — RESTful conversation API for building custom UIs. Returns streaming or complete responses.\n- **Slack/Teams** — Native app integration. Users interact with your GPT directly in their workspace.\n\n## Website Plan Limits\n- Visitor message caps (3–5 per session, configurable)\n- IP-based rate limiting to prevent abuse\n- Custom branding on the chat widget (remove UltriumAI badge on higher plans)\n- Analytics dashboard showing visitor interactions, popular questions, and drop-off points",
          },
        ],
      },
    ],
  },

  // ─── Vanguard ───────────────────────────────────────────────
  {
    id: "vanguard",
    label: "Vanguard",
    logo: vanguardLogo,
    color: "text-cyan-400",
    categories: [
      {
        id: "vanguard-overview",
        label: "Overview",
        icon: Shield,
        articles: [
          {
            id: "vanguard-intro",
            title: "What is Vanguard?",
            content:
              "Vanguard is the **AI-powered IT operations & security platform** for MSPs and IT departments.\n\n## The Problem It Solves\nMost IT teams run 5–10 separate tools — one for endpoints, one for tickets, one for documentation, one for security, one for compliance. Each has its own login, its own billing, its own data silo. Vanguard eliminates that fragmentation.\n\n## What It Replaces\n- **RMM** (Datto, NinjaOne, ConnectWise Automate) → Horizon\n- **PSA / Helpdesk** (Autotask, ConnectWise Manage, Freshdesk) → Response\n- **XDR / AV** (SentinelOne, CrowdStrike, Huntress) → Pursuit\n- **SaaS Security** (Saasment, Augmentt) → Sentinel\n- **Vulnerability Scanning** (Nessus, Qualys) → Recon\n- **IT Documentation** (IT Glue, Hudu) → Atlas\n- **Compliance** (Drata, Vanta) → Comply\n- **Reporting** (BrightGauge, CloudRadial) → Ledger\n\n## 9 Core Modules\n1. **Horizon** — Remote Monitoring & Management (RMM)\n2. **Response** — Service Desk & Ticketing (PSA)\n3. **Pursuit** — Extended Detection & Response (XDR)\n4. **Sentinel** — SaaS Security (M365/GWS monitoring)\n5. **Recon** — Vulnerability Assessment & Penetration Testing\n6. **Atlas** — IT Documentation & Knowledge Base\n7. **Ledger** — Unified Reporting Engine\n8. **Comply** — Compliance Lifecycle Management\n9. **Cortex** — AI Intelligence Hub\n\n## Pricing Model\nPer-technician, unlimited endpoints. No per-device surcharges. Add-ons are modular — start with what you need, expand when you're ready.",
          },
        ],
      },
      {
        id: "horizon",
        label: "Horizon (RMM)",
        icon: MonitorSmartphone,
        articles: [
          {
            id: "horizon-overview",
            title: "Horizon Overview",
            content:
              "Horizon is Vanguard's RMM module — monitor, manage, and secure endpoints at scale.\n\n## What It Does\nHorizon gives technicians a single pane of glass for every endpoint in every client environment. Deploy agents, push patches, transfer files, run scripts, and connect remotely — without switching tools.\n\n## Who Uses It\n- **MSP technicians** managing hundreds of endpoints across client sites\n- **IT administrators** maintaining an internal fleet\n- **NOC teams** monitoring alerts and device health around the clock\n\n## Where It Fits in Daily Operations\nHorizon is the module you live in. Morning starts with the alert dashboard — patch failures, offline devices, disk warnings. From there, drill into a site, remote into a workstation, or push a software update fleet-wide. Every device action is logged and auditable.\n\n## Core Features\n- **Device Management** — Windows, Mac, Linux agent deployment\n- **Patch Management** — Automated Windows updates + 3rd-party via Chocolatey/WinGet with rollback\n- **Remote Access** — RustDesk built-in remote access with session history\n- **Alerting** — Multi-channel (email, SMS, webhook) with escalation rules and on-call scheduling\n- **Software Management** — Deploy, update, and remove software fleet-wide\n- **File Transfer** — Secure file transfer up to 80GB/mo (plan-dependent)\n- **Network Discovery** — Subnet scanning and device auto-detection\n- **Asset Lifecycle** — Track hardware from procurement to retirement\n\n## Site-Centric Navigation\nDevices are organized by **Sites** (client organizations). Select a site to view its devices, alerts, tickets, and configurations via horizontal tabs.",
          },
          {
            id: "horizon-agents",
            title: "Agent Deployment",
            content:
              "## Deployment Methods\n1. **Direct Download** — Generate installer from Portal → Download\n2. **Provisioning Tokens** — Create tokens for zero-touch enrollment\n3. **Group Policy** — Deploy via GPO for domain-joined machines\n4. **Intune/SCCM** — Push via MDM/SCCM\n\n## Agent Capabilities\n- System inventory (hardware, software, OS)\n- Real-time performance monitoring (CPU, RAM, disk, network)\n- Script execution (PowerShell, Bash)\n- Patch status reporting\n- Security baseline compliance checking\n\n## System Requirements\n- Windows 10/11, Server 2016+\n- macOS 12+ (Monterey)\n- Ubuntu 20.04+, Debian 11+, CentOS 8+\n- 50MB disk space, 128MB RAM",
          },
        ],
      },
      {
        id: "response",
        label: "Response (Service Desk)",
        icon: Headphones,
        articles: [
          {
            id: "response-overview",
            title: "Response Overview",
            content:
              "Response is Vanguard's built-in PSA and service desk.\n\n## What It Does\nManage the full ticket lifecycle — from client submission through resolution, time logging, and invoicing. SLA timers, escalation rules, and AI-powered routing keep your team efficient.\n\n## Who Uses It\n- **Helpdesk technicians** working ticket queues\n- **Service managers** tracking SLA compliance and team utilization\n- **Account managers** reviewing time entries and generating invoices\n- **Clients** submitting requests through the branded service portal\n\n## Where It Fits in Daily Operations\nResponse is where work gets assigned and tracked. Tickets arrive from the service portal, email, or alerts generated by Horizon and Pursuit. Technicians log time, attach notes, and resolve. Managers monitor SLA dashboards and review utilization reports in Ledger.\n\n## Features\n- **Ticket Management** — Create, assign, track, and resolve tickets\n- **SLA Tracking** — Automated SLA timers with escalation\n- **Time Tracking** — Per-ticket time logging for billing\n- **Service Portal** — Client-facing portal for ticket submission\n- **Contracts & Invoicing** — Manage recurring contracts and generate invoices\n- **AI Auto-Tagging** — Cortex AI categorizes and routes tickets automatically\n- **Knowledge Base Suggestions** — AI recommends relevant KB articles during resolution\n\n## Integrations\n- Bi-directional sync with ConnectWise and Autotask\n- QuickBooks Online and Xero for invoicing\n- Slack/Teams notifications for ticket updates",
          },
        ],
      },
      {
        id: "pursuit",
        label: "Pursuit (XDR)",
        icon: Target,
        articles: [
          {
            id: "pursuit-overview",
            title: "Pursuit XDR Overview",
            content:
              "Pursuit provides extended detection and response across your endpoint fleet.\n\n## What It Does\nDetect threats using behavioral analysis and signature matching, map detections to MITRE ATT&CK, and respond with automated isolation, process termination, and file quarantine.\n\n## Who Uses It\n- **SOC analysts** triaging and investigating alerts\n- **MSP security teams** monitoring multiple client environments from a unified console\n- **IT directors** reviewing threat posture and incident history\n\n## Where It Fits in Daily Operations\nPursuit feeds into the SOC dashboard. When a detection fires, an analyst reviews the ATT&CK mapping, examines the timeline, and decides whether to isolate the endpoint. Resolved incidents create tickets in Response and entries in Ledger reports for QBRs.\n\n## Capabilities\n- **Threat Detection** — AI-powered behavioral analysis and signature matching\n- **MITRE ATT&CK Mapping** — Map detections to the ATT&CK framework\n- **Automated Remediation** — Isolate endpoints, kill processes, quarantine files\n- **SOC Dashboards** — Real-time threat visibility with drill-down\n- **Cross-Client SOC** — Detect coordinated campaigns across your MSP fleet (add-on)\n- **Incident Response Playbooks** — Guided response workflows\n- **Threat Hunting** — Proactive IOC and behavioral queries\n\n## Add-On Pricing\n- Pursuit XDR: $8/user/mo\n- Cross-Client SOC: $10/user/mo\n- Included in Power/Superpower (MSP) and Master/Enterprise (IT) plans",
          },
        ],
      },
      {
        id: "sentinel",
        label: "Sentinel (SaaS Security)",
        icon: Eye,
        articles: [
          {
            id: "sentinel-overview",
            title: "Sentinel Overview",
            content:
              "Sentinel monitors Microsoft 365 and Google Workspace tenants for security threats.\n\n## What It Does\nConnects to your cloud tenants and continuously monitors for suspicious activity — unauthorized sign-ins, mail forwarding rule changes, admin permission escalations, and data exfiltration patterns.\n\n## Who Uses It\n- **MSPs** managing multiple client M365/GWS tenants\n- **IT security teams** responsible for cloud identity and data protection\n- **Compliance officers** needing audit trails for cloud admin activity\n\n## Where It Fits in Daily Operations\nSentinel alerts appear alongside Pursuit detections in the unified alert stream. An analyst sees a suspicious login from an unusual location, reviews the audit log, and decides whether to reset credentials or escalate. Phishing simulation campaigns run on a schedule and feed employee risk scores into Comply.\n\n## Features\n- **M365 Security Alerts** — Suspicious sign-ins, mail forwarding rules, admin changes\n- **Google Workspace Monitoring** — Drive sharing, admin audit, login anomalies\n- **AI Triage** — Cortex AI prioritizes and contextualizes alerts\n- **Tenant Management** — Manage multiple client tenants from one view\n- **Phishing Simulation** — Run simulated phishing campaigns with employee risk scoring (add-on)\n\n## Add-On Pricing\n- Sentinel SaaS: $6/user/mo\n- Phishing Simulation: $4/user/mo",
          },
        ],
      },
      {
        id: "recon",
        label: "Recon (Security Assessment)",
        icon: Radar,
        articles: [
          {
            id: "recon-overview",
            title: "Recon Overview",
            content:
              "Recon provides vulnerability assessment and penetration testing capabilities.\n\n## What It Does\nScans networks and endpoints for known vulnerabilities (CVEs), runs guided penetration tests with evidence collection, and benchmarks configurations against CIS and NIST frameworks.\n\n## Who Uses It\n- **Security engineers** running scheduled vulnerability scans\n- **Pentest teams** conducting assessments for clients\n- **Compliance leads** needing scan evidence for SOC 2 or HIPAA audits\n\n## Where It Fits in Daily Operations\nRecon scans run on a schedule or on demand before client QBRs. Results feed into Comply for control evidence and into Ledger for security posture reports. Critical findings can auto-create tickets in Response for remediation tracking.\n\n## Features\n- **Vulnerability Scanning** — Automated CVE detection across network assets\n- **Pentest Workflows** — Guided penetration testing with evidence collection\n- **Network Discovery** — Subnet scanning and asset mapping\n- **Recon Hardware** — Optional physical appliances (Recon Lite $299, Recon Pro $499) for on-premises scanning\n- **Compliance Scanning** — CIS benchmarks, NIST framework checks\n\n## Hardware Subscriptions\n- Essential: $29/mo — Basic scanning\n- Professional: $49/mo — Advanced + scheduled scans\n- Enterprise: $99/mo — Continuous monitoring + API access\n\n## Add-On Pricing\n- Recon Pentest: $12/user/mo",
          },
        ],
      },
      {
        id: "atlas",
        label: "Atlas (Documentation)",
        icon: FileText,
        articles: [
          {
            id: "atlas-overview",
            title: "Atlas Overview",
            content:
              "Atlas is Vanguard's IT documentation platform — comparable to IT Glue.\n\n## What It Does\nCentralizes all client documentation — contacts, configurations, credentials, SOPs, runbooks, and custom asset types — in a searchable, multi-tenant knowledge base.\n\n## Who Uses It\n- **Technicians** looking up passwords, network diagrams, or runbooks mid-ticket\n- **Service managers** ensuring documentation coverage across all client sites\n- **Onboarding coordinators** running checklists for new client setups\n\n## Where It Fits in Daily Operations\nAtlas is the reference layer. When a technician opens a ticket in Response, they search Atlas for the relevant SOP or password. When onboarding a new client, they follow an Atlas checklist. SSL and domain expirations generate proactive alerts before anything lapses.\n\n## Core Features\n- **Organizations** — Multi-tenant client documentation\n- **Contacts** — Client contact database with roles\n- **Configurations** — Hardware, software, and network configs\n- **Documents & SOPs** — Rich-text documentation with versioning\n- **Runbooks** — Step-by-step procedures with difficulty levels\n- **Flexible Assets** — Custom schema asset types (e.g., \"Firewall Rules\", \"License Keys\")\n- **Password Vault** — Encrypted credential storage per organization\n- **SSL/Domain Tracking** — Automated expiration monitoring\n- **Checklists** — Onboarding/offboarding workflows\n\n## AI Features (via Cortex)\n- **AI Doc Generator** — Generate SOPs and policies from prompts\n- **AI Search & Q&A** — Natural language search across all documentation\n\n## Add-On Pricing\n- Atlas Documentation: $3/user/mo",
          },
        ],
      },
      {
        id: "comply",
        label: "Comply (Compliance)",
        icon: Scale,
        articles: [
          {
            id: "comply-overview",
            title: "Comply Overview",
            content:
              "Comply manages the full compliance lifecycle — from framework selection to audit readiness.\n\n## What It Does\nMaps your controls to industry frameworks, automates evidence collection from other Vanguard modules, and generates audit-ready reports.\n\n## Who Uses It\n- **Compliance officers** managing SOC 2, HIPAA, or ISO 27001 programs\n- **MSP owners** offering compliance-as-a-service to clients\n- **IT directors** preparing for internal or external audits\n\n## Where It Fits in Daily Operations\nComply pulls evidence automatically — patch compliance from Horizon, scan results from Recon, access logs from Sentinel, and ticket resolution data from Response. Instead of scrambling before an audit, your compliance posture stays current in real time.\n\n## Supported Frameworks\n- SOC 2 Type I & II\n- HIPAA\n- ISO 27001\n- NIST CSF\n- CIS Controls\n- PCI DSS\n\n## Features\n- **Control Mapping** — Map controls to multiple frameworks simultaneously\n- **Evidence Collection** — Automated evidence gathering from Vanguard modules\n- **Continuous Monitoring** — Real-time control status dashboards\n- **Audit Reports** — Generate audit-ready reports with one click\n- **Gap Analysis** — Identify and track compliance gaps\n- **Policy Templates** — Pre-built policy documents\n\n## Add-On Pricing\n- Comply: $7/user/mo",
          },
        ],
      },
      {
        id: "ledger",
        label: "Ledger (Reporting)",
        icon: BarChart3,
        articles: [
          {
            id: "ledger-overview",
            title: "Ledger Overview",
            content:
              "Ledger is the unified reporting engine across all Vanguard modules.\n\n## What It Does\nAggregates data from every module into structured reports — executive summaries, security posture, SLA performance, fleet health, and compliance status. One reporting engine instead of nine.\n\n## Who Uses It\n- **MSP owners** preparing QBR presentations for clients\n- **Service managers** reviewing SLA and utilization metrics\n- **Security leads** summarizing threat activity and response times\n\n## Where It Fits in Daily Operations\nLedger is where operational data becomes business intelligence. Generate a report before a client meeting, schedule automated weekly summaries, or drill into a specific module's metrics for root-cause analysis.\n\n## Report Categories\n1. **Executive Summaries** — C-level KPIs aggregated from all modules\n2. **Helpdesk** — Ticket volume, SLA performance, technician utilization\n3. **Security (Pursuit/Recon)** — Threat detections, vulnerabilities, incident response\n4. **SaaS Security (Sentinel)** — M365/GWS alerts, tenant health\n5. **Fleet (Horizon)** — Device health, patch compliance, asset inventory\n6. **Compliance (Comply)** — Framework status, control effectiveness\n7. **Documentation (Atlas)** — Coverage metrics, stale document alerts\n\n## AI Summaries\nEvery report includes a **Generate AI Summary** button powered by Cortex — producing attack narratives, risk assessments, and strategic recommendations.",
          },
        ],
      },
      {
        id: "cortex",
        label: "Cortex (AI Hub)",
        icon: Brain,
        articles: [
          {
            id: "cortex-overview",
            title: "Cortex AI Overview",
            content:
              "Cortex is Vanguard's AI intelligence layer — over 20 specialized tools for IT operations.\n\n## What It Does\nProvides AI-powered analysis, automation, and decision support across every Vanguard module. From auto-triaging tickets to predicting SLA breaches to generating documentation from screenshots.\n\n## Who Uses It\n- **Technicians** using AI Ticket Analyzer and Smart Router to work faster\n- **Service managers** using SLA Predictor to prevent breaches\n- **Documentation leads** using Screen-to-Docs and KB Generator to keep Atlas current\n\n## Where It Fits in Daily Operations\nCortex runs in the background across Vanguard. It auto-categorizes incoming tickets, suggests relevant KB articles during resolution, flags potential SLA breaches before they happen, and generates report summaries in Ledger. You interact with it through contextual AI buttons embedded in every module.\n\n## Key Tools\n- **AI Ticket Analyzer** — Summarize, categorize, and suggest responses\n- **SLA Predictor** — Forecast SLA breaches before they happen\n- **Screen-to-Docs** — Convert screenshots into structured documentation\n- **Smart Router** — Route tickets to the best technician based on skills and workload\n- **Knowledge Base Generator** — Auto-generate KB articles from resolved tickets\n- **Voice Assistant** — Hands-free AI for operational tasks (intent detection)\n\n## AI Models\nPowered by Gemini 3 and GPT-5 via the Lovable AI Gateway.\n\n## Add-On Pricing\n- Cortex AI: $5/user/mo\n- AI Copilot: $50/technician/mo (premium tier with full automation)",
          },
        ],
      },
      {
        id: "vanguard-addons",
        label: "Add-Ons & Bundles",
        icon: Layers,
        articles: [
          {
            id: "addon-matrix",
            title: "Add-On Pricing Matrix",
            content:
              "All add-ons are per-user/month and can be added to any base plan.\n\n| Module | Price | Category |\n|--------|-------|----------|\n| Pursuit XDR | $8 | Security |\n| Sentinel SaaS | $6 | Security |\n| Recon Pentest | $12 | Security |\n| Cortex AI | $5 | AI |\n| Comply | $7 | Compliance |\n| Cross-Client SOC | $10 | Intelligence |\n| Atlas Documentation | $3 | Operations |\n| Phishing Simulation | $4 | Security |\n| AI Copilot | $50 | AI (Premium) |\n| Network Discovery | $25 | Operations |\n\n## Strategic Bundles\n- **Security Bundle** (Pursuit + Sentinel + Comply): $18/user/mo (save 15%)\n- **Complete SOC** (All security modules): $38/user/mo (save 20%)\n\nHigher-tier plans include many add-ons at no extra cost. See [Vanguard Pricing](/pricing/vanguard) for inclusion details.",
          },
          {
            id: "reseller-program",
            title: "MSP Partner Program",
            content:
              "## Partner Tiers\n| Tier | Min Seats | Discount | White-Label |\n|------|-----------|----------|-------------|\n| Silver | 10 | 15% | None |\n| Gold | 25 | 25% | Partial (co-branded) |\n| Platinum | 50 | 35% | Full removal of UltriumAI branding |\n\n## Partner Benefits\n- Volume discounts on all plans and add-ons\n- Profit margin calculator in partner dashboard\n- Co-branded marketing kit generator\n- Client provisioning interface\n- Dedicated partner support\n\nApply via the **MSP Partner Portal** in Vanguard settings.",
          },
        ],
      },
    ],
  },

  // ─── SafeSuite ──────────────────────────────────────────────
  {
    id: "safesuite",
    label: "SafeSuite",
    logo: safesuiteLogo,
    color: "text-emerald-400",
    categories: [
      {
        id: "safesuite-overview",
        label: "Overview",
        icon: Shield,
        articles: [
          {
            id: "safesuite-intro",
            title: "What is SafeSuite?",
            content:
              "SafeSuite is UltriumAI's consumer and SMB security toolkit — five integrated tools for personal and small business cybersecurity.\n\n## Products\n1. **SafePass** — Zero-knowledge password vault (AES-256-GCM, 600K PBKDF2, TOTP authenticator)\n2. **SafeScan** — Unified email, URL, and document threat scanner (bulk scanning up to 50 items)\n3. **SafeWeb** — Dark web breach monitoring with AI-powered threat analysis\n4. **SafeTrack** — IT asset lifecycle management with QR tracking and depreciation\n5. **SafeAssist** — AI-powered security assistant for plain-language guidance",
          },
        ],
      },
      {
        id: "safepass",
        label: "SafePass",
        icon: Lock,
        articles: [
          {
            id: "safepass-guide",
            title: "SafePass Guide",
            content:
              "## Zero-Knowledge Architecture\nYour master password never leaves your device. All encryption/decryption happens client-side using AES-256-GCM with 600,000 PBKDF2 iterations.\n\n## Features\n- Password vault with folders and tags\n- Built-in TOTP authenticator (replace Google Authenticator)\n- Password health dashboard (weak, reused, breached)\n- Secure password generator (configurable length, character sets)\n- Browser extension (Chrome, Edge)\n- Mobile apps (iOS, Android)\n- Secure notes and credit card storage\n- Emergency access contacts\n\n## Import\nImport from LastPass, 1Password, Bitwarden, Chrome, and CSV.",
          },
        ],
      },
      {
        id: "safescan",
        label: "SafeScan",
        icon: Search,
        articles: [
          {
            id: "safescan-guide",
            title: "SafeScan Guide",
            content:
              "## Scanning Capabilities\n- **Email Analysis** — Phishing detection, sender verification, attachment scanning\n- **URL Scanning** — Malware detection, domain reputation, redirect chain analysis\n- **Document Scanning** — Macro detection, embedded object analysis, metadata extraction\n\n## Features\n- Bulk scanning (up to 50 items per batch)\n- Scheduled recurring scans\n- PDF and CSV report generation\n- Risk scoring (0–100)\n- Threat intelligence integration\n\n## API Access\nAvailable on Business and Enterprise plans for automated scanning workflows.",
          },
        ],
      },
      {
        id: "safeweb",
        label: "SafeWeb",
        icon: Globe,
        articles: [
          {
            id: "safeweb-guide",
            title: "SafeWeb Guide",
            content:
              "## Dark Web Monitoring\n- Monitor email addresses and domains for breach exposure\n- Aggregated breach intelligence from multiple databases\n- Real-time alerts when new breaches are detected\n\n## AI Analysis\n- AI-generated threat response plans\n- Exposure risk scoring per identity\n- Remediation guidance (password changes, account recovery steps)\n- Historical breach timeline\n\n## Enterprise Features\n- Bulk domain monitoring\n- Executive monitoring (leadership team alerts)\n- Compliance reporting for breach notification requirements",
          },
        ],
      },
      {
        id: "safetrack",
        label: "SafeTrack",
        icon: Server,
        articles: [
          {
            id: "safetrack-guide",
            title: "SafeTrack Guide",
            content:
              "## Asset Management\n- Hardware and software inventory with custom fields\n- QR code generation and scanning for physical assets\n- Depreciation calculations (straight-line, declining balance)\n- Warranty tracking with expiration alerts\n\n## Lifecycle Management\n- Procurement → Deployment → Maintenance → Retirement\n- Maintenance scheduling with cost tracking\n- Assignment history (user, department, location)\n- Compliance audit trails\n\n## Reporting\n- Asset valuation reports\n- Depreciation schedules\n- Maintenance cost analysis\n- Warranty status overview",
          },
        ],
      },
      {
        id: "safeassist",
        label: "SafeAssist",
        icon: Bot,
        articles: [
          {
            id: "safeassist-guide",
            title: "SafeAssist Guide",
            content:
              "## AI Security Assistant\nSafeAssist provides plain-language security guidance through a ChatGPT-style interface.\n\n## Capabilities\n- Answer security questions in plain English\n- Analyze uploaded files and emails for threats\n- Provide personalized security recommendations\n- Explain technical security concepts\n- Guide through incident response steps\n\n## Powered By\nSafeAssist uses the same AI models as Cortex (Gemini 3 / GPT-5) but optimized for consumer-friendly language.",
          },
        ],
      },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────

const Docs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("platform");
  const [activeArticle, setActiveArticle] = useState("quick-start");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["getting-started", "choose-your-path"])
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Find current article
  const findArticle = (
    articleId: string
  ): { article: DocArticle; section: DocSection; category: DocCategory } | null => {
    for (const section of DOC_SECTIONS) {
      for (const category of section.categories) {
        const article = category.articles.find((a) => a.id === articleId);
        if (article) return { article, section, category };
      }
    }
    return null;
  };

  const current = findArticle(activeArticle);

  // Search
  const searchResults = searchTerm.trim()
    ? DOC_SECTIONS.flatMap((s) =>
        s.categories.flatMap((c) =>
          c.articles
            .filter(
              (a) =>
                a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.content.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((a) => ({ article: a, section: s, category: c }))
        )
      )
    : [];

  const selectArticle = (articleId: string) => {
    const found = findArticle(articleId);
    if (found) {
      setActiveSection(found.section.id);
      setActiveArticle(articleId);
      setExpandedCategories((prev) => new Set([...prev, found.category.id]));
      setMobileSidebarOpen(false);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Render markdown-ish content
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("### ")) return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-2">{line.slice(4)}</h3>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-3 pb-2 border-b border-border/30">{line.slice(3)}</h2>;
      if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold text-foreground mt-6 mb-4">{line.slice(2)}</h1>;
      if (line.startsWith("| ") && line.includes("|")) {
        const cells = line.split("|").filter(Boolean).map((c) => c.trim());
        if (cells.every((c) => /^[-:]+$/.test(c))) return null; // separator row
        const isHeader = i > 0 && content.split("\n")[i + 1]?.includes("---");
        return (
          <div key={i} className={cn("grid gap-4 px-3 py-2 text-sm", `grid-cols-${cells.length}`, isHeader ? "font-semibold text-foreground border-b border-border/30" : "text-muted-foreground")}>
            {cells.map((c, j) => <span key={j}>{c}</span>)}
          </div>
        );
      }
      if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
        if (match) return <li key={i} className="ml-4 text-sm text-muted-foreground mb-1.5"><span className="font-semibold text-foreground">{match[1]}</span> — {match[2]}</li>;
        const match2 = line.match(/^- \*\*(.+?)\*\*(.*)$/);
        if (match2) return <li key={i} className="ml-4 text-sm text-muted-foreground mb-1.5"><span className="font-semibold text-foreground">{match2[1]}</span>{match2[2]}</li>;
      }
      if (line.startsWith("- ")) return <li key={i} className="ml-4 text-sm text-muted-foreground mb-1">{renderInline(line.slice(2))}</li>;
      if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 text-sm text-muted-foreground mb-1 list-decimal">{renderInline(line.replace(/^\d+\.\s/, ""))}</li>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-2">{renderInline(line)}</p>;
    });
  };

  const renderInline = (text: string) => {
    // Handle **bold**, `code`, [links](/path)
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">{part.slice(1, -1)}</code>;
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch)
        return <a key={i} href={linkMatch[2]} className="text-primary hover:underline">{linkMatch[1]}</a>;
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-16 flex">
        {/* ── Mobile Sidebar Toggle ─────────────────────── */}
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="md:hidden fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground rounded-full p-3 shadow-lg"
        >
          <BookOpen className="h-5 w-5" />
        </button>

        {/* ── Sidebar ───────────────────────────────────── */}
        <aside
          className={cn(
            "fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-64px)] w-72 bg-background border-r border-border/50 transition-transform md:translate-x-0 flex flex-col",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Search */}
          <div className="p-4 border-b border-border/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search docs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/50"
              />
            </div>

            {/* Search Results */}
            {searchTerm.trim() && searchResults.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
                {searchResults.slice(0, 10).map((r) => (
                  <button
                    key={r.article.id}
                    onClick={() => {
                      selectArticle(r.article.id);
                      setSearchTerm("");
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-foreground font-medium block truncate">{r.article.title}</span>
                    <span className="text-muted-foreground text-xs">{r.section.label} → {r.category.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav Tree */}
          <ScrollArea className="flex-1">
            <nav className="p-3 space-y-1">
              {DOC_SECTIONS.map((section) => (
                <div key={section.id} className="mb-3">
                  {/* Section Header */}
                  <button
                    onClick={() => setActiveSection(section.id === activeSection ? "" : section.id)}
                    className={cn(
                      "flex items-center gap-2 w-full px-2 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors",
                      activeSection === section.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {section.logo ? (
                      <img src={section.logo} alt={section.label} className="h-4 w-4 object-contain" />
                    ) : (
                      section.icon && <section.icon className="h-3.5 w-3.5" />
                    )}
                    {section.label}
                  </button>

                  {/* Categories */}
                  <div className="ml-2 mt-1 space-y-0.5">
                    {section.categories.map((category) => {
                      const isExpanded = expandedCategories.has(category.id);
                      const hasActive = category.articles.some((a) => a.id === activeArticle);

                      return (
                        <div key={category.id}>
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className={cn(
                              "flex items-center justify-between w-full px-2 py-1.5 text-sm rounded transition-colors",
                              hasActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <category.icon className="h-3.5 w-3.5" />
                              <span>{category.label}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="ml-5 border-l border-border/30 pl-2 space-y-0.5">
                              {category.articles.map((article) => (
                                <button
                                  key={article.id}
                                  onClick={() => selectArticle(article.id)}
                                  className={cn(
                                    "block w-full text-left px-2 py-1 text-sm rounded transition-colors truncate",
                                    activeArticle === article.id
                                      ? "text-primary bg-primary/10 font-medium"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                  )}
                                >
                                  {article.title}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* ── Overlay for mobile ────────────────────────── */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ── Content ───────────────────────────────────── */}
        <main ref={contentRef} className="flex-1 min-h-[calc(100vh-64px)] overflow-y-auto">
          {current ? (
            <div className="max-w-3xl mx-auto px-6 py-10">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <span>{current.section.label}</span>
                <ChevronRight className="h-3 w-3" />
                <span>{current.category.label}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium">{current.article.title}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-foreground mb-8">
                {current.article.title}
              </h1>

              {/* Content */}
              <div className="prose-sm">{renderContent(current.article.content)}</div>

              {/* Navigation */}
              <div className="mt-12 pt-6 border-t border-border/30 flex items-center justify-between">
                {(() => {
                  const allArticles = DOC_SECTIONS.flatMap((s) =>
                    s.categories.flatMap((c) => c.articles)
                  );
                  const idx = allArticles.findIndex((a) => a.id === activeArticle);
                  const prev = idx > 0 ? allArticles[idx - 1] : null;
                  const next = idx < allArticles.length - 1 ? allArticles[idx + 1] : null;

                  return (
                    <>
                      {prev ? (
                        <Button variant="ghost" size="sm" onClick={() => selectArticle(prev.id)}>
                          ← {prev.title}
                        </Button>
                      ) : <div />}
                      {next ? (
                        <Button variant="ghost" size="sm" onClick={() => selectArticle(next.id)}>
                          {next.title} →
                        </Button>
                      ) : <div />}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select an article from the sidebar
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Docs;
