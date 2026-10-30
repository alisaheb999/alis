import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

export const findAccount = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => z.object({ contact: z.string().trim().min(5).max(255) }).parse(input))
  .handler(async ({ data }) => {
    const request = getRequest();
    const g = await import('./ghost-api.server');
    const meta = g.clientMeta(request);
    if (!g.rateLimit(`account-recovery:${meta.ip ?? 'anon'}`, 3, 60_000).allowed) throw new Error('একটু অপেক্ষা করে আবার চেষ্টা করুন।');
    const email = z.string().email().max(255).safeParse(data.contact);
    if (!email.success) return { channel: 'support' as const };
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error('এই মুহূর্তে পুনরুদ্ধার সম্ভব হচ্ছে না। Support-এ যোগাযোগ করুন।');
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const origin = new URL(request.url).origin;
    const { error } = await client.auth.resetPasswordForEmail(email.data.toLowerCase(), { redirectTo: `${origin}/reset-password` });
    if (error) throw new Error('এই মুহূর্তে লিংক পাঠানো যাচ্ছে না। Support-এ যোগাযোগ করুন।');
    return { channel: 'email' as const };
  });