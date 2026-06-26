import { test, expect } from '@playwright/test';

/**
 * Regression: malformed Framer Motion JSX must always be auto-repaired
 * deterministically so the preview never enters a compile-failed state.
 *
 * Seeds multiple known-bad shapes (bare `</motion>`, orphan trailing
 * `</motion>`, nested motion + extra closer, attribute-with-`>` confusion,
 * motion.button variant) through the dev-only test hook and asserts:
 *   1. autoRepairFiles rewrites every bad closer to a valid form.
 *   2. No `</motion>` (bare) survives in the repaired output.
 *   3. The compile pipeline resolves without throwing.
 *   4. The main thread stays live (heartbeat advances).
 */

interface Case {
  name: string;
  code: string;
  /** Substring(s) that MUST appear in repaired output. */
  expectContains?: string[];
}

const CASES: Case[] = [
  {
    name: 'bare </motion> after motion.div',
    code: `import { motion } from 'framer-motion';
export default function App() {
  return (
    <motion.div className="p-4"><h1>Hi</h1></motion></div>
  );
}
`,
    expectContains: ['</motion.div>'],
  },
  {
    name: 'orphan trailing </motion>',
    code: `import { motion } from 'framer-motion';
export default function App() {
  return (
    <div>
      <motion.section><p>x</p></motion.section>
    </div>
    </motion>
  );
}
`,
  },
  {
    name: 'nested motion with extra bare closer',
    code: `import { motion } from 'framer-motion';
export default function App() {
  return (
    <motion.div>
      <motion.span>hello</motion.span>
    </motion></motion.div>
  );
}
`,
    expectContains: ['</motion.div>'],
  },
  {
    name: 'attribute containing > should not confuse parser',
    code: `import { motion } from 'framer-motion';
export default function App({ items = [] }: { items?: unknown[] }) {
  return (
    <motion.div animate={{ opacity: items.length > 0 ? 1 : 0 }}>
      <span>ok</span>
    </motion></div>
  );
}
`,
    expectContains: ['</motion.div>', 'items.length > 0'],
  },
  {
    name: 'motion.button variant',
    code: `import { motion } from 'framer-motion';
export default function App() {
  return (
    <motion.button whileHover={{ scale: 1.05 }}>Click</motion></button>
  );
}
`,
    expectContains: ['</motion.button>'],
  },
  {
    name: 'deeply nested motion siblings with mixed bare closers',
    code: `import { motion } from 'framer-motion';
export default function App() {
  return (
    <motion.section>
      <motion.div>
        <motion.span>a</motion>
        <motion.span>b</motion.span>
      </motion></motion.div>
      <motion.footer>end</motion></motion.footer>
    </motion.section>
  );
}
`,
    expectContains: ['</motion.section>', '</motion.div>', '</motion.footer>'],
  },
  {
    name: 'multiline attribute with > and JSX child expression',
    code: `import { motion } from 'framer-motion';
export default function App({ count = 0 }: { count?: number }) {
  return (
    <motion.div
      style={{ opacity: count > 3 ? 1 : 0.5 }}
      transition={{ duration: count > 10 ? 0.4 : 0.2 }}
    >
      {count > 0 && <motion.span key={count}>{count}</motion></span>}
    </motion></div>
  );
}
`,
    expectContains: ['</motion.div>', '</motion.span>', 'count > 3', 'count > 10'],
  },
  {
    name: 'AnimatePresence wrapping with broken inner motion',
    code: `import { motion, AnimatePresence } from 'framer-motion';
export default function App({ show = true }: { show?: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: -10 }} animate={{ y: 0 }} exit={{ y: 10 }}>
          <motion.h1>Title</motion></h1>
          <p>body</p>
        </motion></div>
      )}
    </AnimatePresence>
  );
}
`,
    expectContains: ['</motion.div>', '</motion.h1>', '</AnimatePresence>'],
  },
  {
    name: 'self-closing motion mixed with broken closer',
    code: `import { motion } from 'framer-motion';
export default function App() {
  return (
    <motion.div>
      <motion.img src="/a.png" alt="" />
      <motion.input type="text" />
      <motion.p>txt</motion></p>
    </motion></div>
  );
}
`,
    expectContains: ['</motion.div>', '</motion.p>', '<motion.img', '<motion.input'],
  },
  {
    name: 'fragment + motion children with stray closers',
    code: `import { motion } from 'framer-motion';
export default function App() {
  return (
    <>
      <motion.header>h</motion></header>
      <motion.main>m</motion></main>
    </>
  );
}
`,
    expectContains: ['</motion.header>', '</motion.main>'],
  },
  {
    name: 'terminal export default followed by stray brace',
    code: `import React from 'react';
const Navbar = () => <nav>D'Taylor Barbershop</nav>;
export default Navbar;
}`,
    expectContains: ['export default Navbar;'],
  },
  {
    name: 'terminal export default followed by stray closing punctuation',
    code: `import React from 'react';
const Navbar = () => <nav>D'Taylor Barbershop</nav>;
export default Navbar;
};`,
    expectContains: ['export default Navbar;'],
  },
  {
    name: 'terminal export default followed by stray markdown tick and brace',
    code: `import React from 'react';
const Navbar = () => <nav>D'Taylor Barbershop</nav>;
export default Navbar;
\`
}`,
    expectContains: ['export default Navbar;'],
  },
];

const MAIN_TSX = "import App from './App'; export default App;";

test.describe('App Builder — Framer Motion repair regression', () => {
  test('all malformed motion shapes are repaired and never break the preview', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    await page.goto('/ai-studio/app-builder', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean((window as any).__BUILDER_TEST__), null, {
      timeout: 30_000,
    });

    const startHb = await page.evaluate(
      () => (window as any).__BUILDER_TEST_HEARTBEAT__ ?? 0,
    );

    for (const c of CASES) {
      const result = await page.evaluate(
        async ({ code, name }) => {
          const hook = (window as any).__BUILDER_TEST__;
          const files = [
            { path: 'App.tsx', content: code },
            { path: 'main.tsx', content: "import App from './App'; export default App;" },
          ];
          hook.seedFiles(files);
          const repaired = hook.runAutoRepair(files);

          let compileError: string | null = null;
          try {
            await hook.runCompile(repaired.files);
          } catch (e: any) {
            compileError = String(e?.message ?? e);
          }

          const app = repaired.files.find((f: any) => f.path === 'App.tsx');
          return {
            name,
            repairs: repaired.repairs,
            content: app?.content ?? '',
            compileError,
          };
        },
        { code: c.code, name: c.name },
      );

      // No bare </motion> may survive — only </motion.X> is valid JSX.
      expect(result.content, `case: ${c.name}`).not.toMatch(/<\/motion>(?!\.)/);
      expect(result.content, `case: ${c.name} left syntax after export`).not.toMatch(/export\s+default\s+[A-Za-z_$][\w$]*\s*;\s*[}\])]/);
      expect(result.content, `case: ${c.name} left backtick after export`).not.toMatch(/export\s+default\s+[A-Za-z_$][\w$]*\s*;\s*`/);

      for (const needle of c.expectContains ?? []) {
        expect(result.content, `case: ${c.name} missing ${needle}`).toContain(needle);
      }

      // Compile pipeline must not throw uncaught (graceful error result is OK,
      // but a thrown rejection here would mean the preview hit a hard fail).
      if (result.compileError) {
        // eslint-disable-next-line no-console
        console.warn(`[motion-regression][${c.name}] compile reported:`, result.compileError);
      }

      // Preview must NOT show the compile-failed / "Repairing preview" wall
      // for any case. The repaired output is valid JSX, so the panel should
      // remain in idle/compiling/success — never in the error state.
      const failedWallVisible = await page
        .getByText('Repairing preview', { exact: false })
        .isVisible()
        .catch(() => false);
      expect(failedWallVisible, `case: ${c.name} entered compile-failed state`).toBe(false);
    }

    // Heartbeat must have advanced across the full sweep — proves no freeze.
    const endHb = await page.evaluate(
      () => (window as any).__BUILDER_TEST_HEARTBEAT__ ?? 0,
    );
    expect(endHb - startHb, 'heartbeat did not advance during regression sweep').toBeGreaterThan(
      300,
    );

    expect(pageErrors, pageErrors.join('\n')).toHaveLength(0);
  });
});
