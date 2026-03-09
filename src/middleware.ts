import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ENABLE_SUBDOMAIN_ROUTING } from "@/lib/flags";
import { getOrgFromSubdomain } from "@/lib/org-context";

const IGNORED_SUBDOMAINS = new Set(["www", "sandbox", "greasy"]);

function detectOrgSlug(request: NextRequest): string {
  if (!ENABLE_SUBDOMAIN_ROUTING) return "";

  const host = request.headers.get("host") ?? "";
  // Strip port (e.g. localhost:3000)
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");

  // A subdomain exists when there are at least 3 parts: sub.domain.tld
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (!IGNORED_SUBDOMAINS.has(subdomain)) {
      return getOrgFromSubdomain(subdomain) ?? "";
    }
  }

  return "";
}

export async function middleware(request: NextRequest) {
  const orgSlug = detectOrgSlug(request);

  // Attach org slug header to every request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-org-slug", orgSlug);

  // Protect /account routes — redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith("/account")) {
    const token = await getToken({ req: request });
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js static internals and common static files.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
