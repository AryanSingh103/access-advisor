/**
 * Server-only access to the signed-in user's GitHub token.
 *
 * The token is stored on the NextAuth JWT and is deliberately NOT copied onto
 * the session object, so it is never serialised to the browser. Route Handlers
 * read it here and attach it to backend / GitHub calls server-side.
 */

import { getToken } from "next-auth/jwt";

if (typeof window !== "undefined") {
  throw new Error("lib/server/github.ts must not be imported from client code");
}

const SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
const AUTH_URL = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";

export async function getGithubToken(req: Request): Promise<string | null> {
  if (!SECRET) throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) is not set");

  // Over HTTPS the session cookie is "__Secure-authjs.session-token"; over HTTP
  // it is unprefixed. Try the likely one first, then the other, so the same code
  // works in local dev and behind a TLS-terminating proxy.
  const order = AUTH_URL.startsWith("https://") ? [true, false] : [false, true];

  for (const secureCookie of order) {
    const jwt = await getToken({ req, secret: SECRET, secureCookie });
    const accessToken = jwt?.accessToken;
    if (typeof accessToken === "string" && accessToken.length > 0) return accessToken;
  }
  return null;
}

export function unauthorized(): Response {
  return Response.json(
    { error: "Your GitHub session has expired. Sign in again to continue." },
    { status: 401 },
  );
}

/** Call the GitHub REST API as the signed-in user. */
export async function githubFetch(path: string, token: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
}
