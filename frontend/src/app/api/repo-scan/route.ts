import { auth } from "@/auth";
import { callBackend, relayStream } from "@/lib/server/backend";
import { getGithubToken, unauthorized } from "@/lib/server/github";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return unauthorized();

  const github_token = await getGithubToken(req);
  if (!github_token) return unauthorized();

  const { repo } = await req.json();
  if (typeof repo !== "string" || !repo.includes("/")) {
    return Response.json({ error: "Send a `repo` as \"owner/name\"." }, { status: 400 });
  }

  const upstream = await callBackend("/api/repo-scan", { repo, github_token });
  return relayStream(upstream, "application/x-ndjson");
}
