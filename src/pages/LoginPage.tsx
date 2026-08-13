import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthShell } from "../components/auth/AuthShell";
import {
  AuthError,
  GoogleButton,
  SetupNotice,
} from "../components/auth/AuthBits";
import { Button } from "../components/ui/Button";

export function LoginPage() {
  const { signIn, signInWithGoogle, user, configured, googleEnabled } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Send the user back to whatever they were trying to reach
  const from = (location.state as { from?: string } | null)?.from ?? "/home";

  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    navigate(from, { replace: true });
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Pick up your path to A* where you left off."
      footer={
        <>
          New here? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {!configured && <SetupNotice />}

        {googleEnabled && (
          <>
            <GoogleButton onClick={handleGoogle} disabled={busy} />
            <div className="auth-form__divider">or</div>
          </>
        )}

        <div className="form-grid">
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@school.ac.uk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="auth-form__meta">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>
        </div>

        {error && <AuthError message={error} />}

        <Button
          type="submit"
          size="lg"
          className="auth-form__submit"
          disabled={busy || !configured}
          leftIcon={
            busy ? <Loader2 size={16} className="auth-spinner" /> : undefined
          }
        >
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
