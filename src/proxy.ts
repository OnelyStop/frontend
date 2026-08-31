import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Everything not listed here stays public and server-rendered for SEO.
const PROTECTED = [
  "/home",
  "/attempt-map",
  "/mocks",
  "/drills",
  "/descriptive",
  "/progress",
  "/notes",
  "/flashcards",
  "/community",
  "/upgrade",
  "/profile",
  "/settings",
  "/admin",
];

// Local-only escape hatch for working on signed-in screens without an account.
// Refuses to engage in a production build, so it cannot be turned on by a stray
// env var on a deployed instance. Server-side only — never NEXT_PUBLIC_.
const AUTH_DISABLED =
  process.env.AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production";

export async function proxy(request: NextRequest) {
  if (AUTH_DISABLED) return NextResponse.next({ request });

  // Must start from the incoming request so refreshed auth cookies survive
  let response = NextResponse.next({ request });

  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED.some(
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

  if (needsAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Preserve the query string so ?billing=annual survives the round trip
    url.searchParams.set("from", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  // Redirects here are a UX nicety, not the security boundary — server actions
  // can be invoked without ever passing through the proxy. Every admin page and
  // action re-checks via requireRole(), and RLS enforces it at the database.
  //
  // Costs one query, but only on /admin, which one person opens occasionally.
  if (pathname.startsWith("/admin")) {
    const { data: row } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (row?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Only the root — deeper marketing pages stay readable while signed in.
  if (user && ["/", "/login", "/signup"].includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const proxyConfig = {
  matcher: [
    // Everything except static assets and image files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
