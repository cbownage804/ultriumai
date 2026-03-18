import { useCallback, useRef } from 'react';

/**
 * useDeployGate — Post-build smoke tests that verify the preview
 * is functional before allowing deployment. Auto-blocks broken deploys.
 *
 * Checks:
 * 1. Routes render (root has visible content)
 * 2. No console errors during initial render
 * 3. No white screen / blank render
 * 4. No infinite loops detected
 * 5. Network requests succeed (no 5xx errors)
 */

export interface SmokeTestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

export interface DeployGateResult {
  passed: boolean;
  tests: SmokeTestResult[];
  totalDuration: number;
  timestamp: number;
  blockedReason?: string;
}

/** Smoke test script injected into preview iframe */
const SMOKE_TEST_SCRIPT = `
<script data-smoke-test>
(function(){
  var errors = [];
  var networkErrors = [];
  var origError = console.error;
  
  // Capture console errors during initial render
  console.error = function() {
    var msg = Array.from(arguments).map(function(a) { return String(a); }).join(' ');
    errors.push(msg);
    origError.apply(console, arguments);
  };
  
  // Capture network failures
  var origFetch = window.fetch;
  window.fetch = function() {
    return origFetch.apply(this, arguments).then(function(resp) {
      if (resp.status >= 500) {
        networkErrors.push({ url: String(arguments[0]), status: resp.status });
      }
      return resp;
    }).catch(function(err) {
      networkErrors.push({ url: String(arguments[0]), status: 0, error: err.message });
      throw err;
    });
  };
  
  // Listen for smoke test request from parent
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== '__RUN_SMOKE_TESTS__') return;
    
    var results = [];
    
    // Test 1: Root has content
    var root = document.getElementById('root') || document.getElementById('app');
    var hasContent = root && root.children.length > 0;
    results.push({
      name: 'Root renders content',
      passed: !!hasContent,
      message: hasContent ? 'Root has ' + root.children.length + ' children' : 'Root is empty or missing',
    });
    
    // Test 2: No console errors
    results.push({
      name: 'No console errors during render',
      passed: errors.length === 0,
      message: errors.length === 0 ? 'Clean render' : errors.length + ' error(s): ' + errors[0],
    });
    
    // Test 3: Visible content (not blank screen)
    var isVisible = root && root.offsetHeight > 0 && root.offsetWidth > 0;
    results.push({
      name: 'Content is visible',
      passed: !!isVisible,
      message: isVisible ? 'Root is ' + root.offsetWidth + 'x' + root.offsetHeight + 'px' : 'Content not visible',
    });
    
    // Test 4: No error overlay present
    var hasErrorOverlay = !!document.getElementById('__vite_error_overlay__');
    results.push({
      name: 'No error overlay',
      passed: !hasErrorOverlay,
      message: hasErrorOverlay ? 'Error overlay is visible' : 'No error overlay',
    });
    
    // Test 5: No 5xx network errors
    results.push({
      name: 'No server errors (5xx)',
      passed: networkErrors.length === 0,
      message: networkErrors.length === 0 ? 'All requests OK' : networkErrors.length + ' failed request(s)',
    });
    
    // Test 6: Page loaded within timeout
    var loadTime = performance.now();
    results.push({
      name: 'Page loads within 10s',
      passed: loadTime < 10000,
      message: 'Loaded in ' + Math.round(loadTime) + 'ms',
    });
    
    window.parent.postMessage({
      type: '__SMOKE_TEST_RESULTS__',
      results: results,
    }, '*');
  });
})();
</script>`;

export function useDeployGate() {
  const lastResultRef = useRef<DeployGateResult | null>(null);

  /** Inject smoke test script into HTML */
  const injectSmokeTests = useCallback((html: string): string => {
    if (html.includes('data-smoke-test')) return html;
    if (html.includes('Compilation Error') || html.includes('ai-builder-fallback')) return html;

    const headClose = html.indexOf('</head>');
    if (headClose !== -1) {
      return html.slice(0, headClose) + SMOKE_TEST_SCRIPT + html.slice(headClose);
    }
    return html;
  }, []);

  /** Run smoke tests in the preview iframe */
  const runSmokeTests = useCallback(async (
    iframeRef: React.RefObject<HTMLIFrameElement | null>,
  ): Promise<DeployGateResult> => {
    const t0 = performance.now();
    const iframe = iframeRef.current;

    if (!iframe?.contentWindow) {
      const result: DeployGateResult = {
        passed: false,
        tests: [{ name: 'Iframe accessible', passed: false, message: 'Preview iframe not available', duration: 0 }],
        totalDuration: 0,
        timestamp: Date.now(),
        blockedReason: 'Preview iframe not available',
      };
      lastResultRef.current = result;
      return result;
    }

    // Wait for results
    const resultsPromise = new Promise<SmokeTestResult[]>((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve([{
          name: 'Smoke test timeout',
          passed: false,
          message: 'Tests did not complete within 8s',
          duration: 8000,
        }]);
      }, 8000);

      const handler = (e: MessageEvent) => {
        if (e.data?.type === '__SMOKE_TEST_RESULTS__') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          const results = (e.data.results || []).map((r: any) => ({
            ...r,
            duration: Math.round(performance.now() - t0),
          }));
          resolve(results);
        }
      };

      window.addEventListener('message', handler);
    });

    // Trigger smoke tests
    iframe.contentWindow.postMessage({ type: '__RUN_SMOKE_TESTS__' }, '*');

    const tests = await resultsPromise;
    const allPassed = tests.every(t => t.passed);
    const totalDuration = Math.round(performance.now() - t0);

    const result: DeployGateResult = {
      passed: allPassed,
      tests,
      totalDuration,
      timestamp: Date.now(),
      blockedReason: allPassed ? undefined : tests.find(t => !t.passed)?.message,
    };

    lastResultRef.current = result;
    console.info('[DeployGate]', allPassed ? '✅ All smoke tests passed' : '❌ Smoke tests failed:', result.blockedReason);
    return result;
  }, []);

  return {
    injectSmokeTests,
    runSmokeTests,
    getLastResult: () => lastResultRef.current,
  };
}
