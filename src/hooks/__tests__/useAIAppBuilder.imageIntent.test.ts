import { describe, expect, it } from 'vitest';
import { detectImageGenerationIntent } from '@/hooks/useAIAppBuilder';

describe('detectImageGenerationIntent', () => {
  it('does not treat redesign requests as image generation', () => {
    expect(detectImageGenerationIntent('Please redesign the logo')).toBeNull();
    expect(detectImageGenerationIntent('update the navbar logo')).toBeNull();
    expect(detectImageGenerationIntent('refresh the existing brand icon')).toBeNull();
  });

  it('detects explicit new-image generation requests', () => {
    expect(detectImageGenerationIntent('create a new logo from scratch for my app')).toEqual({
      prompt: 'create a new logo from scratch',
      quality: 'standard',
    });

    expect(detectImageGenerationIntent('generate a high quality icon for the website')).toEqual({
      prompt: 'generate a high quality icon',
      quality: 'high',
    });
  });
});
