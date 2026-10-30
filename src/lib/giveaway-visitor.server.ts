import { getCookie, getRequest, setCookie, setResponseHeader } from '@tanstack/react-start/server';
import { GIVEAWAY_COOKIE, validGiveawayVisitor } from './giveaway-identity';
export function giveawayVisitor(create = false): string | null {
  setResponseHeader('Cache-Control', 'private, no-store');
  const previous = validGiveawayVisitor(getCookie(GIVEAWAY_COOKIE));
  if (previous || !create) return previous;
  const id = crypto.randomUUID();
  setCookie(GIVEAWAY_COOKIE, id, { httpOnly: true, sameSite: 'strict', secure: new URL(getRequest().url).protocol === 'https:', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return id;
}
