/**
 * Reusable AlertCard for operational notices and dashboard alerts.
 * Displays only real application-driven notifications.
 */
export default function AlertCard({
  type = "info",
  title,
  message,
  icon,
  action,
  className = "",
}) {
  // Default icons for alert variants
  const defaultIcons = {
    warning: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
    danger: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    success: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  };

  return (
    <div className={`dashboard-alert-card dashboard-alert-card--${type} ${className}`}>
      <div className="dashboard-alert-card__icon" aria-hidden="true">
        {icon || defaultIcons[type] || defaultIcons.info}
      </div>
      <div className="dashboard-alert-card__body">
        {title && <div className="dashboard-alert-card__title">{title}</div>}
        <div className="dashboard-alert-card__msg">{message}</div>
      </div>
      {action && <div className="dashboard-alert-card__action">{action}</div>}
    </div>
  );
}
