/**
 * Ray action client — routes a natural-language utterance to a structured
 * action (navigate / scan / ask) by calling the `ray-action` edge function.
 *
 * The client stays dumb: it just executes whatever Ray decides.
 */

import { supabase } from '@/integrations/supabase/client';

export type RayIntent = 'navigate' | 'scan' | 'ask';

export interface RayAction {
  intent: RayIntent;
  target: string | null;
  say: string;
  /** Resolved client path when intent === 'navigate'. */
  path?: string;
  /** Friendly destination label, e.g. "your passwords". */
  label?: string;
}

/**
 * Lightweight deterministic shortcut — covers the obvious cases instantly
 * without burning a model call. Returns null when the AI router should
 * decide.
 */
export function quickRoute(utterance: string): RayAction | null {
  const t = utterance.trim().toLowerCase();
  if (!t) return null;

  // "open/show/go to <X>" patterns
  const navMatch = t.match(/^(?:open|show|take me to|go to|jump to|navigate to)\s+(.+)$/);
  if (navMatch) {
    const dest = navMatch[1].replace(/^(my|the)\s+/, '').trim();
    const map: Record<string, { path: string; label: string }> = {
      'home': { path: '/app/dashboard', label: 'your briefing' },
      'dashboard': { path: '/app/dashboard', label: 'your briefing' },
      'briefing': { path: '/app/dashboard', label: 'your briefing' },
      'passwords': { path: '/app/pass', label: 'your passwords' },
      'password vault': { path: '/app/pass', label: 'your passwords' },
      'vault': { path: '/app/pass', label: 'your passwords' },
      'threats': { path: '/app/scan', label: 'the threat scanner' },
      'threat scanner': { path: '/app/scan', label: 'the threat scanner' },
      'scan': { path: '/app/scan', label: 'the threat scanner' },
      'exposure': { path: '/app/web', label: 'your exposure' },
      'identity': { path: '/app/web', label: 'your exposure' },
      'timeline': { path: '/app/timeline', label: 'the timeline' },
      'history': { path: '/app/timeline', label: 'the timeline' },
      'settings': { path: '/app/settings', label: 'settings' },
      'ray': { path: '/app/ray', label: 'Ray' },
    };
    const hit = map[dest];
    if (hit) {
      return { intent: 'navigate', target: dest, say: `Opening ${hit.label}.`, ...hit };
    }
  }
  return null;
}

export async function resolveRayAction(message: string): Promise<RayAction> {
  const fast = quickRoute(message);
  if (fast) return fast;

  const { data, error } = await supabase.functions.invoke('ray-action', {
    body: { message },
  });
  if (error) throw error;
  if (!data || typeof data !== 'object' || !('intent' in data)) {
    return { intent: 'ask', target: null, say: "Let me think on that." };
  }
  return data as RayAction;
}
