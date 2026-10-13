import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../AuthContext";
import { login } from "../api/authApi";

const ROLES = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "ADMIN", label: "Admin" },
  { value: "OPERATIONS_SUPERVISOR", label: "Operations Supervisor" },
  { value: "KITCHEN_STAFF", label: "Kitchen Staff" },
  { value: "DELIVERY_STAFF", label: "Delivery Staff" },
  { value: "FINANCE_OFFICER", label: "Finance Officer" },
  { value: "INVENTORY_COORDINATOR", label: "Inventory Coordinator" },
];

export default function LoginPage() {
  const [role, setRole] = useState("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login: setLoggedInUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      // Authenticate against existing auth API contract
      const user = await login(email.trim(), password);
      setLoggedInUser(user);

      // Route according to redirect parameter or user's assigned role
      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role && user.role.toUpperCase() === "CUSTOMER") {
        navigate("/menu");
      } else if (user.role) {
        navigate(`/dashboard/${user.role.toLowerCase()}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.message || "Unable to complete sign in. Please verify your credentials or server connection."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <Navbar />

      <main className="section auth-main" id="login-section">
        <div className="container auth-container">
          <div className="auth-card card">
            {/* Header */}
            <div className="auth-card__header text-center">
              <span className="eyebrow">AURELIA ACCESS</span>
              <h1 className="auth-card__title">Welcome Back</h1>
              <p className="auth-card__subtitle">
                Sign in to manage your catering bookings or access your staff portal.
              </p>
              <div className="gold-rule mx-auto mt-4"></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="auth-error-alert mb-5" role="alert">
                <span className="auth-error-icon" aria-hidden="true">&#9888;</span>
                <span className="auth-error-text">{error}</span>
              </div>
            )}

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Role Selector */}
              <div className="booking-field">
                <label className="booking-label" htmlFor="role-select">
                  Account Type <span className="booking-required" aria-hidden="true">*</span>
                </label>
                <select
                  id="role-select"
                  className="booking-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email / Username / Phone */}
              <div className="booking-field">
                <label className="booking-label" htmlFor="email-input">
                  {role === "CUSTOMER" ? "Email Address / Username" : "Email or Username"} <span className="booking-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="email-input"
                  type="text"
                  className="booking-input"
                  placeholder={role === "CUSTOMER" ? "e.g. name@example.com or 0771234567" : "name@example.com or username"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              {/* Password with Show/Hide Toggle */}
              <div className="booking-field">
                <div className="auth-password-header">
                  <label className="booking-label" htmlFor="password-input">
                    Password <span className="booking-required" aria-hidden="true">*</span>
                  </label>
                  {role === "CUSTOMER" && (
                    <span style={{ fontSize: "0.78rem", color: "var(--gold, #d4af37)" }}>
                      (Initial password = registered phone #)
                    </span>
                  )}
                </div>
                <div className="auth-password-wrapper">
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    className="booking-input auth-password-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn gold auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-sm mr-2" aria-hidden="true"></span>
                    Signing in&hellip;
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="auth-card__footer text-center">
              <p className="auth-footer-text">
                New customer?{" "}
                <Link
                  to={redirectPath ? `/signup?redirect=${encodeURIComponent(redirectPath)}` : "/signup"}
                  className="auth-link"
                >
                  Create an account
                </Link>
              </p>
              <Link to="/" className="auth-back-link mt-3">
                &larr; Return to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
