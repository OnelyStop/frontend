"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { syncReplay } from "@/lib/posthog.client";

export function ReplayGuard() {
  const pathname = usePathname();
  useEffect(() => syncReplay(pathname), [pathname]);
  return null;
}
