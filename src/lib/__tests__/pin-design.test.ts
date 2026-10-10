import { describe, expect, it } from 'vitest';
import { canFallbackImage, dripTimes, fallbackLayout, matchBoard, photoPrompts, validLayout } from '../ai/pin-design';
describe('Pinterest artwork and safe fallback', () => {
  it('leads recipes and free cookbook with the two-angle split', () => { expect(fallbackLayout('recipe', 0)).toBe('double-split'); expect(fallbackLayout('free', 0)).toBe('double-split'); expect(fallbackLayout('blog', 0)).toBe('checklist'); });
  it('maps old saved layouts onto the new ones', () => { expect(validLayout('split-collage')).toBe('double-split'); expect(validLayout('top-banner')).toBe('hero-card'); expect(validLayout('generic-poster')).toBe('double-split'); });
  it('asks Magic Hour for two angles of the same dish, with no text', () => {
    const p = photoPrompts('double-split', 'a harissa chickpea bowl');
    expect(p).toHaveLength(2); expect(p[1]).toContain('SAME dish'); expect(p.every(x => x.includes('No text'))).toBe(true);
    expect(photoPrompts('step-collage', 'tofu')).toHaveLength(3);
  });
  it('matches the board that shares the most words', () => { expect(matchBoard([{ id: '1', name: 'Desserts' }, { id: '2', name: 'Vegan Meal Prep' }], 'Meal Prep Ideas')?.id).toBe('2'); });
  it('drips one pin per day at 7 PM', () => { const t = dripTimes(3, new Date(2026, 0, 1, 20)); expect(t.map(d => [d.getDate(), d.getHours()])).toEqual([[2, 19], [3, 19], [4, 19]]); });
  it('continues on temporary image-provider failures only', () => { expect(canFallbackImage(429)).toBe(true); expect(canFallbackImage(503)).toBe(true); expect(canFallbackImage(403)).toBe(false); expect(canFallbackImage(500, true)).toBe(false); expect(canFallbackImage(402)).toBe(false); });
});
