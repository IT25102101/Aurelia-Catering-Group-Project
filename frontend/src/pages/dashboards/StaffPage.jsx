import { useEffect, useState, useCallback } from "react";
import { DashboardLayout, DashboardHeader, StatusBadge } from "../components/dashboard";
import {
  getStaffs,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../api/staffApi";

const STAFF_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "OPERATIONS_SUPERVISOR", label: "Operations Supervisor" },
  { value: "KITCHEN_STAFF", label: "Kitchen Staff" },
  { value: "DELIVERY_STAFF", label: "Delivery Staff" },
  { value: "FINANCE_OFFICER", label: "Finance Officer" },
  { value: "INVENTORY_COORDINATOR", label: "Inventory Coordinator" },
];

const emptyForm = {
  name: "",
  role: "OPERATIONS_SUPERVISOR",
  contactNumber: "",
  available: true,
};

/**
 * CRUD screen for "6.6 Staff Management".
 * Features role selection, availability badges, validation, loading/empty states,
 * and reliable backend CRUD integration.
 */
export default function StaffPage() {
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
      const data = await getStaffs();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load staff records: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function validate() {
    const errs = {};
    if (!form.name || !form.name.trim()) {
      errs.name = "Please enter the staff member's name.";
    }
    if (!form.role) {
      errs.role = "Please select a staff role.";
    }
    if (!form.contactNumber || !form.contactNumber.trim()) {
      errs.contactNumber = "Please enter a contact phone number.";
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
        name: form.name.trim(),
        role: form.role,
        contactNumber: form.contactNumber.trim(),
        available: Boolean(form.available),
      };

      if (editingId) {
        await updateStaff(editingId, payload);
      } else {
        await createStaff(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      setError(err.message || "Failed to save staff record.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item) {
    setForm({
      name: item.name || "",
      role: item.role || "OPERATIONS_SUPERVISOR",
      contactNumber: item.contactNumber || "",
      available: item.available !== false,
    });
    setEditingId(item.id);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete staff member "${name || `#${id}`}"?`)) {
      return;
    }
    try {
      await deleteStaff(id);
      await loadItems();
    } catch (err) {
      setError("Failed to delete staff member: " + (err.message || "Server error"));
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
        title="Manage Staff"
        subtitle="Maintain staff rosters, assign operational roles, and manage dispatch availability."
        showGreeting={false}
      />
      <div className="dashboard-content">

        {error && (
          <div className="error-text" style={{ padding: "10px", marginBottom: "16px", borderRadius: "6px" }}>
            {error}
          </div>
        )}

        {/* ── Staff Form ───────────────────────────────────────────── */}
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h3 style={{ marginTop: 0 }}>{editingId ? `Edit Staff Member #${editingId}` : "Register New Staff Member"}</h3>

          {/* Name */}
          <div className="form-group">
            <label htmlFor="staff-name-input">
              Full Name <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="staff-name-input"
              type="text"
              placeholder="e.g. Ruwan Silva"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.name && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.name}
              </div>
            )}
          </div>

          {/* Role */}
          <div className="form-group">
            <label htmlFor="staff-role-select">
              Assigned Role <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <select
              id="staff-role-select"
              value={form.role}
              onChange={(e) => {
                setForm({ ...form, role: e.target.value });
                if (fieldErrors.role) setFieldErrors((prev) => ({ ...prev, role: "" }));
              }}
              disabled={submitting}
            >
              {STAFF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} ({r.value})
                </option>
              ))}
            </select>
            {fieldErrors.role && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.role}
              </div>
            )}
          </div>

          {/* Contact Number */}
          <div className="form-group">
            <label htmlFor="staff-contact-input">
              Contact Number <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="staff-contact-input"
              type="text"
              placeholder="e.g. 0771234567"
              value={form.contactNumber}
              onChange={(e) => {
                setForm({ ...form, contactNumber: e.target.value });
                if (fieldErrors.contactNumber) setFieldErrors((prev) => ({ ...prev, contactNumber: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.contactNumber && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.contactNumber}
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="form-group">
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm({ ...form, available: e.target.checked })}
                disabled={submitting}
                style={{ width: "auto", marginRight: 8 }}
              />
              Available for Active Dispatch &amp; Service
            </label>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Register Staff"}
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

        {/* ── Staff Table ─────────────────────────────────────────── */}
        <h2 style={{ marginTop: 32, marginBottom: 12 }}>Staff Directory</h2>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--muted, #888)" }}>
            Loading staff records...
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "28px", color: "var(--muted, #888)" }}>
            No staff records found. Use the form above to register staff members.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Contact Number</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const roleObj = STAFF_ROLES.find((r) => r.value === item.role);
                  const roleDisplay = roleObj ? roleObj.label : item.role;
                  const isAvail = item.available !== false;

                  return (
                    <tr key={item.id}>
                      <td><strong>#{item.id}</strong></td>
                      <td><strong>{item.name}</strong></td>
                      <td>{roleDisplay}</td>
                      <td>{item.contactNumber || <span style={{ color: "#888" }}>N/A</span>}</td>
                      <td>
                        <StatusBadge status={isAvail ? "AVAILABLE" : "UNAVAILABLE"} />
                      </td>
                      <td>
                        <button className="btn secondary sm" onClick={() => handleEdit(item)}>
                          Edit
                        </button>
                        <button
                          className="btn danger sm"
                          style={{ marginLeft: 6 }}
                          onClick={() => handleDelete(item.id, item.name)}
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

