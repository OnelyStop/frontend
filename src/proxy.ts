import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require a session. Everything else — landing, pricing, auth
// pages — stays public and server-rendered for SEO.
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

  // Admin is gated on a role claim, never on user_metadata — that field is
  // user-writable and would allow self-promotion
  if (pathname.startsWith("/admin")) {
    const role =
      (user?.app_metadata as { role?: string } | undefined)?.role ??
      (user?.app_metadata as { user_role?: string } | undefined)?.user_role;
    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/home";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Signed-in users have no business on the auth screens
  if (user && ["/login", "/signup"].includes(pathname)) {
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
