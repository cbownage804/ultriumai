# UltriumAI Platform

A comprehensive enterprise security and AI operations platform built with React, TypeScript, and Supabase.

## 🎯 Overview

UltriumAI is a unified platform consisting of three major product suites:

- **Vanguard** - Enterprise MSP/MSSP security and operations platform
- **SafeSuite** - Consumer/SMB password management and security tools  
- **AI Studio** - Custom GPT builder and AI orchestration platform

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React 18 + TypeScript + Vite + TailwindCSS + Framer Motion │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Database   │  │  Edge Funcs  │  │   Auth/Storage   │  │
│  │  PostgreSQL  │  │    Deno      │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Integrations                      │
│  Stripe • Lovable AI Gateway • Third-party APIs             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ultriumai

# Install dependencies
bun install
# or
npm install

# Start development server
bun dev
# or
npm run dev
```

The app will be available at `http://localhost:8080`

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Base UI components (shadcn/ui)
│   ├── vanguard/       # Vanguard-specific components
│   ├── safesuite/      # SafeSuite components
│   ├── ai-studio/      # AI Studio components
│   └── shared/         # Cross-product shared components
├── hooks/              # Custom React hooks
├── pages/              # Page components (routes)
├── layouts/            # Layout wrappers
├── lib/                # Utility functions
├── config/             # Configuration files
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client & types
└── routes/             # Route configurations

supabase/
├── functions/          # Edge functions (Deno)
├── migrations/         # Database migrations
└── config.toml         # Supabase configuration

e2e/                    # Playwright E2E tests
```

## 🎨 Design System

### Theme

The platform uses a dark theme with product-specific accent colors:

| Product    | Primary Color | CSS Variable     |
|------------|---------------|------------------|
| Vanguard   | Cyan/Teal     | `--cyan-500`     |
| SafePass   | Amber         | `--amber-500`    |
| SafeScan   | Red           | `--red-500`      |
| AI Studio  | Violet        | `--violet-500`   |

### CSS Architecture

- **Base styles**: `src/index.css`
- **Tailwind config**: `tailwind.config.ts`
- **Component variants**: shadcn/ui + custom extensions

## 🔐 Authentication

Authentication is handled via Supabase Auth supporting:

- Email/Password
- Magic Link
- Google OAuth
- MFA (TOTP)

Protected routes use `<ProtectedRoute>` wrapper.

## 📊 Database

### Key Tables

| Category | Tables |
|----------|--------|
| Users | `profiles`, `user_roles` |
| Vanguard | `vanguard_agents`, `vanguard_metrics`, `vanguard_commands` |
| Tickets | `helpdesk_tickets`, `ticket_comments` |
| AI Studio | `custom_gpts`, `gpt_conversations` |
| SafePass | `safepass_vaults`, `safepass_entries` |

### Row-Level Security

All tables have RLS policies enforcing `auth.uid() = user_id` patterns.

## 🧪 Testing

### Unit Tests (Vitest)

```bash
bun run test
# or
npm run test
```

### E2E Tests (Playwright)

```bash
# Run all tests
bun run test:e2e

# Run specific test file
bun run test:e2e e2e/vanguard.spec.ts

# Run with UI
bun run test:e2e --ui
```

## 🚢 Deployment

### Lovable Cloud (Recommended)

The project is optimized for Lovable Cloud deployment. Push to main branch to trigger automatic deployment.

**Project URL**: https://lovable.dev/projects/51e5cd04-5f19-440a-a7ba-de30fc766877

### Manual Deployment

1. Build the project:
   ```bash
   bun run build
   ```

2. Deploy the `dist` folder to your hosting provider.

## 🔧 Development

### Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Conventional commits recommended

### Logging

Use `devLog` utility for development logging:
```typescript
import { devLog } from '@/lib/logger';
devLog.log('Debug message');
devLog.error('Error message');
```

### Adding New Pages

1. Create component in `src/pages/`
2. Add lazy-loaded route in `src/App.tsx`:
   ```typescript
   const NewPage = lazy(() => import('@/pages/NewPage'));
   ```
3. Wrap with `<Suspense>` and `<PageSkeleton>`

### Adding Edge Functions

1. Create folder in `supabase/functions/`
2. Add `index.ts` with `Deno.serve()` handler
3. Functions auto-deploy on push

## 📝 Key Configurations

| Config | Location |
|--------|----------|
| Vanguard Pricing | `src/config/vanguardPricing.ts` |
| SafeSuite Products | `src/config/safeSuiteProducts.ts` |
| AI Models | Edge functions via Lovable AI Gateway |

## 🔗 Useful Links

- [Supabase Dashboard](https://supabase.com/dashboard/project/nsyobmjpdpvesjwdphlh)
- [Edge Function Logs](https://supabase.com/dashboard/project/nsyobmjpdpvesjwdphlh/functions)
- [Database Schema](https://supabase.com/dashboard/project/nsyobmjpdpvesjwdphlh/database/tables)
- [Lovable Project](https://lovable.dev/projects/51e5cd04-5f19-440a-a7ba-de30fc766877)

## 📄 License

Proprietary - All rights reserved.

---

Built with ❤️ by UltriumAI
