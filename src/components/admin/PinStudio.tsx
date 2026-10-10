import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, ChefHat, Download, Gift, ImagePlus, Loader2, Newspaper, RefreshCw, Settings2, Sparkles, Square, Trash2, Wand2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { listPinSources, generatePinsFromSource, savePinPreviews, type PinSource, type PinSourceType } from '@/lib/ai/pin-studio.functions';
import { adminListSettings, adminSaveSetting } from '@/lib/settings.functions';
import { getPinProviders, startPinPhoto, pollPinPhoto, cancelPinPhoto, uploadPinArtwork } from '@/lib/ai/pin-images.functions';
import { PIN_LAYOUTS, photoPrompts, photosFor, type PinArtwork, type PinLayoutId } from '@/lib/ai/pin-design';
import { exportPin } from '@/lib/ai/pin-canvas';
import { PinCanvas } from './PinCanvas';
import samplePhoto from '@/assets/recipe-sesame-tofu.jpg';
import cookbookPhoto from '@/assets/cookbook-mockup.jpg';
import freePhoto from '@/assets/hero-editorial.jpg';

const field = 'w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';
const TYPES = [{ id: 'recipe', title: 'Recipes', icon: ChefHat }, { id: 'blog', title: 'Articles', icon: Newspaper }, { id: 'product', title: 'Products', icon: BookOpen }, { id: 'free', title: 'Free cookbook', icon: Gift }, { id: 'custom', title: 'Custom', icon: Sparkles }] as const;
const preview: PinArtwork = { style: 'double-split', hook: 'Dinner in 20 minutes, no stress', pill: 'High-protein • 20 min', bullets: ['24g plant protein', 'One pan, easy cleanup', 'Keeps 4 days'], title: 'Sesame tofu bowls', overlay_text: 'Sesame tofu bowls', description: '', alt: 'Sesame tofu bowl template sample', hashtags: [], primary_keyword: '', board_suggestion: '', why_it_works: '', image_prompt: '', image_url: samplePhoto, palette: 'brand' };
type Provider = 'magic-hour' | 'pixazo';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const toBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] ?? ''); reader.onerror = reject; reader.readAsDataURL(blob); });

export function PinterestStudioPanel() {
  const [type, setType] = useState<PinSourceType>('recipe');
  const [sources, setSources] = useState<Record<string, PinSource[]>>({});
  const [loading, setLoading] = useState(true);
  const [sourceId, setSourceId] = useState('');
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [angle, setAngle] = useState('');
  const [count, setCount] = useState(3);
  const [auto, setAuto] = useState(true);
  const [layout, setLayout] = useState<PinLayoutId>('double-split');
  const [photoMode, setPhotoMode] = useState<'existing' | 'generate'>('existing');
  const [provider, setProvider] = useState<Provider | ''>('');
  const [providers, setProviders] = useState<Awaited<ReturnType<typeof getPinProviders>>>([]);
  const [pins, setPins] = useState<PinArtwork[]>([]);
  const [active, setActive] = useState(0);
  const [included, setIncluded] = useState<number[]>([]);
  const [destination, setDestination] = useState('');
  const [heading, setHeading] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [connections, setConnections] = useState(false);
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof adminListSettings>>>([]);
  const jobs = useRef<string[]>([]);
  const stopped = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const targetSlot = useRef<'image_url' | 'secondary_image_url' | 'tertiary_image_url'>('image_url');
  const objectUrls = useRef<string[]>([]);
  useEffect(() => () => { stopped.current = true; objectUrls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  const load = () => {
    setLoading(true);
    listPinSources().then(setSources).catch(e => setError(e.message)).finally(() => setLoading(false));
    getPinProviders().then(setProviders).catch(e => setError(e.message));
  };
  useEffect(load, []);
  const selected = (sources[type] ?? []).find(row => row.id === sourceId);
  const current = pins[active];
  const patch = (change: Partial<PinArtwork>) => setPins(rows => rows.map((row, index) => index === active ? { ...row, ...change } : row));
  const photo = async (index: number, prompt: string, slot: 'image_url' | 'secondary_image_url' | 'tertiary_image_url' = 'image_url', label = '') => {
    setStage(`Pin ${index + 1} of ${count}${label}`);
    const job = await startPinPhoto({ data: { prompt, provider: provider || undefined } });
    jobs.current.push(job.id);
    while (!stopped.current) {
      const result = await pollPinPhoto({ data: { id: job.id } });
      if (stopped.current) break;
      if (result.status === 'failed') throw new Error(result.error || 'Image generation could not complete.');
      if (result.status === 'cancelled') return;
      if (result.status === 'complete') {
        setPins(rows => rows.map((row, i) => i === index ? { ...row, [slot]: result.image_url, ...(slot === 'image_url' ? { storage_path: result.storage_path } : {}), provider: result.provider, credits: result.credits } : row));
        return;
      }
      await delay(3000);
    }
  };
  const generate = async () => {
    setBusy(true); setError(''); setNotice(''); stopped.current = false; jobs.current = [];
    try {
      setStage('Reading your content and writing pin headlines…');
      const result = await generatePinsFromSource({ data: { type, id: sourceId || undefined, subject, angle, count, layouts: [layout], automaticStyle: auto, imageMode: photoMode } });
      if (stopped.current) return;
      const artwork = result.pins.map(pin => ({ ...pin, image_url: pin.image_url || (type === 'product' ? cookbookPhoto : type === 'free' ? freePhoto : null), palette: 'brand' as const }));
      setPins(artwork); setActive(0); setIncluded(artwork.map((_, i) => i)); setHeading(result.subject); setDestination(result.link ?? '');
      if (photoMode === 'generate') for (let i = 0; i < artwork.length && !stopped.current; i++) {
        const prompts = (artwork[i] as { photo_prompts?: string[] }).photo_prompts ?? [artwork[i].image_prompt];
        const slots = ['image_url', 'secondary_image_url', 'tertiary_image_url'] as const;
        for (let p = 0; p < prompts.length && p < 3 && !stopped.current; p++) await photo(i, prompts[p]!, slots[p], prompts.length > 1 ? ` · photo ${p + 1} of ${prompts.length}` : '');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not complete your pin set.'); }
    finally { setBusy(false); setStage(''); }
  };
  const stop = async () => {
    stopped.current = true; setStage('Stopping…');
    await Promise.all(jobs.current.map(id => cancelPinPhoto({ data: { id } }).catch(() => undefined)));
    setNotice('Stopped. Completed pins remain available. Provider work already submitted may still be billed.');
  };
  const download = async () => {
    if (!current) return;
    try {
      const url = URL.createObjectURL(await exportPin(current));
      const a = document.createElement('a'); a.href = url; a.download = `planted-simple-pin-${active + 1}.png`; a.click(); URL.revokeObjectURL(url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Download failed.'); }
  };
  const save = async () => {
    setSaving(true); setError('');
    try {
      const url = new URL(destination);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Enter a valid destination link.');
      const finished = [];
      for (const index of included) {
        const pin = pins[index]; if (!pin) continue;
        const uploaded = await uploadPinArtwork({ data: { base64: await toBase64(await exportPin(pin)) } });
        finished.push({ ...pin, ...uploaded, photo_url: pin.image_url });
      }
      const result = await savePinPreviews({ data: { subject: heading, link: destination, pins: finished } });
      setNotice(`${result.saved} finished pins sent to approvals. Open Publish & Schedule to choose a board.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save pins.'); }
    finally { setSaving(false); }
  };
  const openConnections = () => { setConnections(true); adminListSettings().then(setSettings).catch(e => setError(e.message)); };
  const ready = type === 'custom' ? subject.trim().length > 3 : Boolean(sourceId);
  const useSource = () => {
    const title = selected?.title || subject;
    if (!title.trim()) return;
    const image = selected?.image_url || (type === 'product' ? cookbookPhoto : type === 'free' ? freePhoto : null);
    const rows = Array.from({ length: count }, (_, index) => ({ ...preview, title, overlay_text: title, description: selected?.summary ?? '', alt: title, style: auto ? PIN_LAYOUTS[index % PIN_LAYOUTS.length]?.id ?? layout : layout, image_url: image, secondary_image_url: null, image_prompt: photoPrompts('hero-card', title)[0] ?? title, why_it_works: '' }));
    setPins(rows); setActive(0); setIncluded(rows.map((_, i) => i)); setHeading(title); setDestination(selected?.url ?? ''); setError('');
  };
  return <div className="min-w-0 space-y-5 text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
      <div><p className="mb-1 text-xs font-medium text-muted-foreground">CREATE / PINTEREST</p><h2 className="text-2xl font-semibold">Pin Studio<span className="ml-2 text-primary">.</span></h2></div>
      <Button variant="outline" onClick={openConnections}><Settings2 /> Connections</Button>
    </header>
    {error && <div role="alert" className="flex items-start justify-between gap-3 rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive"><span>{error}</span><Button variant="ghost" size="icon" aria-label="Dismiss error" onClick={() => setError('')}><X /></Button></div>}
    {notice && <p role="status" className="rounded-md bg-secondary p-3 text-sm text-secondary-foreground">{notice}</p>}
    <div className="grid min-w-0 gap-0 overflow-hidden rounded-lg border border-border bg-card xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="min-w-0 border-b border-border p-5 xl:border-b-0 xl:border-r">
        <div className="mb-5 flex flex-wrap gap-1" aria-label="Content type">{TYPES.map(item => <Button key={item.id} size="sm" variant={type === item.id ? 'default' : 'ghost'} onClick={() => { setType(item.id); setSourceId(item.id === 'free' ? 'free-cookbook' : ''); }}><item.icon />{item.title}</Button>)}</div>
        <div className="space-y-5">
          <div><div className="mb-2 flex items-center justify-between"><label className="text-sm font-semibold" htmlFor="pin-source">Content</label><Button size="icon" variant="ghost" title="Refresh content" aria-label="Refresh content" onClick={load}><RefreshCw /></Button></div>
            {type === 'custom' ? <input id="pin-source" className={field} placeholder="Your topic or recipe title" value={subject} onChange={e => setSubject(e.target.value)} /> : <>
              <input aria-label="Search content" className={`${field} mb-2`} placeholder="Search your library" value={query} onChange={e => setQuery(e.target.value)} />
              <select id="pin-source" className={field} value={sourceId} onChange={e => setSourceId(e.target.value)}><option value="">{loading ? 'Loading content…' : 'Choose content'}</option>{(sources[type] ?? []).filter(row => row.title.toLowerCase().includes(query.toLowerCase())).map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select>
              {selected && <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{selected.summary}</p>}
            </>}
          </div>
          <div><label className="mb-2 block text-sm font-semibold" htmlFor="pin-angle">Hook / angle <span className="font-normal text-muted-foreground">optional</span></label><input id="pin-angle" className={field} placeholder="Quick weeknight meals, pantry staples…" value={angle} onChange={e => setAngle(e.target.value)} /></div>
          <div><div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">Pin style</span><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} className="accent-primary" />Smart pick</label></div>
            <div className="grid grid-cols-3 gap-2">{PIN_LAYOUTS.map(item => <Button key={item.id} variant="ghost" aria-pressed={!auto && layout === item.id} title={item.note} onClick={() => { setLayout(item.id); setAuto(false); }} className={`h-auto min-w-0 flex-col gap-2 whitespace-normal rounded-md border p-2 ${!auto && layout === item.id ? 'border-primary bg-secondary/40' : 'border-border'}`}><div className="pointer-events-none w-full"><PinCanvas pin={{ ...preview, style: item.id, secondary_image_url: item.id === 'hero-card' || item.id === 'checklist' ? null : freePhoto }} /></div><span className="text-center text-[10px] leading-tight">{item.name}</span></Button>)}</div>
          </div>
          <div><label className="mb-2 block text-sm font-semibold" htmlFor="photo-mode">Photography</label><select id="photo-mode" className={field} value={photoMode} onChange={e => setPhotoMode(e.target.value === 'generate' ? 'generate' : 'existing')}><option value="existing">Use content photography</option><option value="generate">Generate new photography</option></select>
            {photoMode === 'generate' && <select aria-label="Image provider" className={`${field} mt-2`} value={provider} onChange={e => setProvider(e.target.value as Provider | '')}><option value="">Automatic fallback</option>{providers.map(row => <option key={row.id} value={row.id} disabled={!row.configured}>{row.name}{row.configured ? '' : ' · not connected'}</option>)}</select>}
          </div>
          <div className="flex items-center justify-between"><label htmlFor="pin-count" className="text-sm font-semibold">Variants</label><input id="pin-count" type="number" min="1" max="5" className={`${field} w-20`} value={count} onChange={e => setCount(Math.min(5, Math.max(1, Number(e.target.value) || 1)))} /></div>
          <Button className="w-full" disabled={!ready || busy || saving || (photoMode === 'generate' && !providers.some(row => row.configured))} onClick={generate}>{busy ? <Loader2 className="animate-spin" /> : <Wand2 />}{busy ? 'Creating pins…' : `Create ${count} pins`}</Button>
          <Button variant="outline" className="w-full" disabled={!ready || busy || saving} onClick={useSource}>Use source title · no AI</Button>
          {busy && <div className="space-y-2"><p role="status" className="text-xs text-muted-foreground">{stage}</p><Button variant="outline" className="w-full" onClick={stop}><Square /> Stop</Button></div>}
        </div>
      </aside>
      <main className="min-w-0 bg-muted/35 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{pins.length ? 'Your pin collection' : 'Style preview'}</h3><p className="mt-1 text-xs text-muted-foreground">{pins.length ? `${pins.length} variants · ${included.length} selected` : 'Recipe headline · 1000 × 1778'}</p></div><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Download selected pin" title="Download PNG" onClick={download} disabled={!current?.image_url || busy}><Download /></Button><Button disabled={!included.length || busy || saving || included.some(i => !pins[i]?.image_url)} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <Check />}Send to approvals</Button></div></div>
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <div className="mx-auto max-w-[360px] shadow-card">{current?.image_url ? <PinCanvas pin={current} /> : current ? <div className="grid aspect-[9/16] place-items-center bg-muted p-6 text-center"><div><ImagePlus className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-sm">Add a photo or generate photography</p><Button variant="outline" className="mt-3" onClick={() => { targetSlot.current = 'image_url'; fileRef.current?.click(); }}><ImagePlus />Add photo</Button></div></div> : <PinCanvas pin={{ ...preview, style: layout, secondary_image_url: freePhoto }} />}</div>
            {pins.length > 0 && <div className="mt-5 grid grid-cols-5 gap-2">{pins.map((pin, index) => <div key={index} className="min-w-0"><Button aria-label={`Edit pin ${index + 1}`} variant="ghost" onClick={() => setActive(index)} className={`h-auto w-full overflow-hidden border-2 p-0 ${active === index ? 'border-primary' : 'border-transparent'}`}>{pin.image_url ? <PinCanvas pin={pin} /> : <div className="grid aspect-[9/16] w-full place-items-center bg-muted"><ImagePlus /></div>}</Button><label className="mt-2 flex justify-center gap-1 text-xs"><input type="checkbox" aria-label={`Include pin ${index + 1}`} checked={included.includes(index)} onChange={() => setIncluded(rows => rows.includes(index) ? rows.filter(i => i !== index) : [...rows, index])} className="accent-primary" />{index + 1}</label></div>)}</div>}
          </div>
          <div className="min-w-0 space-y-4 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <h4 className="text-sm font-semibold">{current ? `Edit pin ${active + 1}` : 'The food comes first.'}</h4>
            {!current ? <p className="text-sm leading-relaxed text-muted-foreground">Planted &amp; Simple<br />Photo-led recipes, useful stories, and readable headlines.</p> : <>
              <Field label="Italic hook" value={current.hook ?? ''} onChange={value => patch({ hook: value.slice(0, 60) })} />
              <Field label="Headline (shown in capitals)" value={current.overlay_text} onChange={value => patch({ overlay_text: value })} />
              <Field label="Pill badge" value={current.pill ?? ''} onChange={value => patch({ pill: value.slice(0, 32) })} />
              {current.style === 'checklist' && [0, 1, 2].map(i => <Field key={i} label={`Checklist point ${i + 1}`} value={current.bullets?.[i] ?? ''} onChange={value => { const bullets = [...(current.bullets ?? ['', '', ''])]; bullets[i] = value.slice(0, 40); patch({ bullets }); }} />)}
              {current.angle && <p className="text-xs text-muted-foreground">Angle: {current.angle}</p>}
              <label className="block text-xs font-medium">Layout<select className={`${field} mt-2`} value={current.style} onChange={e => patch({ style: e.target.value })}>{PIN_LAYOUTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <div className="flex gap-2" aria-label="Pin palette">{(['brand', 'paper', 'berry'] as const).map(palette => <Button key={palette} size="icon" variant={current.palette === palette ? 'default' : 'outline'} aria-label={`${palette} palette`} title={`${palette} palette`} onClick={() => patch({ palette })}><span className={`h-4 w-4 rounded-full pin-swatch-${palette}`} /></Button>)}</div>
              <div className="flex flex-wrap gap-2">{(['image_url', 'secondary_image_url', 'tertiary_image_url'] as const).slice(0, photosFor(current.style)).map((slot, i) => <Button key={slot} variant="outline" size="sm" onClick={() => { targetSlot.current = slot; fileRef.current?.click(); }}><ImagePlus />{['Top photo', i === 1 && photosFor(current.style) === 2 ? 'Bottom photo' : 'Photo 2', 'Photo 3'][i]}</Button>)}</div>
              <Field label="Pinterest title" value={current.title} onChange={value => patch({ title: value.slice(0, 100) })} />
              <label className="block text-xs font-medium">Description<textarea className={`${field} mt-2 min-h-28`} value={current.description} onChange={e => patch({ description: e.target.value })} /></label>
              <Field label="Alt text" value={current.alt} onChange={value => patch({ alt: value })} />
              <Field label="Hashtags" value={current.hashtags.join(' ')} onChange={value => patch({ hashtags: value.split(/\s+/).filter(Boolean) })} />
              <Field label="Destination" value={destination} onChange={setDestination} />
              <p className="text-xs leading-relaxed text-muted-foreground">{current.why_it_works}</p>
              {current.provider && <p className="text-xs text-muted-foreground">Photography: {current.provider}{current.credits != null ? ` · ${current.credits} provider credits` : ' · cost reported by provider'}</p>}
              <Button variant="ghost" size="sm" onClick={() => { setPins([]); setIncluded([]); }} disabled={busy}><Trash2 />Discard set</Button>
            </>}
          </div>
        </div>
      </main>
    </div>
    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => {
      const file = e.target.files?.[0]; if (!file || !current) return;
      if (file.size > 20 * 1024 * 1024) { setError('Choose a photo smaller than 20 MB.'); return; }
      const url = URL.createObjectURL(file); objectUrls.current.push(url);
      patch({ [targetSlot.current]: url }); e.target.value = '';
    }} />
    <Dialog open={connections} onOpenChange={setConnections}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogTitle>Image connections</DialogTitle><p className="text-sm text-muted-foreground">Magic Hour → Pixazo → Gemini. Connected backups take over on temporary provider failures. Provider usage is billed separately.</p>
      {['MAGIC_HOUR_API_KEY', 'PIXAZO_API_KEY'].map(key => <div key={key} className="space-y-2 border-t border-border pt-4"><label className="text-sm font-semibold" htmlFor={key}>{key === 'MAGIC_HOUR_API_KEY' ? 'Magic Hour' : 'Pixazo'}</label><p className="text-xs text-muted-foreground">{settings.find(row => row.key === key)?.source === 'missing' ? 'Not connected' : settings.find(row => row.key === key)?.masked ? 'Key saved securely' : 'Checking connection…'}</p><input id={key} type="password" className={field} autoComplete="off" placeholder="Private API key" value={keyValues[key] ?? ''} onChange={e => setKeyValues(rows => ({ ...rows, [key]: e.target.value }))} /><Button disabled={saving || !keyValues[key]?.trim()} onClick={async () => { setSaving(true); try { await adminSaveSetting({ data: { key, value: keyValues[key] ?? '' } }); setKeyValues(rows => ({ ...rows, [key]: '' })); setSettings(await adminListSettings()); setProviders(await getPinProviders()); setNotice('Image provider key saved securely.'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save key.'); } finally { setSaving(false); } }}>Save connection</Button></div>)}
      <p className="text-xs text-muted-foreground">Gemini uses your existing key and selected image model in Settings. Permission denials, billing blocks, and safety refusals need attention rather than hidden retries.</p>
    </DialogContent></Dialog>
  </div>;
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-xs font-medium">{label}<input className={`${field} mt-2`} value={value} onChange={e => onChange(e.target.value)} /></label>; }
