/**
 * GHOST default provider keys — server-only.
 * Every third-party key lives in the server environment; the extension and the
 * web panel only ever talk to our own /api/public/v1/* routes.
 */

export const PROVIDER_ENV = {
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  mistral: "MISTRAL_API_KEY",
  together: "TOGETHER_API_KEY",
  cohere: "COHERE_API_KEY",
  huggingface: "HUGGINGFACE_API_KEY",
  deepgram: "DEEPGRAM_API_KEY",
  assemblyai: "ASSEMBLYAI_API_KEY",
  elevenlabs: "ELEVENLABS_API_KEY",
  photoroom: "PHOTOROOM_API_KEY",
  replicate: "REPLICATE_API_TOKEN",
  pexels: "PEXELS_API_KEY",
  pixabay: "PIXABAY_API_KEY",
  freesound: "FREESOUND_API_KEY",
  giphy: "GIPHY_API_KEY",
} as const;

export type ProviderId = keyof typeof PROVIDER_ENV;

/** Read a provider key inside a handler (env is injected per request). */
export function providerKey(id: ProviderId): string | null {
  return process.env[PROVIDER_ENV[id]]?.trim() || null;
}

export function providerAvailability(): Record<ProviderId, boolean> {
  const out = {} as Record<ProviderId, boolean>;
  for (const id of Object.keys(PROVIDER_ENV) as ProviderId[]) out[id] = Boolean(providerKey(id));
  return out;
}

/** Uniform upstream failure surface — never swallow the provider's status. */
export async function upstreamError(provider: string, res: Response) {
  const detail = await res.text().catch(() => "");
  console.error(`[ghost:${provider}] upstream ${res.status}: ${detail.slice(0, 500)}`);
  const message =
    res.status === 401 || res.status === 403
      ? `${provider} rejected the configured API key.`
      : res.status === 429
        ? `${provider} is rate limited — try again shortly.`
        : res.status === 402
          ? `${provider} account is out of credits.`
          : `${provider} request failed (${res.status}).`;
  return { message, detail: detail.slice(0, 1000), status: res.status };
}
