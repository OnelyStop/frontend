import "@/styles/global.css";
import type { Metadata } from "next";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { getRole } from "@/features/auth/roles";
import "./admin.css";

export const metadata: Metadata = { title: "Admin" };

type Check = { label: string; ok: boolean; detail: string };

// Walks the RBAC chain end to end so a half-finished setup is obvious rather
// than showing up later as a mysterious permission denial.
async function runChecks(): Promise<Check[]> {
  const supabase = await createClient();
  const checks: Check[] = [];

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  checks.push({
    label: "Signed in",
    ok: Boolean(user),
    detail: user?.email ?? "no session",
  });

  const role = await getRole();
  checks.push({
    label: "Role resolved",
    ok: role !== null,
    detail: role ?? "no role assigned to this account",
  });

  const { data: roleRows, error: rolesError } = await supabase
    .from("user_roles")
    .select("role");
  checks.push({
    label: "user_roles table reachable",
    ok: !rolesError,
    detail: rolesError
      ? `${rolesError.code}: ${rolesError.message}`
      : `${roleRows?.length ?? 0} row(s) visible under RLS`,
  });

  const { data: permRows, error: permsError } = await supabase
    .from("role_permissions")
    .select("role, permission");
  checks.push({
    label: "role_permissions seeded",
    ok: !permsError && (permRows?.length ?? 0) > 0,
    detail: permsError
      ? `${permsError.code}: ${permsError.message}`
      : `${permRows?.length ?? 0} permission mapping(s)`,
  });

  return checks;
}

export default async function Page() {
  const checks = await runChecks();
  const failing = checks.filter((c) => !c.ok);

  return (
    <div className="page">
      <div className="page__eyebrow">Admin</div>
      <h1 className="page__title">Control room</h1>
      <p className="page__desc">
        Manage the question bank, papers, and access.
      </p>

      <section className="admin-status">
        <div className="admin-status__head">
          <h2 className="panel__title">RBAC status</h2>
          {failing.length === 0 ? (
            <span className="admin-pill admin-pill--ok">
              All checks passing
            </span>
          ) : (
            <span className="admin-pill admin-pill--bad">
              {failing.length} failing
            </span>
          )}
        </div>

        <ul className="admin-checks">
          {checks.map((c) => (
            <li key={c.label} className="admin-check">
              {c.ok ? (
                <CheckCircle2 size={16} className="admin-check__ok" />
              ) : (
                <XCircle size={16} className="admin-check__bad" />
              )}
              <div>
                <div className="admin-check__label">{c.label}</div>
                <div className="admin-check__detail">{c.detail}</div>
              </div>
            </li>
          ))}
        </ul>

        {failing.length > 0 && (
          <div className="admin-hint">
            <AlertCircle size={15} />
            <div>
              Run <code>bun run db:migrate</code>. If a role is missing, grant
              it with an insert into <code>user_roles</code> from the SQL
              editor.
            </div>
          </div>
        )}
      </section>

      <div className="grid-3" style={{ marginTop: 20 }}>
        {[
          { label: "Questions", hint: "Import, edit, and retire questions" },
          { label: "Papers", hint: "Group questions into full mock papers" },
          { label: "Users", hint: "Roles and plan management" },
        ].map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-card__label">{card.label}</div>
            <div className="stat-card__hint">{card.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
