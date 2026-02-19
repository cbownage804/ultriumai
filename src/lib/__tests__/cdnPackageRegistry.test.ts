import { describe, it, expect } from 'vitest';
import {
  buildPackageLookup,
  resolveBareImport,
  generateImportMap,
  detectMissingPackages,
  DEFAULT_PACKAGES,
} from '../cdnPackageRegistry';

describe('cdnPackageRegistry', () => {
  const lookup = buildPackageLookup();

  describe('buildPackageLookup', () => {
    it('includes all default packages', () => {
      expect(lookup.size).toBeGreaterThanOrEqual(DEFAULT_PACKAGES.length);
      expect(lookup.has('lucide-react')).toBe(true);
      expect(lookup.has('date-fns')).toBe(true);
    });

    it('allows user packages to override defaults', () => {
      const custom = buildPackageLookup(DEFAULT_PACKAGES, [
        { name: 'lucide-react', version: '999.0.0', cdnUrl: 'https://custom.cdn/lucide' },
      ]);
      expect(custom.get('lucide-react')!.version).toBe('999.0.0');
    });
  });

  describe('resolveBareImport', () => {
    it('resolves known packages to CDN URL', () => {
      const url = resolveBareImport('lucide-react', lookup);
      expect(url).toContain('esm.sh/lucide-react');
    });

    it('resolves scoped package subpaths', () => {
      const url = resolveBareImport('@tanstack/react-query', lookup);
      expect(url).toContain('esm.sh/@tanstack/react-query');
    });

    it('falls back to esm.sh for unknown packages', () => {
      const url = resolveBareImport('some-unknown-pkg', lookup);
      expect(url).toBe('https://esm.sh/some-unknown-pkg');
    });
  });

  describe('generateImportMap', () => {
    it('includes react and react-dom', () => {
      const map = generateImportMap([]);
      expect(map['react']).toContain('esm.sh/react');
      expect(map['react-dom']).toContain('esm.sh/react-dom');
    });

    it('includes custom packages', () => {
      const map = generateImportMap(DEFAULT_PACKAGES);
      expect(map['lucide-react']).toBeDefined();
      expect(map['framer-motion']).toBeDefined();
    });
  });

  describe('detectMissingPackages', () => {
    it('detects imports not in registry', () => {
      const code = `import { something } from 'unknown-lib';\nimport React from 'react';`;
      const missing = detectMissingPackages(code, lookup);
      expect(missing).toContain('unknown-lib');
      expect(missing).not.toContain('react');
    });

    it('ignores relative imports', () => {
      const code = `import { foo } from './utils';`;
      const missing = detectMissingPackages(code, lookup);
      expect(missing).toHaveLength(0);
    });
  });
});
