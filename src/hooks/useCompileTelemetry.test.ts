import { describe, expect, it } from 'vitest';
import { classifyFailure } from './useCompileTelemetry';

describe('classifyFailure', () => {
  it('classifies pre-compile syntax diagnostics as syntax failures', () => {
    expect(classifyFailure("src/App.tsx: Unclosed '(' — missing ')'"))
      .toBe('syntax');
  });

  it('classifies generic compiler output gaps as unknown failures', () => {
    expect(classifyFailure('Compiler produced no output'))
      .toBe('unknown');
  });
});
