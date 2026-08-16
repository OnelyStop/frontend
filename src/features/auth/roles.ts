import { redirect } from "next/navigation";
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

// getClaims verifies the token signature; getSession would only read the
// cookie, which a client controls.
export async function getRole(): Promise<AppRole | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;

  const role = (data.claims as { user_role?: string | null }).user_role;
  return role === "admin" || role === "editor" ? role : null;
}

export async function hasPermission(p: AppPermission): Promise<boolean> {
  const role = await getRole();
  return role ? PERMISSIONS[role].includes(p) : false;
}

// Call at the top of every admin page and server action. The proxy redirect is
// only there to avoid rendering a page the user can't use — it is not the
// security boundary, because a server action can be invoked directly.
export async function requireRole(role: AppRole) {
  const actual = await getRole();
  if (actual !== role) redirect("/home");
  return actual;
}

export async function requirePermission(p: AppPermission) {
  if (!(await hasPermission(p))) redirect("/home");
}
