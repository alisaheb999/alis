/**
 * Ghost Caption queue — server-only helpers.
 *
 * Pipeline: Ghostae Text (After Effects) -> caption job API -> job queue
 *        -> Ghost Caption Chrome Worker (browser AI) -> validated SRT -> Ghostae Text
 *
 * The backend only orchestrates jobs. Browser automation stays in the worker.
 */

export const CAPTION_BUCKET = "caption-media";
export const CAPTION_MAX_BYTES = 100 * 1024 * 1024;
export const CAPTION_LEASE_SECONDS = 900;
export const CAPTION_SIGNED_URL_SECONDS = 1800;

export type Cue = { start: number; end: number; text: string };

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Constant-time-ish comparison for the worker token. */
export function tokenMatches(supplied: string, expected: string) {
  if (!supplied || !expected || supplied.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < supplied.length; i++) diff |= supplied.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Worker auth: the token lives only in the worker installation. */
export function workerAuthorized(request: Request) {
  const expected = process.env["GHOST_CAPTION_WORKER_TOKEN"]?.trim() || "";
  if (!expected) return { ok: false as const, reason: "not_configured" };
  const supplied = (request.headers.get("x-worker-token") || "").trim();
  if (!tokenMatches(supplied, expected)) return { ok: false as const, reason: "unauthorized" };
  return { ok: true as const, reason: "ok" };
}

/* ── SRT ────────────────────────────────────────────────────────── */

function stamp(seconds: number) {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s - h * 3600) / 60);
  const sec = Math.floor(s - h * 3600 - m * 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  const p = (v: number, n = 2) => String(v).padStart(n, "0");
  return `${p(h)}:${p(m)}:${p(sec)},${p(ms, 3)}`;
}

function parseStamp(value: string): number | null {
  const m = value.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})$/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4].padEnd(3, "0")) / 1000;
}

/** Parse + validate an SRT payload. Returns cues or a reason it was rejected. */
export function parseSrt(raw: string): { ok: true; cues: Cue[]; srt: string } | { ok: false; error: string } {
  const text = String(raw || "").replace(/\r\n?/g, "\n").replace(/^\uFEFF/, "").trim();
  if (!text) return { ok: false, error: "Empty SRT payload." };

  const cues: Cue[] = [];
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const timeIndex = lines.findIndex((l) => l.includes("-->"));
    if (timeIndex === -1) continue;
    const [fromRaw, toRaw] = lines[timeIndex].split("-->");
    const start = parseStamp(fromRaw ?? "");
    const end = parseStamp((toRaw ?? "").split(/\s+/)[0] ?? "");
    const body = lines.slice(timeIndex + 1).join("\n").trim();
    if (start === null || end === null || !body) continue;
    if (end <= start) continue;
    if (end - start > 30) continue;
    cues.push({ start: Number(start.toFixed(3)), end: Number(end.toFixed(3)), text: body });
  }

  if (!cues.length) return { ok: false, error: "No valid caption cues found in the SRT." };
  if (cues.length > 5000) return { ok: false, error: "SRT has an unreasonable number of cues." };

  cues.sort((a, b) => a.start - b.start);
  for (let i = 1; i < cues.length; i++) {
    if (cues[i].start < cues[i - 1].end) cues[i].start = cues[i - 1].end;
    if (cues[i].end <= cues[i].start) cues[i].end = cues[i].start + 0.4;
  }

  return { ok: true, cues, srt: cuesToSrt(cues) };
}

export function cuesToSrt(cues: Cue[]) {
  return cues
    .map((cue, i) => `${i + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}\n`)
    .join("\n")
    .trim();
}

/* ── storage ────────────────────────────────────────────────────── */

export async function uploadMedia(file: File) {
  const db = await admin();
  const safe = (file.name || "media").replace(/[^\w.\-]+/g, "_").slice(-80);
  const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safe}`;
  const { error } = await db.storage.from(CAPTION_BUCKET).upload(key, await file.arrayBuffer(), {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return key;
}

export async function signedMediaUrl(objectKey: string) {
  const db = await admin();
  const { data, error } = await db.storage
    .from(CAPTION_BUCKET)
    .createSignedUrl(objectKey, CAPTION_SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) throw new Error(error?.message || "Could not sign the media URL.");
  return data.signedUrl;
}

export async function removeMedia(keys: string[]) {
  if (!keys.length) return;
  const db = await admin();
  await db.storage.from(CAPTION_BUCKET).remove(keys);
}

/** True when a worker has checked in recently enough to take a job. */
export async function workerOnline(withinSeconds = 120) {
  const db = await admin();
  const since = new Date(Date.now() - withinSeconds * 1000).toISOString();
  const { data } = await db
    .from("caption_workers")
    .select("id")
    .gte("last_seen_at", since)
    .limit(1);
  return Boolean(data?.length);
}
