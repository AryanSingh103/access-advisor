import { callBackend, relayStream } from "@/lib/server/backend";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { content, content_type } = await req.json();

  if (typeof content !== "string" || (content_type !== "code" && content_type !== "dom")) {
    return Response.json(
      { error: "Send `content` as a string and `content_type` as \"code\" or \"dom\"." },
      { status: 400 },
    );
  }

  const upstream = await callBackend("/api/analyze", { content, content_type });
  return relayStream(upstream, "text/event-stream");
}
