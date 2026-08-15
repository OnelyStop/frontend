import { AuthShell } from "./AuthShell";

// Rendered on the server for auth pages that read search params. Without a
// real fallback those routes ship an empty document and flash white.
export function AuthShellFallback({ title }: { title: string }) {
  return (
    <AuthShell title={title} subtitle="Loading…" footer={null}>
      <div className="auth-form auth-confirm" aria-busy="true" />
    </AuthShell>
  );
}
