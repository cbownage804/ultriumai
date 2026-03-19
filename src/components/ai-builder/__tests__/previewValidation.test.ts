import { describe, it, expect } from 'vitest';
import { isPreviewValid, previewDebugSummary } from '../previewValidation';

describe('isPreviewValid', () => {
  it('returns false for null/undefined/empty', () => {
    expect(isPreviewValid(null)).toBe(false);
    expect(isPreviewValid(undefined)).toBe(false);
    expect(isPreviewValid('')).toBe(false);
    expect(isPreviewValid('   ')).toBe(false);
  });

  it('returns true for valid HTML with root mount', () => {
    const html = '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>';
    expect(isPreviewValid(html)).toBe(true);
  });

  it('returns true for app mount point', () => {
    const html = '<!DOCTYPE html><html><body><div id="app"></div></body></html>';
    expect(isPreviewValid(html)).toBe(true);
  });

  it('returns false without doctype or html tag', () => {
    expect(isPreviewValid('<div id="root"></div>')).toBe(false);
  });

  it('returns false without mount point', () => {
    expect(isPreviewValid('<!DOCTYPE html><html><body></body></html>')).toBe(false);
  });

  it('returns false for fallback sentinel', () => {
    const html = '<!DOCTYPE html><html><head><meta name="ai-builder-fallback" content="error"></head><body><div id="root"></div></body></html>';
    expect(isPreviewValid(html)).toBe(false);
  });

  it('returns false for compilation error page', () => {
    const html = '<!DOCTYPE html><html><body><div id="root">⚠️ Compilation Error</div></body></html>';
    expect(isPreviewValid(html)).toBe(false);
  });
});

describe('previewDebugSummary', () => {
  it('handles null input', () => {
    const summary = previewDebugSummary(null);
    expect(summary.htmlLength).toBe(0);
  });

  it('returns correct flags for valid HTML', () => {
    const html = '<!DOCTYPE html><html><body><div id="root"></div></body></html>';
    const summary = previewDebugSummary(html);
    expect(summary.hasDoctype).toBe(true);
    expect(summary.hasMount).toBe(true);
    expect(summary.isFallback).toBe(false);
  });
});
