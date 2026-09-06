"use client";

import { useEffect, useState } from "react";
import { fetchEnabledProviders } from "@/lib/supabase";

// Asked from the sign-in pages only: Google can be switched on in the
// dashboard without a redeploy, and every other page skips the request.
export function useEnabledProviders() {
  const [google, setGoogle] = useState(false);

  useEffect(() => {
    let active = true;
    fetchEnabledProviders().then((providers) => {
      if (active) setGoogle(providers.google);
    });
    return () => {
      active = false;
    };
  }, []);

  return { google };
}
