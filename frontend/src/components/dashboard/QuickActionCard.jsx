import { Link } from "react-router-dom";

/**
 * Reusable QuickActionCard for navigating to existing functional management modules.
 */
export default function QuickActionCard({
  to,
  title,
  description,
  icon,
  badge,
  className = "",
}) {
  return (
    <Link to={to} className={`quick-action-card ${className}`}>
      <div className="quick-action-card__header">
        {icon && <div className="quick-action-card__icon-box">{icon}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {badge && <span className="stat-card__tag">{badge}</span>}
          <span className="quick-action-card__arrow" aria-hidden="true">&rarr;</span>
        </div>
      </div>
      <div>
        <div className="quick-action-card__title">{title}</div>
        {description && <div className="quick-action-card__desc">{description}</div>}
      </div>
    </Link>
  );
}
