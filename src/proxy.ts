import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Everything not listed here stays public and server-rendered for SEO.
const PROTECTED = [
  "/home",
  "/question-bank",
  "/past-papers",
  "/pyq-mix",
  "/ai-exams",
  "/theory",
  "/revision",
  "/marker",
  "/diagrams",
  "/interview",
  "/tutor",
  "/progress",
  "/memory",
  "/notes",
  "/upgrade",
  "/profile",
  "/settings",
  "/admin",
];

export async function proxy(request: NextRequest) {
  // Must start from the incoming request so refreshed auth cookies survive
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser revalidates against the auth server; getSession only reads the
  // cookie, which a client could have forged
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

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
  // The role comes from a signed JWT claim set by an auth hook, never from
  // user_metadata, which the user can write to and could use to self-promote.
  if (pathname.startsWith("/admin")) {
    const { data } = await supabase.auth.getClaims();
    const role = (data?.claims as { user_role?: string } | undefined)?.user_role;
    if (role !== "admin") {
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
