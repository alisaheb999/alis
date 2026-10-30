import gemini from '@/assets/live/gemini.jpg';
import chatgptGo from '@/assets/live/chatgpt-go.jpg';
import chatgptPlus from '@/assets/mockups/chatgpt-plus.jpg';
import duolingo from '@/assets/live/duolingo.jpg';
import appleMusic from '@/assets/live/apple-music.jpg';
import coursera from '@/assets/live/coursera.jpg';
import prime from '@/assets/live/prime-video.jpg';
import wispr from '@/assets/live/wispr.jpg';
import lovable from '@/assets/live/lovable.jpg';
import muse from '@/assets/live/muse.jpg';
import spotify from '@/assets/live/spotify.jpg';
import ilovepdf from '@/assets/live/ilovepdf.jpg';
import udemy from '@/assets/live/udemy.jpg';
import grammarly from '@/assets/live/grammarly.jpg';

// Ghost-mascot artwork matching the approved digital mockups; checked in order.
const ART: Array<[RegExp, string]> = [
  [/chatgpt\s*plus/i, chatgptPlus], [/chatgpt/i, chatgptGo], [/coursera/i, coursera], [/gemini/i, gemini],
  [/duolingo/i, duolingo], [/apple music/i, appleMusic], [/prime video/i, prime], [/wispr/i, wispr],
  [/lovable/i, lovable], [/muse/i, muse], [/spotify/i, spotify], [/ilovepdf/i, ilovepdf], [/udemy/i, udemy], [/grammarly/i, grammarly],
];
export const liveArtSrc = (name: string) => ART.find(([re]) => re.test(name))?.[1];

// Ghostae-branded artwork generated from the product name, so supplier images are never shown.
const BRANDS: Array<[RegExp, string, string]> = [
  [/chatgpt/i, 'ChatGPT', 'oklch(0.62 0.13 165)'],
  [/lovable/i, 'Lovable', 'oklch(0.65 0.2 20)'],
  [/spotify/i, 'Spotify', 'oklch(0.68 0.19 150)'],
  [/apple music/i, 'Apple Music', 'oklch(0.63 0.22 15)'],
  [/duolingo/i, 'Duolingo', 'oklch(0.72 0.2 135)'],
  [/coursera/i, 'Coursera', 'oklch(0.55 0.19 260)'],
  [/gemini/i, 'Gemini', 'oklch(0.62 0.19 255)'],
  [/prime video/i, 'Prime Video', 'oklch(0.66 0.15 230)'],
  [/wispr/i, 'Wispr Flow', 'oklch(0.6 0.12 290)'],
  [/muse/i, 'Muse AI', 'oklch(0.62 0.2 310)'],
  [/ilovepdf/i, 'iLovePDF', 'oklch(0.6 0.21 25)'],
  [/udemy/i, 'Udemy', 'oklch(0.55 0.22 295)'],
  [/grammarly/i, 'Grammarly', 'oklch(0.6 0.13 170)'],
  [/capcut/i, 'CapCut', 'oklch(0.7 0.02 260)'],
  [/netflix/i, 'Netflix', 'oklch(0.58 0.23 27)'],
  [/grok/i, 'Grok', 'oklch(0.7 0.01 260)'],
];

export function liveBrand(name: string) {
  const hit = BRANDS.find(([re]) => re.test(name));
  return { brand: hit?.[1] ?? name.split(/\s+/).slice(0, 2).join(' '), tint: hit?.[2] ?? 'oklch(0.6 0.18 260)' };
}

function planLabel(name: string) {
  const m = name.match(/(\d+)\s*(month|months|m\b|day|days|year)/i) || name.match(/(\d+)\s*(B)\s*token/i);
  if (!m) return /plus/i.test(name) ? 'PLUS' : 'PRO';
  const n = m[1]; const u = m[2].toLowerCase();
  if (u.startsWith('day')) return `${n} দিন`;
  if (u.startsWith('year')) return `${n} বছর`;
  if (u === 'b') return `${n}B টোকেন`;
  return `${n} মাস`;
}

export function LiveArt({ name, className = '' }: { name: string; className?: string }) {
  const src = liveArtSrc(name);
  if (src) return <img src={src} alt="" width={1264} height={848} loading="lazy" decoding="async" className={`object-cover ${className}`} />;
  const { brand, tint } = liveBrand(name);
  return <div aria-hidden="true" className={`live-art relative overflow-hidden ${className}`} style={{ ['--tint' as string]: tint }}>
    <div className="absolute inset-0 flex flex-col justify-center px-[8%]">
      <span className="live-art-brand font-black leading-none tracking-tight">{brand}</span>
      <span className="live-art-chip mt-[6%] w-fit rounded px-[5%] py-[2%] font-bold">{planLabel(name)}</span>
    </div>
    <img src="/web-app-manifest-192x192.png" alt="" width={192} height={192} loading="lazy" className="absolute bottom-[6%] right-[5%] w-[24%] rounded-[22%] opacity-95" />
  </div>;
}
