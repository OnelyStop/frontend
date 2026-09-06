import { NextResponse } from "next/server";
import { getRole } from "@/features/auth/roles";
import { getAdminStatus } from "@/features/admin/queries.server";

export const dynamic = "force-dynamic";

// The layout's requireRole redirects, which a polling fetch cannot follow —
// this returns 403 so the client renders an error instead of parsing HTML.
export async function GET() {
  if ((await getRole()) !== "admin")
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  return NextResponse.json(await getAdminStatus());
}
