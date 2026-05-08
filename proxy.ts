import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isRootPage = nextUrl.pathname === "/"; // Root path check
  const isAuthPage = nextUrl.pathname.startsWith("/admin-login");
  const isDashboardPage = nextUrl.pathname.startsWith("/dashboard");
  const hasError = req.auth?.error === "RefreshAccessTokenError";

  if (hasError) {
    if (isDashboardPage || isRootPage) {
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

  if (!isLoggedIn && isDashboardPage) {
    return Response.redirect(new URL("/admin-login", nextUrl));
  }
});
export default proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
