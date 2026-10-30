import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GhostShell } from '@/components/ghost/Shell';
import { AccountSupport } from '@/components/auth/AccountSupport';
import { LockKeyhole, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'নতুন পাসওয়ার্ড — Ghostae Account' },
    { name: 'description', content: 'Securely reset your Ghostae account password through a verified recovery link.' },
    { property: 'og:title', content: 'Ghostae — Reset your password' },
    { property: 'og:description', content: 'Set a new password for your Ghostae account.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const recovery = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) setReady(true);
    });
    if (recovery) void supabase.auth.getUser().then(({ data }) => { if (data.user) setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    const parsed = z.string().min(8).max(200).safeParse(password);
    if (!parsed.success || password !== confirm) { setError('অন্তত ৮ অক্ষরের একই পাসওয়ার্ড দুবার দিন।'); return; }
    if (!ready) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) setError('পাসওয়ার্ড বদলানো যায়নি। নতুন পুনরুদ্ধার লিংক নিন বা Support-এ যোগাযোগ করুন।');
    else await navigate({ to: '/dashboard' });
  }
  return <GhostShell><main className="account-typography mx-auto max-w-md py-12">
    <LockKeyhole className="mb-4 size-8 text-primary" /><h1 className="text-2xl font-medium">নতুন পাসওয়ার্ড</h1>
    {ready ? <form onSubmit={submit} className="my-6 space-y-4">
      <label className="block text-sm">পাসওয়ার্ড<input type="password" autoComplete="new-password" required minLength={8} maxLength={200} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-border bg-surface px-3" /></label>
      <label className="block text-sm">আবার পাসওয়ার্ড দিন<input type="password" autoComplete="new-password" required minLength={8} maxLength={200} value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-2 h-12 w-full rounded-md border border-border bg-surface px-3" /></label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button disabled={busy} className="h-12 w-full">{busy && <Loader2 className="size-4 animate-spin" />}পাসওয়ার্ড সংরক্ষণ করুন</Button>
    </form> : <div className="my-6 space-y-4"><p className="text-sm leading-7 text-muted-fg">ইমেইলের পুনরুদ্ধার লিংক থেকে এই পেজ খুলুন। লিংকের মেয়াদ শেষ হলে নতুন লিংক নিন।</p><Button asChild variant="outline"><Link to="/auth">Find your account</Link></Button></div>}
    <AccountSupport />
  </main></GhostShell>;
}