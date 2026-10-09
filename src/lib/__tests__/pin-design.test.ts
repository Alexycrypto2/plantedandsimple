import { describe, expect, it } from 'vitest';
import { canFallbackImage, fallbackLayout, validLayout } from '../ai/pin-design';
describe('Pinterest artwork and safe fallback', () => {
  it('uses publisher layouts for recipes and products', () => { expect(fallbackLayout('recipe', 0)).toBe('top-banner'); expect(fallbackLayout('product', 0)).toBe('bottom-card'); expect(fallbackLayout('free', 0)).toBe('bottom-card'); });
  it('normalizes unsupported layout IDs', () => { expect(validLayout('generic-poster')).toBe('bottom-card'); expect(validLayout('split-collage')).toBe('split-collage'); });
  it('continues on temporary image-provider failures', () => { expect(canFallbackImage(429)).toBe(true); expect(canFallbackImage(503)).toBe(true); });
  it('never hides a refusal or permission denial behind a fallback', () => { expect(canFallbackImage(403)).toBe(false); expect(canFallbackImage(500, true)).toBe(false); expect(canFallbackImage(200, true)).toBe(false); });
  it('stops on billing, configuration and unavailable endpoints', () => { expect(canFallbackImage(402)).toBe(false); expect(canFallbackImage(401)).toBe(false); expect(canFallbackImage(404)).toBe(false); expect(canFallbackImage(400)).toBe(false); });
});
