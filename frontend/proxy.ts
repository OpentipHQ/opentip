import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth protection — admin only
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const sessionToken = request.cookies.get("next-auth.session-token")?.value
      || request.cookies.get("__Secure-next-auth.session-token")?.value;
    if (!sessionToken) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
      }
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Security headers — ALL routes
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.reown.com https://*.walletconnect.com https://verify.walletconnect.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' https://avatars.githubusercontent.com https://*.blob.core.windows.net data:",
      "connect-src 'self' https://sepolia.base.org https://mainnet.base.org https://api.relay.link https://*.reown.com https://*.walletconnect.com wss://*.walletconnect.com",
      "frame-src 'self' https://*.reown.com https://*.walletconnect.com",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: ["/(.*)"],
};
