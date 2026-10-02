import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

/**
 * Route protection guard.
 * Supports:
 *   - single role: <RequireRole role="ADMIN">
 *   - multiple allowed roles: <RequireRole allowedRoles={["ADMIN", "OPERATIONS_SUPERVISOR"]}>
 *
 * If not authenticated: redirects to /login.
 * If authenticated with unauthorized role: redirects to the user's role dashboard.
 */
export default function RequireRole({ role, allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine authorized roles
  const permitted = allowedRoles
    ? allowedRoles.map((r) => r.toUpperCase())
    : role
    ? [role.toUpperCase()]
    : [];

  const userRole = (user.role || "").toUpperCase();

  if (permitted.length > 0 && !permitted.includes(userRole)) {
    // Redirect unauthorized user to their own role dashboard
    const targetDashboard = userRole.toLowerCase();
    return <Navigate to={`/dashboard/${targetDashboard}`} replace />;
  }

  return children;
}

