import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withEdgeCache(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};


// Public marketing pages are identical for every visitor (auth lives in the
// browser), so let the CDN serve them and refresh in the background.
const CACHEABLE = /^\/(products(\/[a-z0-9-]+)?\/?|digital(\/[a-z0-9-]+)?\/?|gear(\/[a-z0-9-]+)?\/?|about|contact|terms|privacy|refund|faq)?$/;
function withEdgeCache(request: Request, response: Response): Response {
  try {
    if (request.method !== "GET" || response.status !== 200) return response;
    if (!(response.headers.get("content-type") ?? "").includes("text/html")) return response;
    const url = new URL(request.url);
    if (!CACHEABLE.test(url.pathname) || url.search) return response;
    if (/sb-[^=]*-auth-token/.test(request.headers.get("cookie") ?? "")) return response;
    const headers = new Headers(response.headers);
    headers.set("cache-control", "public, max-age=0, s-maxage=300, stale-while-revalidate=1800");
    headers.set("cdn-cache-control", "public, max-age=300, stale-while-revalidate=1800");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch {
    return response;
  }
}
