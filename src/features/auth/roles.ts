import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { captureError } from "@/lib/observability.server";
import { createClient } from "@/lib/supabase-server";

export type AppRole = "admin" | "editor";

export type AppPermission =
  | "questions.create"
  | "questions.update"
  | "questions.delete"
  | "papers.import"
  | "users.read";

const PERMISSIONS: Record<AppRole, AppPermission[]> = {
  admin: [
    "questions.create",
    "questions.update",
    "questions.delete",
    "papers.import",
    "users.read",
  ],
  editor: ["questions.create", "questions.update"],
};

// Reads user_roles directly, not a JWT claim, so there is no auth hook to configure.
export async function getRole(): Promise<AppRole | null> {
  const supabase = await createClient();

  // getUser validates against the auth server; getSession would trust a cookie
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError && !isAuthSessionMissingError(authError))
    captureError(authError, { at: "getRole" });
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  // Failing closed is right, but silently it looks like the admin lost their role.
  if (error) captureError(error, { at: "getRole.user_roles", userId: user.id });
  if (error || !data) return null;
  const role = data.role as string;
  return role === "admin" || role === "editor" ? role : null;
}

export async function hasPermission(p: AppPermission): Promise<boolean> {
  const role = await getRole();
  return role ? PERMISSIONS[role].includes(p) : false;
}

// Call in every admin page and server action: a server action skips the proxy.
export async function requireRole(role: AppRole) {
  const actual = await getRole();
  if (actual !== role) redirect("/home");
  return actual;
}

export async function requirePermission(p: AppPermission) {
  if (!(await hasPermission(p))) redirect("/home");
}
