/**
 * deviceAssessment — turns a raw Wrayth posture payload into the plain-English
 * narrative Ray uses across the device page: a top-line verdict, per-tab
 * one-liners, and an itemized score-loss breakdown.
 *
 * Pure functions only. Zero side effects, zero network. Everything here reads
 * facts the agent has already uploaded so nothing is speculative.
 */
import type { DevicePosture } from '@/components/ray/DeviceSecurityTabs';

export type Severity = 'good' | 'warn' | 'bad' | 'neutral';

export interface ScoreDeduction {
  points: number;
  reason: string;
  fix?: string;
}

export interface TabSummary {
  tone: Severity;
  text: string;
}

export interface DeviceAssessment {
  headline: string;
  detail: string;
  tone: Severity;
  score: number | null;
  deductions: ScoreDeduction[];
  tabs: {
    posture: TabSummary;
    system: TabSummary;
    defender: TabSummary;
    network: TabSummary;
    accounts: TabSummary;
    software: TabSummary;
    updates: TabSummary;
    keys: TabSummary;
  };
}

function count<T>(arr: T[] | undefined | null): number {
  return Array.isArray(arr) ? arr.length : 0;
}

/** Deduct points for every real weakness. Baseline 100. */
function computeDeductions(p: DevicePosture): ScoreDeduction[] {
  const d: ScoreDeduction[] = [];

  // Encryption / boot
  if (p.disk_encryption && p.disk_encryption.enabled === false) {
    d.push({ points: 20, reason: 'BitLocker is off on C:', fix: 'Turn on BitLocker' });
  }
  if (p.tpm && p.tpm.present && !p.tpm.ready) {
    d.push({ points: 4, reason: 'TPM is present but not ready' });
  }
  if (p.secure_boot?.supported && p.secure_boot.enabled === false) {
    d.push({ points: 4, reason: 'Secure Boot is off' });
  }
  if (p.uac && p.uac.enabled === false) {
    d.push({ points: 5, reason: 'UAC (elevation prompts) is disabled' });
  }

  // Firewall
  if (p.firewall) {
    if (p.firewall.enabled === false) {
      d.push({ points: 15, reason: 'Windows Firewall is off', fix: 'Turn on Windows Firewall' });
    } else if (p.firewall.profiles) {
      const off = Object.entries(p.firewall.profiles).filter(([, v]) => !v).map(([k]) => k);
      if (off.length) {
        d.push({ points: 6, reason: `Firewall off on ${off.join(', ')} profile${off.length > 1 ? 's' : ''}` });
      }
    }
  }

  // Antivirus / Defender
  if (p.antivirus) {
    if (p.antivirus.enabled === false) {
      d.push({ points: 20, reason: 'Microsoft Defender is disabled', fix: 'Enable Defender' });
    } else if (p.antivirus.realtime_protection === false) {
      d.push({ points: 12, reason: 'Real-time protection is off' });
    }
    if (typeof p.antivirus.definitions_age_days === 'number' && p.antivirus.definitions_age_days > 7) {
      d.push({ points: 3, reason: `Defender signatures are ${p.antivirus.definitions_age_days} days old` });
    }
  }
  if (p.defender_detail?.cloud_protection === false) {
    d.push({ points: 3, reason: 'Defender cloud-delivered protection is off' });
  }
  if (p.defender_detail?.pua_protection === false) {
    d.push({ points: 2, reason: 'Defender PUA (adware) protection is off' });
  }

  // Tamper protection — informational only (Microsoft blocks 3rd-party toggles)
  // so we don't deduct; the note lives in findings.

  // Updates
  const sec = p.update_categories?.security ?? 0;
  if (sec > 0) {
    d.push({
      points: Math.min(3 + sec * 2, 10),
      reason: `${sec} security update${sec === 1 ? '' : 's'} pending`,
      fix: 'Install pending Windows updates',
    });
  }
  const drv = p.update_categories?.drivers ?? 0;
  if (drv > 0) {
    d.push({ points: Math.min(drv, 3), reason: `${drv} optional driver update${drv === 1 ? '' : 's'} available` });
  }

  // Session
  if (typeof p.screen_lock_seconds === 'number') {
    if (p.screen_lock_seconds === 0) {
      d.push({ points: 4, reason: 'Screen lock timeout is not configured' });
    } else if (p.screen_lock_seconds > 900) {
      d.push({
        points: 2,
        reason: `Screen locks after ${Math.round(p.screen_lock_seconds / 60)} min (baseline is 15)`,
      });
    }
  }

  // RDP
  if (p.rdp_security?.rdp_enabled) {
    if (p.rdp_security.nla_enabled === false) {
      d.push({ points: 8, reason: 'RDP is enabled without Network Level Authentication' });
    } else {
      d.push({ points: 2, reason: 'Remote Desktop is enabled' });
    }
  }
  if (p.rdp_security?.remote_assistance_enabled) {
    d.push({ points: 3, reason: 'Remote Assistance is allowed' });
  }

  // Local admins
  const builtinOn = (p.local_admins_detail ?? []).some((a) => a.is_builtin && a.enabled);
  if (builtinOn) {
    d.push({ points: 5, reason: 'Built-in Administrator account is enabled' });
  }
  const adminCount = p.local_admins?.count ?? 0;
  if (adminCount > 3) {
    d.push({ points: 2, reason: `${adminCount} local administrators on this machine` });
  }

  // Browser password managers (informational nudge)
  const stored =
    (p.browser_passwords?.chrome?.stored_count ?? 0) +
    (p.browser_passwords?.edge?.stored_count ?? 0) +
    (p.browser_passwords?.firefox?.stored_count ?? 0);
  if (stored > 0) {
    d.push({ points: 2, reason: `${stored} password${stored === 1 ? '' : 's'} saved in browsers` });
  }

  // Disk pressure
  if (typeof p.disk?.free_gb === 'number' && p.disk.free_gb < 10) {
    d.push({ points: 2, reason: `Only ${p.disk.free_gb} GB free on C:` });
  }

  return d;
}

function clampScore(raw: number): number {
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function pickHeadline(deductions: ScoreDeduction[], score: number): { headline: string; detail: string; tone: Severity } {
  if (!deductions.length) {
    return {
      headline: 'This machine is in great shape.',
      detail: 'Every posture check I run currently passes. Nothing needs your attention today.',
      tone: 'good',
    };
  }
  const worst = [...deductions].sort((a, b) => b.points - a.points)[0];
  if (worst.points >= 15) {
    return {
      headline: `The biggest weakness on this device is: ${worst.reason.toLowerCase()}.`,
      detail: `I'd fix this before anything else${worst.fix ? ` — approve "${worst.fix}" from the actions box below and I'll handle it` : ''}. ${deductions.length - 1 > 0 ? `${deductions.length - 1} smaller item${deductions.length - 1 === 1 ? ' is' : 's are'} also open.` : ''}`,
      tone: 'bad',
    };
  }
  if (score >= 85) {
    return {
      headline: 'This machine is protected, with a few small items open.',
      detail: `Nothing critical — the only thing I'd fix today is: ${worst.reason.toLowerCase()}.`,
      tone: 'warn',
    };
  }
  return {
    headline: 'A handful of settings are pulling this device below baseline.',
    detail: `Top issue: ${worst.reason.toLowerCase()}. ${deductions.length - 1} more are listed under the score.`,
    tone: 'warn',
  };
}

function summarizePosture(p: DevicePosture): TabSummary {
  const bl = p.disk_encryption?.enabled;
  const fw = p.firewall?.enabled;
  const tpm = p.tpm?.ready;
  if (bl && fw && tpm) return { tone: 'good', text: 'The hardening basics — encryption, firewall, TPM — are all in place.' };
  const missing: string[] = [];
  if (bl === false) missing.push('BitLocker');
  if (fw === false) missing.push('Firewall');
  if (tpm === false && p.tpm?.present) missing.push('TPM readiness');
  if (missing.length) return { tone: 'bad', text: `${missing.join(', ')} needs attention on this device.` };
  return { tone: 'warn', text: 'Most hardening basics look right — check the rows below for anything unknown.' };
}

function summarizeSystem(p: DevicePosture): TabSummary {
  const parts: string[] = [];
  if (typeof p.disk?.free_gb === 'number' && typeof p.disk?.total_gb === 'number') {
    parts.push(`${p.disk.free_gb} GB free on a ${p.disk.total_gb} GB drive`);
  }
  if (typeof p.uptime_seconds === 'number') {
    const days = Math.floor(p.uptime_seconds / 86400);
    if (days >= 30) parts.push(`up for ${days} days — a reboot is probably overdue`);
    else if (days >= 7) parts.push(`up for ${days} days`);
  }
  const b = count(p.browsers);
  if (b) parts.push(`${b} browser${b === 1 ? '' : 's'} installed`);
  return {
    tone:
      typeof p.disk?.free_gb === 'number' && p.disk.free_gb < 10
        ? 'bad'
        : (p.uptime_seconds ?? 0) > 30 * 86400
        ? 'warn'
        : 'good',
    text: parts.length ? parts.join(' · ') : 'Hardware snapshot not reported yet.',
  };
}

function summarizeDefender(p: DevicePosture): TabSummary {
  const a = p.antivirus;
  const d = p.defender_detail;
  if (!a) return { tone: 'neutral', text: 'Defender status has not been reported yet.' };
  if (a.enabled === false) return { tone: 'bad', text: 'Microsoft Defender is disabled on this device.' };
  if (a.realtime_protection === false) return { tone: 'bad', text: 'Defender is on, but real-time protection is off.' };
  if (d?.cloud_protection && d?.pua_protection && !d.last_full_scan) {
    return { tone: 'warn', text: 'Defender exceeds Microsoft\u2019s recommended baseline, but a full scan has never run.' };
  }
  if (d?.cloud_protection && d?.pua_protection) {
    return { tone: 'good', text: 'Defender configuration exceeds Microsoft\u2019s recommended baseline.' };
  }
  return { tone: 'warn', text: 'Defender is active — a couple of advanced options aren\u2019t on yet.' };
}

function summarizeNetwork(p: DevicePosture): TabSummary {
  const ports = count(p.listening_ports);
  const rdpOn = p.rdp_security?.rdp_enabled === true;
  const nlaOff = rdpOn && p.rdp_security?.nla_enabled === false;
  if (nlaOff) return { tone: 'bad', text: `RDP is on without NLA and ${ports} port${ports === 1 ? '' : 's'} are listening.` };
  if (rdpOn) return { tone: 'warn', text: `RDP is enabled with NLA required; ${ports} listening port${ports === 1 ? '' : 's'} observed.` };
  if (ports === 0) return { tone: 'good', text: 'No listening ports and no remote-desktop exposure.' };
  return { tone: 'good', text: `${ports} listening port${ports === 1 ? '' : 's'} observed — nothing unexpected.` };
}

function summarizeAccounts(p: DevicePosture): TabSummary {
  const admins = p.local_admins?.count ?? 0;
  const builtin = (p.local_admins_detail ?? []).some((a) => a.is_builtin && a.enabled);
  const stored =
    (p.browser_passwords?.chrome?.stored_count ?? 0) +
    (p.browser_passwords?.edge?.stored_count ?? 0) +
    (p.browser_passwords?.firefox?.stored_count ?? 0);
  const parts: string[] = [];
  parts.push(`${admins} local admin${admins === 1 ? '' : 's'}${builtin ? ' (built-in is on)' : ''}`);
  if (stored) parts.push(`${stored} password${stored === 1 ? '' : 's'} saved in browsers — move these into Wrayth Vault when you can`);
  return { tone: builtin ? 'warn' : stored > 0 ? 'warn' : 'good', text: parts.join(' · ') };
}

function summarizeSoftware(p: DevicePosture): TabSummary {
  const sw = count(p.installed_software);
  const ar = count(p.autoruns);
  const svc = count(p.non_ms_services);
  const ext = count(p.browser_extensions);
  const unsignedAutoruns = (p.autoruns ?? []).filter((a) => a.signed === false).length;
  if (sw === 0) return { tone: 'neutral', text: 'Installed software has not been enumerated yet.' };
  const detail = unsignedAutoruns
    ? `${unsignedAutoruns} unsigned autorun${unsignedAutoruns === 1 ? '' : 's'} to review`
    : 'nothing obviously malicious';
  return {
    tone: unsignedAutoruns ? 'warn' : 'good',
    text: `${sw} program${sw === 1 ? '' : 's'}, ${ar} startup item${ar === 1 ? '' : 's'}, ${svc} 3rd-party service${svc === 1 ? '' : 's'}, ${ext} browser extension${ext === 1 ? '' : 's'} — ${detail}.`,
  };
}

function summarizeUpdates(p: DevicePosture): TabSummary {
  const sec = p.update_categories?.security ?? 0;
  const drv = p.update_categories?.drivers ?? 0;
  const others = (p.update_categories?.feature ?? 0) + (p.update_categories?.office ?? 0) + (p.update_categories?.other ?? 0);
  if (sec === 0 && drv === 0 && others === 0) {
    return { tone: 'good', text: 'No pending updates. Windows is current.' };
  }
  const bits: string[] = [];
  if (sec) bits.push(`${sec} security update${sec === 1 ? '' : 's'} — install today`);
  if (drv) bits.push(`${drv} optional driver update${drv === 1 ? '' : 's'} — safe to wait`);
  if (others) bits.push(`${others} other`);
  return { tone: sec ? 'bad' : 'warn', text: bits.join(' · ') };
}

function summarizeKeys(p: DevicePosture): TabSummary {
  if (p.disk_encryption?.enabled === false) {
    return { tone: 'bad', text: 'BitLocker is off, so no recovery key exists yet.' };
  }
  if (p.disk_encryption?.enabled) {
    return { tone: 'warn', text: 'BitLocker is on — approve "Turn on BitLocker" once so I can escrow the recovery key here.' };
  }
  return { tone: 'neutral', text: 'Encryption status hasn\u2019t been reported yet.' };
}

export function assessDevice(posture: DevicePosture | null | undefined): DeviceAssessment | null {
  if (!posture) return null;
  const deductions = computeDeductions(posture);
  const raw = 100 - deductions.reduce((sum, d) => sum + d.points, 0);
  const score = clampScore(raw);
  const { headline, detail, tone } = pickHeadline(deductions, score);
  return {
    headline,
    detail,
    tone,
    score,
    deductions,
    tabs: {
      posture: summarizePosture(posture),
      system: summarizeSystem(posture),
      defender: summarizeDefender(posture),
      network: summarizeNetwork(posture),
      accounts: summarizeAccounts(posture),
      software: summarizeSoftware(posture),
      updates: summarizeUpdates(posture),
      keys: summarizeKeys(posture),
    },
  };
}
