import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIMARY_HOST = "tackers.xyz";

const LEGACY_HOSTS = new Set([
  "www.tackers.xyz",
  "multivault-wallet.vercel.app",
]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (!host || host === PRIMARY_HOST || !LEGACY_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.host = PRIMARY_HOST;
  url.protocol = "https:";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: "/:path*",
};