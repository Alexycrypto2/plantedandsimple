import { validLayout, type PinArtwork } from './pin-design';

async function loadPhoto(url: string) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();
  return image;
}
function photo(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const sw = w / scale, sh = h / scale;
  ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}
function lines(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = []; let line = '';
  for (const word of text.trim().split(/\s+/)) {
    if (line && ctx.measureText(`${line} ${word}`).width > width) { result.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) result.push(line);
  return result;
}
export async function drawPin(canvas: HTMLCanvasElement, pin: PinArtwork) {
  if (!pin.image_url) throw new Error('Choose a photograph first.');
  await document.fonts.ready;
  const image = await loadPhoto(pin.image_url);
  const secondary = pin.secondary_image_url ? await loadPhoto(pin.secondary_image_url) : null;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image export is unavailable.');
  canvas.width = 1000; canvas.height = 1500;
  const tokens = getComputedStyle(canvas);
  const ink = tokens.getPropertyValue('--pin-ink').trim();
  const paper = tokens.getPropertyValue('--pin-paper').trim();
  const accent = tokens.getPropertyValue(`--pin-${pin.palette === 'berry' ? 'berry' : pin.palette === 'paper' ? 'ink' : 'green'}`).trim();
  ctx.fillStyle = paper; ctx.fillRect(0, 0, 1000, 1500);
  const layout = validLayout(pin.style);
  let box = { x: 0, y: 0, w: 1000, h: 340 };
  if (layout === 'top-banner') photo(ctx, image, 0, 340, 1000, 1160);
  else if (layout === 'bottom-card') { photo(ctx, image, 0, 0, 1000, 1110); box = { x: 0, y: 1110, w: 1000, h: 390 }; }
  else {
    photo(ctx, image, 0, 0, 1000, 1500);
    if (layout === 'split-collage' && secondary) { photo(ctx, image, 0, 0, 1000, 650); photo(ctx, secondary, 0, 850, 1000, 650); }
    if (layout === 'split-collage' || layout === 'middle-band') box = { x: 0, y: 590, w: 1000, h: 320 };
    if (layout === 'center-card') box = { x: 85, y: 530, w: 830, h: 430 };
    if (layout === 'minimal-label') box = { x: 55, y: 1050, w: 890, h: 335 };
  }
  const colored = layout === 'middle-band' || layout === 'top-banner' || layout === 'split-collage';
  ctx.fillStyle = colored ? accent : paper; ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = colored ? paper : ink;
  const title = pin.overlay_text.trim() || pin.title;
  let size = 76; let wrapped: string[] = [];
  while (size >= 24) {
    ctx.font = `600 ${size}px Georgia, serif`;
    wrapped = lines(ctx, title, box.w - 100);
    if (wrapped.length * size * 1.12 <= box.h - 100 && wrapped.every(line => ctx.measureText(line).width <= box.w - 100)) break;
    size -= 2;
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  wrapped.forEach((line, index) => ctx.fillText(line, box.x + box.w / 2, box.y + box.h / 2 + (index - (wrapped.length - 1) / 2) * size * 1.12 - 8));
  ctx.font = '500 21px Arial, sans-serif';
  ctx.fillText('PLANTED & SIMPLE', box.x + box.w / 2, box.y + box.h - 32);
  if (pin.badge?.trim()) {
    ctx.font = '600 27px Arial, sans-serif';
    const width = Math.min(ctx.measureText(pin.badge).width + 50, 850);
    const y = layout === 'top-banner' ? 380 : 45;
    ctx.fillStyle = paper; ctx.fillRect(45, y, width, 65);
    ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.fillText(pin.badge, 70, y + 33, width - 45);
  }
}
export function pinBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not export the pin.')), 'image/png'));
}
export async function exportPin(pin: PinArtwork) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pin-artwork'; document.body.appendChild(canvas); canvas.hidden = true;
  try { await drawPin(canvas, pin); return await pinBlob(canvas); }
  finally { canvas.remove(); }
}
