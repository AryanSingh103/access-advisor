const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

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

export interface PostCommentsResponse {
  comments_posted: number;
}

export async function* streamAnalysis(
  content: string,
  contentType: "code" | "dom"
): AsyncGenerator<string> {
  const res = await fetch(`${BACKEND_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
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
    headers: { "Content-Type": "application/json" },
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

export async function* scanUrl(url: string): AsyncGenerator<Violation> {
  const res = await fetch(`${BACKEND_URL}/api/scan-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Scan failed: ${res.status}`);
  }

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
        yield JSON.parse(line) as Violation;
      } catch {
        // skip malformed lines
      }
    }
  }
}
