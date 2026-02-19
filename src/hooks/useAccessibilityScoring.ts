import { useState, useCallback } from 'react';
import type { ProjectFile } from './useProjectFileSystem';

export interface A11yViolation {
  id: string;
  rule: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  element: string;
  file: string;
  fix: string;
}

export interface A11yScore {
  overall: number;
  categories: { name: string; score: number; maxScore: number }[];
  violations: A11yViolation[];
  scannedAt: Date;
  filesScanned: number;
}

export function useAccessibilityScoring() {
  const [latestScore, setLatestScore] = useState<A11yScore | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const scan = useCallback((files: ProjectFile[]): A11yScore => {
    setIsScanning(true);
    const violations: A11yViolation[] = [];
    const components = files.filter(f => /\.(tsx|jsx)$/.test(f.path));

    for (const file of components) {
      // Missing alt on img
      const imgNoAlt = [...file.content.matchAll(/<img(?![^>]*alt=)[^>]*>/g)];
      for (const m of imgNoAlt) {
        violations.push({ id: crypto.randomUUID(), rule: 'img-alt', impact: 'critical', description: 'Image missing alt attribute', element: m[0].slice(0, 80), file: file.path, fix: 'Add descriptive alt text to <img>' });
      }
      // onClick without keyboard
      const clickNoKey = [...file.content.matchAll(/onClick=\{[^}]+\}/g)];
      const hasKeyHandler = file.content.includes('onKeyDown') || file.content.includes('onKeyPress') || file.content.includes('onKeyUp');
      if (clickNoKey.length > 0 && !hasKeyHandler) {
        violations.push({ id: crypto.randomUUID(), rule: 'keyboard-access', impact: 'serious', description: 'onClick without keyboard handler', element: 'interactive element', file: file.path, fix: 'Add onKeyDown handler for keyboard accessibility' });
      }
      // Missing aria-label on icon buttons
      const iconBtns = [...file.content.matchAll(/<button[^>]*>[\s]*<(?:svg|Icon|.*Icon)/g)];
      for (const m of iconBtns) {
        if (!m[0].includes('aria-label')) {
          violations.push({ id: crypto.randomUUID(), rule: 'button-name', impact: 'serious', description: 'Icon button missing aria-label', element: m[0].slice(0, 80), file: file.path, fix: 'Add aria-label to icon-only buttons' });
        }
      }
      // Missing form labels
      const inputs = [...file.content.matchAll(/<(?:input|textarea|select)(?![^>]*aria-label)[^>]*>/g)];
      for (const m of inputs) {
        if (!m[0].includes('id=') || !file.content.includes('htmlFor')) {
          violations.push({ id: crypto.randomUUID(), rule: 'label', impact: 'critical', description: 'Form input missing associated label', element: m[0].slice(0, 80), file: file.path, fix: 'Add <label htmlFor> or aria-label' });
        }
      }
    }

    const contrastScore = Math.max(0, 25 - violations.filter(v => v.rule === 'color-contrast').length * 5);
    const ariaScore = Math.max(0, 25 - violations.filter(v => v.rule.includes('aria') || v.rule === 'button-name').length * 3);
    const keyboardScore = Math.max(0, 25 - violations.filter(v => v.rule === 'keyboard-access').length * 5);
    const semanticScore = Math.max(0, 25 - violations.filter(v => v.rule === 'img-alt' || v.rule === 'label').length * 3);

    const score: A11yScore = {
      overall: contrastScore + ariaScore + keyboardScore + semanticScore,
      categories: [
        { name: 'Color & Contrast', score: contrastScore, maxScore: 25 },
        { name: 'ARIA & Labels', score: ariaScore, maxScore: 25 },
        { name: 'Keyboard Navigation', score: keyboardScore, maxScore: 25 },
        { name: 'Semantic HTML', score: semanticScore, maxScore: 25 },
      ],
      violations: violations.slice(0, 50),
      scannedAt: new Date(),
      filesScanned: components.length,
    };
    setLatestScore(score);
    setIsScanning(false);
    return score;
  }, []);

  return { latestScore, isScanning, scan };
}
