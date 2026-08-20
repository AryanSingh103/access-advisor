import "next-auth/jwt";

// The GitHub access token lives ONLY on the JWT. It is deliberately never copied
// onto Session: anything on Session is served to the browser by
// /api/auth/session, and this token carries repo scope. Route Handlers read it
// server-side via lib/server/github.ts.
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}
