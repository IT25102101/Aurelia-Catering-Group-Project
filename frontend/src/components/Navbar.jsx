import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

/**
 * Aurelia Catering & Events — Primary Navigation Bar
 * 
 * Features:
 * - Scrolled state with backdrop blur and elevated surface
 * - Desktop nav with active indicators and "Book an Event" CTA
 * - Accessible mobile navigation drawer with hamburger toggle
 * - Seamless integration with existing AuthContext (in-memory auth)
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor scroll for transition to solid/elevated navbar
  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }

    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  function handleLogout() {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  }

  return (
    <header className={`navbar-header ${isScrolled ? "scrolled" : ""}`}>
      <nav className="navbar" aria-label="Main Navigation">
        {/* Brand / Logo */}
        <Link to="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
          <span className="brand-title">AURELIA</span>
          <span className="brand-subtitle">Catering &amp; Events</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar__links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/packages"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Catering Packages
          </NavLink>
          <NavLink
            to="/menu"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Food Menu
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Catering Occasions
          </NavLink>
          <NavLink
            to="/track"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Track Order
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Contact
          </NavLink>
        </div>

        {/* Right CTA & Authentication Actions */}
        <div className="navbar__actions">
          {/* Primary CTA: Book Catering */}
          <Link to="/packages" className="btn btn-book">
            Book Catering
          </Link>

          {/* Auth State */}
          {user ? (
            <div className="navbar__user-menu">
              <Link
                to={`/dashboard/${user.role.toLowerCase()}`}
                className="user-badge-link"
                title="Go to Dashboard"
              >
                <span className="user-avatar">{user.fullName?.charAt(0) || "U"}</span>
                <span className="user-name">{user.fullName}</span>
              </Link>
              <button
                type="button"
                className="btn secondary sm logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn" title="Staff &amp; Administration Portal">
              Staff Portal
            </Link>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className={`navbar__toggle ${mobileMenuOpen ? "open" : ""}`}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="hamburger-box">
              <span className="hamburger-inner"></span>
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        id="mobile-nav-drawer"
        className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="mobile-drawer__header">
          <Link to="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
            <span className="brand-title">AURELIA</span>
            <span className="brand-subtitle">Catering &amp; Events</span>
          </Link>
          <button
            type="button"
            className="mobile-drawer__close"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            &times;
          </button>
        </div>

        <div className="mobile-drawer__links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/packages"
            className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Catering Packages
          </NavLink>
          <NavLink
            to="/menu"
            className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Food Menu
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Catering Occasions
          </NavLink>
          <NavLink
            to="/track"
            className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Track Order
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            About Aurelia
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact &amp; Inquiries
          </NavLink>
        </div>

        <div className="mobile-drawer__footer">
          <Link
            to="/packages"
            className="btn btn-book"
            style={{ width: "100%", marginBottom: "12px" }}
            onClick={() => setMobileMenuOpen(false)}
          >
            Book Catering
          </Link>

          {user ? (
            <div className="mobile-drawer__user">
              <Link
                to={`/dashboard/${user.role.toLowerCase()}`}
                className="btn secondary"
                style={{ width: "100%", marginBottom: "8px" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard ({user.fullName})
              </Link>
              <button
                type="button"
                className="btn danger"
                style={{ width: "100%" }}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn secondary"
              style={{ width: "100%" }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Staff Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
