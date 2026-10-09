import { useEffect, useRef, useState } from 'react';
import { drawPin } from '@/lib/ai/pin-canvas';
import type { PinArtwork } from '@/lib/ai/pin-design';
export function PinCanvas({ pin }: { pin: PinArtwork }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    // Draw off-screen first: stale image loads cannot overwrite a newer edit.
    const buffer = document.createElement('canvas'); buffer.className = 'pin-artwork';
    buffer.hidden = true; document.body.appendChild(buffer);
    setError('');
    drawPin(buffer, pin).then(() => {
      if (!alive || !ref.current) return;
      ref.current.width = 1000; ref.current.height = 1500;
      ref.current.getContext('2d')?.drawImage(buffer, 0, 0);
    }).catch(e => { if (alive) setError(e.message); }).finally(() => buffer.remove());
    return () => { alive = false; };
  }, [pin]);
  return <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
    <canvas ref={ref} className="pin-artwork block h-full w-full" aria-label={pin.alt || pin.overlay_text} role="img" />
    {error && <p className="absolute inset-0 grid place-items-center bg-muted p-4 text-center text-sm text-destructive">{error}</p>}
  </div>;
}
