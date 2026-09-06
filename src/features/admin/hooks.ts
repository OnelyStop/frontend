"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/query/fetcher";
import type { AdminStatus } from "./types";

export const adminKeys = {
  all: ["admin"] as const,
  status: () => [...adminKeys.all, "status"] as const,
};

const POLL_MS = 10_000;

export function useAdminStatus() {
  return useQuery({
    queryKey: adminKeys.status(),
    queryFn: () => apiFetch<AdminStatus>("/api/v1/admin/status"),
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}
