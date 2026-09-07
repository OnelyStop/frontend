import { createServerClient } from "@supabase/ssr";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_DISABLED } from "@/config/auth";
import { PROTECTED_PREFIXES } from "@/config/routes";
import { safeInternalPath } from "@/features/auth/redirect";
import { captureError } from "@/lib/observability.server";

export async function proxy(request: NextRequest) {
  if (AUTH_DISABLED) return NextResponse.next({ request });

  // Must start from the incoming request so refreshed auth cookies survive
  let response = NextResponse.next({ request });

  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    if (!needsAuth) return response;
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser revalidates; getSession only reads a cookie a client could have forged.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // An Auth outage also answers user: null, so without this a 5xx reads as "signed out".
  if (authError && !isAuthSessionMissingError(authError))
    captureError(authError, { at: "proxy.getUser", pathname });

  // A fresh redirect drops the refreshed cookies, and the next token is already rotated.
  const redirect = (to: URL) => {
    const redirected = NextResponse.redirect(to);
    response.cookies.getAll().forEach((c) => redirected.cookies.set(c));
    return redirected;
  };

  if (needsAuth && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("from", `${pathname}${search}`);
    return redirect(login);
  }

  // Not the security boundary: server actions never pass through the proxy.
  if (pathname.startsWith("/admin")) {
    const { data: row } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (row?.role !== "admin") {
      const home = request.nextUrl.clone();
      home.pathname = "/home";
      home.search = "";
      return redirect(home);
    }
  }

  // Only these — deeper marketing pages stay readable while signed in.
  if (user && ["/", "/login", "/signup"].includes(pathname)) {
    const from = request.nextUrl.searchParams.get("from");
    return redirect(new URL(safeInternalPath(from), request.url));
  }

  return response;
}

// API routes authenticate themselves, so neither pays for the auth round-trip.
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
