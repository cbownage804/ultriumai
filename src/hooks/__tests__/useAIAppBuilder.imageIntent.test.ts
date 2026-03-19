import { describe, expect, it } from 'vitest';
import { detectImageGenerationIntent } from '@/hooks/useAIAppBuilder';

describe('detectImageGenerationIntent', () => {
  it('treats redesign/update requests as image generation', () => {
    expect(detectImageGenerationIntent('Please redesign the logo')).not.toBeNull();
    expect(detectImageGenerationIntent('update the logo')).not.toBeNull();
    expect(detectImageGenerationIntent('change the icon to something modern')).not.toBeNull();
  });

  it('does NOT trigger for keep/reuse requests', () => {
    expect(detectImageGenerationIntent('keep the current logo')).toBeNull();
    expect(detectImageGenerationIntent('reuse the existing brand icon')).toBeNull();
  });

  it('detects explicit new-image generation requests', () => {
    const result = detectImageGenerationIntent('create a new logo from scratch for my app');
    expect(result).not.toBeNull();
    expect(result!.quality).toBe('standard');

    const hq = detectImageGenerationIntent('generate a high quality icon for the website');
    expect(hq).not.toBeNull();
    expect(hq!.quality).toBe('high');
  });

  it('does not trigger without an image noun', () => {
    expect(detectImageGenerationIntent('redesign the homepage')).toBeNull();
    expect(detectImageGenerationIntent('update the navbar color')).toBeNull();
  });
});
