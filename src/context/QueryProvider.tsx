"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Never module scope: on the server that would serve one user's cache to the next.
  const [client] = useState(makeQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
