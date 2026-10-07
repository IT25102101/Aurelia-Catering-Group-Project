import { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardLayout, DashboardHeader, StatusBadge } from "../components/dashboard";
import {
  getDeliverys,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} from "../api/deliveryApi";
import { getOrders } from "../api/orderApi";
import { getStaffs } from "../api/staffApi";
import { getEvents } from "../api/eventApi";

const emptyForm = {
  orderId: "",
  staffId: "",
  venue: "",
  scheduledTime: "",
  status: "ASSIGNED",
};

/**
 * CRUD screen for "6.5 Delivery Management".
 * Features backend-powered dropdowns for Orders & Staff, automatic venue prefill,
 * clear availability indicators, and input validation.
 */
export default function DeliveriesPage() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [events, setEvents] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /** Fetch all required datasets concurrently on mount */
  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
      setError("");
    }
    try {
      const [deliveriesData, ordersData, staffsData, eventsData] = await Promise.all([
        getDeliverys().catch(() => []),
        getOrders().catch(() => []),
        getStaffs().catch(() => []),
        getEvents().catch(() => []),
      ]);
      setItems(Array.isArray(deliveriesData) ? deliveriesData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setStaffList(Array.isArray(staffsData) ? staffsData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err) {
      setError("Failed to load delivery management records: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  /** Fast lookup maps for table display */
  const orderMap = useMemo(() => {
    const map = new Map();
    orders.forEach((o) => map.set(Number(o.id), o));
    return map;
  }, [orders]);

  const staffMap = useMemo(() => {
    const map = new Map();
    staffList.forEach((s) => map.set(Number(s.id), s));
    return map;
  }, [staffList]);

  const eventMap = useMemo(() => {
    const map = new Map();
    events.forEach((e) => map.set(Number(e.id), e));
    return map;
  }, [events]);

  /** When an order is selected, automatically prefill the venue from the linked event if available */
  function handleOrderChange(e) {
    const selectedOrderId = e.target.value;
    let autoVenue = form.venue;

    if (selectedOrderId) {
      const selectedOrder = orderMap.get(Number(selectedOrderId));
      if (selectedOrder && selectedOrder.eventId) {
        const matchingEvent = eventMap.get(Number(selectedOrder.eventId));
        if (matchingEvent && matchingEvent.venue) {
          autoVenue = matchingEvent.venue;
        }
      }
    }

    setForm((prev) => ({
      ...prev,
      orderId: selectedOrderId,
      venue: autoVenue,
    }));

    if (fieldErrors.orderId) {
      setFieldErrors((prev) => ({ ...prev, orderId: "" }));
    }
  }

  function handleStaffChange(e) {
    const selectedStaffId = e.target.value;
    setForm((prev) => ({ ...prev, staffId: selectedStaffId }));
    if (fieldErrors.staffId) {
      setFieldErrors((prev) => ({ ...prev, staffId: "" }));
    }
  }

  function validate() {
    const errs = {};
    if (!form.orderId) {
      errs.orderId = "Please select an Order.";
    }
    if (!form.staffId) {
      errs.staffId = "Please select a Staff member.";
    }
    if (!form.venue || !form.venue.trim()) {
      errs.venue = "Please enter the delivery venue address.";
    }
    if (!form.scheduledTime) {
      errs.scheduledTime = "Please specify a scheduled delivery date and time.";
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const valErrors = validate();
    if (Object.keys(valErrors).length > 0) {
      setFieldErrors(valErrors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const payload = {
        orderId: form.orderId ? parseInt(form.orderId, 10) : null,
        staffId: form.staffId ? parseInt(form.staffId, 10) : null,
        venue: form.venue.trim(),
        scheduledTime: form.scheduledTime,
        status: form.status || "ASSIGNED",
      };

      if (editingId) {
        await updateDelivery(editingId, payload);
      } else {
        await createDelivery(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      // Reload delivery items
      const updatedDeliveries = await getDeliverys();
      setItems(Array.isArray(updatedDeliveries) ? updatedDeliveries : []);
    } catch (err) {
      setError(err.message || "Failed to save delivery record.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item) {
    // Format scheduledTime for input datetime-local if necessary (slice to 16 chars: YYYY-MM-DDTHH:mm)
    let formattedTime = "";
    if (item.scheduledTime) {
      formattedTime = item.scheduledTime.slice(0, 16);
    }

    setForm({
      orderId: item.orderId !== null && item.orderId !== undefined ? String(item.orderId) : "",
      staffId: item.staffId !== null && item.staffId !== undefined ? String(item.staffId) : "",
      venue: item.venue || "",
      scheduledTime: formattedTime,
      status: item.status || "ASSIGNED",
    });
    setEditingId(item.id);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm(`Are you sure you want to remove Delivery #${id}?`)) {
      return;
    }
    try {
      await deleteDelivery(id);
      const updatedDeliveries = await getDeliverys();
      setItems(Array.isArray(updatedDeliveries) ? updatedDeliveries : []);
    } catch (err) {
      setError(err.message || "Failed to delete delivery.");
    }
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
  }

  /** Render Order option label */
  function formatOrderLabel(order) {
    const event = order.eventId ? eventMap.get(Number(order.eventId)) : null;
    const eventName = event ? ` (${event.customerName} - ${event.eventType})` : "";
    return `Order #${order.id} — Event #${order.eventId || "N/A"}${eventName} [${order.status || "PENDING"}]`;
  }

  /** Render Staff option label with availability and role */
  function formatStaffLabel(staff) {
    const isAvail = staff.available !== false;
    const availTag = isAvail ? "✓ Available" : "✗ Unavailable";
    return `${staff.name} — ${staff.role || "Staff"} [${availTag}]`;
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Manage Deliveries"
        subtitle="Schedule, assign, and track catering dispatch and deliveries."
        showGreeting={false}
      />
      <div className="dashboard-content">

        {error && (
          <div className="error-text" style={{ padding: "10px", marginBottom: "16px", borderRadius: "6px" }}>
            {error}
          </div>
        )}

        {/* ── Delivery Form ────────────────────────────────────────── */}
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h3 style={{ marginTop: 0 }}>{editingId ? `Edit Delivery #${editingId}` : "Schedule New Delivery"}</h3>

          {/* Order Selector */}
          <div className="form-group">
            <label htmlFor="delivery-order-select">
              Select Order <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <select
              id="delivery-order-select"
              value={form.orderId}
              onChange={handleOrderChange}
              disabled={submitting}
            >
              <option value="">-- Select an Order ({orders.length} available) --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {formatOrderLabel(o)}
                </option>
              ))}
            </select>
            {fieldErrors.orderId && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.orderId}
              </div>
            )}
          </div>

          {/* Staff Selector */}
          <div className="form-group">
            <label htmlFor="delivery-staff-select">
              Assign Staff Member <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <select
              id="delivery-staff-select"
              value={form.staffId}
              onChange={handleStaffChange}
              disabled={submitting}
            >
              <option value="">-- Select Staff Member ({staffList.length} total) --</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatStaffLabel(s)}
                </option>
              ))}
            </select>
            {fieldErrors.staffId && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.staffId}
              </div>
            )}
          </div>

          {/* Venue Location */}
          <div className="form-group">
            <label htmlFor="delivery-venue-input">
              Delivery Venue / Location <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="delivery-venue-input"
              type="text"
              placeholder="e.g. Lotus Ballroom, Colombo"
              value={form.venue}
              onChange={(e) => {
                setForm({ ...form, venue: e.target.value });
                if (fieldErrors.venue) setFieldErrors((prev) => ({ ...prev, venue: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.venue && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.venue}
              </div>
            )}
          </div>

          {/* Scheduled Time */}
          <div className="form-group">
            <label htmlFor="delivery-time-input">
              Scheduled Date &amp; Time <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="delivery-time-input"
              type="datetime-local"
              value={form.scheduledTime}
              onChange={(e) => {
                setForm({ ...form, scheduledTime: e.target.value });
                if (fieldErrors.scheduledTime) setFieldErrors((prev) => ({ ...prev, scheduledTime: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.scheduledTime && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.scheduledTime}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="form-group">
            <label htmlFor="delivery-status-select">Delivery Status</label>
            <select
              id="delivery-status-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              disabled={submitting}
            >
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Schedule Delivery"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn secondary"
                style={{ marginLeft: 8 }}
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* ── Deliveries Table ─────────────────────────────────────── */}
        <h2 style={{ marginTop: 32, marginBottom: 12 }}>Current Delivery Schedule</h2>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--muted, #888)" }}>
            Loading delivery records...
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "28px", color: "var(--muted, #888)" }}>
            No deliveries scheduled yet. Use the form above to schedule a delivery for an active order.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order Ref</th>
                  <th>Staff Assigned</th>
                  <th>Venue</th>
                  <th>Scheduled Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const assignedStaff = item.staffId ? staffMap.get(Number(item.staffId)) : null;
                  const assignedOrder = item.orderId ? orderMap.get(Number(item.orderId)) : null;
                  const assignedEvent = assignedOrder?.eventId ? eventMap.get(Number(assignedOrder.eventId)) : null;

                  return (
                    <tr key={item.id}>
                      <td><strong>#{item.id}</strong></td>
                      <td>
                        {item.orderId ? (
                          <span>
                            Order #{item.orderId}
                            {assignedEvent ? <small style={{ display: "block", color: "var(--muted, #888)" }}>{assignedEvent.customerName}</small> : null}
                          </span>
                        ) : (
                          <span style={{ color: "#888" }}>Unassigned</span>
                        )}
                      </td>
                      <td>
                        {assignedStaff ? (
                          <span>
                            {assignedStaff.name}
                            <small style={{ display: "block", color: "var(--muted, #888)" }}>{assignedStaff.role}</small>
                          </span>
                        ) : item.staffId ? (
                          `Staff #${item.staffId}`
                        ) : (
                          <span style={{ color: "#888" }}>Unassigned</span>
                        )}
                      </td>
                      <td>{item.venue || <span style={{ color: "#888" }}>N/A</span>}</td>
                      <td>
                        {item.scheduledTime
                          ? new Date(item.scheduledTime).toLocaleString("en-LK", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : <span style={{ color: "#888" }}>Not scheduled</span>}
                      </td>
                      <td>
                        <StatusBadge status={item.status || "ASSIGNED"} />
                      </td>
                      <td>
                        <button className="btn secondary sm" onClick={() => handleEdit(item)}>
                          Edit
                        </button>
                        <button
                          className="btn danger sm"
                          style={{ marginLeft: 6 }}
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

