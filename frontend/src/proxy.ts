import { auth } from "@/auth";

// Protect the dashboard (and PR analysis) routes: signed-out users are
// redirected to the GitHub sign-in flow before they can reach them.
// In Next.js 16 this file convention is named "proxy" (formerly "middleware").
export default auth((req) => {
  if (!req.auth) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
