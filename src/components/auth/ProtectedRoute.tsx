import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Session restore is async — rendering the redirect first would bounce
  // signed-in users to /login on every refresh
  if (loading) {
    return <div className="route-loading" aria-busy="true" />;
  }

  if (!user) {
    // Keep the query string so e.g. ?billing=annual survives the round trip
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}
