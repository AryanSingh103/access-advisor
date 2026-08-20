import { callBackend, relayStream } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { url } = await req.json();

  if (typeof url !== "string" || url.length === 0) {
    return Response.json({ error: "Send a `url` to scan." }, { status: 400 });
  }

  const upstream = await callBackend("/api/scan-url", { url });
  return relayStream(upstream, "application/x-ndjson");
}
