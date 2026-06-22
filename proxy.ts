import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

console.log("proxy AUTH_SECRET:", !!process.env.AUTH_SECRET);
console.log("proxy NEXTAUTH_SECRET:", !!process.env.NEXTAUTH_SECRET);

export async function proxy(req: NextRequest) {

  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  const token = await getToken({
    req,
    secret,
    cookieName: "__Secure-authjs.session-token",
  });

  const tokenFallback = token ?? await getToken({
    req,
    secret,
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
