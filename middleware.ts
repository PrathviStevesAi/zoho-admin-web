import { auth } from "@/lib/auth";

export const middleware = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isRootPage = nextUrl.pathname === "/";
  const isAuthPage = nextUrl.pathname.startsWith("/admin-login");
  const isProtectedRoute = !isAuthPage;
  const hasError = req.auth?.error === "RefreshAccessTokenError";

  if (hasError) {
    if (isProtectedRoute) {
      return Response.redirect(new URL("/admin-login", nextUrl));
    }
    return;
  }

  if (isRootPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", nextUrl));
    } else {
      return Response.redirect(new URL("/admin-login", nextUrl));
    }
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", nextUrl));
  }

  if (!isLoggedIn && isProtectedRoute) {
    return Response.redirect(new URL("/admin-login", nextUrl));
  }
});

export default middleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
