import { sql } from "drizzle-orm";
import {
  bigint,
  pgEnum,
  pgPolicy,
  pgTable,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";

export const appRole = pgEnum("app_role", ["admin", "editor"]);

export const appPermission = pgEnum("app_permission", [
  "questions.create",
  "questions.update",
  "questions.delete",
  "papers.import",
  "users.read",
]);

// Not user_metadata: the user can write to that and make themselves an admin.
export const userRoles = pgTable(
  "user_roles",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    userId: uuid("user_id").notNull(),
    role: appRole("role").notNull(),
  },
  (t) => [
    unique("user_roles_user_id_role_key").on(t.userId, t.role),

    // Postgres checks grants before RLS, so this is inert without the migration's GRANT.
    pgPolicy("signed-in users can read their own role", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${t.userId}`,
    }),
  ],
).enableRLS();

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedByDefaultAsIdentity(),
    role: appRole("role").notNull(),
    permission: appPermission("permission").notNull(),
  },
  (t) => [
    unique("role_permissions_role_permission_key").on(t.role, t.permission),

    pgPolicy("signed-in users can read permissions", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
).enableRLS();
