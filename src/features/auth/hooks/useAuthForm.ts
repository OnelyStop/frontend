"use client";

import { useState, type FormEvent } from "react";

type Result = { error: string | null };

export function useAuthForm(
  submit: () => Promise<Result & Record<string, unknown>>,
  onSuccess?: (result: Record<string, unknown>) => void,
) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await submit();
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.(result);
  };

  return { error, setError, busy, handleSubmit };
}
