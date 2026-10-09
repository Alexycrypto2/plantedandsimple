export const PIN_LAYOUTS = [
  { id: 'top-banner', name: 'Recipe headline', note: 'Clear title, generous food photo' },
  { id: 'bottom-card', name: 'Food first', note: 'Full photograph, clean caption' },
  { id: 'middle-band', name: 'Publisher band', note: 'A familiar, confident title strip' },
  { id: 'center-card', name: 'Editorial feature', note: 'Framed headline for useful articles' },
  { id: 'minimal-label', name: 'Quiet label', note: 'Understated, photography-led' },
  { id: 'split-collage', name: 'Two-photo story', note: 'Two distinct photos with a title band' },
] as const;
export type PinLayoutId = typeof PIN_LAYOUTS[number]['id'];
export type PinArtwork = {
  style: string; title: string; overlay_text: string; description: string; alt: string;
  hashtags: string[]; primary_keyword: string; board_suggestion: string; why_it_works: string;
  image_prompt: string; image_url: string | null; secondary_image_url?: string | null;
  badge?: string; palette?: 'brand' | 'paper' | 'berry'; storage_path?: string | null;
  provider?: string; jobId?: string; credits?: number | null;
};
export function validLayout(value: string): PinLayoutId {
  return PIN_LAYOUTS.find(layout => layout.id === value)?.id ?? 'bottom-card';
}
export function fallbackLayout(type: string, index: number): PinLayoutId {
  const choices: PinLayoutId[] = type === 'blog' ? ['center-card', 'top-banner', 'minimal-label']
    : type === 'product' || type === 'free' ? ['bottom-card', 'minimal-label', 'top-banner']
    : ['top-banner', 'bottom-card', 'middle-band', 'minimal-label'];
  return choices[index % choices.length] ?? 'bottom-card';
}
export function canFallbackImage(status: number | undefined, refused = false) {
  return !refused && (status === 429 || (status !== undefined && status >= 500 && status <= 599));
}
