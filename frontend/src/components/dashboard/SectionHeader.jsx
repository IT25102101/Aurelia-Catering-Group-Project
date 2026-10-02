import { Link } from "react-router-dom";

/**
 * Reusable SectionHeader for dashboard groupings (e.g. "Recent Orders", "Quick Management Links").
 */
export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionTo,
  actionOnClick,
  className = "",
}) {
  return (
    <div className={`dashboard-section-header ${className}`}>
      <div>
        <h2 className="dashboard-section-header__title">{title}</h2>
        {subtitle && <p className="dashboard-section-header__subtitle">{subtitle}</p>}
      </div>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="dashboard-section-header__action">
          {actionLabel} &rarr;
        </Link>
      )}
      {actionLabel && !actionTo && actionOnClick && (
        <button
          type="button"
          onClick={actionOnClick}
          className="dashboard-section-header__action"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
