import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImageOff, Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Item = { image: HTMLImageElement; parent: HTMLElement; status: 'loading' | 'error' };

/** Covers authored HTML and React images alike, without eagerly loading lazy images. */
export function ImageLoadingStates() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    const root = document.querySelector('.ghost-shell-root');
    if (!root) return;
    const tracked = new Map<HTMLImageElement, () => void>();
    const near = new Set<HTMLImageElement>();
    let active = true;
    const update = (image: HTMLImageElement, status: 'idle' | 'ready' | 'loading' | 'error') => {
      const parent = image.parentElement;
      if (!parent || !active) return;
      image.dataset.mediaState = status;
      parent.classList.add('media-state-host');
      setItems(previous => {
        const old = previous.find(x => x.image === image);
        if (old?.status === status) return previous;
        const rest = previous.filter(x => x.image !== image && x.image.isConnected);
        return status === 'loading' || status === 'error' ? [...rest, { image, parent, status }] : old ? rest : previous;
      });
    };
    const sync = (image: HTMLImageElement) => {
      if (!image.getAttribute('src')) return update(image, 'idle');
      if (image.complete) return update(image, image.naturalWidth > 0 ? 'ready' : 'error');
      update(image, image.loading !== 'lazy' || near.has(image) ? 'loading' : 'idle');
    };
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      const image = entry.target as HTMLImageElement;
      if (entry.isIntersecting) near.add(image); else near.delete(image);
      sync(image);
    }), { rootMargin: '200px' });
    const scan = () => {
      root.querySelectorAll<HTMLImageElement>('img').forEach(image => {
        if (tracked.has(image)) return;
        const loaded = () => update(image, 'ready');
        const failed = () => update(image, 'error');
        image.addEventListener('load', loaded);
        image.addEventListener('error', failed);
        tracked.set(image, () => { image.removeEventListener('load', loaded); image.removeEventListener('error', failed); });
        io.observe(image);
        sync(image);
      });
      tracked.forEach((cleanup, image) => { if (!image.isConnected) { cleanup(); io.unobserve(image); tracked.delete(image); near.delete(image); } });
    };
    const observer = new MutationObserver(records => {
      if (records.some(r => r.type === 'childList' && [...r.addedNodes, ...r.removedNodes].some(node => node instanceof Element && (node.matches('img') || node.querySelector('img'))))) scan();
      records.forEach(r => { if (r.type === 'attributes' && r.target instanceof HTMLImageElement) sync(r.target); });
    });
    scan();
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
    return () => { active = false; observer.disconnect(); io.disconnect(); tracked.forEach(cleanup => cleanup()); };
  }, []);
  return <>{items.map(({ image, parent, status }, index) => createPortal(
    <div className="media-state-overlay absolute inset-0 z-10 grid place-items-center bg-surface-2 text-muted-fg" role={status === 'loading' ? 'status' : undefined} aria-label={status === 'loading' ? 'ছবি আসছে' : 'ছবি আসেনি'}>
      {status === 'loading' ? <Loader2 className="size-5 animate-spin motion-reduce:animate-none" /> : <div className="flex items-center gap-2"><ImageOff className="size-4" /><Button variant="ghost" size="icon" aria-label="ছবি আবার চেষ্টা করুন" title="আবার চেষ্টা করুন" onClick={() => {
        const src = image.getAttribute('src');
        if (!src) return;
        image.removeAttribute('src');
        image.setAttribute('src', src);
      }}><RotateCw className="size-4" /></Button></div>}
    </div>, parent, `${index}-${image.getAttribute('src')}`))}</>;
}