/**
 * Browser-side API client.
 *
 * Every call goes to a same-origin Route Handler under /api. Those handlers add
 * the backend API key and the user's GitHub token server-side, so neither
 * credential is ever present in this bundle.
 */

async function errorFrom(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  const message =
    body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : fallback;
  return new Error(message);
}

export interface Violation {
  file_path: string;
  line_number: number | null;
  criterion: string;
  level: string;
  description: string;
  fix: string;
  criterion_name?: string;
}

export interface AnalyzePRResponse {
  violations: Violation[];
}

export interface FailedComment {
  file_path: string;
  line_number: number | null;
  reason: string;
}

export interface PostCommentsResponse {
  comments_posted: number;
  failed: FailedComment[];
}

export interface Repo {
  full_name: string;
  name: string;
  open_issues_count: number;
  updated_at: string;
}

export interface PullRequest {
  number: number;
  title: string;
  updated_at: string;
  user: { login: string };
  draft: boolean;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export async function* streamAnalysis(
  content: string,
  contentType: "code" | "dom"
): AsyncGenerator<string> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ content, content_type: contentType }),
  });

  if (!res.ok || !res.body) {
    throw await errorFrom(res, "Analysis failed. Try again.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

export async function analyzePR(repo: string, prNumber: number): Promise<AnalyzePRResponse> {
  const res = await fetch("/api/github/analyze-pr", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ repo, pr_number: prNumber }),
  });

  if (!res.ok) throw await errorFrom(res, "PR analysis failed.");
  return res.json() as Promise<AnalyzePRResponse>;
}

export async function postComments(
  repo: string,
  prNumber: number,
  violations: Violation[]
): Promise<PostCommentsResponse> {
  const res = await fetch("/api/github/post-comments", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ repo, pr_number: prNumber, violations }),
  });

  if (!res.ok) throw await errorFrom(res, "Could not post comments to the PR.");
  return res.json() as Promise<PostCommentsResponse>;
}

export async function listRepos(): Promise<Repo[]> {
  const res = await fetch("/api/github/repos");
  if (!res.ok) throw await errorFrom(res, "Could not load your repositories.");
  return res.json() as Promise<Repo[]>;
}

export async function listPullRequests(repo: string): Promise<PullRequest[]> {
  const res = await fetch(`/api/github/pulls?repo=${encodeURIComponent(repo)}`);
  if (!res.ok) throw await errorFrom(res, "Could not load pull requests.");
  return res.json() as Promise<PullRequest[]>;
}

async function* ndjsonStream<T>(res: Response): AsyncGenerator<T> {
  if (!res.body) throw new Error("Response has no body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        yield JSON.parse(line) as T;
      } catch {
        // skip malformed lines
      }
    }
  }
}

export type ScanUrlEvent =
  | ({ type: "violation" } & Violation)
  | { type: "progress"; stage: "rendering" | "analyzing" }
  | { type: "error"; error: string }
  | { type: "done"; total_violations: number };

export async function* scanUrl(url: string): AsyncGenerator<ScanUrlEvent> {
  const res = await fetch("/api/scan-url", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ url }),
  });

  if (!res.ok || !res.body) {
    throw await errorFrom(res, "Scan failed. Check the URL and try again.");
  }

  yield* ndjsonStream<ScanUrlEvent>(res);
}

export interface RepoScanEvent {
  type: "file_start" | "file_result" | "error" | "done" | "truncated";
  scanned?: number;
  skipped_count?: number;
  file?: string;
  index?: number;
  total?: number;
  violations?: Violation[];
  skipped?: boolean;
  reason?: string;
  message?: string;
  total_files?: number;
  total_violations?: number;
}

export async function* scanRepo(repo: string): AsyncGenerator<RepoScanEvent> {
  const res = await fetch("/api/repo-scan", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ repo }),
  });

  if (!res.ok || !res.body) {
    throw await errorFrom(res, "Repo scan failed.");
  }

  yield* ndjsonStream<RepoScanEvent>(res);
}
