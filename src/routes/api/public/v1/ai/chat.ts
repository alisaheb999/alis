import { createFileRoute } from "@tanstack/react-router";
import { errorResponse, jsonResponse, preflight } from "@/lib/ghost-api";
import { AI_FALLBACK_CHAIN } from "@/lib/ghost-entitlements";

type Body = {
  provider?: string;
  model?: string;
  prompt?: string;
  system?: string;
  temperature?: number;
  /** Task category for the intelligent prompting pipeline (motion-graphics, coding, …). */
  task?: string;
  /** Set false to skip the Layer 1 identity preamble (diagnostics only). */
  identity?: boolean;
  /** Automatic AI mode: on a provider failure the next configured one answers. */
  auto?: boolean;
};

/**
 * Server-side half of the prompt optimisation pipeline: whatever category the
 * panel reports, the stored cloud rules for it are prepended to the system
 * prompt. Old panel builds therefore benefit from improved rules too.
 */
async function cloudSystemFor(task: string): Promise<string> {
  const category = task.trim().toLowerCase();
  if (!category) return "";
  try {
    const g = await import("@/lib/ghost-api.server");
    const db = await g.admin();
    const { data } = await db
      .from("prompt_templates")
      .select("body,kind,weight")
      .eq("enabled", true)
      .in("category", [category, "general"])
      .order("weight", { ascending: false })
      .limit(12);
    return (data ?? []).map((r) => String(r.body || "")).filter(Boolean).join("\n");
  } catch {
    return "";
  }
}

const DEFAULT_MODEL: Record<string, string> = {
  gemini: "gemini-3.6-flash",
  groq: "llama-3.3-70b-versatile",
  openrouter: "google/gemini-2.5-flash",
  mistral: "mistral-large-latest",
  together: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  cohere: "command-a-03-2025",
  huggingface: "meta-llama/Llama-3.1-8B-Instruct",
};


type Attempt = { ok: true; text: string } | { ok: false; status: number; message: string };

/** One provider call. Every branch keeps the provider's own request shape. */
async function callProvider(
  provider: string,
  model: string,
  system: string,
  prompt: string,
  temperature: number,
): Promise<Attempt> {
  const { providerKey, upstreamError } = await import("@/lib/ghost-providers.server");
  const messages = [
    ...(system ? [{ role: "system", content: system }] : []),
    { role: "user", content: prompt },
  ];
  const openAiStyle: Record<string, string> = {
    groq: "https://api.groq.com/openai/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    mistral: "https://api.mistral.ai/v1/chat/completions",
    together: "https://api.together.xyz/v1/chat/completions",
    huggingface: "https://router.huggingface.co/v1/chat/completions",
  };

  try {
    if (openAiStyle[provider]) {
      const key = providerKey(provider as never);
      if (!key) return { ok: false, status: 503, message: `${provider} key is not configured.` };
      const res = await fetch(openAiStyle[provider]!, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages, temperature }),
      });
      if (!res.ok) {
        const e = await upstreamError(provider, res);
        return { ok: false, status: e.status, message: e.message };
      }
      const data = (await res.json()) as any;
      return { ok: true, text: data.choices?.[0]?.message?.content ?? "" };
    }

    if (provider === "gemini") {
      const key = providerKey("gemini");
      if (!key) return { ok: false, status: 503, message: "Gemini key is not configured." };
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
            generationConfig: { temperature },
          }),
        },
      );
      if (!res.ok) {
        const e = await upstreamError("Gemini", res);
        return { ok: false, status: e.status, message: e.message };
      }
      const data = (await res.json()) as any;
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((p: any) => p.text ?? "")
        .join("")
        .trim();
      return { ok: true, text };
    }

    if (provider === "cohere") {
      const key = providerKey("cohere");
      if (!key) return { ok: false, status: 503, message: "Cohere key is not configured." };
      const res = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, temperature, messages }),
      });
      if (!res.ok) {
        const e = await upstreamError("Cohere", res);
        return { ok: false, status: e.status, message: e.message };
      }
      const data = (await res.json()) as any;
      const text = (data.message?.content ?? []).map((c: any) => c.text ?? "").join("").trim();
      return { ok: true, text };
    }

    return {
      ok: false,
      status: 400,
      message: "Unknown provider. Use auto, gemini, groq, openrouter, mistral, together, cohere or huggingface.",
    };
  } catch (err) {
    console.error(`[ghost:ai] ${provider} failure`, err);
    return { ok: false, status: 502, message: `${provider} request failed.` };
  }
}

export const Route = createFileRoute("/api/public/v1/ai/chat")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return errorResponse("bad_request", "Send a JSON body.", 400);
        }

        const prompt = String(body.prompt || "").trim();
        if (!prompt) return errorResponse("bad_request", "prompt is required.", 400);
        if (prompt.length > 24000) return errorResponse("bad_request", "prompt is too long.", 400);

        const requested = String(body.provider || "gemini").toLowerCase();
        const auto = body.auto === true || requested === "auto";

        // Layer 1 (identity) always leads, then Layer 2 category rules, then the
        // panel's own runtime context. Order is part of the contract.
        const { identitySystemPrompt } = await import("@/lib/ghost-identity.server");
        const identity = body.identity === false ? "" : await identitySystemPrompt();
        const cloudSystem = await cloudSystemFor(String(body.task || ""));
        const ownSystem = String(body.system || "").trim();
        const system = [identity, cloudSystem, ownSystem].filter(Boolean).join("\n\n").trim();
        const temperature = typeof body.temperature === "number" ? body.temperature : 0.7;

        // Candidate order: what the panel asked for first, then the fallback
        // chain when automatic AI mode is on.
        const first =
          requested === "auto"
            ? AI_FALLBACK_CHAIN[0]!
            : { provider: requested, model: String(body.model || DEFAULT_MODEL[requested] || "").trim() };
        const candidates = auto
          ? [first, ...AI_FALLBACK_CHAIN.filter((c) => c.provider !== first.provider)]
          : [first];

        let last: Attempt = { ok: false, status: 502, message: "No AI provider answered." };
        const tried: string[] = [];
        for (const candidate of candidates) {
          const model = candidate.model || DEFAULT_MODEL[candidate.provider] || "";
          const attempt = await callProvider(candidate.provider, model, system, prompt, temperature);
          if (attempt.ok)
            return jsonResponse({
              ok: true,
              provider: candidate.provider,
              model,
              text: attempt.text,
              auto,
              fell_back: tried.length > 0,
              tried,
            });
          tried.push(candidate.provider);
          last = attempt;
          if (attempt.status === 400 && !auto) break;
        }

        return errorResponse(
          last.status === 503 ? "not_configured" : "upstream",
          auto ? `${last.message} (tried ${tried.join(", ")})` : last.message,
          last.status,
        );
      },
    },
  },
});
