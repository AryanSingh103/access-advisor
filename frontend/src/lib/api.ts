const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const BACKEND_API_KEY = process.env.NEXT_PUBLIC_BACKEND_API_KEY ?? "";

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (BACKEND_API_KEY) headers["X-API-Key"] = BACKEND_API_KEY;
  return headers;
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

export async function* streamAnalysis(
  content: string,
  contentType: "code" | "dom"
): AsyncGenerator<string> {
  const res = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ content, content_type: contentType }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Backend error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}

export async function analyzePR(
  repo: string,
  prNumber: number,
  githubToken: string
): Promise<AnalyzePRResponse> {
  const res = await fetch(`${BACKEND_URL}/api/github/analyze-pr`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ repo, pr_number: prNumber, github_token: githubToken }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PR analysis failed: ${err}`);
  }

  return res.json() as Promise<AnalyzePRResponse>;
}

export async function postComments(
  repo: string,
  prNumber: number,
  githubToken: string,
  violations: Violation[]
): Promise<PostCommentsResponse> {
  const res = await fetch(`${BACKEND_URL}/api/github/post-comments`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({
      repo,
      pr_number: prNumber,
      github_token: githubToken,
      violations,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Post comments failed: ${err}`);
  }

  return res.json() as Promise<PostCommentsResponse>;
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
  const res = await fetch(`${BACKEND_URL}/api/scan-url`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ url }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Scan failed: ${res.status}`);
  }

  yield* ndjsonStream<ScanUrlEvent>(res);
}

export interface RepoScanEvent {
  type: "file_start" | "file_result" | "error" | "done" | "truncated";
  scanned?: number;
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

export async function* scanRepo(
  repo: string,
  githubToken: string
): AsyncGenerator<RepoScanEvent> {
  const res = await fetch(`${BACKEND_URL}/api/repo-scan`, {
    method: "POST",
    headers: apiHeaders(),
    body: JSON.stringify({ repo, github_token: githubToken }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Repo scan failed: ${res.status}`);
  }

  yield* ndjsonStream<RepoScanEvent>(res);
}
