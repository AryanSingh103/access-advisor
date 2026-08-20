import { auth } from "@/auth";
import { getGithubToken, githubFetch, unauthorized } from "@/lib/server/github";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return unauthorized();

  const token = await getGithubToken(req);
  if (!token) return unauthorized();

  const res = await githubFetch("/user/repos?sort=updated&per_page=20", token);
  if (!res.ok) {
    return Response.json(
      { error: `GitHub returned ${res.status} when listing your repositories.` },
      { status: res.status === 401 ? 401 : 502 },
    );
  }

  // Return only the fields the dashboard renders.
  const repos = (await res.json()) as Array<Record<string, unknown>>;
  return Response.json(
    repos.map((r) => ({
      full_name: r.full_name,
      name: r.name,
      open_issues_count: r.open_issues_count,
      updated_at: r.updated_at,
    })),
  );
}
