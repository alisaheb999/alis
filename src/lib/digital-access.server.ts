import { getCookie, setCookie, setResponseHeader } from '@tanstack/react-start/server';

export async function hashAccess(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

export async function digitalBrowserAccess(create = false) {
  setResponseHeader('Cache-Control', 'no-store');
  let token = getCookie('ghost_digital_access');
  if (!token && create) {
    token = crypto.randomUUID() + crypto.randomUUID();
    setCookie('ghost_digital_access', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  }
  return token ? hashAccess(token) : null;
}