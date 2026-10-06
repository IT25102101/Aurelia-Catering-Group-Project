import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../AuthContext";
import { register, login } from "../api/authApi";

/**
 * Signup is for customers only — staff/admin accounts are created by
 * an admin directly (e.g. via POST /api/auth/register with a different
 * role, or straight into the database), not through this public form.
 * That's why "role" isn't a field here — it's hardcoded to "CUSTOMER".
 */
export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login: setLoggedInUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please create a password.");
      return;
    }

    setLoading(true);
    try {
      await register(fullName.trim(), email.trim(), password, "CUSTOMER");
      const user = await login(email.trim(), password);
      setLoggedInUser(user);
      navigate("/menu");
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <Navbar />

      <main className="section auth-main" id="signup-section">
        <div className="container auth-container">
          <div className="auth-card card">
            {/* Header */}
            <div className="auth-card__header text-center">
              <span className="eyebrow">AURELIA REGISTRATION</span>
              <h1 className="auth-card__title">Create an Account</h1>
              <p className="auth-card__subtitle">
                Register as an Aurelia client to book bespoke catering and manage banquet events.
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
              {/* Full Name */}
              <div className="booking-field">
                <label className="booking-label" htmlFor="name-input">
                  Full Name <span className="booking-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="name-input"
                  type="text"
                  className="booking-input"
                  placeholder="e.g. Ruwan Perera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="booking-field">
                <label className="booking-label" htmlFor="email-input">
                  Email Address <span className="booking-required" aria-hidden="true">*</span>
                </label>
                <input
                  id="email-input"
                  type="email"
                  className="booking-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              {/* Password with Show/Hide Toggle */}
              <div className="booking-field">
                <div className="auth-password-header">
                  <label className="booking-label" htmlFor="password-input">
                    Password <span className="booking-required" aria-hidden="true">*</span>
                  </label>
                </div>
                <div className="auth-password-wrapper">
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    className="booking-input auth-password-input"
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
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
                    Creating account&hellip;
                  </>
                ) : (
                  "Create Account &rarr;"
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="auth-card__footer text-center">
              <p className="auth-footer-text">
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
