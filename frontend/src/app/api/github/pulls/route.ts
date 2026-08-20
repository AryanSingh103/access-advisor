import { auth } from "@/auth";
import { getGithubToken, githubFetch, unauthorized } from "@/lib/server/github";

export const runtime = "nodejs";

// owner/name, GitHub's own allowed character set — keeps the value from
// escaping the path segment it is interpolated into below.
const REPO_RE = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return unauthorized();

  const token = await getGithubToken(req);
  if (!token) return unauthorized();

  const repo = new URL(req.url).searchParams.get("repo") ?? "";
  if (!REPO_RE.test(repo)) {
    return Response.json({ error: "Pass `repo` as \"owner/name\"." }, { status: 400 });
  }

  const res = await githubFetch(`/repos/${repo}/pulls?state=open&per_page=20`, token);
  if (!res.ok) {
    return Response.json(
      { error: `GitHub returned ${res.status} when listing pull requests.` },
      { status: res.status === 401 ? 401 : 502 },
    );
  }

  const pulls = (await res.json()) as Array<Record<string, unknown>>;
  return Response.json(
    pulls.map((p) => ({
      number: p.number,
      title: p.title,
      updated_at: p.updated_at,
      draft: p.draft,
      user: { login: (p.user as { login?: string } | null)?.login ?? "" },
    })),
  );
}
