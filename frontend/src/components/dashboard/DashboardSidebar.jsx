import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";

/**
 * Clean SVG icons for sidebar navigation items
 */
const NavIcons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9"/>
      <rect x="14" y="3" width="7" height="5"/>
      <rect x="14" y="12" width="7" height="9"/>
      <rect x="3" y="16" width="7" height="5"/>
    </svg>
  ),
  events: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  menu: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  packages: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  orders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  inventory: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  deliveries: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  staff: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  recipes: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
};

export default function DashboardSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = (user?.role || "STAFF").toUpperCase();

  function handleLogout() {
    logout();
    if (onClose) onClose();
    navigate("/");
  }

  // Define navigation configuration strictly matching existing routes & user roles
  function getNavItems() {
    const dashboardLink = {
      label: "Overview",
      to: `/dashboard/${userRole.toLowerCase()}`,
      icon: NavIcons.dashboard,
      end: true,
    };

    switch (userRole) {
      case "ADMIN":
        return [
          dashboardLink,
          { label: "Catering Orders", to: "/manage/orders", icon: NavIcons.orders },
          { label: "Catering Packages", to: "/manage/catering-packages", icon: NavIcons.packages },
          { label: "Menu Catalog", to: "/manage/menu-items", icon: NavIcons.menu },
          { label: "Recipe Ingredients", to: "/manage/recipes", icon: NavIcons.recipes },
          { label: "Inventory & Stock", to: "/manage/inventory", icon: NavIcons.inventory },
          { label: "Delivery Logistics", to: "/manage/deliveries", icon: NavIcons.deliveries },
          { label: "Event Logistics", to: "/manage/events", icon: NavIcons.events },
          { label: "Staff Directory", to: "/manage/staff", icon: NavIcons.staff },
        ];

      case "OPERATIONS_SUPERVISOR":
        return [
          dashboardLink,
          { label: "Catering Order Queue", to: "/manage/orders", icon: NavIcons.orders },
          { label: "Delivery Dispatch", to: "/manage/deliveries", icon: NavIcons.deliveries },
          { label: "Event Schedules", to: "/manage/events", icon: NavIcons.events },
          { label: "Staff Roster", to: "/manage/staff", icon: NavIcons.staff },
        ];

      case "KITCHEN_STAFF":
        return [
          dashboardLink,
          { label: "Orders & Prep", to: "/manage/orders", icon: NavIcons.orders },
          { label: "Menu Catalog", to: "/manage/menu-items", icon: NavIcons.menu },
          { label: "Recipe Ingredients", to: "/manage/recipes", icon: NavIcons.recipes },
          { label: "Ingredient Stock", to: "/manage/inventory", icon: NavIcons.inventory },
        ];

      case "DELIVERY_STAFF":
        return [
          dashboardLink,
          { label: "My Deliveries", to: "/manage/deliveries", icon: NavIcons.deliveries },
        ];

      case "FINANCE_OFFICER":
        return [
          dashboardLink,
          { label: "Orders & Invoicing", to: "/manage/orders", icon: NavIcons.orders },
        ];

      case "INVENTORY_COORDINATOR":
        return [
          dashboardLink,
          { label: "Stock & Supplies", to: "/manage/inventory", icon: NavIcons.inventory },
        ];

      default:
        return [dashboardLink];
    }
  }

  const navItems = getNavItems();
  const roleDisplay = userRole.replace(/_/g, " ");

  return (
    <aside className={`dashboard-sidebar ${isOpen ? "open" : ""}`}>
      {/* Brand Crest */}
      <Link to="/" className="dashboard-sidebar__brand" onClick={onClose}>
        <div className="dashboard-sidebar__logo-crest">A</div>
        <div className="dashboard-sidebar__brand-text">
          <span className="dashboard-sidebar__brand-title">AURELIA</span>
          <span className="dashboard-sidebar__brand-subtitle">Catering Management</span>
        </div>
      </Link>

      {/* Role Pill */}
      <div className="dashboard-sidebar__role-pill">
        <span className="dashboard-sidebar__role-label">Portal</span>
        <span className="dashboard-sidebar__role-tag">{roleDisplay}</span>
      </div>

      {/* Navigation List */}
      <nav className="dashboard-sidebar__nav">
        <div className="dashboard-sidebar__nav-heading">Management</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `dashboard-sidebar__link ${isActive ? "active" : ""}`
            }
            onClick={onClose}
          >
            <span className="dashboard-sidebar__link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Staff Footer */}
      <div className="dashboard-sidebar__footer">
        <div className="dashboard-sidebar__user">
          <div className="dashboard-sidebar__user-avatar">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <div className="dashboard-sidebar__user-details">
            <div className="dashboard-sidebar__user-name" title={user?.fullName}>
              {user?.fullName || "Staff User"}
            </div>
            <div className="dashboard-sidebar__user-role">{user?.email || roleDisplay}</div>
          </div>
        </div>

        <div className="dashboard-sidebar__footer-actions">
          <Link to="/" className="dashboard-sidebar__btn-public" onClick={onClose}>
            Public Site
          </Link>
          <button
            type="button"
            className="dashboard-sidebar__btn-logout"
            onClick={handleLogout}
            title="Log out of session"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
