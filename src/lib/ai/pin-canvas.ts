import { PIN_H, PIN_W, validLayout, type PinArtwork } from './pin-design';

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
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = []; let line = '';
  for (const word of text.trim().split(/\s+/)) {
    if (line && ctx.measureText(`${line} ${word}`).width > width) { result.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) result.push(line);
  return result;
}
const F = (weight: number, size: number, italic = false) => `${italic ? 'italic ' : ''}${weight} ${size}px Poppins, Arial, sans-serif`;

/** Fits an uppercase headline in at most `maxLines` lines and returns its height. */
function headline(ctx: CanvasRenderingContext2D, text: string, cx: number, top: number, width: number, maxLines: number, color: string, maxSize = 84) {
  let size = maxSize; let lines: string[] = [];
  while (size > 30) { ctx.font = F(800, size); lines = wrap(ctx, text.toUpperCase(), width); if (lines.length <= maxLines) break; size -= 3; }
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, cx, top + i * size * 1.05, width));
  return lines.length * size * 1.05;
}
function pill(ctx: CanvasRenderingContext2D, text: string, cx: number, top: number, bg: string, fg: string, size = 32) {
  ctx.font = F(600, size);
  const w = Math.min(ctx.measureText(text.toUpperCase()).width + size * 1.6, PIN_W - 120); const h = size * 1.8;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(cx - w / 2, top, w, h, h / 2); ctx.fill();
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), cx, top + h / 2 + 1, w - size);
  return h;
}
/** White band: italic hook, uppercase title, pill — vertically centred in the band. */
function band(ctx: CanvasRenderingContext2D, pin: PinArtwork, y: number, h: number, c: Colors, x = 0, w = PIN_W) {
  ctx.fillStyle = c.paper; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = c.accent; ctx.fillRect(x, y, w, 7); ctx.fillRect(x, y + h - 7, w, 7);
  const cx = x + w / 2; const title = pin.overlay_text.trim() || pin.title;
  // Measure first so the block is centred.
  const measure = document.createElement('canvas').getContext('2d')!;
  let size = 84; let lines: string[] = [];
  while (size > 30) { measure.font = F(800, size); lines = wrap(measure, title.toUpperCase(), w - 110); if (lines.length <= 2) break; size -= 3; }
  const hookH = pin.hook?.trim() ? 52 : 0; const pillH = pin.pill?.trim() ? 58 + 24 : 0;
  let top = y + (h - (hookH + lines.length * size * 1.05 + pillH)) / 2;
  if (hookH) { ctx.font = F(400, 38, true); ctx.fillStyle = c.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(pin.hook!.trim(), cx, top, w - 110); top += hookH; }
  top += headline(ctx, title, cx, top, w - 110, 2, c.accent, size);
  if (pillH) pill(ctx, pin.pill!.trim(), cx, top + 24, c.accent, c.paper);
}
function brand(ctx: CanvasRenderingContext2D, c: Colors, onPhoto = true) {
  ctx.save();
  if (onPhoto) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 14; }
  ctx.fillStyle = onPhoto ? c.paper : c.accent; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
  ctx.font = F(700, 52); ctx.fillText('PLANTED', PIN_W - 80, PIN_H - 205); ctx.fillText('& SIMPLE', PIN_W - 80, PIN_H - 150);
  ctx.font = F(500, 30); ctx.textAlign = 'center'; ctx.fillText('plantedandsimple.store', PIN_W / 2, PIN_H - 145 + 60);
  ctx.restore();
}
type Colors = { paper: string; ink: string; accent: string };

export async function drawPin(canvas: HTMLCanvasElement, pin: PinArtwork) {
  if (!pin.image_url) throw new Error('Choose a photograph first.');
  await document.fonts.load(F(800, 40)); await document.fonts.load(F(400, 30, true)); await document.fonts.ready;
  const layout = validLayout(pin.style);
  const one = await loadPhoto(pin.image_url);
  const two = pin.secondary_image_url ? await loadPhoto(pin.secondary_image_url) : one;
  const three = pin.tertiary_image_url ? await loadPhoto(pin.tertiary_image_url) : two;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Image export is unavailable.');
  canvas.width = PIN_W; canvas.height = PIN_H;
  const t = getComputedStyle(canvas);
  const c: Colors = {
    paper: t.getPropertyValue('--pin-paper').trim() || '#ffffff',
    ink: t.getPropertyValue('--pin-ink').trim() || '#192820',
    accent: t.getPropertyValue(`--pin-${pin.palette === 'berry' ? 'berry' : pin.palette === 'paper' ? 'ink' : 'green'}`).trim() || '#2a5f3a',
  };
  ctx.fillStyle = c.paper; ctx.fillRect(0, 0, PIN_W, PIN_H);
  const title = pin.overlay_text.trim() || pin.title;

  if (layout === 'double-split') {
    const top = Math.round(PIN_H * 0.42), mid = Math.round(PIN_H * 0.16);
    photo(ctx, one, 0, 0, PIN_W, top);
    photo(ctx, two, 0, top + mid, PIN_W, PIN_H - top - mid);
    band(ctx, pin, top, mid + 40, c);
    brand(ctx, c);
  } else if (layout === 'hero-card') {
    const h = Math.round(PIN_H * 0.63);
    photo(ctx, one, 0, 0, PIN_W, h);
    band(ctx, pin, h, PIN_H - h - 140, c);
    ctx.fillStyle = c.ink; ctx.font = F(600, 34); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PLANTED & SIMPLE · plantedandsimple.store', PIN_W / 2, PIN_H - 80, PIN_W - 120);
  } else if (layout === 'step-collage') {
    const head = Math.round(PIN_H * 0.22); const each = Math.round((PIN_H - head) / 3);
    [one, two, three].forEach((img, i) => {
      photo(ctx, img, 0, head + i * each, PIN_W, each - (i < 2 ? 8 : 0));
      ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(95, head + i * each + 95, 50, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.paper; ctx.font = F(800, 52); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), 95, head + i * each + 98);
    });
    band(ctx, pin, 0, head, c);
    brand(ctx, c);
  } else if (layout === 'checklist') {
    const h = Math.round(PIN_H * 0.44);
    photo(ctx, one, 0, 0, PIN_W, h);
    ctx.fillStyle = c.accent; ctx.fillRect(0, h, PIN_W, 7);
    let y = h + 70;
    if (pin.hook?.trim()) { ctx.font = F(400, 38, true); ctx.fillStyle = c.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(pin.hook.trim(), PIN_W / 2, y, PIN_W - 120); y += 62; }
    y += headline(ctx, title, PIN_W / 2, y, PIN_W - 120, 2, c.accent, 78) + 40;
    for (const item of (pin.bullets ?? []).filter(Boolean).slice(0, 3)) {
      ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(130, y + 26, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c.paper; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(117, y + 27); ctx.lineTo(127, y + 37); ctx.lineTo(144, y + 16); ctx.stroke();
      ctx.fillStyle = c.ink; ctx.font = F(500, 38); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(item, 185, y + 27, PIN_W - 260);
      y += 92;
    }
    if (pin.pill?.trim()) pill(ctx, pin.pill.trim(), PIN_W / 2, Math.min(y + 20, PIN_H - 230), c.accent, c.paper);
    ctx.fillStyle = c.ink; ctx.font = F(600, 30); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PLANTED & SIMPLE · plantedandsimple.store', PIN_W / 2, PIN_H - 80, PIN_W - 120);
  } else {
    photo(ctx, one, 0, 0, PIN_W, PIN_H);
    const w = 820, h = 520, x = (PIN_W - w) / 2, y = (PIN_H - h) / 2 - 60;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 40; ctx.fillStyle = c.paper; ctx.fillRect(x, y, w, h); ctx.restore();
    ctx.strokeStyle = c.accent; ctx.lineWidth = 4; ctx.strokeRect(x + 18, y + 18, w - 36, h - 36);
    band(ctx, pin, y + 30, h - 60, c, x + 30, w - 60);
    brand(ctx, c);
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
