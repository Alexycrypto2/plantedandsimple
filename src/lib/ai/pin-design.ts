export const PIN_W = 1000;
export const PIN_H = 1778;
export const PIN_LAYOUTS = [
  { id: 'double-split', name: 'Two-angle split', note: 'Top photo, white title band, action shot below', photos: 2 },
  { id: 'hero-card', name: 'Hero card', note: 'One big photo with a clean title card', photos: 1 },
  { id: 'step-collage', name: '3-step prep', note: 'Title band over three numbered steps', photos: 3 },
  { id: 'checklist', name: 'Checklist', note: 'Photo with three checked proof points', photos: 1 },
  { id: 'editorial-card', name: 'Floating card', note: 'Full photo with a centred recipe card', photos: 1 },
] as const;
export type PinLayoutId = typeof PIN_LAYOUTS[number]['id'];
export type PinArtwork = {
  style: string; title: string; overlay_text: string; description: string; alt: string;
  hashtags: string[]; primary_keyword: string; board_suggestion: string; why_it_works: string;
  image_prompt: string; image_url: string | null; secondary_image_url?: string | null; tertiary_image_url?: string | null;
  hook?: string; pill?: string; bullets?: string[]; angle?: string;
  badge?: string; palette?: 'brand' | 'paper' | 'berry'; storage_path?: string | null;
  provider?: string; jobId?: string; credits?: number | null;
};
const LEGACY: Record<string, PinLayoutId> = {
  'split-collage': 'double-split', 'middle-band': 'double-split', 'top-banner': 'hero-card',
  'bottom-card': 'hero-card', 'center-card': 'editorial-card', 'minimal-label': 'editorial-card',
};
export function validLayout(value: string): PinLayoutId {
  return PIN_LAYOUTS.find(layout => layout.id === value)?.id ?? LEGACY[value] ?? 'double-split';
}
export function photosFor(layout: string) {
  return PIN_LAYOUTS.find(l => l.id === validLayout(layout))?.photos ?? 1;
}
export function fallbackLayout(type: string, index: number): PinLayoutId {
  const choices: PinLayoutId[] = type === 'blog' ? ['checklist', 'double-split', 'editorial-card']
    : type === 'product' || type === 'free' ? ['double-split', 'hero-card', 'checklist']
    : ['double-split', 'hero-card', 'step-collage'];
  return choices[index % choices.length] ?? 'double-split';
}
export function canFallbackImage(status: number | undefined, refused = false) {
  return !refused && (status === 429 || (status !== undefined && status >= 500 && status <= 599));
}

/** Picks the connected board that best matches the AI's suggestion by shared words. */
export function matchBoard<T extends { id: string; name: string }>(boards: T[], suggestion: string | undefined | null): T | undefined {
  if (!boards.length) return undefined;
  const words = new Set(String(suggestion ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2));
  let best = boards[0]; let bestScore = 0;
  for (const board of boards) {
    const score = board.name.toLowerCase().split(/[^a-z0-9]+/).filter(w => words.has(w)).length;
    if (score > bestScore) { best = board; bestScore = score; }
  }
  return best;
}

/** Spaces pins one per day at the given local hour, starting tomorrow if today's slot passed. */
export function dripTimes(count: number, from: Date, hour = 19): Date[] {
  const start = new Date(from); start.setHours(hour, 0, 0, 0);
  if (start <= from) start.setDate(start.getDate() + 1);
  return Array.from({ length: count }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}

/**
 * Photography-only brief for Magic Hour. Text, bands and branding are drawn by the
 * canvas so spelling is always exact; each photo is generated separately so it fills
 * its zone, and every prompt repeats the same dish, bowl and surface for consistency.
 */
export function photoPrompts(layout: string, scene: string): string[] {
  const base = `Photorealistic vertical food photography of ${scene.trim().replace(/\.$/, '')}. Warm earthy tones, soft natural window light, shallow depth of field, sharp and appetizing, handmade ceramic tableware on a light linen cloth.`;
  const noText = 'No text, letters, logos, labels, watermarks or graphics anywhere in the frame.';
  const l = validLayout(layout);
  if (l === 'double-split') return [
    `${base} Overhead 45-degree angle showing the whole dish. ${noText}`,
    `${base} The SAME dish in the SAME bowl on the SAME linen, eye-level side angle, a fork lifting a bite with sauce dripping, blurred herbs in the background. ${noText}`,
  ];
  if (l === 'step-collage') return [
    `${base} Step 1: raw prepared ingredients laid out on a board. ${noText}`,
    `${base} Step 2: the dish cooking in a pan or roasting tray. ${noText}`,
    `${base} Step 3: the finished dish portioned into glass meal prep containers. ${noText}`,
  ];
  if (l === 'checklist') return [`${base} Flat lay of the dish surrounded by its key ingredients. ${noText}`];
  return [`${base} Eye-level hero shot, steam rising, generous negative space. ${noText}`];
}
