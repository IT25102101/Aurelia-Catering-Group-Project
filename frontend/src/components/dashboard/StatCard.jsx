/**
 * Reusable StatCard component for summary metrics across staff dashboards.
 * Displays only real dynamic backend values, with optional loading skeleton state.
 */
export default function StatCard({
  icon,
  label,
  value,
  supportingText,
  tag,
  accentColor,
  iconBg,
  loading = false,
  className = "",
}) {
  const style = {};
  if (accentColor) style["--stat-accent"] = accentColor;
  if (iconBg) style["--stat-icon-bg"] = iconBg;

  if (loading) {
    return (
      <div className={`stat-card ${className}`} style={style}>
        <div className="stat-card__top">
          <div className="skeleton-box" style={{ width: 42, height: 42, borderRadius: 8 }} />
          <div className="skeleton-box" style={{ width: 60, height: 20, borderRadius: 999 }} />
        </div>
        <div className="stat-card__content" style={{ marginTop: 8 }}>
          <div className="skeleton-box" style={{ width: 80, height: 36, marginBottom: 8 }} />
          <div className="skeleton-box" style={{ width: 140, height: 16 }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`stat-card ${className}`} style={style}>
      <div className="stat-card__top">
        {icon && <div className="stat-card__icon">{icon}</div>}
        {tag && <span className="stat-card__tag">{tag}</span>}
      </div>
      <div className="stat-card__content">
        <div className="stat-card__value">{value !== undefined && value !== null ? value : "—"}</div>
        <div className="stat-card__label">{label}</div>
        {supportingText && <div className="stat-card__supporting">{supportingText}</div>}
      </div>
    </div>
  );
}
