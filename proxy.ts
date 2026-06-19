import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isAuthPage = nextUrl.pathname.startsWith("/admin-login");
  const isProtectedRoute = !isAuthPage;
  const hasError = req.auth?.error === "RefreshAccessTokenError";

  if (hasError || (!isLoggedIn && isProtectedRoute)) {
    return NextResponse.redirect(new URL("/admin-login", nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|firebase-messaging-sw.js|favicon.ico).*)"],
};
