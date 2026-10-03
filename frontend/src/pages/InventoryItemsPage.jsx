import { useEffect, useState, useCallback } from "react";
import { DashboardLayout, DashboardHeader, StatusBadge } from "../components/dashboard";
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../api/inventoryItemApi";

const emptyForm = {
  ingredientName: "",
  unit: "kg",
  quantityInStock: "",
  reorderThreshold: "",
};

/**
 * CRUD screen for "6.4 Inventory & Supply Management".
 * Features real-time stock status badges (IN STOCK / LOW STOCK),
 * non-negative validation, loading/empty states, and full CRUD backend integration.
 */
export default function InventoryItemsPage() {
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
      const data = await getInventoryItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load inventory stock records: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function validate() {
    const errs = {};
    if (!form.ingredientName || !form.ingredientName.trim()) {
      errs.ingredientName = "Please enter an ingredient or supply name.";
    }
    if (!form.unit || !form.unit.trim()) {
      errs.unit = "Please specify a unit of measurement (e.g. kg, liters, units).";
    }
    if (form.quantityInStock === "" || isNaN(Number(form.quantityInStock))) {
      errs.quantityInStock = "Please specify quantity in stock.";
    } else if (Number(form.quantityInStock) < 0) {
      errs.quantityInStock = "Quantity in stock cannot be negative.";
    }
    if (form.reorderThreshold === "" || isNaN(Number(form.reorderThreshold))) {
      errs.reorderThreshold = "Please specify reorder threshold.";
    } else if (Number(form.reorderThreshold) < 0) {
      errs.reorderThreshold = "Reorder threshold cannot be negative.";
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
        ingredientName: form.ingredientName.trim(),
        unit: form.unit.trim(),
        quantityInStock: parseFloat(form.quantityInStock),
        reorderThreshold: parseFloat(form.reorderThreshold),
      };

      if (editingId) {
        await updateInventoryItem(editingId, payload);
      } else {
        await createInventoryItem(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      setError(err.message || "Failed to save inventory item.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item) {
    setForm({
      ingredientName: item.ingredientName || "",
      unit: item.unit || "kg",
      quantityInStock: item.quantityInStock !== null && item.quantityInStock !== undefined ? String(item.quantityInStock) : "",
      reorderThreshold: item.reorderThreshold !== null && item.reorderThreshold !== undefined ? String(item.reorderThreshold) : "",
    });
    setEditingId(item.id);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete inventory item "${name || `#${id}`}"?`)) {
      return;
    }
    try {
      await deleteInventoryItem(id);
      await loadItems();
    } catch (err) {
      setError("Failed to delete inventory item: " + (err.message || "Server error"));
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
        title="Manage Inventory"
        subtitle="Track raw ingredient supplies, stock levels, and automated reorder alerts."
        showGreeting={false}
      />
      <div className="dashboard-content">

        {error && (
          <div className="error-text" style={{ padding: "10px", marginBottom: "16px", borderRadius: "6px" }}>
            {error}
          </div>
        )}

        {/* ── Inventory Form ───────────────────────────────────────── */}
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h3 style={{ marginTop: 0 }}>{editingId ? `Edit Inventory Item #${editingId}` : "Add New Inventory Stock"}</h3>

          {/* Ingredient Name */}
          <div className="form-group">
            <label htmlFor="inv-name-input">
              Ingredient / Supply Name <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="inv-name-input"
              type="text"
              placeholder="e.g. Grass-Fed Lamb Rack"
              value={form.ingredientName}
              onChange={(e) => {
                setForm({ ...form, ingredientName: e.target.value });
                if (fieldErrors.ingredientName) setFieldErrors((prev) => ({ ...prev, ingredientName: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.ingredientName && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.ingredientName}
              </div>
            )}
          </div>

          {/* Unit */}
          <div className="form-group">
            <label htmlFor="inv-unit-input">
              Unit of Measurement <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="inv-unit-input"
              type="text"
              placeholder="e.g. kg, liters, packs, portions"
              value={form.unit}
              onChange={(e) => {
                setForm({ ...form, unit: e.target.value });
                if (fieldErrors.unit) setFieldErrors((prev) => ({ ...prev, unit: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.unit && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.unit}
              </div>
            )}
          </div>

          {/* Quantity in Stock */}
          <div className="form-group">
            <label htmlFor="inv-qty-input">
              Current Quantity in Stock <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="inv-qty-input"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 50"
              value={form.quantityInStock}
              onChange={(e) => {
                setForm({ ...form, quantityInStock: e.target.value });
                if (fieldErrors.quantityInStock) setFieldErrors((prev) => ({ ...prev, quantityInStock: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.quantityInStock && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.quantityInStock}
              </div>
            )}
          </div>

          {/* Reorder Threshold */}
          <div className="form-group">
            <label htmlFor="inv-threshold-input">
              Reorder Alert Threshold <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="inv-threshold-input"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 10"
              value={form.reorderThreshold}
              onChange={(e) => {
                setForm({ ...form, reorderThreshold: e.target.value });
                if (fieldErrors.reorderThreshold) setFieldErrors((prev) => ({ ...prev, reorderThreshold: "" }));
              }}
              disabled={submitting}
            />
            {fieldErrors.reorderThreshold && (
              <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                {fieldErrors.reorderThreshold}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Add Inventory Item"}
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

        {/* ── Inventory Table ──────────────────────────────────────── */}
        <h2 style={{ marginTop: 32, marginBottom: 12 }}>Current Stock Inventory</h2>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--muted, #888)" }}>
            Loading inventory stock records...
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "28px", color: "var(--muted, #888)" }}>
            No inventory items found. Use the form above to record supply stock.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ingredient / Supply</th>
                  <th>Quantity in Stock</th>
                  <th>Unit</th>
                  <th>Reorder Threshold</th>
                  <th>Stock Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLowStock =
                    Number(item.quantityInStock || 0) <= Number(item.reorderThreshold || 0);

                  return (
                    <tr key={item.id}>
                      <td><strong>#{item.id}</strong></td>
                      <td><strong>{item.ingredientName}</strong></td>
                      <td>
                        <span style={{ fontSize: "1.05rem", fontWeight: 600 }}>
                          {item.quantityInStock !== null && item.quantityInStock !== undefined
                            ? Number(item.quantityInStock).toLocaleString()
                            : "0"}
                        </span>
                      </td>
                      <td>{item.unit || "units"}</td>
                      <td>{item.reorderThreshold !== null && item.reorderThreshold !== undefined ? Number(item.reorderThreshold).toLocaleString() : "0"}</td>
                      <td>
                        <StatusBadge status={isLowStock ? "LOW_STOCK" : "IN_STOCK"} />
                      </td>
                      <td>
                        <button className="btn secondary sm" onClick={() => handleEdit(item)}>
                          Edit
                        </button>
                        <button
                          className="btn danger sm"
                          style={{ marginLeft: 6 }}
                          onClick={() => handleDelete(item.id, item.ingredientName)}
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

