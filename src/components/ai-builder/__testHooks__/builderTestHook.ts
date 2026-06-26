/**
 * Dev-only test hook for E2E smoke tests of the App Builder.
 * Exposes `window.__BUILDER_TEST__` (only when import.meta.env.DEV).
 *
 * Used by `e2e/builder-autorepair-smoke.spec.ts` to drive the deterministic
 * auto-repair + compile pipeline without going through the AI generation path.
 *
 * NOTE: This module is tree-shaken out of production builds — the install()
 * function is a no-op when import.meta.env.DEV is false.
 */
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { autoRepairFiles } from '@/components/ai-builder/autoRepairFiles';

export interface BuilderTestHook {
  /** Replace the current project files. */
  seedFiles: (files: ProjectFile[]) => void;
  /** Run autoRepairFiles synchronously and return repaired output. */
  runAutoRepair: (files: ProjectFile[]) => { files: ProjectFile[]; repairs: string[] };
  /** Compile the given files via the worker compiler. Returns a Promise of the result. */
  runCompile: (files: ProjectFile[]) => Promise<unknown>;
  /** Read current files. */
  getFiles: () => ProjectFile[];
  /** Monotonic heartbeat updated every 100ms by a setInterval. */
  heartbeat: () => number;
}

declare global {
  interface Window {
    __BUILDER_TEST__?: BuilderTestHook;
    __BUILDER_TEST_HEARTBEAT__?: number;
  }
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export interface InstallDeps {
  setFiles: (files: ProjectFile[]) => void;
  getFiles: () => ProjectFile[];
  compileReactProject: (files: ProjectFile[]) => Promise<unknown>;
}

export function installBuilderTestHook(deps: InstallDeps): () => void {
  if (!import.meta.env.DEV) return () => {};
  if (typeof window === 'undefined') return () => {};

  if (!heartbeatTimer) {
    window.__BUILDER_TEST_HEARTBEAT__ = performance.now();
    heartbeatTimer = setInterval(() => {
      window.__BUILDER_TEST_HEARTBEAT__ = performance.now();
    }, 100);
  }

  window.__BUILDER_TEST__ = {
    seedFiles: (files) => deps.setFiles(files),
    runAutoRepair: (files) => autoRepairFiles(files),
    runCompile: (files) => deps.compileReactProject(files),
    getFiles: () => deps.getFiles(),
    heartbeat: () => window.__BUILDER_TEST_HEARTBEAT__ ?? 0,
  };

  // eslint-disable-next-line no-console
  console.info('[builderTestHook] installed window.__BUILDER_TEST__');

  return () => {
    if (window.__BUILDER_TEST__) delete window.__BUILDER_TEST__;
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };
}
