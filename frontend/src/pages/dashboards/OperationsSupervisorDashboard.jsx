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
import { getDeliverys } from "../../api/deliveryApi";
import { getStaffs } from "../../api/staffApi";
import { getCateringPackages } from "../../api/cateringPackageApi";

/**
 * Clean SVG icons for operational dashboard metrics
 */
const OpsIcons = {
  orders: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
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
  deliveries: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
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
  refresh: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  unassigned: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

/**
 * B8.3 — Operations Supervisor Dashboard
 * Mission-control center for operational coordination, unassigned delivery triage,
 * active order preparation queues, upcoming event schedules, and staff rosters.
 */
function OperationsSupervisorDashboardContent() {
  const [events, setEvents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [packages, setPackages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /** Concurrently load all operational datasets from backend */
  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError("");
    }

    try {
      const [
        eventsData,
        ordersData,
        deliveriesData,
        staffData,
        packagesData,
      ] = await Promise.all([
        getEvents().catch(() => []),
        getOrders().catch(() => []),
        getDeliverys().catch(() => []),
        getStaffs().catch(() => []),
        getCateringPackages().catch(() => []),
      ]);

      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
    } catch (err) {
      setError("Unable to sync operational datasets: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Fast in-memory lookup maps
  const eventMap = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => map.set(Number(ev.id), ev));
    return map;
  }, [events]);

  const staffMap = useMemo(() => {
    const map = new Map();
    staffList.forEach((st) => map.set(Number(st.id), st));
    return map;
  }, [staffList]);

  const packageMap = useMemo(() => {
    const map = new Map();
    packages.forEach((pkg) => map.set(Number(pkg.id), pkg));
    return map;
  }, [packages]);

  const orderMap = useMemo(() => {
    const map = new Map();
    orders.forEach((ord) => map.set(Number(ord.id), ord));
    return map;
  }, [orders]);

  // Operational metrics
  const pendingOrders = useMemo(
    () => orders.filter((o) => String(o.status).toUpperCase() === "PENDING"),
    [orders]
  );
  const activeOrders = useMemo(
    () =>
      orders.filter((o) =>
        ["CONFIRMED", "PREPARING", "READY"].includes(String(o.status).toUpperCase())
      ),
    [orders]
  );
  const activeDeliveries = useMemo(
    () =>
      deliveries.filter((d) =>
        ["ASSIGNED", "IN_TRANSIT"].includes(String(d.status).toUpperCase())
      ),
    [deliveries]
  );

  // Unassigned deliveries triage (staffId is empty, 0, or null)
  const unassignedDeliveries = useMemo(
    () =>
      deliveries.filter(
        (d) =>
          d.staffId === null ||
          d.staffId === undefined ||
          d.staffId === "" ||
          Number(d.staffId) === 0
      ),
    [deliveries]
  );

  // Available staff on duty
  const availableStaff = useMemo(
    () => staffList.filter((s) => s.available !== false),
    [staffList]
  );

  // Chronologically sorted upcoming events
  const upcomingEvents = useMemo(() => {
    const valid = events.filter((e) => String(e.status).toUpperCase() !== "CANCELLED");
    return [...valid]
      .sort((a, b) => new Date(a.eventDate || 0) - new Date(b.eventDate || 0))
      .slice(0, 5);
  }, [events]);

  // Recent operational orders (top 5)
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  // Recent deliveries (top 5)
  const recentDeliveries = useMemo(() => deliveries.slice(0, 5), [deliveries]);

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Catering Operations Control"
        subtitle="Live oversight of catering order queue, dispatch logistics, and event service schedules."
        actions={
          <button
            type="button"
            className={`dashboard-refresh-btn ${refreshing ? "refreshing" : ""}`}
            onClick={() => loadAllData(true)}
            disabled={loading || refreshing}
            title="Sync operations data from live backend"
          >
            {OpsIcons.refresh}
            <span>{refreshing ? "Refreshing..." : "Sync Data"}</span>
          </button>
        }
      />

      <div className="dashboard-content">
        {/* Error Alert if any */}
        {error && (
          <AlertCard
            type="danger"
            title="Operational Sync Notice"
            message={error}
          />
        )}

        {/* ── 1. Operational Summary Cards ──────────────────────────── */}
        <section>
          <SectionHeader
            title="Operational Summary"
            subtitle="Real-time workload and dispatch metrics for today's catering schedule"
          />
          <div className="dashboard-stat-grid">
            <StatCard
              icon={OpsIcons.orders}
              value={pendingOrders.length}
              label="Pending Orders"
              tag={pendingOrders.length > 0 ? "Requires Review" : "Queue Clear"}
              supportingText="Awaiting kitchen and operational routing"
              accentColor="var(--color-warning)"
              iconBg="rgba(181, 119, 30, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={OpsIcons.orders}
              value={activeOrders.length}
              label="Active Prep Orders"
              tag="In Production"
              supportingText={`${orders.length} total customer orders`}
              accentColor="var(--color-primary)"
              iconBg="rgba(44, 74, 46, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={OpsIcons.events}
              value={events.length}
              label="Event Schedules"
              tag={`${upcomingEvents.length} Upcoming`}
              supportingText="Venue & date logistics for catering bookings"
              accentColor="#32678C"
              iconBg="rgba(50, 103, 140, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={OpsIcons.deliveries}
              value={deliveries.length}
              label="Delivery Dispatches"
              tag={
                unassignedDeliveries.length > 0
                  ? `${unassignedDeliveries.length} Unassigned`
                  : "All Assigned"
              }
              supportingText={`${activeDeliveries.length} active in-transit / assigned`}
              accentColor={
                unassignedDeliveries.length > 0 ? "var(--color-danger)" : "var(--color-gold)"
              }
              iconBg={
                unassignedDeliveries.length > 0
                  ? "rgba(143, 52, 52, 0.1)"
                  : "rgba(184, 146, 42, 0.1)"
              }
              loading={loading}
            />
          </div>
        </section>

        {/* ── 2. Needs Attention Triage ──────────────────────────────── */}
        <section>
          <SectionHeader
            title="Needs Operational Attention"
            subtitle="High-priority items requiring supervisor intervention or dispatch assignment"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {unassignedDeliveries.length > 0 && (
              <AlertCard
                type="danger"
                title={`Unassigned Deliveries (${unassignedDeliveries.length} require courier assignment)`}
                message={
                  <div>
                    <span>The following delivery runs have no staff member assigned:</span>
                    <div className="dashboard-low-stock-grid">
                      {unassignedDeliveries.map((del) => {
                        const matchedOrder = del.orderId ? orderMap.get(Number(del.orderId)) : null;
                        const matchedEvent = matchedOrder?.eventId ? eventMap.get(Number(matchedOrder.eventId)) : null;
                        return (
                          <span
                            key={del.id}
                            className="dashboard-low-stock-item"
                            style={{ backgroundColor: "rgba(143, 52, 52, 0.08)", borderColor: "rgba(143, 52, 52, 0.25)", color: "var(--color-danger)" }}
                          >
                            <strong>Delivery #{del.id}</strong>: {del.venue || "Venue TBD"} ({matchedEvent?.customerName || `Order #${del.orderId || "N/A"}`})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                }
                action={
                  <Link to="/manage/deliveries" className="btn sm danger" style={{ textDecoration: "none" }}>
                    Assign Couriers
                  </Link>
                }
              />
            )}

            {pendingOrders.length > 0 && (
              <AlertCard
                type="warning"
                title={`Pending Orders Queue (${pendingOrders.length} unconfirmed orders)`}
                message="New event orders are waiting in the queue. Confirm orders to route them into kitchen production and delivery planning."
                action={
                  <Link to="/manage/orders" className="btn sm gold" style={{ textDecoration: "none" }}>
                    Review Orders
                  </Link>
                }
              />
            )}

            {unassignedDeliveries.length === 0 && pendingOrders.length === 0 && (
              <AlertCard
                type="success"
                title="Operations On Track"
                message={`All catering orders and delivery dispatches are scheduled and assigned. ${availableStaff.length} staff members are available on roster.`}
              />
            )}
          </div>
        </section>

        {/* ── 3. Operational Activity Streams (2-Column Grid) ───────── */}
        <section>
          <SectionHeader
            title="Catering Operational Pipelines"
            subtitle="Live catering order queue and upcoming event service schedules"
          />
          <div className="dashboard-two-col-grid">
            {/* Left: Catering Order Pipeline (primary) */}
            <DashboardTable
              title="Live Catering Order Queue"
              headerAction={
                <Link to="/manage/orders" className="dashboard-section-header__action">
                  Order Queue &rarr;
                </Link>
              }
              headers={["Order ID", "Client / Event", "Package", "Status"]}
              loading={loading}
              empty={recentOrders.length === 0}
              emptyTitle="No orders in pipeline"
              emptyDesc="New catering orders placed by clients or supervisors will appear here."
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

            {/* Right: Upcoming Event Schedules (supporting) */}
            <DashboardTable
              title="Upcoming Event Service Schedules"
              headerAction={
                <Link to="/manage/events" className="dashboard-section-header__action">
                  Manage Events &rarr;
                </Link>
              }
              headers={["Client / Event", "Date & Venue", "Headcount", "Status"]}
              loading={loading}
              empty={upcomingEvents.length === 0}
              emptyTitle="No upcoming events scheduled"
              emptyDesc="Event venue and date logistics for catering bookings will appear here."
            >
              {upcomingEvents.map((ev) => (
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

        {/* ── 4. Delivery Operations Table ───────────────────────────── */}
        <section>
          <SectionHeader
            title="Delivery Dispatch Operations"
            subtitle="Active delivery runs, destination venues, and assigned personnel"
            actionLabel="Manage Deliveries"
            actionTo="/manage/deliveries"
          />
          <DashboardTable
            headers={["Delivery", "Linked Event / Order", "Venue Destination", "Schedule Time", "Assigned Staff", "Status"]}
            loading={loading}
            empty={recentDeliveries.length === 0}
            emptyTitle="No deliveries currently registered"
            emptyDesc="Scheduled deliveries will appear here as orders progress."
          >
            {recentDeliveries.map((del) => {
              const matchedOrder = del.orderId ? orderMap.get(Number(del.orderId)) : null;
              const matchedEvent = matchedOrder?.eventId ? eventMap.get(Number(matchedOrder.eventId)) : null;
              const matchedStaff = del.staffId ? staffMap.get(Number(del.staffId)) : null;

              let formattedTime = "Time TBD";
              if (del.scheduledTime) {
                formattedTime = del.scheduledTime.replace("T", " • ").slice(0, 18);
              }

              return (
                <tr key={del.id}>
                  <td>
                    <strong>Delivery #{del.id}</strong>
                  </td>
                  <td>
                    {matchedEvent ? (
                      <div>
                        <span>{matchedEvent.customerName}</span>
                        <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                          Order #{del.orderId} • {matchedEvent.eventType}
                        </small>
                      </div>
                    ) : del.orderId ? (
                      <span>Order #{del.orderId}</span>
                    ) : (
                      <span style={{ color: "var(--color-text-light)" }}>Unlinked</span>
                    )}
                  </td>
                  <td>
                    <span>{del.venue || "Venue TBD"}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem" }}>{formattedTime}</span>
                  </td>
                  <td>
                    {matchedStaff ? (
                      <div>
                        <strong style={{ color: "var(--color-primary)" }}>{matchedStaff.name}</strong>
                        <small style={{ display: "block", color: "var(--color-text-light)", marginTop: 2 }}>
                          {matchedStaff.role || "Staff"}
                        </small>
                      </div>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "var(--color-danger)",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                        }}
                      >
                        {OpsIcons.unassigned}
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={del.status || "ASSIGNED"} />
                  </td>
                </tr>
              );
            })}
          </DashboardTable>
        </section>

        {/* ── 5. Quick Actions ───────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Operational Shortcuts"
            subtitle="Quick access to core catering operational coordination modules"
          />
          <div className="quick-action-grid">
            <QuickActionCard
              to="/manage/orders"
              icon={OpsIcons.orders}
              title="Catering Order Queue"
              description="Review incoming catering orders, culinary requests, and fulfillment status."
              badge={pendingOrders.length > 0 ? `${pendingOrders.length} Pending` : undefined}
            />
            <QuickActionCard
              to="/manage/deliveries"
              icon={OpsIcons.deliveries}
              title="Delivery Dispatch"
              description="Assign delivery staff, monitor venue dispatches, and track completion."
              badge={unassignedDeliveries.length > 0 ? `${unassignedDeliveries.length} Unassigned` : undefined}
            />
            <QuickActionCard
              to="/manage/events"
              icon={OpsIcons.events}
              title="Event Logistics"
              description="Review event venue details, dates, and guest headcounts for catering service scheduling."
            />
            <QuickActionCard
              to="/manage/staff"
              icon={OpsIcons.staff}
              title="Staff Roster"
              description="Inspect staff roster, active duty assignments, and personnel availability."
              badge={`${availableStaff.length} Available`}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function OperationsSupervisorDashboard() {
  return (
    <RequireRole role="OPERATIONS_SUPERVISOR">
      <OperationsSupervisorDashboardContent />
    </RequireRole>
  );
}
