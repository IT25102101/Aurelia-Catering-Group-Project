import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import RequireRole from "../components/RequireRole.jsx";
import { useAuth } from "../AuthContext.jsx";
import {
  DashboardLayout,
  DashboardHeader,
  StatCard,
  QuickActionCard,
  StatusBadge,
  AlertCard,
  SectionHeader,
  DashboardTable,
} from "../components/dashboard/index.js";
import { getDeliverys } from "../api/deliveryApi.js";
import { getOrders } from "../api/orderApi.js";
import { getEvents } from "../api/eventApi.js";
import { getStaffs } from "../api/staffApi.js";

/* ── SVG Icons ─────────────────────────────────────────────────── */
const DeliveryIcons = {
  truck: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  clock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="12 14 12 17 14 17"/>
    </svg>
  ),
  transit: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
    </svg>
  ),
  delivered: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
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
 * Delivery Staff Dashboard — B8.7 Redesign
 * Unanimously unified with Admin Dashboard visual language.
 */
function DeliveryStaffDashboardContent() {
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | MY_ASSIGNED | OUT_FOR_DELIVERY | ASSIGNED | DELIVERED | CANCELLED
  const [searchQuery, setSearchQuery] = useState("");

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError("");
    }

    try {
      const [deliveriesData, ordersData, eventsData, staffsData] = await Promise.all([
        getDeliverys().catch(() => []),
        getOrders().catch(() => []),
        getEvents().catch(() => []),
        getStaffs().catch(() => []),
      ]);
      setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setStaffList(Array.isArray(staffsData) ? staffsData : []);
    } catch (err) {
      setError("Failed to load delivery logistics data: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Fast In-Memory Lookup Maps (Zero N+1 API calls)
  const orderMap = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => map.set(Number(o.id), o));
    return map;
  }, [orders]);

  const eventMap = useMemo(() => {
    const map = new Map();
    events.forEach((e) => map.set(Number(e.id), e));
    return map;
  }, [events]);

  const staffMap = useMemo(() => {
    const map = new Map();
    staffList.forEach((s) => map.set(Number(s.id), s));
    return map;
  }, [staffList]);

  // Identify current logged-in delivery staff record if matched
  const currentStaff = useMemo(() => {
    if (!user) return null;
    return (
      staffList.find(
        (s) =>
          (user.fullName && s.name && s.name.trim().toLowerCase() === user.fullName.trim().toLowerCase()) ||
          (user.id && s.id === Number(user.id))
      ) || null
    );
  }, [user, staffList]);

  // Summary Statistics
  const stats = useMemo(() => {
    const total = deliveries.length;
    let assigned = 0;
    let outForDelivery = 0;
    let delivered = 0;
    let cancelled = 0;
    let myAssignedCount = 0;

    deliveries.forEach((d) => {
      const st = (d.status || "ASSIGNED").toUpperCase();
      if (st === "ASSIGNED") assigned++;
      else if (st === "OUT_FOR_DELIVERY" || st === "IN_TRANSIT") outForDelivery++;
      else if (st === "DELIVERED") delivered++;
      else if (st === "CANCELLED") cancelled++;

      if (currentStaff && Number(d.staffId) === Number(currentStaff.id)) {
        myAssignedCount++;
      }
    });

    return { total, assigned, outForDelivery, delivered, cancelled, myAssignedCount };
  }, [deliveries, currentStaff]);

  // Urgent / In-transit & upcoming active deliveries
  const activeDeliveries = useMemo(() => {
    return deliveries
      .filter((d) => {
        const st = (d.status || "ASSIGNED").toUpperCase();
        return st === "OUT_FOR_DELIVERY" || st === "IN_TRANSIT" || st === "ASSIGNED";
      })
      .sort((a, b) => {
        const stA = (a.status || "ASSIGNED").toUpperCase();
        const stB = (b.status || "ASSIGNED").toUpperCase();
        const isTransitA = stA === "OUT_FOR_DELIVERY" || stA === "IN_TRANSIT";
        const isTransitB = stB === "OUT_FOR_DELIVERY" || stB === "IN_TRANSIT";
        if (isTransitA && !isTransitB) return -1;
        if (!isTransitA && isTransitB) return 1;

        const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : Infinity;
        const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : Infinity;
        return timeA - timeB;
      });
  }, [deliveries]);

  // Filtered deliveries for catalog table
  const filteredDeliveries = useMemo(() => {
    return deliveries
      .filter((d) => {
        const st = (d.status || "ASSIGNED").toUpperCase();

        if (statusFilter === "MY_ASSIGNED") {
          if (!currentStaff || Number(d.staffId) !== Number(currentStaff.id)) return false;
        } else if (statusFilter === "OUT_FOR_DELIVERY") {
          if (st !== "OUT_FOR_DELIVERY" && st !== "IN_TRANSIT") return false;
        } else if (statusFilter !== "ALL") {
          if (st !== statusFilter) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const venueMatch = d.venue?.toLowerCase().includes(q);
          const idMatch = String(d.id).includes(q);
          const orderIdMatch = d.orderId && String(d.orderId).includes(q);

          const assignedStaff = d.staffId ? staffMap.get(Number(d.staffId)) : null;
          const staffMatch = assignedStaff?.name?.toLowerCase().includes(q);

          const assignedOrder = d.orderId ? orderMap.get(Number(d.orderId)) : null;
          const assignedEvent = assignedOrder?.eventId ? eventMap.get(Number(assignedOrder.eventId)) : null;
          const customerMatch = assignedEvent?.customerName?.toLowerCase().includes(q);

          if (!venueMatch && !idMatch && !orderIdMatch && !staffMatch && !customerMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
        const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
        return timeB - timeA;
      });
  }, [deliveries, statusFilter, searchQuery, currentStaff, staffMap, orderMap, eventMap]);

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Delivery Dispatch"
        subtitle="Manage assigned catering deliveries, drop-off venues, and live transit logistics."
        actions={
          <button
            type="button"
            className={`dashboard-refresh-btn ${refreshing ? "refreshing" : ""}`}
            onClick={() => loadAllData(true)}
            disabled={loading || refreshing}
            title="Sync delivery logistics from live backend"
          >
            {DeliveryIcons.refresh}
            <span>{refreshing ? "Refreshing..." : "Sync Data"}</span>
          </button>
        }
      />

      <div className="dashboard-content">
        {/* Error Alert */}
        {error && (
          <AlertCard
            type="danger"
            title="Failed to Load Logistics Data"
            message={error}
          />
        )}

        {/* ── 1. Summary Stat Cards (4 Cards Grid) ───────────────── */}
        <section>
          <SectionHeader
            title="Logistics & Dispatch Summary"
            subtitle="Real-time delivery progress and driver assignment status"
          />
          <div className="dashboard-stat-grid">
            <StatCard
              icon={DeliveryIcons.truck}
              label="Total Deliveries"
              value={stats.total}
              tag="Dispatches"
              supportingText="All recorded catering routes"
              accentColor="var(--color-primary)"
              loading={loading}
            />
            <StatCard
              icon={DeliveryIcons.clock}
              label="Assigned / Pending"
              value={stats.assigned}
              tag={stats.assigned > 0 ? "Scheduled" : "Clear"}
              supportingText="Scheduled for driver dispatch"
              accentColor="#32678C"
              iconBg="rgba(50, 103, 140, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={DeliveryIcons.transit}
              label="Out for Delivery"
              value={stats.outForDelivery}
              tag={stats.outForDelivery > 0 ? "In Transit" : "None"}
              supportingText="Active on-road couriers"
              accentColor="var(--color-warning)"
              iconBg="rgba(181, 119, 30, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={DeliveryIcons.delivered}
              label="Delivered"
              value={stats.delivered}
              tag="Completed"
              supportingText="Successfully fulfilled drop-offs"
              accentColor="var(--color-success)"
              iconBg="rgba(46, 107, 55, 0.1)"
              loading={loading}
            />
          </div>
        </section>

        {/* ── 2. Delivery Attention & In-Transit Alerts ──────────── */}
        <section>
          <SectionHeader
            title="Logistics Attention & Live Alerts"
            subtitle="Real-time operational status of catering dispatch runs"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stats.outForDelivery > 0 && (
              <AlertCard
                type="warning"
                title={`${stats.outForDelivery} Delivery Route${stats.outForDelivery > 1 ? "s" : ""} Currently In Transit`}
                message={`Active deliveries in progress: ${deliveries
                  .filter(
                    (d) =>
                      (d.status || "").toUpperCase() === "OUT_FOR_DELIVERY" ||
                      (d.status || "").toUpperCase() === "IN_TRANSIT"
                  )
                  .map((d) => `Delivery #${d.id} to ${d.venue || "venue"}`)
                  .join(", ")}.`}
                action={
                  <Link to="/manage/deliveries" className="btn sm gold" style={{ textDecoration: "none" }}>
                    Update Status
                  </Link>
                }
              />
            )}

            {stats.assigned > 0 && stats.outForDelivery === 0 && (
              <AlertCard
                type="info"
                title={`${stats.assigned} Delivery${stats.assigned > 1 ? "ies" : ""} Assigned & Ready for Dispatch`}
                message="Scheduled catering runs are assigned to delivery personnel. Review drop-off times and venue addresses."
                action={
                  <Link to="/manage/deliveries" className="btn sm secondary" style={{ textDecoration: "none" }}>
                    View Delivery Queue
                  </Link>
                }
              />
            )}

            {stats.total > 0 && stats.assigned === 0 && stats.outForDelivery === 0 && (
              <AlertCard
                type="success"
                title="All Scheduled Deliveries Completed"
                message="There are no active or pending dispatches requiring immediate transit updates."
              />
            )}

            {stats.total === 0 && !loading && (
              <AlertCard
                type="info"
                title="No Delivery Records Found"
                message="No catering orders have been scheduled for delivery dispatch yet."
                action={
                  <Link to="/manage/deliveries" className="btn sm secondary" style={{ textDecoration: "none" }}>
                    Schedule Delivery
                  </Link>
                }
              />
            )}
          </div>
        </section>

        {/* ── 3. Active & Upcoming Delivery Queue (Schedule) ─────── */}
        {activeDeliveries.length > 0 && (
          <section>
            <SectionHeader
              title="Active & Upcoming Delivery Queue"
              subtitle="Prioritized list of in-transit and assigned catering dispatches"
              actionLabel="Manage Logistics &rarr;"
              actionTo="/manage/deliveries"
            />
            <DashboardTable
              title="Active Dispatch Queue"
              headerAction={
                <Link to="/manage/deliveries" className="dashboard-section-header__action">
                  Manage Deliveries &rarr;
                </Link>
              }
              headers={["ID", "Order & Customer", "Destination Venue", "Scheduled Dispatch", "Assigned Driver", "Status", "Action"]}
              loading={loading}
              empty={activeDeliveries.length === 0}
              emptyTitle="Queue Clear"
              emptyDesc="No active dispatches currently pending or on the road."
            >
              {activeDeliveries.map((d) => {
                const assignedOrder = d.orderId ? orderMap.get(Number(d.orderId)) : null;
                const assignedEvent = assignedOrder?.eventId ? eventMap.get(Number(assignedOrder.eventId)) : null;
                const assignedStaff = d.staffId ? staffMap.get(Number(d.staffId)) : null;
                const isTransit =
                  (d.status || "").toUpperCase() === "OUT_FOR_DELIVERY" ||
                  (d.status || "").toUpperCase() === "IN_TRANSIT";

                return (
                  <tr key={d.id} style={{ background: isTransit ? "rgba(181, 119, 30, 0.05)" : undefined }}>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>
                        #{d.id}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{assignedEvent ? assignedEvent.customerName : `Order #${d.orderId || "N/A"}`}</strong>
                        <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                          {assignedEvent?.eventType ? `${assignedEvent.eventType} • ` : ""}
                          Order #{d.orderId || "N/A"}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span>{d.venue || "Venue not specified"}</span>
                    </td>
                    <td>
                      {d.scheduledTime ? (
                        <div>
                          <strong>
                            {new Date(d.scheduledTime).toLocaleDateString("en-LK", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </strong>
                          <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                            {new Date(d.scheduledTime).toLocaleTimeString("en-LK", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-text-light)" }}>Not scheduled</span>
                      )}
                    </td>
                    <td>
                      {assignedStaff ? (
                        <div>
                          <strong>{assignedStaff.name}</strong>
                          {assignedStaff.contactNumber && (
                            <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                              {assignedStaff.contactNumber}
                            </small>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--color-danger)", fontWeight: 600, fontSize: "0.82rem" }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={d.status || "ASSIGNED"} />
                    </td>
                    <td>
                      <Link
                        to="/manage/deliveries"
                        className="btn sm gold"
                        style={{ textDecoration: "none", display: "inline-block" }}
                      >
                        Update
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </DashboardTable>
          </section>
        )}

        {/* ── 4. Complete Delivery Dispatches Table ──────────────── */}
        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <SectionHeader
              title="All Delivery Dispatches"
              subtitle={`Showing ${filteredDeliveries.length} of ${deliveries.length} total deliveries`}
            />

            {/* Filter Tabs */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {[
                { id: "ALL", label: `All (${deliveries.length})` },
                ...(currentStaff
                  ? [{ id: "MY_ASSIGNED", label: `My Deliveries (${stats.myAssignedCount})` }]
                  : []),
                { id: "OUT_FOR_DELIVERY", label: `In Transit (${stats.outForDelivery})` },
                { id: "ASSIGNED", label: `Assigned (${stats.assigned})` },
                { id: "DELIVERED", label: `Delivered (${stats.delivered})` },
                { id: "CANCELLED", label: `Cancelled (${stats.cancelled})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "0.8rem",
                    fontWeight: statusFilter === tab.id ? 600 : 500,
                    border: "1px solid",
                    borderColor:
                      statusFilter === tab.id ? "var(--color-primary)" : "var(--color-border-light)",
                    borderRadius: "var(--radius-full)",
                    background:
                      statusFilter === tab.id ? "var(--color-primary)" : "var(--color-surface)",
                    color: statusFilter === tab.id ? "#ffffff" : "var(--color-text)",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Search by venue, customer name, driver, order ID, or delivery ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                fontSize: "0.88rem",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-surface)",
                boxSizing: "border-box",
                color: "var(--color-text)",
              }}
            />
          </div>

          <DashboardTable
            title="Delivery Dispatch Schedule"
            headerAction={
              <Link to="/manage/deliveries" className="dashboard-section-header__action">
                Full Logistics Manager &rarr;
              </Link>
            }
            headers={["ID", "Order & Customer", "Destination Venue", "Scheduled Dispatch", "Driver / Staff", "Status", "Actions"]}
            loading={loading}
            empty={filteredDeliveries.length === 0}
            emptyTitle="No Matching Deliveries"
            emptyDesc={
              searchQuery || statusFilter !== "ALL"
                ? "No delivery records match the selected filter criteria or search query."
                : "No catering deliveries have been recorded yet."
            }
          >
            {filteredDeliveries.map((d) => {
              const assignedOrder = d.orderId ? orderMap.get(Number(d.orderId)) : null;
              const assignedEvent = assignedOrder?.eventId ? eventMap.get(Number(assignedOrder.eventId)) : null;
              const assignedStaff = d.staffId ? staffMap.get(Number(d.staffId)) : null;

              return (
                <tr key={d.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>
                      #{d.id}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong>{assignedEvent ? assignedEvent.customerName : `Order #${d.orderId || "N/A"}`}</strong>
                      <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                        {assignedEvent?.eventType ? `${assignedEvent.eventType} • ` : ""}
                        Order #{d.orderId || "N/A"}
                      </small>
                    </div>
                  </td>
                  <td>
                    <span>{d.venue || "N/A"}</span>
                  </td>
                  <td>
                    {d.scheduledTime ? (
                      <div>
                        <strong>
                          {new Date(d.scheduledTime).toLocaleDateString("en-LK", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </strong>
                        <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                          {new Date(d.scheduledTime).toLocaleTimeString("en-LK", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                    ) : (
                      <span style={{ color: "var(--color-text-light)" }}>Not scheduled</span>
                    )}
                  </td>
                  <td>
                    {assignedStaff ? (
                      <div>
                        <strong>{assignedStaff.name}</strong>
                        {assignedStaff.contactNumber && (
                          <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: 2 }}>
                            {assignedStaff.contactNumber}
                          </small>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "var(--color-text-light)" }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={d.status || "ASSIGNED"} />
                  </td>
                  <td>
                    <Link
                      to="/manage/deliveries"
                      className="btn sm secondary"
                      style={{ textDecoration: "none", display: "inline-block" }}
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              );
            })}
          </DashboardTable>
        </section>

        {/* ── 5. Quick Actions Section ───────────────────────────── */}
        <section>
          <SectionHeader
            title="Delivery Management & Logistics"
            subtitle="Authorized delivery workflow controls and route assignments"
          />
          <div className="quick-action-grid">
            <QuickActionCard
              to="/manage/deliveries"
              title="My Deliveries & Logistics"
              description="Inspect venue locations, update transit dispatch statuses to Out for Delivery or Delivered, and manage schedules."
              icon={DeliveryIcons.truck}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function DeliveryStaffDashboard() {
  return (
    <RequireRole role="DELIVERY_STAFF">
      <DeliveryStaffDashboardContent />
    </RequireRole>
  );
}
