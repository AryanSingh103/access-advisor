import { auth } from "@/auth";
import { callBackend, relayJson } from "@/lib/server/backend";
import { getGithubToken, unauthorized } from "@/lib/server/github";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return unauthorized();

  const github_token = await getGithubToken(req);
  if (!github_token) return unauthorized();

  const { repo, pr_number } = await req.json();
  if (typeof repo !== "string" || !repo.includes("/")) {
    return Response.json({ error: "Send a `repo` as \"owner/name\"." }, { status: 400 });
  }
  if (!Number.isInteger(pr_number) || pr_number < 1) {
    return Response.json({ error: "Send a `pr_number` as a positive integer." }, { status: 400 });
  }

  const upstream = await callBackend("/api/github/analyze-pr", {
    repo,
    pr_number,
    github_token,
  });
  return relayJson(upstream);
}
