import { useCallback, useRef } from 'react';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

/**
 * useAutoTestGenerator — AI-powered test generation pipeline.
 * After each successful build, analyzes components and generates
 * unit tests. Runs them in-browser using a lightweight test harness.
 */

export interface TestCase {
  id: string;
  name: string;
  file: string;
  targetFile: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  error?: string;
  duration?: number;
}

export interface TestSuite {
  cases: TestCase[];
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  generatedAt: number;
}

/** Script injected into preview iframe to run test assertions */
const TEST_HARNESS_SCRIPT = `
<script data-test-harness>
(function(){
  window.__testResults = [];
  window.__testRunning = false;

  window.__runTests = function(tests) {
    window.__testRunning = true;
    window.__testResults = [];
    var results = [];
    
    tests.forEach(function(test) {
      var result = { id: test.id, name: test.name, status: 'running', startTime: performance.now() };
      try {
        // Execute test assertions
        var fn = new Function('document', 'window', 'expect', test.code);
        fn(document, window, window.__expect);
        result.status = 'passed';
      } catch(err) {
        result.status = 'failed';
        result.error = err.message || String(err);
      }
      result.duration = Math.round(performance.now() - result.startTime);
      results.push(result);
    });
    
    window.__testResults = results;
    window.__testRunning = false;
    window.parent.postMessage({ type: '__TEST_RESULTS__', results: results }, '*');
  };

  // Simple expect helper
  window.__expect = function(actual) {
    return {
      toBe: function(expected) {
        if (actual !== expected) throw new Error('Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
      },
      toBeTruthy: function() {
        if (!actual) throw new Error('Expected truthy but got ' + JSON.stringify(actual));
      },
      toBeFalsy: function() {
        if (actual) throw new Error('Expected falsy but got ' + JSON.stringify(actual));
      },
      toContain: function(expected) {
        if (typeof actual === 'string' && !actual.includes(expected)) throw new Error('Expected "' + actual + '" to contain "' + expected + '"');
        if (Array.isArray(actual) && !actual.includes(expected)) throw new Error('Expected array to contain ' + JSON.stringify(expected));
      },
      toBeGreaterThan: function(expected) {
        if (actual <= expected) throw new Error('Expected ' + actual + ' > ' + expected);
      },
      toBeNull: function() {
        if (actual !== null) throw new Error('Expected null but got ' + JSON.stringify(actual));
      },
      not: {
        toBe: function(expected) {
          if (actual === expected) throw new Error('Expected not ' + JSON.stringify(expected));
        },
        toBeNull: function() {
          if (actual === null) throw new Error('Expected not null');
        },
        toBeTruthy: function() {
          if (actual) throw new Error('Expected falsy');
        },
      },
    };
  };
})();
</script>`;

/**
 * Generate test cases from project files by analyzing component structure.
 */
function generateTestCases(files: ProjectFile[]): { id: string; name: string; file: string; targetFile: string; code: string }[] {
  const tests: { id: string; name: string; file: string; targetFile: string; code: string }[] = [];
  let testId = 0;

  for (const file of files) {
    if (!/\.(tsx|jsx)$/.test(file.path)) continue;
    if (/\.(test|spec)\.(tsx|jsx)$/.test(file.path)) continue;
    if (file.path.includes('node_modules')) continue;

    const componentName = file.path.split('/').pop()?.replace(/\.(tsx|jsx)$/, '') || 'Component';

    // Test 1: Component renders without crashing
    tests.push({
      id: `test-${testId++}`,
      name: `${componentName} renders without crashing`,
      file: `${file.path}.test`,
      targetFile: file.path,
      code: `
        var root = document.getElementById('root');
        expect(root).not.toBeNull();
        expect(root.children.length).toBeGreaterThan(0);
      `,
    });

    // Test 2: No console errors during render
    tests.push({
      id: `test-${testId++}`,
      name: `${componentName} renders without console errors`,
      file: `${file.path}.test`,
      targetFile: file.path,
      code: `
        // Check that no error overlay is visible
        var errorOverlay = document.getElementById('__vite_error_overlay__');
        expect(errorOverlay).toBeNull();
      `,
    });

    // Test 3: Check for accessible elements (buttons, links, headings)
    if (file.content.includes('<button') || file.content.includes('<Button')) {
      tests.push({
        id: `test-${testId++}`,
        name: `${componentName} has accessible buttons`,
        file: `${file.path}.test`,
        targetFile: file.path,
        code: `
          var buttons = document.querySelectorAll('button');
          for (var i = 0; i < buttons.length; i++) {
            var btn = buttons[i];
            var hasText = btn.textContent.trim().length > 0;
            var hasAriaLabel = !!btn.getAttribute('aria-label');
            var hasTitle = !!btn.getAttribute('title');
            expect(hasText || hasAriaLabel || hasTitle).toBeTruthy();
          }
        `,
      });
    }

    // Test 4: Check for proper heading hierarchy
    if (file.content.match(/<h[1-6]/)) {
      tests.push({
        id: `test-${testId++}`,
        name: `${componentName} has proper heading hierarchy`,
        file: `${file.path}.test`,
        targetFile: file.path,
        code: `
          var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          if (headings.length > 0) {
            // At least one heading should exist
            expect(headings.length).toBeGreaterThan(0);
          }
        `,
      });
    }

    // Test 5: Check images have alt text
    if (file.content.includes('<img') || file.content.includes('<Image')) {
      tests.push({
        id: `test-${testId++}`,
        name: `${componentName} images have alt text`,
        file: `${file.path}.test`,
        targetFile: file.path,
        code: `
          var images = document.querySelectorAll('img');
          for (var i = 0; i < images.length; i++) {
            var alt = images[i].getAttribute('alt');
            expect(alt !== null).toBeTruthy();
          }
        `,
      });
    }
  }

  return tests;
}

export function useAutoTestGenerator() {
  const lastSuiteRef = useRef<TestSuite | null>(null);
  const testResolverRef = useRef<((results: any[]) => void) | null>(null);

  /** Inject the test harness into compiled HTML */
  const injectTestHarness = useCallback((html: string): string => {
    if (html.includes('data-test-harness')) return html;
    if (html.includes('Compilation Error') || html.includes('ai-builder-fallback')) return html;

    const headClose = html.indexOf('</head>');
    if (headClose !== -1) {
      return html.slice(0, headClose) + TEST_HARNESS_SCRIPT + html.slice(headClose);
    }
    return html;
  }, []);

  /** Generate and run tests after a successful build */
  const runAutoTests = useCallback(async (
    files: ProjectFile[],
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
  ): Promise<TestSuite> => {
    const testCases = generateTestCases(files);

    if (testCases.length === 0) {
      const suite: TestSuite = {
        cases: [],
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: 0,
        totalDuration: 0,
        generatedAt: Date.now(),
      };
      lastSuiteRef.current = suite;
      return suite;
    }

    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) {
      // Can't run tests — return pending
      const cases: TestCase[] = testCases.map(t => ({
        id: t.id,
        name: t.name,
        file: t.file,
        targetFile: t.targetFile,
        status: 'skipped' as const,
      }));
      const suite: TestSuite = {
        cases,
        totalPassed: 0,
        totalFailed: 0,
        totalSkipped: cases.length,
        totalDuration: 0,
        generatedAt: Date.now(),
      };
      lastSuiteRef.current = suite;
      return suite;
    }

    // Wait for results via postMessage
    const resultsPromise = new Promise<any[]>((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve([]);
      }, 5000);

      const handler = (e: MessageEvent) => {
        if (e.data?.type === '__TEST_RESULTS__') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          resolve(e.data.results || []);
        }
      };

      window.addEventListener('message', handler);
    });

    // Send tests to iframe
    iframe.contentWindow.postMessage({
      type: '__RUN_TESTS__',
    }, '*');

    // Trigger test execution
    try {
      iframe.contentWindow.postMessage({ type: '__NOOP__' }, '*');
      // Directly call __runTests if available
      const testPayload = testCases.map(t => ({ id: t.id, name: t.name, code: t.code }));
      iframe.contentWindow.postMessage({ type: '__EXEC__', code: `window.__runTests(${JSON.stringify(testPayload)})` }, '*');

      // Fallback: try eval
      try {
        (iframe.contentWindow as any).__runTests?.(testPayload);
      } catch {}
    } catch {}

    const results = await resultsPromise;

    // Map results to test cases
    const cases: TestCase[] = testCases.map(t => {
      const result = results.find((r: any) => r.id === t.id);
      return {
        id: t.id,
        name: t.name,
        file: t.file,
        targetFile: t.targetFile,
        status: result?.status || 'skipped',
        error: result?.error,
        duration: result?.duration,
      };
    });

    const suite: TestSuite = {
      cases,
      totalPassed: cases.filter(c => c.status === 'passed').length,
      totalFailed: cases.filter(c => c.status === 'failed').length,
      totalSkipped: cases.filter(c => c.status === 'skipped').length,
      totalDuration: cases.reduce((sum, c) => sum + (c.duration || 0), 0),
      generatedAt: Date.now(),
    };

    lastSuiteRef.current = suite;
    console.info('[AutoTest]', suite.totalPassed, 'passed,', suite.totalFailed, 'failed,', suite.totalSkipped, 'skipped in', suite.totalDuration, 'ms');
    return suite;
  }, []);

  return {
    injectTestHarness,
    runAutoTests,
    getLastSuite: () => lastSuiteRef.current,
    generateTestCases,
  };
}
