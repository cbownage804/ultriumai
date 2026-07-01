/**
 * Launch Checklist manifest — the measurable definition of "ready".
 * Manual checks live here; automated grep results come from auditReport.json.
 * Not shipped to production users; the page that renders this is dev-gated.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail' | 'todo';

export interface ManualCheck {
  id: string;
  label: string;
  hint?: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  manual: ManualCheck[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'branding',
    title: 'Branding & Legacy',
    description: 'No trace of the previous product names anywhere users can see.',
    manual: [
      { id: 'brand-nav', label: 'Nav, header, footer show only "Wrayth" and "Ray"' },
      { id: 'brand-og', label: 'OG image, favicon, and meta reflect Wrayth' },
      { id: 'brand-emails', label: 'Transactional emails reference Wrayth, not Safe*' },
    ],
  },
  {
    id: 'design',
    title: 'UI Consistency',
    description: 'One design system. Same spacing, radii, shadows, and type scale everywhere.',
    manual: [
      { id: 'ui-tokens', label: 'No hardcoded colors in components (tokens only)' },
      { id: 'ui-radius', label: 'Cards, inputs, buttons share the same radius scale' },
      { id: 'ui-type', label: 'Heading weights and sizes follow one scale' },
      { id: 'ui-buttons', label: 'Button hierarchy is consistent (primary / secondary / ghost)' },
    ],
  },
  {
    id: 'copy',
    title: 'Copy & Ray Voice',
    description: 'Ray sounds like one calm teammate everywhere. Copy is plain English.',
    manual: [
      { id: 'copy-voice', label: 'All Ray phrases sourced from src/lib/ray/voice.ts' },
      { id: 'copy-jargon', label: 'No developer / DB terminology in user-facing copy' },
      { id: 'copy-cta', label: 'Every CTA verb-first ("Add", "Review", "Continue")' },
    ],
  },
  {
    id: 'states',
    title: 'Empty / Loading / Error States',
    description: 'Every page feels intentional at zero data, mid-load, and after failure.',
    manual: [
      { id: 'state-empty', label: 'Every list route uses the shared <EmptyState> primitive' },
      { id: 'state-skeleton', label: 'Skeletons match the shape of the loaded content' },
      { id: 'state-error', label: 'Errors show human copy + a recovery action' },
    ],
  },
  {
    id: 'interactions',
    title: 'Interactions & Motion',
    description: 'Focus, hover, disabled, transitions — all considered.',
    manual: [
      { id: 'int-focus', label: 'Every interactive element has a visible focus ring' },
      { id: 'int-motion', label: 'No animation exceeds 300ms; motion communicates state' },
      { id: 'int-reduced', label: 'prefers-reduced-motion respected in custom keyframes' },
    ],
  },
  {
    id: 'a11y',
    title: 'Accessibility',
    description: 'Wrayth should be usable by everyone.',
    manual: [
      { id: 'a11y-keyboard', label: 'All primary flows completable via keyboard' },
      { id: 'a11y-labels', label: 'Icon-only buttons have aria-label' },
      { id: 'a11y-contrast', label: 'Text meets WCAG AA against its background' },
      { id: 'a11y-targets', label: 'Touch targets ≥ 44px on mobile' },
    ],
  },
  {
    id: 'perf',
    title: 'Performance',
    description: 'Fast on cold load, snappy on interaction.',
    manual: [
      { id: 'perf-lazy', label: 'Route components lazy-loaded' },
      { id: 'perf-query', label: 'React Query cache keys deduped; no waterfall fetches' },
      { id: 'perf-bundle', label: 'Main bundle < 400kb gzipped' },
    ],
  },
  {
    id: 'errors',
    title: 'Error Handling',
    description: 'Every API call fails gracefully. No raw errors reach the user.',
    manual: [
      { id: 'err-wrapper', label: 'Edge function calls go through edgeInvoke() wrapper' },
      { id: 'err-offline', label: 'Offline state shows Ray-voiced message' },
      { id: 'err-session', label: 'Expired session redirects to /auth with return path' },
    ],
  },
  {
    id: 'extension',
    title: 'Browser Extension QA',
    description: 'Feels like a native Chrome feature.',
    manual: [
      { id: 'ext-popup', label: 'Popup opens in < 200ms, no layout shift' },
      { id: 'ext-sidepanel', label: 'Side panel keeps state between navigations' },
      { id: 'ext-contextbar', label: 'Context Bar renders only when relevant' },
      { id: 'ext-offline', label: 'Extension survives offline without spinning' },
    ],
  },
  {
    id: 'e2e',
    title: 'End-to-End Journeys',
    description: 'Every user path completes without dead ends.',
    manual: [
      { id: 'e2e-personal', label: 'Personal user: sign up → onboarding → first password → brief' },
      { id: 'e2e-org', label: 'Org admin: create org → invite → review org brief' },
      { id: 'e2e-msp', label: 'MSP: add client → see rollup' },
      { id: 'e2e-returning', label: 'Returning user: dashboard greets by name, brief refreshes' },
    ],
  },
  {
    id: 'security',
    title: 'Security & Production',
    description: 'Deployable to production with confidence.',
    manual: [
      { id: 'sec-headers', label: 'Security headers set (CSP, HSTS, X-Content-Type-Options)' },
      { id: 'sec-rls', label: 'Every public.* table has RLS enabled + a policy' },
      { id: 'sec-secrets', label: 'No secret keys in client bundle' },
      { id: 'sec-rate', label: 'Public edge functions rate-limited' },
      { id: 'sec-session', label: 'Session expiration surfaces a friendly re-auth prompt' },
    ],
  },
  {
    id: 'monitoring',
    title: 'Analytics & Monitoring',
    description: 'We know when something breaks in production.',
    manual: [
      { id: 'mon-events', label: 'Key funnels emit analytics events' },
      { id: 'mon-errors', label: 'Client errors reported to a sink' },
      { id: 'mon-uptime', label: 'Edge function health monitored' },
    ],
  },
];

/** Local persistence key for manual check state. */
export const STORAGE_KEY = 'wrayth.launchChecklist.v1';
