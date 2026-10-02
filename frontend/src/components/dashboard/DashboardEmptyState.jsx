/**
 * Reusable empty state display for dashboard tables and cards.
 */
export default function DashboardEmptyState({
  title = "No data found",
  description,
  icon,
  action,
  className = "",
}) {
  return (
    <div className={`dashboard-empty-state ${className}`}>
      <div className="dashboard-empty-state__icon" aria-hidden="true">
        {icon || (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </div>
      <h3 className="dashboard-empty-state__title">{title}</h3>
      {description && <p className="dashboard-empty-state__desc">{description}</p>}
      {action && <div style={{ marginTop: "1rem" }}>{action}</div>}
    </div>
  );
}
