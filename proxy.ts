import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isRootPage = nextUrl.pathname === "/";
  const isAuthPage = nextUrl.pathname.startsWith("/admin-login");
  const isProtectedRoute = !isAuthPage;
  const hasError = req.auth?.error === "RefreshAccessTokenError";

  // Force logout on token error
  if (hasError && isProtectedRoute) {
    return NextResponse.redirect(new URL("/admin-login", nextUrl));
  }

  // Root page redirect
  if (isRootPage) {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/admin-login", nextUrl)
    );
  }

  // Redirect logged-in users away from login page
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/admin-login", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|firebase-messaging-sw.js|favicon.ico).*)"],
};
