/**
 * Server-only client for the FastAPI backend.
 *
 * BACKEND_API_KEY must never be given a NEXT_PUBLIC_ prefix: that would inline
 * it into the browser bundle and make the backend's X-API-Key gate pointless.
 * Only Route Handlers under src/app/api/ import this module.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/server/backend.ts must not be imported from client code");
}

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
const BACKEND_API_KEY = process.env.BACKEND_API_KEY ?? "";

function backendHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (BACKEND_API_KEY) headers["X-API-Key"] = BACKEND_API_KEY;
  return headers;
}

/** POST a JSON body to the backend. The caller decides how to read the response. */
export async function callBackend(path: string, body: unknown): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: backendHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

/** Turn a failed upstream response into a JSON error the browser can display. */
export async function upstreamError(res: Response): Promise<Response> {
  const detail = await res.text().catch(() => "");
  return Response.json(
    { error: detail || `Backend returned ${res.status}.` },
    { status: res.status === 401 ? 502 : res.status },
  );
}

/** Pipe a streaming backend response straight through to the browser. */
export async function relayStream(res: Response, contentType: string): Promise<Response> {
  if (!res.ok) return upstreamError(res);
  if (!res.body) {
    return Response.json({ error: "Backend returned an empty stream." }, { status: 502 });
  }
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      // Stops nginx-style proxies from buffering the stream into one chunk.
      "X-Accel-Buffering": "no",
    },
  });
}

/** Pass a JSON backend response through unchanged. */
export async function relayJson(res: Response): Promise<Response> {
  if (!res.ok) return upstreamError(res);
  return Response.json(await res.json());
}
