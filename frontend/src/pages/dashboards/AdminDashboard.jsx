import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import RequireRole from "../../components/RequireRole";
import {
  DashboardLayout,
  DashboardHeader,
  StatCard,
  QuickActionCard,
  StatusBadge,
  AlertCard,
  SectionHeader,
  DashboardTable,
} from "../../components/dashboard";

import { getEvents } from "../../api/eventApi";
import { getOrders } from "../../api/orderApi";
import { getMenuItems } from "../../api/menuItemApi";
import { getInventoryItems } from "../../api/inventoryItemApi";
import { getCateringPackages } from "../../api/cateringPackageApi";

/**
 * Clean SVG icons for admin metric cards and actions
 */
const AdminIcons = {
  events: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  orders: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  menu: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  inventory: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  packages: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  staff: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  deliveries: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  refresh: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
};

/**
 * B8.2 — Aurelia Admin Dashboard Control Center
 * Displays real-time operational metrics, low-stock alerts, recent events/orders, and quick navigation.
 */
function AdminDashboardContent() {
  const [events, setEvents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [packages, setPackages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /**
   * Concurrently fetch all datasets using real existing backend endpoints
   */
  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError("");
    }

    try {
      const [
        eventsData,
        ordersData,
        menuData,
        inventoryData,
        packagesData,
      ] = await Promise.all([
        getEvents().catch(() => []),
        getOrders().catch(() => []),
        getMenuItems().catch(() => []),
        getInventoryItems().catch(() => []),
        getCateringPackages().catch(() => []),
      ]);

      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setMenuItems(Array.isArray(menuData) ? menuData : []);
      setInventoryItems(Array.isArray(inventoryData) ? inventoryData : []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
    } catch (err) {
      setError("Unable to sync some dashboard records: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Fast in-memory lookup maps for relational display
  const eventMap = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => map.set(Number(ev.id), ev));
    return map;
  }, [events]);

  const packageMap = useMemo(() => {
    const map = new Map();
    packages.forEach((pkg) => map.set(Number(pkg.id), pkg));
    return map;
  }, [packages]);

  // Derived real metrics
  const confirmedEventsCount = useMemo(
    () => events.filter((e) => String(e.status).toUpperCase() === "CONFIRMED").length,
    [events]
  );
  const pendingEventsCount = useMemo(
    () => events.filter((e) => String(e.status).toUpperCase() === "PENDING").length,
    [events]
  );
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => String(o.status).toUpperCase() === "PENDING").length,
    [orders]
  );
  const activeOrdersCount = useMemo(
    () =>
      orders.filter((o) =>
        ["PENDING", "CONFIRMED", "PREPARING"].includes(String(o.status).toUpperCase())
      ).length,
    [orders]
  );

  // Real inventory items requiring replenishment
  const lowStockItems = useMemo(
    () =>
      inventoryItems.filter((item) => {
        const qty = Number(item.quantityInStock);
        const threshold = Number(item.reorderThreshold);
        return !isNaN(qty) && !isNaN(threshold) && qty <= threshold;
      }),
    [inventoryItems]
  );

  // Recent subsets (up to 5 items)
  const recentEvents = useMemo(() => events.slice(0, 5), [events]);
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Admin Control Center"
        subtitle="Live oversight of catering orders, culinary packages, kitchen inventory, and event delivery logistics."
        actions={
          <button
            type="button"
            className={`dashboard-refresh-btn ${refreshing ? "refreshing" : ""}`}
            onClick={() => loadAllData(true)}
            disabled={loading || refreshing}
            title="Refresh dashboard data from live backend"
          >
            {AdminIcons.refresh}
            <span>{refreshing ? "Refreshing..." : "Sync Data"}</span>
          </button>
        }
      />

      <div className="dashboard-content">
        {/* Error notification if any */}
        {error && (
          <AlertCard
            type="danger"
            title="Data Sync Notice"
            message={error}
          />
        )}

        {/* ── 1. Summary Metrics ────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Operational Overview"
            subtitle="Real-time summary counts across primary catering modules"
          />
          <div className="dashboard-stat-grid">
            <StatCard
              icon={AdminIcons.orders}
              value={orders.length}
              label="Catering Orders"
              tag={pendingOrdersCount > 0 ? `${pendingOrdersCount} In Queue` : "Orders Current"}
              supportingText={`${activeOrdersCount} active in fulfillment pipeline`}
              accentColor="var(--color-gold)"
              iconBg="rgba(184, 146, 42, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={AdminIcons.events}
              value={events.length}
              label="Catered Events"
              tag={pendingEventsCount > 0 ? `${pendingEventsCount} Pending` : `${confirmedEventsCount} Confirmed`}
              supportingText={`${confirmedEventsCount} confirmed • ${events.length} total scheduled`}
              accentColor="var(--color-primary)"
              loading={loading}
            />
            <StatCard
              icon={AdminIcons.menu}
              value={menuItems.length}
              label="Menu Items Catalog"
              tag={`${packages.length} Packages`}
              supportingText="Curated dishes and catering packages"
              accentColor="#32678C"
              iconBg="rgba(50, 103, 140, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={AdminIcons.inventory}
              value={inventoryItems.length}
              label="Inventory Items"
              tag={lowStockItems.length > 0 ? `${lowStockItems.length} Low Stock` : "Stock Healthy"}
              supportingText={
                lowStockItems.length > 0
                  ? "Requires supplier replenishment"
                  : "All pantry supplies above threshold"
              }
              accentColor={lowStockItems.length > 0 ? "var(--color-warning)" : "var(--color-success)"}
              iconBg={lowStockItems.length > 0 ? "rgba(181, 119, 30, 0.1)" : "rgba(46, 107, 55, 0.1)"}
              loading={loading}
            />
          </div>
        </section>

        {/* ── 2. Operational Alerts ──────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Operational Notices"
            subtitle="System health and inventory threshold status derived from live data"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {lowStockItems.length > 0 ? (
              <AlertCard
                type="warning"
                title={`Low Stock Warning (${lowStockItems.length} items below reorder threshold)`}
                message={
                  <div>
                    <span>The following inventory ingredients require purchase orders:</span>
                    <div className="dashboard-low-stock-grid">
                      {lowStockItems.map((item) => (
                        <span key={item.id} className="dashboard-low-stock-item">
                          <strong>{item.ingredientName}</strong>: {item.quantityInStock} {item.unit || "units"} (Threshold: {item.reorderThreshold})
                        </span>
                      ))}
                    </div>
                  </div>
                }
                action={
                  <Link to="/manage/inventory" className="btn sm gold" style={{ textDecoration: "none" }}>
                    Manage Inventory
                  </Link>
                }
              />
            ) : (
              <AlertCard
                type="success"
                title="Pantry Inventory Healthy"
                message="All registered inventory ingredients currently meet or exceed minimum operational reorder thresholds."
              />
            )}

            {pendingOrdersCount > 0 && (
              <AlertCard
                type="info"
                title={`Pending Orders Queue (${pendingOrdersCount} awaiting review)`}
                message="There are newly booked orders currently pending kitchen scheduling and operational confirmation."
                action={
                  <Link to="/manage/orders" className="btn sm secondary" style={{ textDecoration: "none" }}>
                    View Order Queue
                  </Link>
                }
              />
            )}
          </div>
        </section>

        {/* ── 3. Recent Activity (2-Column Grid) ────────────────────── */}
        <section>
          <SectionHeader
            title="Recent Activity"
            subtitle="Latest catering order records and scheduled event logistics"
          />
          <div className="dashboard-two-col-grid">
            {/* Left: Recent Catering Orders */}
            <DashboardTable
              title="Recent Catering Orders"
              headerAction={
                <Link to="/manage/orders" className="dashboard-section-header__action">
                  Manage Orders &rarr;
                </Link>
              }
              headers={["Order ID", "Client / Event", "Package", "Status"]}
              loading={loading}
              empty={recentOrders.length === 0}
              emptyTitle="No orders placed yet"
              emptyDesc="Orders submitted by clients or supervisors will display here in real time."
            >
              {recentOrders.map((ord) => {
                const matchedEvent = ord.eventId ? eventMap.get(Number(ord.eventId)) : null;
                const matchedPackage = ord.packageId ? packageMap.get(Number(ord.packageId)) : null;

                return (
                  <tr key={ord.id}>
                    <td>
                      <strong>Order #{ord.id}</strong>
                    </td>
                    <td>
                      {matchedEvent ? (
                        <div>
                          <span>{matchedEvent.customerName}</span>
                          <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                            {matchedEvent.eventType} • {matchedEvent.eventDate}
                          </small>
                        </div>
                      ) : ord.eventId ? (
                        <span>Event #{ord.eventId}</span>
                      ) : (
                        <span style={{ color: "var(--color-text-light)" }}>Unlinked</span>
                      )}
                    </td>
                    <td>
                      {matchedPackage ? (
                        <div>
                          <span>{matchedPackage.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontStyle: "italic", fontSize: "0.85rem" }}>
                          Custom / No Package
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={ord.status || "PENDING"} />
                    </td>
                  </tr>
                );
              })}
            </DashboardTable>

            {/* Right: Recent Event Schedules */}
            <DashboardTable
              title="Event Schedules & Logistics"
              headerAction={
                <Link to="/manage/events" className="dashboard-section-header__action">
                  Manage Events &rarr;
                </Link>
              }
              headers={["Client / Event", "Date & Venue", "Guests", "Status"]}
              loading={loading}
              empty={recentEvents.length === 0}
              emptyTitle="No events registered yet"
              emptyDesc="Event schedules linked to catering bookings will appear here."
            >
              {recentEvents.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <strong>{ev.customerName || `Event #${ev.id}`}</strong>
                    <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                      {ev.eventType || "Catering Event"}
                    </small>
                  </td>
                  <td>
                    <span>{ev.eventDate || "Date TBD"}</span>
                    <small style={{ display: "block", color: "var(--color-text-light)", marginTop: 2 }}>
                      {ev.venue || "Venue not specified"}
                    </small>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{ev.guestCount ? `${ev.guestCount} guests` : "—"}</span>
                  </td>
                  <td>
                    <StatusBadge status={ev.status || "PENDING"} />
                  </td>
                </tr>
              ))}
            </DashboardTable>
          </div>
        </section>

        {/* ── 4. Quick Actions Grid ─────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Management Modules"
            subtitle="Direct shortcuts to primary catering system management areas"
          />
          <div className="quick-action-grid">
            <QuickActionCard
              to="/manage/orders"
              icon={AdminIcons.orders}
              title="Catering Orders"
              description="Track catering orders, culinary preparation status, and customer special requests."
            />
            <QuickActionCard
              to="/manage/catering-packages"
              icon={AdminIcons.packages}
              title="Catering Packages"
              description="Curate bespoke package offerings, tier pricing, and guest headcount limits."
            />
            <QuickActionCard
              to="/manage/menu-items"
              icon={AdminIcons.menu}
              title="Menu Catalog"
              description="Configure culinary items, pricing, categories, and dietary tags."
            />
            <QuickActionCard
              to="/manage/inventory"
              icon={AdminIcons.inventory}
              title="Inventory & Stock"
              description="Monitor ingredient supplies, stock quantities, and reorder levels."
            />
            <QuickActionCard
              to="/manage/deliveries"
              icon={AdminIcons.deliveries}
              title="Delivery Logistics"
              description="Coordinate dispatch schedules, delivery personnel, and venue drop-offs."
            />
            <QuickActionCard
              to="/manage/events"
              icon={AdminIcons.events}
              title="Event Logistics"
              description="Manage event venue details, dates, and guest logistics supporting catering orders."
            />
            <QuickActionCard
              to="/manage/staff"
              icon={AdminIcons.staff}
              title="Staff Directory"
              description="Manage catering staff profiles, roles, and duty availability schedules."
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function AdminDashboard() {
  return (
    <RequireRole role="ADMIN">
      <AdminDashboardContent />
    </RequireRole>
  );
}
