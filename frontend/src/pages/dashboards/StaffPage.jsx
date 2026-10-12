import { useEffect, useState, useCallback } from "react";
import { DashboardLayout, DashboardHeader, StatusBadge } from "../../components/dashboard";
import {
  getStaffs,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaffPolicy,
  calculateStaffCompensation,
} from "../../api/staffApi";

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
 *
 * Design Patterns demonstrated:
 * 1. DAO Pattern: Interacts with StaffDao/StaffService through REST endpoints.
 * 2. Strategy Pattern: Dynamically inspects role policies, clearances, allowances, and calculates shift pay.
 */
export default function StaffPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Strategy Pattern States
  const [activePolicyStaff, setActivePolicyStaff] = useState(null);
  const [policyResult, setPolicyResult] = useState(null);
  const [compensationResult, setCompensationResult] = useState(null);
  const [calcRegularHours, setCalcRegularHours] = useState(40);
  const [calcOvertimeHours, setCalcOvertimeHours] = useState(5);
  const [policyLoading, setPolicyLoading] = useState(false);

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

  async function handleOpenPolicy(staff) {
    setActivePolicyStaff(staff);
    setPolicyLoading(true);
    try {
      const [policy, comp] = await Promise.all([
        getStaffPolicy(staff.id),
        calculateStaffCompensation(staff.id, calcRegularHours, calcOvertimeHours),
      ]);
      setPolicyResult(policy);
      setCompensationResult(comp);
    } catch (err) {
      setError("Failed to evaluate role strategy policy: " + (err.message || "Server error"));
    } finally {
      setPolicyLoading(false);
    }
  }

  async function handleRecalculateComp(e) {
    e.preventDefault();
    if (!activePolicyStaff) return;
    setPolicyLoading(true);
    try {
      const comp = await calculateStaffCompensation(
        activePolicyStaff.id,
        calcRegularHours,
        calcOvertimeHours
      );
      setCompensationResult(comp);
    } catch (err) {
      setError("Calculation failed: " + (err.message || "Server error"));
    } finally {
      setPolicyLoading(false);
    }
  }

  function handleClosePolicyModal() {
    setActivePolicyStaff(null);
    setPolicyResult(null);
    setCompensationResult(null);
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
                          type="button"
                          className="btn sm"
                          style={{
                            marginLeft: 6,
                            background: "rgba(212, 175, 55, 0.15)",
                            border: "1px solid var(--gold, #d4af37)",
                            color: "var(--gold, #d4af37)",
                            fontWeight: 600,
                          }}
                          onClick={() => handleOpenPolicy(item)}
                        >
                          Policy &amp; Pay
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

        {/* ── Strategy Pattern: Role Policy & Compensation Modal ───────── */}
        {activePolicyStaff && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
              backdropFilter: "blur(4px)",
            }}
            onClick={handleClosePolicyModal}
          >
            <div
              className="card"
              style={{
                maxWidth: "680px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "var(--card-bg, #1a1a1a)",
                border: "1px solid var(--gold, #d4af37)",
                borderRadius: "10px",
                padding: "24px",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, color: "var(--gold, #d4af37)" }}>
                    {policyResult ? policyResult.policyName : "Staff Role Policy Evaluation"}
                  </h3>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted, #aaa)", marginTop: "4px" }}>
                    Staff Member: <strong>{activePolicyStaff.name}</strong> (#{activePolicyStaff.id}) &bull; Assigned Role: <strong>{activePolicyStaff.role}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={handleClosePolicyModal}
                  style={{ minWidth: "32px", padding: "4px 10px" }}
                >
                  ✕
                </button>
              </div>

              {policyLoading && !policyResult ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--muted, #888)" }}>
                  Evaluating role strategy via Spring DI...
                </div>
              ) : (
                <>
                  {policyResult && (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                        <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted, #888)" }}>Base Rate</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--gold, #d4af37)" }}>
                            {policyResult.baseHourlyRate.toFixed(2)} LKR/h
                          </div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted, #888)" }}>Overtime Rate</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#4cd137" }}>
                            {policyResult.overtimeMultiplier.toFixed(2)}x
                          </div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted, #888)" }}>Role Allowance</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#fbc531" }}>
                            {policyResult.specialAllowance.toFixed(2)} LKR
                          </div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted, #888)" }}>Max Shift</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#e84118" }}>
                            {policyResult.maxShiftHours} hrs/shift
                          </div>
                        </div>
                      </div>

                      {/* Clearances */}
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ fontSize: "0.85rem", color: "var(--muted, #bbb)" }}>Operational Clearances:</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                          {policyResult.clearances.map((c, i) => (
                            <span
                              key={i}
                              style={{
                                background: "rgba(76, 209, 55, 0.15)",
                                border: "1px solid #4cd137",
                                color: "#4cd137",
                                fontSize: "0.75rem",
                                padding: "2px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              ✓ {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Duties */}
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ fontSize: "0.85rem", color: "var(--muted, #bbb)" }}>Authorized Duties:</strong>
                        <ul style={{ margin: "6px 0 0 16px", padding: 0, fontSize: "0.85rem", color: "#ccc" }}>
                          {policyResult.operationalDuties.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>

                      {policyResult.notes && (
                        <div style={{ fontSize: "0.8rem", color: "var(--muted, #888)", fontStyle: "italic", marginBottom: "16px" }}>
                          Note: {policyResult.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shift Compensation Calculator */}
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(212,175,55,0.3)" }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "var(--gold, #d4af37)" }}>
                      Live Shift Compensation Calculator (Strategy Calculation)
                    </h4>
                    <form onSubmit={handleRecalculateComp} style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "120px" }}>
                        <label style={{ fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>Regular Hours</label>
                        <input
                          type="number"
                          min="0"
                          max="80"
                          value={calcRegularHours}
                          onChange={(e) => setCalcRegularHours(Number(e.target.value))}
                          style={{ width: "100%", padding: "6px 8px" }}
                          disabled={policyLoading}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: "120px" }}>
                        <label style={{ fontSize: "0.8rem", display: "block", marginBottom: "4px" }}>Overtime Hours</label>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={calcOvertimeHours}
                          onChange={(e) => setCalcOvertimeHours(Number(e.target.value))}
                          style={{ width: "100%", padding: "6px 8px" }}
                          disabled={policyLoading}
                        />
                      </div>
                      <button
                        type="submit"
                        className="btn sm"
                        disabled={policyLoading}
                        style={{ height: "36px", background: "var(--gold, #d4af37)", color: "#000" }}
                      >
                        {policyLoading ? "Calculating..." : "Calculate Shift Pay"}
                      </button>
                    </form>

                    {compensationResult && (
                      <div style={{ marginTop: "14px", borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--muted, #aaa)" }}>Regular Earnings:</span>
                          <strong>{compensationResult.regularEarnings.toFixed(2)} LKR</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--muted, #aaa)" }}>Overtime ({compensationResult.overtimeMultiplier}x):</span>
                          <strong>{compensationResult.overtimeEarnings.toFixed(2)} LKR</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--muted, #aaa)" }}>Role Allowance:</span>
                          <strong>{compensationResult.specialAllowance.toFixed(2)} LKR</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(212,175,55,0.4)", paddingTop: "8px", marginTop: "8px" }}>
                          <span style={{ fontSize: "1rem", color: "var(--gold, #d4af37)", fontWeight: "bold" }}>Total Compensation:</span>
                          <span style={{ fontSize: "1.2rem", color: "var(--gold, #d4af37)", fontWeight: "bold" }}>
                            {compensationResult.totalCompensation.toFixed(2)} LKR
                          </span>
                        </div>
                        {compensationResult.formulaBreakdown && (
                          <div style={{ fontSize: "0.75rem", color: "var(--muted, #888)", marginTop: "6px", fontFamily: "monospace" }}>
                            {compensationResult.formulaBreakdown}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: "14px", textAlign: "right" }}>
                    <button type="button" className="btn secondary sm" onClick={handleClosePolicyModal}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

