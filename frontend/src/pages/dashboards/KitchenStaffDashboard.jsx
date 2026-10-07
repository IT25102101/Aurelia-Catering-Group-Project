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
  DashboardEmptyState,
} from "../../components/dashboard";

import { getOrders } from "../../api/orderApi";
import { getEvents } from "../../api/eventApi";
import { getCateringPackages } from "../../api/cateringPackageApi";
import { getInventoryItems } from "../../api/inventoryItemApi";

/**
 * Clean SVG icons for kitchen operations
 */
const KitchenIcons = {
  prep: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  cooking: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  ready: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  events: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  inventory: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  refresh: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  note: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
};

/**
 * B8.4 — Kitchen Staff Dashboard
 * Practical preparation workstation for monitoring food production queues,
 * active cooking stages, guest headcounts, and special dietary requests.
 */
function KitchenStaffDashboardContent() {
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /** Concurrently load all kitchen operational data */
  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError("");
    }

    try {
      const [
        ordersData,
        eventsData,
        packagesData,
        inventoryData,
      ] = await Promise.all([
        getOrders().catch(() => []),
        getEvents().catch(() => []),
        getCateringPackages().catch(() => []),
        getInventoryItems().catch(() => []),
      ]);

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
      setInventoryItems(Array.isArray(inventoryData) ? inventoryData : []);
    } catch (err) {
      setError("Unable to sync kitchen records: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Lookup maps
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

  // Kitchen Metrics
  const queuedPrepOrders = useMemo(
    () => orders.filter((o) => ["PENDING", "CONFIRMED"].includes(String(o.status).toUpperCase())),
    [orders]
  );
  const inPrepOrders = useMemo(
    () => orders.filter((o) => String(o.status).toUpperCase() === "PREPARING"),
    [orders]
  );
  const readyOrders = useMemo(
    () => orders.filter((o) => String(o.status).toUpperCase() === "READY"),
    [orders]
  );

  // Orders sorted by kitchen preparation urgency
  const prioritizedWorkQueue = useMemo(() => {
    const statusRank = {
      PREPARING: 1,
      CONFIRMED: 2,
      PENDING: 3,
      READY: 4,
      DELIVERED: 5,
      CANCELLED: 6,
    };

    return [...orders].sort((a, b) => {
      const rankA = statusRank[String(a.status).toUpperCase()] || 99;
      const rankB = statusRank[String(b.status).toUpperCase()] || 99;
      if (rankA !== rankB) return rankA - rankB;

      // Secondary sort: nearest event date
      const eventA = a.eventId ? eventMap.get(Number(a.eventId)) : null;
      const eventB = b.eventId ? eventMap.get(Number(b.eventId)) : null;
      const dateA = eventA?.eventDate ? new Date(eventA.eventDate).getTime() : 9999999999999;
      const dateB = eventB?.eventDate ? new Date(eventB.eventDate).getTime() : 9999999999999;
      return dateA - dateB;
    });
  }, [orders, eventMap]);

  // Real Special Dietary Requests / Custom Notes
  const ordersWithSpecialRequests = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.specialRequests &&
          o.specialRequests.trim().length > 0 &&
          String(o.status).toUpperCase() !== "CANCELLED"
      ),
    [orders]
  );

  // Chronologically sorted upcoming banquets
  const upcomingEvents = useMemo(() => {
    const valid = events.filter((e) => String(e.status).toUpperCase() !== "CANCELLED");
    return [...valid]
      .sort((a, b) => new Date(a.eventDate || 0) - new Date(b.eventDate || 0))
      .slice(0, 5);
  }, [events]);

  // Low inventory items relevant to food supplies
  const lowStockIngredients = useMemo(
    () =>
      inventoryItems.filter((item) => {
        const qty = Number(item.quantityInStock);
        const threshold = Number(item.reorderThreshold);
        return !isNaN(qty) && !isNaN(threshold) && qty <= threshold;
      }),
    [inventoryItems]
  );

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Kitchen Operations"
        subtitle="Live oversight of culinary preparation queues, dish plating stages, and special dietary requests."
        actions={
          <button
            type="button"
            className={`dashboard-refresh-btn ${refreshing ? "refreshing" : ""}`}
            onClick={() => loadAllData(true)}
            disabled={loading || refreshing}
            title="Sync kitchen orders from live backend"
          >
            {KitchenIcons.refresh}
            <span>{refreshing ? "Refreshing..." : "Sync Data"}</span>
          </button>
        }
      />

      <div className="dashboard-content">
        {/* Error notification */}
        {error && (
          <AlertCard
            type="danger"
            title="Kitchen Sync Notice"
            message={error}
          />
        )}

        {/* ── 1. Kitchen Summary Cards ──────────────────────────────── */}
        <section>
          <SectionHeader
            title="Kitchen Production Summary"
            subtitle="Current status breakdown across all catering preparation workloads"
          />
          <div className="dashboard-stat-grid">
            <StatCard
              icon={KitchenIcons.prep}
              value={queuedPrepOrders.length}
              label="Queued for Prep"
              tag={queuedPrepOrders.length > 0 ? "Awaiting Cooking" : "Queue Clear"}
              supportingText="Pending & confirmed orders ready to start"
              accentColor="var(--color-warning)"
              iconBg="rgba(181, 119, 30, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={KitchenIcons.cooking}
              value={inPrepOrders.length}
              label="In Preparation"
              tag="Active Production"
              supportingText="Currently being cooked, baked, or plated"
              accentColor="var(--color-primary)"
              iconBg="rgba(44, 74, 46, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={KitchenIcons.ready}
              value={readyOrders.length}
              label="Ready for Pickup"
              tag="Staged"
              supportingText="Completed dishes staged for courier dispatch"
              accentColor="#2F5634"
              iconBg="rgba(143, 175, 140, 0.18)"
              loading={loading}
            />
            <StatCard
              icon={KitchenIcons.events}
              value={upcomingEvents.length}
              label="Upcoming Banquets"
              tag={`${events.length} Total Events`}
              supportingText="Service banquets scheduled on calendar"
              accentColor="#32678C"
              iconBg="rgba(50, 103, 140, 0.1)"
              loading={loading}
            />
          </div>
        </section>

        {/* ── 2. Kitchen Preparation Work Queue (Main Section) ──────── */}
        <section>
          <SectionHeader
            title="Kitchen Work Queue"
            subtitle="Prioritized preparation pipeline sorted by urgency and upcoming event timeline"
            actionLabel="Update Order Status"
            actionTo="/manage/orders"
          />
          <DashboardTable
            headers={["Order #", "Client / Event", "Package Selected", "Event Date & Time", "Special Requests", "Status"]}
            loading={loading}
            empty={prioritizedWorkQueue.length === 0}
            emptyTitle="No catering orders in kitchen queue"
            emptyDesc="Orders booked through the management system will automatically populate here."
          >
            {prioritizedWorkQueue.map((ord) => {
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
                        <strong>{matchedEvent.customerName}</strong>
                        <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                          {matchedEvent.eventType} • {matchedEvent.guestCount ? `${matchedEvent.guestCount} guests` : "Guests TBD"}
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
                    {matchedEvent ? (
                      <div>
                        <span>{matchedEvent.eventDate || "Date TBD"}</span>
                        <small style={{ display: "block", color: "var(--color-text-light)", marginTop: 2 }}>
                          {matchedEvent.startTime ? `Start: ${matchedEvent.startTime}` : "Time TBD"}
                        </small>
                      </div>
                    ) : (
                      <span style={{ color: "var(--color-text-light)" }}>—</span>
                    )}
                  </td>
                  <td>
                    {ord.specialRequests ? (
                      <div
                        style={{
                          backgroundColor: "rgba(184, 146, 42, 0.08)",
                          border: "1px solid rgba(184, 146, 42, 0.25)",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "0.82rem",
                          color: "#7B6012",
                          maxWidth: 240,
                          lineHeight: 1.3,
                        }}
                      >
                        {ord.specialRequests}
                      </div>
                    ) : (
                      <span style={{ color: "var(--color-text-light)", fontSize: "0.82rem" }}>Standard menu</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={ord.status || "PENDING"} />
                  </td>
                </tr>
              );
            })}
          </DashboardTable>
        </section>

        {/* ── 3. Special Requests & Ingredient Alerts (2-Col Grid) ──── */}
        <section>
          <div className="dashboard-two-col-grid">
            {/* Left: Special Dietary & Custom Kitchen Notes */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ color: "var(--color-gold)" }}>{KitchenIcons.note}</div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", margin: 0 }}>
                    Special Dietary Instructions
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                    Active custom requests recorded on customer orders
                  </p>
                </div>
              </div>

              {ordersWithSpecialRequests.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", overflowY: "auto" }}>
                  {ordersWithSpecialRequests.map((ord) => {
                    const matchedEvent = ord.eventId ? eventMap.get(Number(ord.eventId)) : null;
                    return (
                      <div
                        key={ord.id}
                        style={{
                          backgroundColor: "var(--color-surface-alt)",
                          border: "1px solid var(--color-border-light)",
                          borderRadius: "var(--radius-md)",
                          padding: "10px 12px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <strong style={{ fontSize: "0.85rem", color: "var(--color-charcoal)" }}>
                            Order #{ord.id} • {matchedEvent?.customerName || "Customer"}
                          </strong>
                          <small style={{ color: "var(--color-text-muted)" }}>
                            {matchedEvent?.eventDate || "Date TBD"}
                          </small>
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "var(--color-text)", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
                          &ldquo;{ord.specialRequests}&rdquo;
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <DashboardEmptyState
                  title="No Custom Requests"
                  description="All active orders are following standard catering package recipes."
                />
              )}
            </div>

            {/* Right: Pantry Ingredient Stock Alerts */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ color: "var(--color-primary)" }}>{KitchenIcons.inventory}</div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", margin: 0 }}>
                    Kitchen Ingredient Alerts
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                    Pantry supplies at or below reorder threshold
                  </p>
                </div>
              </div>

              {lowStockIngredients.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <AlertCard
                    type="warning"
                    title={`Pantry Restock Warning (${lowStockIngredients.length} ingredients low)`}
                    message={
                      <div>
                        <span>The following ingredients need kitchen replenishment:</span>
                        <div className="dashboard-low-stock-grid">
                          {lowStockIngredients.map((item) => (
                            <span key={item.id} className="dashboard-low-stock-item">
                              <strong>{item.ingredientName}</strong>: {item.quantityInStock} {item.unit || "units"} (Reorder at: {item.reorderThreshold})
                            </span>
                          ))}
                        </div>
                      </div>
                    }
                    action={
                      <Link to="/manage/inventory" className="btn sm gold" style={{ textDecoration: "none" }}>
                        View Inventory
                      </Link>
                    }
                  />
                </div>
              ) : (
                <AlertCard
                  type="success"
                  title="Pantry Stock Optimal"
                  message="All registered culinary ingredients are currently above their minimum threshold levels."
                />
              )}

              <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--color-border-light)" }}>
                <Link to="/manage/inventory" className="dashboard-section-header__action">
                  Open Ingredient Inventory &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Upcoming Banquet Service Schedule ───────────────────── */}
        <section>
          <SectionHeader
            title="Upcoming Banquet Service Schedule"
            subtitle="Event venues and guest headcounts for culinary batch sizing"
          />
          <DashboardTable
            headers={["Event / Client", "Event Type", "Date & Time", "Venue Location", "Guest Headcount", "Status"]}
            loading={loading}
            empty={upcomingEvents.length === 0}
            emptyTitle="No upcoming events scheduled"
            emptyDesc="Confirmed bookings will display here with headcount requirements."
          >
            {upcomingEvents.map((ev) => (
              <tr key={ev.id}>
                <td>
                  <strong>{ev.customerName || `Event #${ev.id}`}</strong>
                </td>
                <td>
                  <span>{ev.eventType || "Event"}</span>
                </td>
                <td>
                  <span>{ev.eventDate || "Date TBD"}</span>
                  <small style={{ display: "block", color: "var(--color-text-light)", marginTop: 2 }}>
                    {ev.startTime || "Time TBD"}
                  </small>
                </td>
                <td>
                  <span>{ev.venue || "Venue not specified"}</span>
                </td>
                <td>
                  <strong style={{ color: "var(--color-primary)", fontSize: "0.95rem" }}>
                    {ev.guestCount ? `${ev.guestCount} guests` : "—"}
                  </strong>
                </td>
                <td>
                  <StatusBadge status={ev.status || "PENDING"} />
                </td>
              </tr>
            ))}
          </DashboardTable>
        </section>

        {/* ── 5. Quick Actions ───────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Kitchen Workstations"
            subtitle="Access primary kitchen management and supply areas"
          />
          <div className="quick-action-grid">
            <QuickActionCard
              to="/manage/orders"
              icon={KitchenIcons.prep}
              title="Orders & Prep Status"
              description="Update cooking progress, mark orders ready, and review dietary requests."
              badge={queuedPrepOrders.length > 0 ? `${queuedPrepOrders.length} In Queue` : undefined}
            />
            <QuickActionCard
              to="/manage/menu-items"
              icon={KitchenIcons.cooking}
              title="Menu Items Catalog"
              description="Inspect culinary items, ingredients, category groupings, and dietary tags."
            />
            <QuickActionCard
              to="/manage/inventory"
              icon={KitchenIcons.inventory}
              title="Ingredient Stock"
              description="Monitor pantry quantities, unit measures, and threshold restock levels."
              badge={lowStockIngredients.length > 0 ? `${lowStockIngredients.length} Low Stock` : undefined}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function KitchenStaffDashboard() {
  return (
    <RequireRole role="KITCHEN_STAFF">
      <KitchenStaffDashboardContent />
    </RequireRole>
  );
}
