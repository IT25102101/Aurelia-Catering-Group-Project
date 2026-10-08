import { useEffect, useState, useCallback } from "react";
import { DashboardLayout, DashboardHeader } from "../../components/dashboard";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../../api/menuItemApi";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "Mains",
  dietaryTags: "",
};

const CATEGORIES = [
  "Appetizers",
  "Mains",
  "Desserts",
  "Beverages",
  "Canapés",
  "Live Stations",
];

/**
 * CRUD screen for "6.2 Menu Management".
 * Features category selectors, currency formatting, validation, loading/empty states, and delete confirmation.
 */
export default function MenuItemsPage() {
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
      const data = await getMenuItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load menu items: " + (err.message || "Server error"));
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
      errs.name = "Please enter the dish / menu item name.";
    }
    if (!form.category || !form.category.trim()) {
      errs.category = "Please select or specify a category.";
    }
    if (form.price === "" || isNaN(Number(form.price))) {
      errs.price = "Please specify a valid price.";
    } else if (Number(form.price) < 0) {
      errs.price = "Price cannot be negative.";
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
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        category: form.category.trim(),
        dietaryTags: form.dietaryTags.trim() || null,
      };

      if (editingId) {
        await updateMenuItem(editingId, payload);
      } else {
        await createMenuItem(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      setError(err.message || "Failed to save menu item.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item) {
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price !== null && item.price !== undefined ? String(item.price) : "",
      category: item.category || "Mains",
      dietaryTags: item.dietaryTags || "",
    });
    setEditingId(item.id);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete dish "${name || `#${id}`}"?`)) {
      return;
    }
    try {
      await deleteMenuItem(id);
      await loadItems();
    } catch (err) {
      setError("Failed to delete menu item: " + (err.message || "Server error"));
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
        title="Manage Menu Items"
        subtitle="Add, update, or remove dishes, pricing, and culinary categories."
        showGreeting={false}
      />
      <div className="dashboard-content">

        {error && (
          <div className="error-text" style={{ padding: "10px", marginBottom: "16px", borderRadius: "6px" }}>
            {error}
          </div>
        )}

        {/* ── Menu Item Form ───────────────────────────────────────── */}
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h3 style={{ marginTop: 0 }}>{editingId ? `Edit Dish #${editingId}` : "Add New Menu Item"}</h3>

          {/* Name */}
          <div className="form-group">
            <label htmlFor="menu-name-input">
              Dish Name <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="menu-name-input"
              type="text"
              placeholder="e.g. Truffle Mushroom Tartlet"
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

          {/* Description */}
          <div className="form-group">
            <label htmlFor="menu-desc-input">Description</label>
            <input
              id="menu-desc-input"
              type="text"
              placeholder="e.g. Crisp butter pastry filled with wild forest mushrooms..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={submitting}
            />
          </div>

          {/* Category & Price */}
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="menu-category-select">
                Category <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
              </label>
              <select
                id="menu-category-select"
                value={form.category}
                onChange={(e) => {
                  setForm({ ...form, category: e.target.value });
                  if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: "" }));
                }}
                disabled={submitting}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {fieldErrors.category && (
                <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                  {fieldErrors.category}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="menu-price-input">
                Price (LKR) <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
              </label>
              <input
                id="menu-price-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 850"
                value={form.price}
                onChange={(e) => {
                  setForm({ ...form, price: e.target.value });
                  if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: "" }));
                }}
                disabled={submitting}
              />
              {fieldErrors.price && (
                <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                  {fieldErrors.price}
                </div>
              )}
            </div>
          </div>

          {/* Dietary Tags */}
          <div className="form-group">
            <label htmlFor="menu-tags-input">Dietary Tags</label>
            <input
              id="menu-tags-input"
              type="text"
              placeholder="e.g. Vegetarian, Gluten-Free, Halal"
              value={form.dietaryTags}
              onChange={(e) => setForm({ ...form, dietaryTags: e.target.value })}
              disabled={submitting}
            />
          </div>

          {/* Actions */}
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Add Dish"}
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

        {/* ── Menu Items Table ─────────────────────────────────────── */}
        <h2 style={{ marginTop: 32, marginBottom: 12 }}>Menu Items Catalog</h2>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--muted, #888)" }}>
            Loading menu items...
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "28px", color: "var(--muted, #888)" }}>
            No menu items found. Use the form above to add dishes to your catering catalog.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Dish Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Dietary Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>#{item.id}</strong></td>
                    <td>
                      <strong>{item.name}</strong>
                      {item.description && (
                        <small style={{ display: "block", color: "var(--muted, #888)", marginTop: 2 }}>
                          {item.description}
                        </small>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 7px",
                          borderRadius: "4px",
                          fontSize: "0.82rem",
                          backgroundColor: "rgba(212, 175, 55, 0.12)",
                          color: "var(--gold-dark, #b8860b)",
                          fontWeight: 600,
                        }}
                      >
                        {item.category || "General"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--gold, #d4af37)" }}>
                        Rs. {Number(item.price || 0).toLocaleString("en-LK")}
                      </strong>
                    </td>
                    <td>
                      {item.dietaryTags ? (
                        <span style={{ fontSize: "0.85rem", color: "var(--muted, #888)" }}>
                          {item.dietaryTags}
                        </span>
                      ) : (
                        <span style={{ color: "#aaa" }}>—</span>
                      )}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

