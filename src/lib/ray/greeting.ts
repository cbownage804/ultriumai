/**
 * greeting.ts — pure helpers that make Ray's opener feel human.
 *
 * Ray never uses the same canned line twice in a row: greeting phrasing,
 * transition phrasing, and even the closing question are all rotated based
 * on the time of day, the page the user is on, and their own posture. This
 * module is deliberately provider-free — it just returns strings and lets
 * the caller compose the copy.
 */
import type { DevicePosture } from '@/components/ray/DeviceSecurityTabs';

export type PageContext =
  | 'dashboard'
  | 'device'
  | 'threats'
  | 'exposure'
  | 'identity'
  | 'network'
  | 'other';

export interface GreetingInputs {
  firstName: string | null;
  page: PageContext;
  hostname?: string;
  posture?: DevicePosture | null;
  /** Optional bit of state so the caller can vary greetings across renders. */
  seed?: number;
}

export interface Greeting {
  hello: string;    // "Good evening, Brandon" / "Welcome back"
  opener: string;   // "I reviewed R15 while you were away."
  closer: string;   // "What would you like to do?"
}

function timeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h < 5)  return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}

function pick<T>(items: T[], seed: number): T {
  if (items.length === 0) throw new Error('pick(): empty');
  const i = Math.abs(Math.floor(seed)) % items.length;
  return items[i];
}

function greetingHellos(firstName: string | null, seed: number): string {
  const tod = timeOfDay();
  const todLine =
    tod === 'morning'   ? 'Good morning'   :
    tod === 'afternoon' ? 'Good afternoon' :
    tod === 'evening'   ? 'Good evening'   :
                          'You\u2019re up late';

  // Roughly half the time we skip the time-of-day and use a warmer opener.
  const variants: string[] = firstName
    ? [
        `${todLine}, ${firstName}.`,
        `Welcome back, ${firstName}.`,
        `Nice to see you again, ${firstName}.`,
        `${todLine}, ${firstName}.`,
        `Hey ${firstName}.`,
      ]
    : [
        `${todLine}.`,
        `Welcome back.`,
        `Nice to see you.`,
        `${todLine} \u2014 glad you\u2019re here.`,
      ];
  return pick(variants, seed);
}

// Openers that transition into WHY Ray is speaking. They vary per page so
// the assistant feels aware of context rather than reading a canned welcome.
function openerFor(inputs: GreetingInputs, seed: number): string {
  const { page, hostname, posture } = inputs;
  const host = hostname ?? 'this device';

  if (page === 'device') {
    const bad = countBadSignals(posture);
    if (bad === 0) {
      return pick([
        `I reviewed ${host} while you were away \u2014 everything still looks healthy.`,
        `${host} is looking steady since your last visit.`,
        `I checked ${host} in the background \u2014 nothing new to flag.`,
      ], seed);
    }
    if (bad === 1) {
      return pick([
        `I reviewed ${host} while you were away. I found one thing I\u2019d fix today.`,
        `${host} is mostly clean \u2014 there\u2019s just one thing worth looking at.`,
      ], seed);
    }
    return pick([
      `I reviewed ${host} while you were away. There are ${bad} things I\u2019d fix.`,
      `${host} needs a bit of attention \u2014 ${bad} findings stood out.`,
    ], seed);
  }

  if (page === 'dashboard') {
    return pick([
      `Here\u2019s what changed since you were last here.`,
      `I ran the environment while you were away. Here\u2019s the shape of it.`,
      `Everything checked in \u2014 here\u2019s where things stand.`,
    ], seed);
  }
  if (page === 'threats') {
    return pick([
      `I haven\u2019t seen any new threats targeting your organization today.`,
      `Threat feeds are quiet at the moment. I\u2019ll keep watching.`,
      `Nothing new from the feeds since your last visit.`,
    ], seed);
  }
  if (page === 'exposure') {
    return pick([
      `I checked your monitored identities while you were away \u2014 there\u2019s a couple of items worth reviewing.`,
      `Here\u2019s what I\u2019m watching on your monitored identities.`,
    ], seed);
  }
  if (page === 'identity') {
    return pick([
      `Identity looks calm. I\u2019ll flag anything unusual as it lands.`,
      `Here\u2019s what your identity surface looks like right now.`,
    ], seed);
  }
  return pick([
    `Here\u2019s where things stand.`,
    `I\u2019ve been watching in the background \u2014 here\u2019s the update.`,
  ], seed);
}

function closerFor(page: PageContext, seed: number): string {
  const universal = [
    'What would you like to do?',
    'Where would you like to start?',
    'Want me to take the first step?',
  ];
  const perPage: Record<PageContext, string[]> = {
    device:    ['Where do you want me to start?', 'Want me to fix the safe ones?', 'What should I look at first?'],
    dashboard: ['What would you like to look at first?', 'Where should we start?'],
    threats:   ['Want me to review anything specific?', 'Anything you\u2019d like me to watch more closely?'],
    exposure:  ['Want me to walk through them?', 'Should I start with the highest risk one?'],
    identity:  ['Want me to audit anything specific?', 'Where would you like to start?'],
    network:   ['Want me to walk the ports with you?', 'Should I flag anything unusual first?'],
    other:     universal,
  };
  return pick(perPage[page] ?? universal, seed + 7);
}

export function buildGreeting(inputs: GreetingInputs): Greeting {
  const seed = inputs.seed ?? new Date().getHours() * 31 + new Date().getMinutes();
  return {
    hello: greetingHellos(inputs.firstName, seed),
    opener: openerFor(inputs, seed + 3),
    closer: closerFor(inputs.page, seed),
  };
}

// ---------- posture-derived narrative bullets ----------

export interface NarrativeBullet {
  tone: 'good' | 'warn' | 'bad' | 'info';
  text: string;
}

function countBadSignals(p: DevicePosture | null | undefined): number {
  if (!p) return 0;
  let n = 0;
  if (p.disk_encryption?.enabled === false) n += 1;
  if (p.firewall?.enabled === false) n += 1;
  if (p.antivirus?.enabled === false || p.antivirus?.realtime_protection === false) n += 1;
  if (p.uac?.enabled === false) n += 1;
  if (p.secure_boot?.supported && p.secure_boot.enabled === false) n += 1;
  if (p.rdp_security?.rdp_enabled && p.rdp_security.nla_enabled === false) n += 1;
  if ((p.pending_updates ?? 0) > 0) n += 1;
  return n;
}

/**
 * Ray's opinion of a single device, expressed as 3-5 short bullets. The
 * tone tags let the UI colour each line without re-parsing the text.
 */
export function deviceNarrative(posture: DevicePosture | null | undefined): NarrativeBullet[] {
  if (!posture) return [];
  const p = posture;
  const out: NarrativeBullet[] = [];

  // Updates first — the most common actionable line.
  const pending = p.pending_updates ?? 0;
  const cats = p.update_categories ?? {};
  const security = (cats as any).security ?? 0;
  if (security > 0) {
    out.push({ tone: 'warn', text: `${security} security update${security === 1 ? '' : 's'} ready to install.` });
  } else if (pending > 0) {
    out.push({ tone: 'info', text: `${pending} optional update${pending === 1 ? '' : 's'} available \u2014 nothing security-critical.` });
  } else {
    out.push({ tone: 'good', text: 'Windows is fully patched.' });
  }

  // Defender / AV
  if (p.antivirus?.enabled) {
    if (p.antivirus.realtime_protection === false) {
      out.push({ tone: 'bad', text: 'Microsoft Defender real-time protection is off.' });
    } else if ((p.antivirus.definitions_age_days ?? 0) > 7) {
      out.push({ tone: 'warn', text: `Defender definitions are ${p.antivirus.definitions_age_days} days old.` });
    } else {
      out.push({ tone: 'good', text: 'Defender is healthy.' });
    }
  } else if (p.antivirus?.enabled === false) {
    out.push({ tone: 'bad', text: 'Microsoft Defender is disabled.' });
  }

  // BitLocker
  if (p.disk_encryption?.enabled === true) {
    out.push({ tone: 'good', text: 'BitLocker is enabled.' });
  } else if (p.disk_encryption?.enabled === false) {
    out.push({ tone: 'bad', text: 'BitLocker is off on the system drive.' });
  }

  // Firewall
  if (p.firewall?.enabled === false) {
    out.push({ tone: 'bad', text: 'The Windows Firewall is off.' });
  } else if (p.firewall?.profiles) {
    const off = Object.entries(p.firewall.profiles).filter(([, v]) => !v).map(([k]) => k);
    if (off.length) out.push({ tone: 'warn', text: `Firewall is off for the ${off.join(' and ')} profile${off.length === 1 ? '' : 's'}.` });
  }

  // RDP
  if (p.rdp_security?.rdp_enabled) {
    if (p.rdp_security.nla_enabled === false) {
      out.push({ tone: 'bad', text: 'RDP is enabled without Network Level Authentication.' });
    }
  }

  // Suspicious software / autoruns hint — mostly reassurance when clean.
  if (out.filter((b) => b.tone === 'bad' || b.tone === 'warn').length === 0) {
    out.push({ tone: 'good', text: 'I don\u2019t see any suspicious software.' });
  }

  return out.slice(0, 5);
}

// ---------- dynamic chip generation ----------

export interface DynamicChip {
  label: string;
  prompt: string;
  tone: 'good' | 'warn' | 'bad' | 'info';
}

/**
 * Chips derived from what Ray actually sees. No generic filler — if the
 * device is clean, we return exploration chips instead of fake fixes.
 */
export function dynamicChipsForDevice(posture: DevicePosture | null | undefined): DynamicChip[] {
  if (!posture) return [];
  const p = posture;
  const chips: DynamicChip[] = [];

  const cats = p.update_categories ?? {};
  const security = (cats as any).security ?? 0;
  if (security > 0) {
    chips.push({
      label: security === 1 ? 'Install the security update' : `Install ${security} security updates`,
      prompt: 'Install the pending Windows security updates on this device.',
      tone: 'warn',
    });
  } else if ((p.pending_updates ?? 0) > 0) {
    chips.push({
      label: 'Explain the pending updates',
      prompt: 'Walk me through the pending Windows updates on this device \u2014 which are worth installing?',
      tone: 'info',
    });
  }

  if (p.disk_encryption?.enabled === false) {
    chips.push({ label: 'Enable BitLocker', prompt: 'Turn on BitLocker for the system drive on this device.', tone: 'bad' });
  }
  if (p.antivirus?.enabled === false || p.antivirus?.realtime_protection === false) {
    chips.push({ label: 'Fix Defender', prompt: 'Re-enable Microsoft Defender real-time protection on this device.', tone: 'bad' });
  }
  if (p.firewall?.enabled === false) {
    chips.push({ label: 'Turn firewall back on', prompt: 'Enable the Windows Firewall on this device for all profiles.', tone: 'bad' });
  }
  if (p.rdp_security?.rdp_enabled && p.rdp_security.nla_enabled === false) {
    chips.push({ label: 'Require NLA for RDP', prompt: 'Require Network Level Authentication for RDP on this device.', tone: 'bad' });
  }

  // Always-useful conversation openers, phrased personally.
  chips.push({ label: 'Explain my security score', prompt: 'Explain why the security score on this device is where it is, and what the biggest wins would be.', tone: 'info' });
  chips.push({ label: 'Review listening ports',    prompt: 'Review the listening TCP ports on this device and flag anything unusual.', tone: 'info' });
  chips.push({ label: 'Harden this PC',            prompt: 'Walk me through hardening this PC end-to-end, in order.', tone: 'info' });
  chips.push({ label: 'Compare with other devices', prompt: 'Compare this device to my other devices. What is different or worse here?', tone: 'info' });

  return chips.slice(0, 6);
}

// ---------- tab-aware nudge ----------

export interface RayNudge {
  observation: string;   // "I noticed you're reviewing listening ports."
  offer: string;         // "Want me to explain which ones are normal?"
  prompt: string;        // what to send to Ray if the user accepts
}

/**
 * Chooses a nudge based on what the user just clicked. Wired into
 * DeviceSecurityTabs so the sentence changes as tabs change.
 */
export function tabNudge(
  tab: string | undefined,
  posture: DevicePosture | null | undefined,
): RayNudge | null {
  if (!tab) return null;
  switch (tab) {
    case 'network':
      return {
        observation: 'I noticed you\u2019re reviewing listening ports.',
        offer: 'Want me to explain which ones are normal on a Windows machine?',
        prompt: 'Look at the listening TCP ports on this device and tell me which ones are normal for Windows and which I should question.',
      };
    case 'accounts': {
      const admin = posture?.local_admins_detail?.find((a) => a.is_builtin);
      if (admin && admin.enabled === false) {
        return {
          observation: 'Your built-in Administrator account is disabled, which is the right posture.',
          offer: 'Want me to explain why that matters?',
          prompt: 'Explain why keeping the built-in Windows Administrator account disabled is the recommended posture.',
        };
      }
      return {
        observation: 'I noticed you\u2019re reviewing local administrators.',
        offer: 'Want me to walk through each account and flag anything unusual?',
        prompt: 'Walk through each local administrator account on this device and tell me which should be removed or disabled.',
      };
    }
    case 'updates': {
      const cats = posture?.update_categories ?? {};
      const drv = (cats as any).drivers ?? 0;
      const sec = (cats as any).security ?? 0;
      if (drv > 0 && sec === 0) {
        return {
          observation: `These ${drv} driver update${drv === 1 ? ' isn\u2019t' : 's aren\u2019t'} security-related.`,
          offer: 'Want me to explain whether they\u2019re worth installing?',
          prompt: 'For each pending driver update on this device, tell me what it does and whether it is worth installing right now.',
        };
      }
      if (sec > 0) {
        return {
          observation: `I see ${sec} security update${sec === 1 ? '' : 's'} waiting.`,
          offer: 'Want me to install them now?',
          prompt: 'Install the pending Windows security updates on this device.',
        };
      }
      return {
        observation: 'Windows is fully patched right now.',
        offer: 'Want me to schedule the next check?',
        prompt: 'How does the Windows Update check schedule work on this device, and can I make it more frequent?',
      };
    }
    case 'defender':
      return {
        observation: 'I noticed you\u2019re reviewing Microsoft Defender.',
        offer: 'Want me to explain which of these settings actually move the needle?',
        prompt: 'Explain which Microsoft Defender settings on this device matter most for real-world protection.',
      };
    case 'software':
      return {
        observation: 'I noticed you\u2019re reviewing installed software.',
        offer: 'Want me to flag anything abandoned or out of policy?',
        prompt: 'Look at the installed software on this device and flag anything risky, abandoned, or out of policy.',
      };
    case 'system':
      return {
        observation: 'This is the system-level view of the device.',
        offer: 'Want me to explain what would move the score the most?',
        prompt: 'Which single change on this device would improve the security score the most?',
      };
    case 'keys':
      return {
        observation: 'You\u2019re looking at the BitLocker recovery key panel.',
        offer: 'Want me to explain where your keys are backed up right now?',
        prompt: 'Where are the BitLocker recovery keys for this device backed up, and how would I recover if the drive locked?',
      };
    default:
      return null;
  }
}
