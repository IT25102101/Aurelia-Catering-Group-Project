import { useAuth } from "../../AuthContext";

/**
 * Reusable DashboardHeader for staff dashboards.
 * Supports dynamic time-based greeting with real authenticated user details.
 */
export default function DashboardHeader({
  title,
  subtitle,
  showGreeting = true,
  greetingPrefix,
  actions,
  onToggleSidebar,
}) {
  const { user } = useAuth();

  // Compute time-of-day greeting
  function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  const greeting = greetingPrefix || getTimeGreeting();
  const userName = user?.fullName || "Staff Member";

  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        {onToggleSidebar && (
          <button
            type="button"
            className="dashboard-header__toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}

        <div className="dashboard-header__titles">
          <h1 className="dashboard-header__title">
            {showGreeting ? `${greeting}, ${userName}` : title}
          </h1>
          <p className="dashboard-header__subtitle">
            {subtitle || (showGreeting && title ? title : "Here's an overview of today's catering operations.")}
          </p>
        </div>
      </div>

      {actions && <div className="dashboard-header__actions">{actions}</div>}
    </header>
  );
}
