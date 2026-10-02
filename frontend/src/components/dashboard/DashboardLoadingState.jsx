/**
 * Reusable loading indicator for dashboard data.
 */
export default function DashboardLoadingState({
  message = "Loading dashboard information...",
  className = "",
}) {
  return (
    <div className={`dashboard-loading-state ${className}`}>
      <div className="dashboard-spinner" aria-hidden="true" />
      <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>{message}</p>
    </div>
  );
}
