import { NextResponse } from "next/server";
import { getRole } from "@/features/auth/roles";
import { getAdminStatus } from "@/features/admin/queries.server";

export const dynamic = "force-dynamic";

// requireRole redirects, which a polling fetch cannot follow; this 403s instead.
export async function GET() {
  if ((await getRole()) !== "admin")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return NextResponse.json(await getAdminStatus());
}
