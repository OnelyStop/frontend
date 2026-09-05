import type { Metadata } from "next";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { getRole } from "@/features/auth/roles";
import { Badge, Card, PageHeader, SectionTitle } from "@/design-system";
import { PipelinePanel } from "./pipeline-panel";

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
    <>
      <PageHeader
        title="Control room"
        sub="Manage the question bank, papers, and access."
      />

      <Card>
        <SectionTitle
          aside={
            failing.length === 0 ? (
              <Badge tone="ok">All checks passing</Badge>
            ) : (
              <Badge tone="bad">{failing.length} failing</Badge>
            )
          }
        >
          RBAC status
        </SectionTitle>

        <ul className="grid gap-3">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2.5">
              {c.ok ? (
                <CheckCircle2 size={16} className="text-ok mt-0.5 shrink-0" />
              ) : (
                <XCircle size={16} className="text-bad mt-0.5 shrink-0" />
              )}
              <div>
                <div className="text-[14px]">{c.label}</div>
                <div className="text-ink-3 text-[13px]">{c.detail}</div>
              </div>
            </li>
          ))}
        </ul>

        {failing.length > 0 && (
          <div className="rounded-ctl bg-warn-soft text-warn mt-5 flex items-start gap-2 px-3 py-2.5 text-[13.5px] leading-relaxed">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <div>
              Run <code>bun run db:migrate</code>. If a role is missing, grant
              it with an insert into <code>user_roles</code> from the SQL
              editor.
            </div>
          </div>
        )}
      </Card>

      <PipelinePanel />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Questions", hint: "Import, edit, and retire questions" },
          { label: "Papers", hint: "Group questions into full mock papers" },
          { label: "Users", hint: "Roles and plan management" },
        ].map((card) => (
          <Card key={card.label} pad={false} className="p-5">
            <div className="text-[15px] font-medium">{card.label}</div>
            <div className="text-ink-3 mt-1 text-[13.5px]">{card.hint}</div>
          </Card>
        ))}
      </div>
    </>
  );
}
