/** Forwards a manifesto alias endpoint to its canonical desktop route (same origin). */
export async function forward(request: Request, path: string, method: "GET" | "POST") {
  const headers = new Headers();
  for (const h of ["authorization", "content-type", "user-agent", "cf-connecting-ip", "x-forwarded-for"]) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  const body = method === "POST" ? await request.text() : undefined;
  return fetch(new URL(path, request.url), { method, headers, body });
}
