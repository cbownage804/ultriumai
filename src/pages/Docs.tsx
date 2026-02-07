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
              "AI Studio uses **AI Capacity Credits** (not tokens) across three market segments:\n\n### MSPs & IT Firms\n| Plan | Credits | Price |\n|------|---------|-------|\n| MSP Starter | 40,000 | $99/mo |\n| MSP Pro | 150,000 | $249/mo |\n| MSP Elite | 350,000 | $499/mo |\n| Platform Pro | 600,000 | $999/mo |\n\n### Internal Business Teams\n| Plan | Credits | Price |\n|------|---------|-------|\n| Team Basic | 15,000 | $49/mo |\n| Team Plus | 75,000 | $149/mo |\n\n### Website / Embedded AI\n| Plan | Credits | Price |\n|------|---------|-------|\n| Website Basic | 3,000 | $29/mo |\n| Website Pro | 12,000 | $79/mo |\n\nCredits do not roll over (except Enterprise). Hard stops at limits.",
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
              "AI Studio is the **Business AI Control Plane** — build, deploy, and govern custom AI assistants without writing code.\n\n## Key Capabilities\n- Create custom GPTs with system prompts, knowledge bases, and actions\n- Deploy assistants on your website, Slack, Teams, or via API\n- Full usage analytics and credit governance\n- 22 pre-built action templates (security scanning, ticket escalation, web search, etc.)\n- White-label embedding for MSP resale",
          },
          {
            id: "custom-gpts",
            title: "Creating Custom GPTs",
            content:
              "## Build Process\n1. **Define** — Set name, avatar, system prompt, and personality\n2. **Knowledge** — Upload documents (PDF, DOCX, TXT, MD, CSV, PPTX) or crawl websites\n3. **Actions** — Attach pre-built or custom API actions\n4. **Test** — Interact in the sandbox to refine behavior\n5. **Deploy** — Publish to web embed, API, or internal use\n\n## Configuration\n- **Model**: Choose between available LLMs\n- **Temperature**: Control creativity vs. precision\n- **Max tokens**: Set response length limits\n- **Knowledge retrieval**: RAG-based document Q&A\n- **Action permissions**: Control which APIs the GPT can call",
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
              "AI Studio includes 22 pre-built action templates:\n\n### SafeSuite Security\n- URL scanning, breach alerts, password analysis\n\n### Support\n- Ticket escalation, Slack/Teams notifications, email dispatch\n\n### Productivity\n- Calendar management, task automation, meeting summaries\n\n### Data Operations\n- Web search, structured extraction, document parsing, CSV generation\n\nEach template includes a pre-defined JSON input schema for seamless integration.",
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
              "## Embed Methods\n- **Chat Widget** — Floating bubble on your website (copy-paste script tag)\n- **Inline Embed** — Full-page or section embed via iframe\n- **API** — RESTful conversation API for custom UIs\n- **Slack/Teams** — Native app integration\n\n## Website Plans\n- Visitor message caps (3–5 per session)\n- IP-based rate limiting\n- Custom branding on chat widget\n- Analytics dashboard for visitor interactions",
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
              "Vanguard is the **AI-powered IT operations & security platform** for MSPs and IT departments.\n\nIt replaces your RMM, PSA, documentation, XDR, and compliance tools with a single unified platform — priced per technician with unlimited endpoints.\n\n## 9 Core Modules\n1. **Horizon** — Remote Monitoring & Management (RMM)\n2. **Response** — Service Desk & Ticketing (PSA)\n3. **Pursuit** — Extended Detection & Response (XDR)\n4. **Sentinel** — SaaS Security (M365/GWS monitoring)\n5. **Recon** — Vulnerability Assessment & Penetration Testing\n6. **Atlas** — IT Documentation & Knowledge Base\n7. **Ledger** — Unified Reporting Engine\n8. **Comply** — Compliance Lifecycle Management\n9. **Cortex** — AI Intelligence Hub",
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
              "Horizon is Vanguard's RMM module — monitor, manage, and secure endpoints at scale.\n\n## Core Features\n- **Device Management** — Windows, Mac, Linux agent deployment\n- **Patch Management** — Automated Windows updates + 3rd-party via Chocolatey/WinGet with rollback\n- **Remote Access** — RustDesk built-in remote access with session history\n- **Alerting** — Multi-channel (email, SMS, webhook) with escalation rules and on-call scheduling\n- **Software Management** — Deploy, update, and remove software fleet-wide\n- **File Transfer** — Secure file transfer up to 80GB/mo (plan-dependent)\n- **Network Discovery** — Subnet scanning and device auto-detection\n- **Asset Lifecycle** — Track hardware from procurement to retirement\n\n## Site-Centric Navigation\nDevices are organized by **Sites** (client organizations). Select a site to view its devices, alerts, tickets, and configurations via horizontal tabs.",
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
              "Response is Vanguard's built-in PSA/service desk.\n\n## Features\n- **Ticket Management** — Create, assign, track, and resolve tickets\n- **SLA Tracking** — Automated SLA timers with escalation\n- **Time Tracking** — Per-ticket time logging for billing\n- **Service Portal** — Client-facing portal for ticket submission\n- **Contracts & Invoicing** — Manage recurring contracts and generate invoices\n- **AI Auto-Tagging** — Cortex AI categorizes and routes tickets automatically\n- **Knowledge Base Suggestions** — AI recommends relevant KB articles during resolution\n\n## Integrations\n- Bi-directional sync with ConnectWise and Autotask\n- QuickBooks Online and Xero for invoicing\n- Slack/Teams notifications for ticket updates",
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
              "Pursuit provides extended detection and response across your endpoint fleet.\n\n## Capabilities\n- **Threat Detection** — AI-powered behavioral analysis and signature matching\n- **MITRE ATT&CK Mapping** — Map detections to the ATT&CK framework\n- **Automated Remediation** — Isolate endpoints, kill processes, quarantine files\n- **SOC Dashboards** — Real-time threat visibility with drill-down\n- **Cross-Client SOC** — Detect coordinated campaigns across your MSP fleet (add-on)\n- **Incident Response Playbooks** — Guided response workflows\n- **Threat Hunting** — Proactive IOC and behavioral queries\n\n## Add-On Pricing\n- Pursuit XDR: $8/user/mo\n- Cross-Client SOC: $10/user/mo\n- Included in Power/Superpower (MSP) and Master/Enterprise (IT) plans",
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
              "Sentinel monitors Microsoft 365 and Google Workspace tenants for security threats.\n\n## Features\n- **M365 Security Alerts** — Suspicious sign-ins, mail forwarding rules, admin changes\n- **Google Workspace Monitoring** — Drive sharing, admin audit, login anomalies\n- **AI Triage** — Cortex AI prioritizes and contextualizes alerts\n- **Tenant Management** — Manage multiple client tenants from one view\n- **Phishing Simulation** — Run simulated phishing campaigns with employee risk scoring (add-on)\n\n## Add-On Pricing\n- Sentinel SaaS: $6/user/mo\n- Phishing Simulation: $4/user/mo",
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
              "Recon provides vulnerability assessment and penetration testing capabilities.\n\n## Features\n- **Vulnerability Scanning** — Automated CVE detection across network assets\n- **Pentest Workflows** — Guided penetration testing with evidence collection\n- **Network Discovery** — Subnet scanning and asset mapping\n- **Recon Hardware** — Optional physical appliances (Recon Lite $299, Recon Pro $499) for on-premises scanning\n- **Compliance Scanning** — CIS benchmarks, NIST framework checks\n\n## Hardware Subscriptions\n- Essential: $29/mo — Basic scanning\n- Professional: $49/mo — Advanced + scheduled scans\n- Enterprise: $99/mo — Continuous monitoring + API access\n\n## Add-On Pricing\n- Recon Pentest: $12/user/mo",
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
              "Atlas is Vanguard's IT documentation platform — comparable to IT Glue.\n\n## Core Features\n- **Organizations** — Multi-tenant client documentation\n- **Contacts** — Client contact database with roles\n- **Configurations** — Hardware, software, and network configs\n- **Documents & SOPs** — Rich-text documentation with versioning\n- **Runbooks** — Step-by-step procedures with difficulty levels\n- **Flexible Assets** — Custom schema asset types (e.g., \"Firewall Rules\", \"License Keys\")\n- **Password Vault** — Encrypted credential storage per organization\n- **SSL/Domain Tracking** — Automated expiration monitoring\n- **Checklists** — Onboarding/offboarding workflows\n\n## AI Features (via Cortex)\n- **AI Doc Generator** — Generate SOPs and policies from prompts\n- **AI Search & Q&A** — Natural language search across all documentation\n\n## Add-On Pricing\n- Atlas Documentation: $3/user/mo",
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
              "Comply manages the full compliance lifecycle — from framework selection to audit readiness.\n\n## Supported Frameworks\n- SOC 2 Type I & II\n- HIPAA\n- ISO 27001\n- NIST CSF\n- CIS Controls\n- PCI DSS\n\n## Features\n- **Control Mapping** — Map controls to multiple frameworks simultaneously\n- **Evidence Collection** — Automated evidence gathering from Vanguard modules\n- **Continuous Monitoring** — Real-time control status dashboards\n- **Audit Reports** — Generate audit-ready reports with one click\n- **Gap Analysis** — Identify and track compliance gaps\n- **Policy Templates** — Pre-built policy documents\n\n## Add-On Pricing\n- Comply: $7/user/mo",
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
              "Ledger is the unified reporting engine across all Vanguard modules.\n\n## Report Categories\n1. **Executive Summaries** — C-level KPIs aggregated from all modules\n2. **Helpdesk** — Ticket volume, SLA performance, technician utilization\n3. **Security (Pursuit/Recon)** — Threat detections, vulnerabilities, incident response\n4. **SaaS Security (Sentinel)** — M365/GWS alerts, tenant health\n5. **Fleet (Horizon)** — Device health, patch compliance, asset inventory\n6. **Compliance (Comply)** — Framework status, control effectiveness\n7. **Documentation (Atlas)** — Coverage metrics, stale document alerts\n\n## AI Summaries\nEvery report includes a **Generate AI Summary** button powered by Cortex — producing attack narratives, risk assessments, and strategic recommendations.",
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
              "Cortex is Vanguard's AI intelligence layer — over 20 specialized tools for IT operations.\n\n## Key Tools\n- **AI Ticket Analyzer** — Summarize, categorize, and suggest responses\n- **SLA Predictor** — Forecast SLA breaches before they happen\n- **Screen-to-Docs** — Convert screenshots into structured documentation\n- **Smart Router** — Route tickets to the best technician based on skills and workload\n- **Knowledge Base Generator** — Auto-generate KB articles from resolved tickets\n- **Voice Assistant** — Hands-free AI for operational tasks (intent detection)\n\n## AI Models\nPowered by Gemini 3 and GPT-5 via the Lovable AI Gateway.\n\n## Add-On Pricing\n- Cortex AI: $5/user/mo\n- AI Copilot: $50/technician/mo (premium tier with full automation)",
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
    new Set(["getting-started"])
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
