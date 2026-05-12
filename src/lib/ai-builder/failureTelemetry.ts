/**
 * #10 — Cloud failure telemetry.
 * Pushes categorized compile/repair failures to Supabase so we can
 * tune prompts and the heal loop against real-world failure data.
 *
 * Best-effort: never blocks the user; never throws.
 */
import { supabase } from '@/integrations/supabase/client';

export interface FailureEvent {
  projectId?: string;
  phase: 'generate' | 'compile' | 'repair' | 'apply';
  category: string;
  errorMessage: string;
  filePath?: string;
  attempt?: number;
  modelUsed?: string;
  promptVersion?: string;
  resolved?: boolean;
}

const QUEUE: FailureEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 8_000;
const MAX_QUEUE = 50;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL);
}

async function flush() {
  if (QUEUE.length === 0) return;
  const batch = QUEUE.splice(0, QUEUE.length);
  try {
    // Edge function will fan out to a telemetry table.
    await supabase.functions.invoke('ai-builder-telemetry', {
      body: { events: batch, ts: Date.now() },
    });
  } catch {
    // Drop on failure — telemetry must never block the builder.
  }
}

export function recordFailure(event: FailureEvent): void {
  QUEUE.push(event);
  if (QUEUE.length > MAX_QUEUE) QUEUE.splice(0, QUEUE.length - MAX_QUEUE);
  scheduleFlush();
}

export function recordResolution(event: FailureEvent): void {
  recordFailure({ ...event, resolved: true });
}

export function flushTelemetryNow(): Promise<void> {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  return flush();
}
