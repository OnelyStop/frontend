import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_DISABLED } from "@/config/auth";
import { PROTECTED_PREFIXES } from "@/config/routes";
import { safeInternalPath } from "@/features/auth/redirect";

export async function proxy(request: NextRequest) {
  if (AUTH_DISABLED) return NextResponse.next({ request });

  // Must start from the incoming request so refreshed auth cookies survive
  let response = NextResponse.next({ request });

  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (!needsAuth) return response;
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  const supabase = createServerClient(url, anonKey, {
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

  // getUser revalidates against the auth server; getSession only reads the
  // cookie, which a client could have forged
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A redirect built from scratch would drop the cookies a token refresh just
  // wrote onto `response`, and the next request would present a refresh token
  // that has already been rotated.
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

  // Not the security boundary — server actions never pass through the proxy.
  // Every admin page and action re-checks via requireRole(), and RLS enforces
  // it at the database.
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

  // Only the root and the sign-in pages — deeper marketing pages stay
  // readable while signed in.
  if (user && ["/", "/login", "/signup"].includes(pathname)) {
    const from = request.nextUrl.searchParams.get("from");
    return redirect(new URL(safeInternalPath(from), request.url));
  }

  return response;
}

// API routes authenticate themselves and the metadata files need no session,
// so neither pays for the auth round-trip.
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
