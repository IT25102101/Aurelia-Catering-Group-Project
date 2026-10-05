import { useEffect, useState, useCallback } from "react";
import { DashboardLayout, DashboardHeader, StatusBadge } from "../components/dashboard";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../api/eventApi";

const emptyForm = {
  customerName: "",
  eventType: "Wedding",
  eventDate: "",
  startTime: "18:00",
  venue: "",
  guestCount: "",
  status: "PENDING",
};

/**
 * CRUD screen for "6.7 Event Management".
 * Features status badges, field validation, loading/empty states, and reliable delete confirmation.
 */
export default function EventsPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
      setError("");
    }
    try {
      const data = await getEvents();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load events: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function validate() {
    const errs = {};
    if (!form.customerName || !form.customerName.trim()) {
      errs.customerName = "Please enter the client / customer name.";
    }
    if (!form.eventType || !form.eventType.trim()) {
      errs.eventType = "Please specify the event type.";
    }
    if (!form.eventDate) {
      errs.eventDate = "Please select the event date.";
    }
    if (!form.venue || !form.venue.trim()) {
      errs.venue = "Please enter the event venue.";
    }
    if (!form.guestCount || Number(form.guestCount) <= 0) {
      errs.guestCount = "Please enter a valid guest count (greater than 0).";
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
      const formattedTime = form.startTime && form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime;
      const payload = {
        customerName: form.customerName.trim(),
        eventType: form.eventType.trim(),
        eventDate: form.eventDate,
        startTime: formattedTime || null,
        venue: form.venue.trim(),
        guestCount: parseInt(form.guestCount, 10),
        status: form.status || "PENDING",
      };

      if (editingId) {
        await updateEvent(editingId, payload);
      } else {
        await createEvent(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      setError(err.message || "Failed to save event record.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item) {
    setForm({
      customerName: item.customerName || "",
      eventType: item.eventType || "Wedding",
      eventDate: item.eventDate ? item.eventDate.split("T")[0] : "",
      startTime: item.startTime ? item.startTime.substring(0, 5) : "18:00",
      venue: item.venue || "",
      guestCount: item.guestCount !== null && item.guestCount !== undefined ? String(item.guestCount) : "",
      status: item.status || "PENDING",
    });
    setEditingId(item.id);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete event "${name || `#${id}`}"?`)) {
      return;
    }
    try {
      await deleteEvent(id);
      await loadItems();
    } catch (err) {
      setError("Failed to delete event: " + (err.message || "Server error"));
    }
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Event Schedules & Logistics"
        subtitle="Manage venue dates, locations, and guest details that support catering service delivery."
        showGreeting={false}
      />
      <div className="dashboard-content">

        {error && (
          <div className="error-text" style={{ padding: "10px", marginBottom: "16px", borderRadius: "6px" }}>
            {error}
          </div>
        )}

        {/* ── Event Form ───────────────────────────────────────────── */}
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h3 style={{ marginTop: 0 }}>{editingId ? `Edit Event #${editingId}` : "Add New Catering Event Schedule"}</h3>

          {/* Customer Name */}
          <div className="form-group">
            <label htmlFor="event-customer-input">
              Client / Customer Name <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="event-customer-input"
              type="text"
              placeholder="e.g. Dilshan &amp; Chamari"
              value={form.customerName}
              onChange={(e) => {
                setForm({ ...form, customerName: e.target.value });
                if (fieldErrors.customerName) setFieldErrors((prev) => ({ ...prev, customerName: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.customerName && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.customerName}
              </div>
            )}
          </div>

          {/* Event Type */}
          <div className="form-group">
            <label htmlFor="event-type-input">
              Event Type <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="event-type-input"
              type="text"
              placeholder="e.g. Wedding, Corporate Gala, Anniversary"
              value={form.eventType}
              onChange={(e) => {
                setForm({ ...form, eventType: e.target.value });
                if (fieldErrors.eventType) setFieldErrors((prev) => ({ ...prev, eventType: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.eventType && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.eventType}
              </div>
            )}
          </div>

          {/* Event Date & Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label htmlFor="event-date-input">
                Event Date <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
              </label>
              <input
                id="event-date-input"
                type="date"
                value={form.eventDate}
                onChange={(e) => {
                  setForm({ ...form, eventDate: e.target.value });
                  if (fieldErrors.eventDate) setFieldErrors((prev) => ({ ...prev, eventDate: "" }));
                }}
                disabled={submitting}
              />
              {fieldErrors.eventDate && (
                <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                  {fieldErrors.eventDate}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="event-time-input">Start Time</label>
              <input
                id="event-time-input"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Venue */}
          <div className="form-group">
            <label htmlFor="event-venue-input">
              Venue / Location <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="event-venue-input"
              type="text"
              placeholder="e.g. Shangri-La Ballroom, Colombo"
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

          {/* Guest Count */}
          <div className="form-group">
            <label htmlFor="event-guest-input">
              Estimated Guest Count <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="event-guest-input"
              type="number"
              min="1"
              placeholder="e.g. 150"
              value={form.guestCount}
              onChange={(e) => {
                setForm({ ...form, guestCount: e.target.value });
                if (fieldErrors.guestCount) setFieldErrors((prev) => ({ ...prev, guestCount: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.guestCount && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.guestCount}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="form-group">
            <label htmlFor="event-status-select">Event Status</label>
            <select
              id="event-status-select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              disabled={submitting}
            >
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Event"}
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

        {/* ── Events Table ─────────────────────────────────────────── */}
        <h2 style={{ marginTop: 32, marginBottom: 12 }}>Event Schedules List</h2>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--muted, #888)" }}>
            Loading event records...
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "28px", color: "var(--muted, #888)" }}>
            No events scheduled yet. Public bookings and form entries will appear here.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Event Type</th>
                  <th>Date &amp; Time</th>
                  <th>Venue</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>#{item.id}</strong></td>
                    <td><strong>{item.customerName}</strong></td>
                    <td>{item.eventType}</td>
                    <td>
                      <span>{item.eventDate ? String(item.eventDate).split("T")[0] : "TBD"}</span>
                      {item.startTime && (
                        <small style={{ display: "block", color: "var(--muted, #888)" }}>
                          {item.startTime.substring(0, 5)}
                        </small>
                      )}
                    </td>
                    <td>{item.venue}</td>
                    <td>{item.guestCount ? `${Number(item.guestCount).toLocaleString()} guests` : "N/A"}</td>
                    <td>
                      <StatusBadge status={item.status || "PENDING"} />
                    </td>
                    <td>
                      <button className="btn secondary sm" onClick={() => handleEdit(item)}>
                        Edit
                      </button>
                      <button
                        className="btn danger sm"
                        style={{ marginLeft: 6 }}
                        onClick={() => handleDelete(item.id, item.customerName)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

