import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // ← Try both cookie names
    cookieName: "__Secure-authjs.session-token",
  });

  // Fallback: also check without __Secure prefix
  const tokenFallback = token ?? await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "authjs.session-token",
  });

  const isLoggedIn = !!tokenFallback;
  const { nextUrl } = req;

  const isRootPage = nextUrl.pathname === "/";
  const isAuthPage = nextUrl.pathname.startsWith("/admin-login");
  const isProtectedRoute = !isAuthPage;
  const hasError = tokenFallback?.error === "RefreshAccessTokenError";

  if (hasError && isProtectedRoute) {
    return NextResponse.redirect(new URL("/admin-login", nextUrl));
  }

  if (isRootPage) {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/admin-login", nextUrl)
    );
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/admin-login", nextUrl));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|firebase-messaging-sw.js|favicon.ico).*)"],
};
