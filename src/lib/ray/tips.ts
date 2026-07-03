/**
 * Rotating "Did you know" / "Security tip" cards for Ray's idle tail.
 * Contextual to the current route so the tip feels connected to what
 * the user is looking at, not generic marketing copy.
 */
import type { RouteContext } from './routeContext';

export type RayTip = {
  id: string;
  kind: 'tip' | 'didyouknow' | 'nudge';
  title: string;
  body: string;
  prompt: string; // question Ray will answer if the user taps "Tell me more"
};

const GENERAL_TIPS: RayTip[] = [
  {
    id: 'tamper-protection',
    kind: 'didyouknow',
    title: 'Tamper Protection blocks most ransomware',
    body: 'Enabling Microsoft Defender Tamper Protection stops malware from disabling your antivirus mid-attack. It takes one click.',
    prompt: 'How do I enable Tamper Protection on my devices?',
  },
  {
    id: 'driver-updates',
    kind: 'tip',
    title: 'Optional driver updates are rarely urgent',
    body: 'Most "optional" Windows Update drivers are cosmetic or vendor-preferred. Skipping them almost never impacts security.',
    prompt: 'Which Windows updates actually matter for security?',
  },
  {
    id: 'passkeys',
    kind: 'didyouknow',
    title: 'Passkeys beat passwords on every axis',
    body: 'Passkeys can\'t be phished, can\'t be reused, and can\'t be leaked in a breach. They\'re now supported by Microsoft, Google, and Apple.',
    prompt: 'Which of my accounts should I move to passkeys first?',
  },
  {
    id: 'browser-extensions',
    kind: 'nudge',
    title: 'Old browser extensions are a common blind spot',
    body: 'Extensions inherit every permission your browser has. Uninstalling ones you no longer use shrinks your attack surface instantly.',
    prompt: 'Review my browser extensions and flag anything risky.',
  },
  {
    id: 'mfa-recovery',
    kind: 'tip',
    title: 'MFA is only as strong as its recovery path',
    body: 'If your MFA recovery is an SMS to your phone, an attacker with SIM-swap access already owns the account. Prefer passkeys or an authenticator app.',
    prompt: 'Audit my MFA recovery methods and tell me which are weak.',
  },
];

const AREA_TIPS: Record<string, RayTip[]> = {
  'Threat Center': [
    {
      id: 'phish-hover',
      kind: 'tip',
      title: 'Hover before you click',
      body: 'Even in preview panes, hovering a link shows the real destination. If the domain doesn\'t match the sender, treat the message as hostile.',
      prompt: 'Walk me through analyzing a suspicious link safely.',
    },
    {
      id: 'header-check',
      kind: 'didyouknow',
      title: 'Email headers rarely lie',
      body: 'SPF, DKIM, and DMARC results in the header tell you whether the sending domain actually authorized the message — long before the body does.',
      prompt: 'Explain how to read an email header for phishing signals.',
    },
  ],
  'Passwords': [
    {
      id: 'reuse-blast-radius',
      kind: 'nudge',
      title: 'One reused password can compromise many accounts',
      body: 'Breach corpora are cross-referenced within hours. A reused password on a forum from 2019 puts every account using it at risk today.',
      prompt: 'Show me every account where I\'m reusing a password.',
    },
  ],
  'Devices': [
    {
      id: 'bitlocker-recovery',
      kind: 'tip',
      title: 'Save your BitLocker recovery key somewhere else',
      body: 'BitLocker protects the drive — but if the recovery key only lives on the same account you\'re locked out of, it doesn\'t help.',
      prompt: 'Where should I store my BitLocker recovery keys?',
    },
  ],
  'Microsoft 365': [
    {
      id: 'legacy-auth',
      kind: 'didyouknow',
      title: 'Legacy auth bypasses MFA',
      body: 'IMAP, POP, and older SMTP protocols don\'t honor Conditional Access. If they\'re enabled in your tenant, MFA is optional for attackers.',
      prompt: 'Is legacy authentication still enabled in my tenant?',
    },
  ],
};

export function pickTips(route: RouteContext): RayTip[] {
  const area = AREA_TIPS[route.areaLabel] ?? [];
  return [...area, ...GENERAL_TIPS];
}
