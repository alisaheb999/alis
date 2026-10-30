/**
 * Compatibility layer for the shipped Ghostae Caption panel (v2).
 *
 * The installed panel talks to `<server>/api/public/caption/*` with its own
 * job contract ({ job: { id, status, progress, result } }) and it does NOT send
 * a licence key header — the panel files are frozen, so the server adapts.
 *
 * Because no licence key arrives, every request is metered on the FREE tier,
 * scoped to the panel's pseudonymous device/user id. Paid limits can never be
 * bought by a forged payload here.
 */
import type { Cue } from "@/lib/caption-queue.server";

export const COMPAT_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "content-type, accept, idempotency-key, x-ghost-key, x-ghost-device, x-ghost-version",
};

export const COMPAT_MAX_BYTES = 24 * 1024 * 1024;

export function compatJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...COMPAT_CORS },
  });
}

/** Identify the caller: real licence key when present, else the panel's pseudonymous id. */
export async function compatIdentity(request: Request, hints: { userId?: string | null; device?: string | null }) {
  const q = await import("@/lib/ghost-quota.server");
  const key = request.headers.get("x-ghost-key");
  const device =
    request.headers.get("x-ghost-device") ||
    (hints.device || "").toString().trim() ||
    (hints.userId || "").toString().trim() ||
    null;
  return q.resolveIdentity(key, device);
}

/** Charge caption minutes, fail-closed. */
export async function compatCharge(
  identity: Awaited<ReturnType<typeof compatIdentity>>,
  minutes: number,
  dryRun = false,
) {
  const q = await import("@/lib/ghost-quota.server");
  const today = new Date().toISOString().slice(0, 10);
  const day = await q.consume(identity, "caption.minutes.day", minutes, dryRun, today);
  if (!day.allowed) return day;
  if (identity.valid && identity.licenseId && identity.plan !== "free") {
    return q.consume(identity, "caption.minutes", minutes, dryRun, `term:${identity.licenseId}`);
  }
  return day;
}

export function minutesFor(sizeBytes: number, durationSeconds?: number | null) {
  const seconds = Number(durationSeconds) || 0;
  if (seconds > 0) return Math.max(1, Math.ceil(seconds / 60));
  return Math.max(1, Math.ceil(sizeBytes / (1024 * 1024)));
}

const EXT_BY_TYPE: Record<string, string> = {
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

/** Transcribe with the Lovable AI gateway. Throws a user-safe message on failure. */
export async function compatTranscribe(file: File, language?: string | null) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("ক্যাপশন সেবা এখন কনফিগার করা নেই।");

  const baseType = (file.type || "audio/mpeg").split(";")[0] ?? "audio/mpeg";
  const ext = EXT_BY_TYPE[baseType] || file.name.split(".").pop() || "mp3";

  const upstream = new FormData();
  upstream.append("model", "openai/gpt-4o-transcribe");
  upstream.append("file", file, `ghost-source.${ext}`);
  const lang = (language || "").trim();
  if (/^[a-z]{2}$/.test(lang)) upstream.append("language", lang);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: upstream,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[ghost:caption-compat] upstream ${response.status}: ${detail}`);
    throw new Error(
      response.status === 429
        ? "এখন অনেক অনুরোধ চলছে — কিছুক্ষণ পরে আবার চেষ্টা করুন।"
        : "ভয়েস বিশ্লেষণ সম্পন্ন করা যায়নি।",
    );
  }

  const payload = (await response.json()) as { text?: string };
  const text = String(payload.text || "").trim();
  if (!text) throw new Error("অডিওতে স্পষ্ট কথা পাওয়া যায়নি।");
  return text;
}

/** Even, word-count based cue timing — no extra AI call, so no extra cost. */
export function buildCues(text: string, duration: number, maxChars = 42): Cue[] {
  const total = Math.max(1, duration || 60);
  const chunks = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?।])\s+/)
    .flatMap((sentence) => {
      const words = sentence.trim().split(" ").filter(Boolean);
      const out: string[] = [];
      let line = "";
      for (const word of words) {
        if (line && (line + " " + word).length > maxChars) {
          out.push(line);
          line = word;
        } else {
          line = line ? line + " " + word : word;
        }
      }
      if (line) out.push(line);
      return out;
    })
    .filter(Boolean);

  if (!chunks.length) return [];
  const chars = chunks.reduce((sum, c) => sum + c.length, 0) || 1;
  let cursor = 0;
  return chunks.map((chunk) => {
    const span = Math.min(5, Math.max(0.8, (chunk.length / chars) * total));
    const cue: Cue = {
      start: Number(cursor.toFixed(2)),
      end: Number(Math.min(total, cursor + span).toFixed(2)),
      text: chunk,
    };
    cursor = cue.end;
    return cue;
  });
}
