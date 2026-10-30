import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { findAccount } from '@/lib/account-access.functions';
import { Loader2, ArrowUp } from 'lucide-react';
import { lovable } from '@/integrations/lovable';

export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Ghostae Account — Sign In & Licences' },
      { name: 'description', content: 'Sign in to your Ghostae account to access your purchased creative products and licences.' },
      { property: 'og:title', content: 'Ghostae Account — Sign In & Licences' },
      { property: 'og:description', content: 'Access your Ghostae purchases and creative licences from your account.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { mode?: 'create' | 'login'; redirect?: string } => ({
    mode: search.mode === 'create' ? 'create' : undefined,
    redirect: typeof search.redirect === 'string' && search.redirect.startsWith('/') && !search.redirect.startsWith('//') ? search.redirect : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const params = Route.useSearch();
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState<'login' | 'create' | 'find'>(params.mode === 'create' ? 'create' : 'login');
  const navigate = useNavigate();
  const recover = useServerFn(findAccount);
  const typed = useTypewriter();
  useEffect(() => {
    const saved = sessionStorage.getItem('ghostae-purchase-email');
    if (saved) setContact(saved);
    const goToOwnedAccount = (email: string | undefined) => {
      if (saved && email?.toLowerCase() !== saved.toLowerCase()) return;
      sessionStorage.removeItem('ghostae-purchase-email');
      void navigate({ to: '/dashboard' });
    };
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) goToOwnedAccount(session.user.email);
    });
    void supabase.auth.getUser().then(({ data }) => { if (data.user) goToOwnedAccount(data.user.email); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);
  function changeMode(next: typeof mode) { setMode(next); setError(''); setNotice(''); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    const parsed = z.string().trim().min(5).max(255).safeParse(contact);
    if (!parsed.success) { setError('সঠিক ইমেইল বা মোবাইল নম্বর দিন।'); return; }
    if (mode !== 'find' && !z.string().min(mode === 'create' ? 8 : 1).max(200).safeParse(password).success) { setError('অন্তত ৮ অক্ষরের পাসওয়ার্ড দিন।'); return; }
    setLoading(true);
    try {
      if (mode === 'find') {
        const result = await recover({ data: { contact: parsed.data } });
        setNotice(result.channel === 'email' ? 'এই ইমেইলে অ্যাকাউন্ট থাকলে পুনরুদ্ধার লিংক পাবেন। Inbox ও Spam দেখুন।' : 'মোবাইল নম্বরের মালিকানা যাচাই করে অ্যাকাউন্ট পেতে Support-এ যোগাযোগ করুন।');
      } else {
        const email = z.string().email().safeParse(parsed.data);
        if (!email.success) {
          const phone = parsed.data.replace(/[\s()-]/g, '');
          if (!/^\+?\d{10,15}$/.test(phone) || mode === 'create') { setError('অ্যাকাউন্ট তৈরিতে নিজের ইমেইল দিন। শুধু নম্বরে কেনা হলে Find your account থেকে Support নিন।'); return; }
          const normalized = phone.startsWith('+') ? phone : phone.startsWith('0') ? `+88${phone}` : `+${phone}`;
          const { error } = await supabase.auth.signInWithPassword({ phone: normalized, password });
          if (error) { setError('ইমেইল/নম্বর বা পাসওয়ার্ড মেলেনি। Find your account দিয়ে আবার চেষ্টা করুন।'); return; }
          await navigate({ to: '/dashboard' });
        } else if (mode === 'create') {
          const { data, error } = await supabase.auth.signUp({ email: email.data.toLowerCase(), password, options: { emailRedirectTo: `${window.location.origin}/auth` } });
          if (error) { setError('অ্যাকাউন্ট তৈরি করা যায়নি। আগে অ্যাকাউন্ট থাকলে Find your account ব্যবহার করুন।'); return; }
          if (data.session) await navigate({ to: '/dashboard' });
          else setNotice('ইমেইলের যাচাই লিংক খুলে অ্যাকাউন্ট নিশ্চিত করুন। তারপর আপনার পণ্য দেখতে লগইন করুন। আগে অ্যাকাউন্ট থাকলে Find your account ব্যবহার করুন।');
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email: email.data.toLowerCase(), password });
          if (error) { setError('ইমেইল/নম্বর বা পাসওয়ার্ড মেলেনি। Find your account দিয়ে আবার চেষ্টা করুন।'); return; }
          await navigate({ to: '/dashboard' });
        }
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'আবার চেষ্টা করুন বা Support-এ যোগাযোগ করুন।'); }
    finally { setLoading(false); }
  }
  async function google() {
    setError(''); setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/auth`, extraParams: { prompt: 'select_account' } });
    if (result.error) { setError('Google দিয়ে লগইন হয়নি। আবার চেষ্টা করুন।'); setLoading(false); return; }
    if (result.redirected) return;
    setLoading(false); await navigate({ to: '/dashboard' });
  }
  const title = mode === 'find' ? 'Find your account' : mode === 'create' ? 'Create your account' : 'Log in';
  return <main className="gx-login">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" />
    <style>{GX_CSS}</style>
    <div className="gx-left">
      <Link to="/" aria-label="Ghostae home" className="gx-logo"><img src="/web-app-manifest-192x192.png" alt="Ghostae" /></Link>
      <h1 className="gx-title">{mode === 'login' ? 'Log in to Ghostae' : title}</h1>
      <p className="gx-sub">AI tools for Premiere & After Effects.</p>
      {mode !== 'find' && <>
        <div className="gx-social">
          <button type="button" onClick={google} disabled={loading} className="gx-auth-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.9 10.9 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>
        </div>
        <div className="gx-or">OR</div>
      </>}
      <form onSubmit={submit} className="gx-form">
        <label className="gx-label" htmlFor="account-contact">Email</label>
        <input id="account-contact" autoComplete="username" required maxLength={255} value={contact} onChange={e => setContact(e.target.value)} placeholder="name@domain.com" className="gx-input" />
        {mode !== 'find' && <>
          <label className="gx-label gx-label-row" htmlFor="account-password">Password{mode === 'login' && <button type="button" onClick={() => changeMode('find')}>Forgot password?</button>}</label>
          <input id="account-password" type="password" placeholder="Password" autoComplete={mode === 'create' ? 'new-password' : 'current-password'} required minLength={mode === 'create' ? 8 : 1} maxLength={200} value={password} onChange={e => setPassword(e.target.value)} className="gx-input" />
        </>}
        {error && <p role="alert" className="gx-error">{error}</p>}
        {notice && <p role="status" className="gx-notice">{notice}</p>}
        <button disabled={loading} className="gx-continue">{loading ? <Loader2 className="size-4 animate-spin" style={{ margin: '0 auto' }} /> : mode === 'find' ? 'Find account' : mode === 'create' ? 'Create account' : 'Continue'}</button>
      </form>
      <div className="gx-foot">{mode === 'login' ? <>Don't have an account? <button type="button" onClick={() => changeMode('create')}>Create your account</button></> : <>Already have an account? <button type="button" onClick={() => changeMode('login')}>Log in</button></>}</div>
    </div>
    <div className="gx-right">
      <div className="gx-pan"><img src={STAGE_IMG} alt="Ghostae AI Motion Graphics" /></div>
      <div className="gx-prompt"><span>{typed}</span><Link to="/products" aria-label="Explore Ghostae" className="gx-prompt-btn"><ArrowUp className="size-[13px]" /></Link></div>
    </div>
  </main>;
}

const STAGE_IMG = 'https://cdn.jumpshare.com/preview/At7lSkoxhhSDzEINOvizvuLWuk9KAeqmON1BwNFOBomZE9Co1BvKm-Sk4yt21M3qn_R3nt6GhkPEXpcg1bDlmqeJAc5XR_huCiLjjdu-7MA-4h3unfsVFOq8J';
const PROMPTS = ['Ask Ghostae Text for AE titles...', 'Run Ghostae Caption AI workflow...', 'Generate After Effects motion script...', 'Optimize timeline with Cache Light...'];

function useTypewriter() {
  const [text, setText] = useState('');
  useEffect(() => {
    let i = 0, c = 0, del = false, t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const p = PROMPTS[i];
      c += del ? -1 : 1; setText(p.substring(0, c));
      let speed = del ? 40 : 80;
      if (!del && c === p.length) { speed = 2000; del = true; }
      else if (del && c === 0) { del = false; i = (i + 1) % PROMPTS.length; speed = 500; }
      t = setTimeout(tick, speed);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  return text;
}

const GX_CSS = `
.gx-login{width:100vw;min-height:100vh;height:100vh;display:grid !important;grid-template-columns:1fr 1fr;background:#fff;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;color:#0f172a}
.gx-login *{font-family:inherit;box-sizing:border-box}
.gx-left{background:#fff;padding:40px 60px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;overflow-y:auto}
.gx-logo{width:36px;height:36px;margin-bottom:20px;display:block}.gx-logo img{width:100%;height:100%;object-fit:contain;border-radius:8px}
.gx-title{font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-.5px;margin:0 0 6px}
.gx-sub{font-size:13px;color:#64748b;margin:0 0 22px;line-height:1.4}
.gx-social{width:100%;max-width:380px;display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.gx-auth-btn{width:100%;padding:12px 16px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;display:flex;align-items:center;gap:12px;font-size:13.5px;font-weight:600;color:#1e293b;cursor:pointer;transition:all .2s;box-shadow:0 1px 2px rgba(0,0,0,.02)}
.gx-auth-btn:hover{background:#f8fafc;border-color:#cbd5e1;box-shadow:0 4px 12px rgba(0,0,0,.04)}.gx-auth-btn:disabled{opacity:.6}
.gx-or{width:100%;max-width:380px;text-align:center;margin:12px 0;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:.5px}
.gx-form{width:100%;max-width:380px}
.gx-label{display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:6px}
.gx-label-row{display:flex;justify-content:space-between}.gx-label-row button{font-size:12px;font-weight:500;color:#64748b;background:none;border:0;cursor:pointer}
.gx-input{width:100%;padding:12px 16px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;font-size:14px;color:#0f172a;outline:none;transition:all .2s;margin-bottom:14px}
.gx-input::placeholder{color:#94a3b8}.gx-input:focus{border-color:#2563eb;box-shadow:0 0 0 2px rgba(37,99,235,.12)}
.gx-continue{width:100%;padding:13px;background:#2563eb;color:#fff;border:0;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s,transform .1s;box-shadow:0 4px 12px rgba(37,99,235,.25);margin-bottom:16px}
.gx-continue:hover{background:#1d4ed8}.gx-continue:active{transform:scale(.99)}.gx-continue:disabled{opacity:.7}
.gx-error{font-size:13px;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:10px 12px;margin:0 0 14px}
.gx-notice{font-size:13px;color:#475569;background:#f1f5f9;border-radius:12px;padding:10px 12px;margin:0 0 14px}
.gx-foot{font-size:13px;color:#64748b}.gx-foot button{color:#2563eb;font-weight:600;background:none;border:0;cursor:pointer;padding:0}.gx-foot button:hover{text-decoration:underline}
.gx-right{position:relative;background:#0f172a;display:flex;align-items:center;justify-content:center;overflow:hidden;height:100%;border-top-left-radius:36px;border-bottom-left-radius:36px}
.gx-pan{position:absolute;width:185%;height:100%;display:flex;animation:gxPan 28s linear infinite alternate}
.gx-pan img{width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.92) contrast(1.05)}
@keyframes gxPan{0%{transform:translateX(-18%)}100%{transform:translateX(18%)}}
.gx-right::after{content:'';position:absolute;inset:0;background:radial-gradient(circle,rgba(15,23,42,.15) 0%,rgba(15,23,42,.45) 100%);pointer-events:none;z-index:1}
.gx-prompt{position:absolute;z-index:2;background:rgba(255,255,255,.9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.95);padding:12px 12px 12px 20px;border-radius:18px;display:flex;align-items:center;justify-content:space-between;width:380px;max-width:calc(100% - 32px);min-height:62px;box-shadow:0 25px 50px rgba(0,0,0,.35);animation:gxFloat 6s ease-in-out infinite}
@keyframes gxFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.gx-prompt span{font-size:13.5px;color:#1e293b;font-weight:500;white-space:nowrap;overflow:hidden;border-right:2px solid #2563eb;animation:gxCaret .75s step-end infinite;padding-right:2px}
@keyframes gxCaret{from,to{border-color:transparent}50%{border-color:#2563eb}}
.gx-prompt-btn{width:36px;height:36px;flex:none;background:#2563eb;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;transition:background .2s,transform .1s}
.gx-prompt-btn:hover{background:#1d4ed8;transform:scale(1.05)}
@media (max-width:900px){.gx-login{grid-template-columns:1fr;height:auto;overflow-y:auto}.gx-right{min-height:350px;border-radius:0}.gx-left{padding:40px 24px}}
`;
