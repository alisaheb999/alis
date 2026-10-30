/**
 * GHOST Cloud API — shared, browser-safe helpers.
 * No secrets, no server imports: this module is reachable from the client bundle.
 */

export const API_VERSION = "v1";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, If-None-Match, X-Worker-Token, X-Ghost-Key, X-Ghost-License, X-Ghost-Panel, X-Ghost-Device, X-Ghost-Version, X-Ghost-Timestamp, X-Ghost-Signature, X-Ghost-Admin-Token",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

export function jsonResponse(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

export function errorResponse(code: string, message: string, status = 400, extra?: unknown) {
  return jsonResponse({ ok: false, error: { code, message, extra } }, status);
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Canonical string the extension signs: METHOD\npath\ntimestamp\nbody */
export function canonicalPayload(method: string, path: string, timestamp: string, body: string) {
  return [method.toUpperCase(), path, timestamp, body].join("\n");
}
