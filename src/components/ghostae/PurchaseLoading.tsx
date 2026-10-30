import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

export function PurchaseLoading() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;
  return createPortal(<div className="payment-overlay fixed inset-0 z-[2147483600] grid place-items-center" role="status" aria-live="polite"><div className="account-typography flex items-center gap-3 rounded-lg border border-border bg-surface px-5 py-4 text-sm text-foreground"><Loader2 className="size-5 animate-spin motion-reduce:animate-none text-primary"/>পেমেন্ট খুলছে…</div></div>, document.body);
}