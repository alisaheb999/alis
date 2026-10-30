/**
 * Background removal with provider failover.
 *
 * Every provider we use has a free/limited tier, so one hitting its quota must
 * not break the feature: the chain walks to the next provider on any auth,
 * quota, rate-limit or upstream failure and only reports an error when every
 * provider has been tried.
 *
 * Keys live in the server environment and are read inside the handler.
 */

export type RemoveBgOptions = {
  /** png | jpg | webp */
  format?: string;
  /** full | preview | medium | hd */
  size?: string;
  /** background colour when the caller wants an opaque result */
  bgColor?: string;
};

export type RemoveBgSuccess = {
  ok: true;
  provider: string;
  mime: string;
  bytes: ArrayBuffer;
  attempts: Array<{ provider: string; status: number | null; message: string }>;
};

export type RemoveBgFailure = {
  ok: false;
  status: number;
  message: string;
  attempts: Array<{ provider: string; status: number | null; message: string }>;
};

type ProviderDef = {
  id: string;
  envKey: string;
  run: (file: File, key: string, opts: RemoveBgOptions) => Promise<Response>;
};

const MIME_BY_FORMAT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function normalisedFormat(format?: string) {
  const f = String(format || "png").toLowerCase();
  return MIME_BY_FORMAT[f] ? f : "png";
}

/** Ordered chain — first configured provider wins, the rest are failovers. */
const PROVIDERS: ProviderDef[] = [
  {
    id: "poof",
    envKey: "POOFBG_API_KEY",
    run: (file, key, opts) => {
      const form = new FormData();
      form.append("image_file", file, file.name || "ghost-input.png");
      form.append("format", normalisedFormat(opts.format));
      form.append("size", opts.size || "full");
      if (opts.bgColor) {
        form.append("channels", "rgb");
        form.append("bg_color", opts.bgColor);
      }
      return fetch("https://api.poof.bg/v1/remove", {
        method: "POST",
        headers: { "x-api-key": key, Accept: "image/*, application/json" },
        body: form,
      });
    },
  },
  {
    id: "photoroom",
    envKey: "PHOTOROOM_API_KEY",
    run: (file, key, opts) => {
      const form = new FormData();
      form.append("image_file", file, file.name || "ghost-input.png");
      form.append("format", normalisedFormat(opts.format) === "jpg" ? "jpg" : "png");
      if (opts.bgColor) form.append("bg_color", opts.bgColor);
      return fetch("https://sdk.photoroom.com/v1/segment", {
        method: "POST",
        headers: { "x-api-key": key, Accept: "image/png, application/json" },
        body: form,
      });
    },
  },
  {
    id: "photoroom-2",
    envKey: "PHOTOROOM_API_KEY_2",
    run: (file, key, opts) => {
      const form = new FormData();
      form.append("image_file", file, file.name || "ghost-input.png");
      form.append("format", normalisedFormat(opts.format) === "jpg" ? "jpg" : "png");
      if (opts.bgColor) form.append("bg_color", opts.bgColor);
      return fetch("https://sdk.photoroom.com/v1/segment", {
        method: "POST",
        headers: { "x-api-key": key, Accept: "image/png, application/json" },
        body: form,
      });
    },
  },
];

export function removeBgProviderStatus(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const p of PROVIDERS) out[p.id] = Boolean(process.env[p.envKey]?.trim());
  return out;
}

export async function removeBackground(
  file: File,
  opts: RemoveBgOptions = {},
): Promise<RemoveBgSuccess | RemoveBgFailure> {
  const attempts: Array<{ provider: string; status: number | null; message: string }> = [];
  const configured = PROVIDERS.filter((p) => process.env[p.envKey]?.trim());

  if (!configured.length) {
    return {
      ok: false,
      status: 503,
      message: "No background-removal provider is configured.",
      attempts,
    };
  }

  for (const provider of configured) {
    const key = process.env[provider.envKey]!.trim();
    try {
      const res = await provider.run(file, key, opts);
      if (res.ok) {
        const bytes = await res.arrayBuffer();
        if (bytes.byteLength > 0) {
          const mime =
            res.headers.get("content-type")?.split(";")[0] ||
            MIME_BY_FORMAT[normalisedFormat(opts.format)];
          return { ok: true, provider: provider.id, mime, bytes, attempts };
        }
        attempts.push({ provider: provider.id, status: res.status, message: "empty response" });
      } else {
        const detail = await res.text().catch(() => "");
        attempts.push({
          provider: provider.id,
          status: res.status,
          message: detail.slice(0, 300) || `HTTP ${res.status}`,
        });
        console.error(
          `[ghost:removebg] ${provider.id} failed ${res.status}: ${detail.slice(0, 300)}`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "network failure";
      attempts.push({ provider: provider.id, status: null, message });
      console.error(`[ghost:removebg] ${provider.id} threw`, err);
    }
  }

  const quotaOnly = attempts.every((a) => a.status === 402 || a.status === 429);
  return {
    ok: false,
    status: quotaOnly ? 429 : 502,
    message: quotaOnly
      ? "All background-removal providers are rate limited right now — try again shortly."
      : "Background removal failed on every provider.",
    attempts,
  };
}
