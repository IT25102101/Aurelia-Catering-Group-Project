import { useEffect, useState, useCallback } from "react";
import { DashboardLayout, DashboardHeader } from "../components/dashboard";
import { getMenuItems } from "../api/menuItemApi";
import { getInventoryItems } from "../api/inventoryItemApi";
import {
  getRecipesByMenuItemId,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "../api/recipeApi";

/**
 * CRUD screen for Recipe Ingredient Management.
 *
 * Workflow:
 *   1. User selects a Menu Item from the dropdown.
 *   2. Page loads all recipe ingredients for that menu item.
 *   3. User can Add / Edit / Delete ingredient-quantity links.
 *
 * This data is consumed by the inventory check system:
 *   Required Quantity = Guest Count × Quantity Per Guest
 *
 * Pattern: follows the same structure as InventoryItemsPage.jsx
 * and MenuItemsPage.jsx — one form card, one data table below.
 */

const emptyForm = {
  inventoryItemId: "",
  quantityPerGuest: "",
  unit: "",
};

export default function RecipesPage() {
  // ── Data Lists ───────────────────────────────────────────────────────
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);

  // ── Selection / Form State ───────────────────────────────────────────
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null = add mode, number = edit mode

  // ── UI State ─────────────────────────────────────────────────────────
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForm, setShowForm] = useState(false); // toggle add/edit form visibility

  // ── Load Menu Items & Inventory Items on Mount ───────────────────────
  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    setError("");
    try {
      const [menuData, invData] = await Promise.all([
        getMenuItems().catch(() => []),
        getInventoryItems().catch(() => []),
      ]);
      setMenuItems(Array.isArray(menuData) ? menuData : []);
      setInventoryItems(Array.isArray(invData) ? invData : []);
    } catch (err) {
      setError("Failed to load menu items or inventory items: " + (err.message || "Server error"));
    } finally {
      setLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // ── Load Recipes for Selected Menu Item ──────────────────────────────
  const loadRecipes = useCallback(async (menuItemId) => {
    if (!menuItemId) {
      setRecipes([]);
      return;
    }
    setLoadingRecipes(true);
    setError("");
    try {
      const data = await getRecipesByMenuItemId(menuItemId);
      setRecipes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load recipe ingredients: " + (err.message || "Server error"));
      setRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  }, []);

  // When menu item selection changes, reload its recipes and reset form
  function handleMenuItemChange(e) {
    const id = e.target.value;
    setSelectedMenuItemId(id);
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setFieldErrors({});
    setError("");
    loadRecipes(id);
  }

  // ── When user picks an inventory item in the form, auto-fill unit ────
  function handleInventoryItemChange(e) {
    const invId = e.target.value;
    const invItem = inventoryItems.find((i) => String(i.id) === String(invId));
    setForm((prev) => ({
      ...prev,
      inventoryItemId: invId,
      // Pre-fill unit from the inventory item's own unit if not in edit mode
      unit: invItem ? invItem.unit || "" : prev.unit,
    }));
    if (fieldErrors.inventoryItemId) {
      setFieldErrors((prev) => ({ ...prev, inventoryItemId: "" }));
    }
  }

  // ── Validation ───────────────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!form.inventoryItemId) {
      errs.inventoryItemId = "Please select an inventory ingredient.";
    }
    if (form.quantityPerGuest === "" || isNaN(Number(form.quantityPerGuest))) {
      errs.quantityPerGuest = "Please enter a valid quantity per guest.";
    } else if (Number(form.quantityPerGuest) <= 0) {
      errs.quantityPerGuest = "Quantity per guest must be greater than zero.";
    }
    if (!form.unit || !form.unit.trim()) {
      errs.unit = "Please enter a unit (e.g. kg, litres, units).";
    }
    return errs;
  }

  // ── Submit: Create or Update ─────────────────────────────────────────
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
        menuItemId: parseInt(selectedMenuItemId, 10),
        inventoryItemId: parseInt(form.inventoryItemId, 10),
        quantityPerGuest: parseFloat(form.quantityPerGuest),
        unit: form.unit.trim(),
      };

      if (editingId) {
        await updateRecipe(editingId, payload);
      } else {
        await createRecipe(payload);
      }

      // Reset form and reload
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadRecipes(selectedMenuItemId);
    } catch (err) {
      setError(err.message || "Failed to save recipe ingredient.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Edit: populate form with selected recipe row ─────────────────────
  function handleEdit(recipe) {
    setForm({
      inventoryItemId: recipe.inventoryItemId != null ? String(recipe.inventoryItemId) : "",
      quantityPerGuest: recipe.quantityPerGuest != null ? String(recipe.quantityPerGuest) : "",
      unit: recipe.unit || "",
    });
    setEditingId(recipe.id);
    setShowForm(true);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Delete ───────────────────────────────────────────────────────────
  async function handleDelete(id, ingredientName) {
    if (
      !window.confirm(
        `Are you sure you want to remove "${ingredientName || `Ingredient #${id}`}" from this recipe?`
      )
    ) {
      return;
    }
    try {
      await deleteRecipe(id);
      await loadRecipes(selectedMenuItemId);
    } catch (err) {
      setError("Failed to delete recipe ingredient: " + (err.message || "Server error"));
    }
  }

  // ── Cancel edit mode ─────────────────────────────────────────────────
  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setFieldErrors({});
  }

  // ── Derived: name of currently selected menu item ────────────────────
  const selectedMenuItemName =
    menuItems.find((m) => String(m.id) === String(selectedMenuItemId))?.name || "";

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <DashboardHeader
        title="Recipe Ingredient Management"
        subtitle="Define the ingredients and per-guest quantities for each menu item to enable automatic inventory checking."
        showGreeting={false}
      />
      <div className="dashboard-content">

        {/* ── Global Error ─────────────────────────────────────────── */}
        {error && (
          <div
            className="error-text"
            style={{ padding: "10px", marginBottom: "16px", borderRadius: "6px" }}
          >
            {error}
          </div>
        )}

        {/* ── Step 1: Menu Item Selector ───────────────────────────── */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Step 1 — Select a Menu Item</h3>
          <p style={{ color: "var(--muted, #888)", fontSize: "0.92rem", marginBottom: 12 }}>
            Choose a menu item to view and manage its recipe ingredients.
          </p>
          {loadingLists ? (
            <div style={{ color: "var(--muted, #888)", padding: "8px 0" }}>
              Loading menu items...
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="recipe-menu-item-select">
                Menu Item <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
              </label>
              <select
                id="recipe-menu-item-select"
                value={selectedMenuItemId}
                onChange={handleMenuItemChange}
              >
                <option value="">— Select a menu item —</option>
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.category ? ` (${m.category})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Step 2: Recipe Ingredients (only after menu item selected) */}
        {selectedMenuItemId && (
          <>
            {/* ── Section Header + Add Button ──────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>
                  Recipe Ingredients
                </h2>
                <p style={{ margin: "4px 0 0", color: "var(--muted, #888)", fontSize: "0.90rem" }}>
                  Showing ingredients for: <strong>{selectedMenuItemName}</strong>
                </p>
              </div>
              {!showForm && (
                <button
                  className="btn"
                  onClick={() => {
                    setForm(emptyForm);
                    setEditingId(null);
                    setShowForm(true);
                    setFieldErrors({});
                  }}
                >
                  + Add Ingredient
                </button>
              )}
            </div>

            {/* ── Add / Edit Form ──────────────────────────────────── */}
            {showForm && (
              <form className="card" onSubmit={handleSubmit} noValidate style={{ marginBottom: 24 }}>
                <h3 style={{ marginTop: 0 }}>
                  {editingId ? `Edit Recipe Ingredient #${editingId}` : "Add Ingredient to Recipe"}
                </h3>
                <p style={{ color: "var(--muted, #888)", fontSize: "0.90rem", marginBottom: 16 }}>
                  Menu Item: <strong>{selectedMenuItemName}</strong>
                </p>

                {/* Inventory Ingredient Dropdown */}
                <div className="form-group">
                  <label htmlFor="recipe-inventory-select">
                    Inventory Ingredient{" "}
                    <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
                  </label>
                  <select
                    id="recipe-inventory-select"
                    value={form.inventoryItemId}
                    onChange={handleInventoryItemChange}
                    disabled={submitting}
                  >
                    <option value="">— Select an ingredient —</option>
                    {inventoryItems.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.ingredientName}
                        {inv.unit ? ` (${inv.unit})` : ""}
                        {inv.quantityInStock != null
                          ? ` — Stock: ${Number(inv.quantityInStock).toLocaleString()} ${inv.unit || ""}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.inventoryItemId && (
                    <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                      {fieldErrors.inventoryItemId}
                    </div>
                  )}
                </div>

                {/* Quantity Per Guest + Unit — side by side */}
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="recipe-qty-input">
                      Quantity Per Guest{" "}
                      <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
                    </label>
                    <input
                      id="recipe-qty-input"
                      type="number"
                      min="0.001"
                      step="0.001"
                      placeholder="e.g. 0.20"
                      value={form.quantityPerGuest}
                      onChange={(e) => {
                        setForm({ ...form, quantityPerGuest: e.target.value });
                        if (fieldErrors.quantityPerGuest)
                          setFieldErrors((prev) => ({ ...prev, quantityPerGuest: "" }));
                      }}
                      disabled={submitting}
                    />
                    {fieldErrors.quantityPerGuest && (
                      <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                        {fieldErrors.quantityPerGuest}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="recipe-unit-input">
                      Unit <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
                    </label>
                    <input
                      id="recipe-unit-input"
                      type="text"
                      placeholder="e.g. kg, litres, units"
                      value={form.unit}
                      onChange={(e) => {
                        setForm({ ...form, unit: e.target.value });
                        if (fieldErrors.unit)
                          setFieldErrors((prev) => ({ ...prev, unit: "" }));
                      }}
                      disabled={submitting}
                    />
                    {fieldErrors.unit && (
                      <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                        {fieldErrors.unit}
                      </div>
                    )}
                  </div>
                </div>

                {/* Helper note */}
                <p style={{ color: "var(--muted, #888)", fontSize: "0.85rem", margin: "8px 0 16px" }}>
                  Formula used during inventory check:{" "}
                  <strong>Required = Guest Count × Quantity Per Guest</strong>
                </p>

                {/* Form Actions */}
                <div>
                  <button type="submit" className="btn" disabled={submitting}>
                    {submitting ? "Saving..." : editingId ? "Save Changes" : "Add to Recipe"}
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    style={{ marginLeft: 8 }}
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* ── Recipe Ingredients Table ─────────────────────────── */}
            {loadingRecipes ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--muted, #888)" }}>
                Loading recipe ingredients...
              </div>
            ) : recipes.length === 0 ? (
              <div
                className="card"
                style={{ textAlign: "center", padding: "28px", color: "var(--muted, #888)" }}
              >
                No recipe ingredients defined for <strong>{selectedMenuItemName}</strong> yet.
                <br />
                <span style={{ fontSize: "0.88rem" }}>
                  Use the <strong>+ Add Ingredient</strong> button above to define the first ingredient.
                </span>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Ingredient</th>
                      <th>Quantity Per Guest</th>
                      <th>Unit</th>
                      <th>Current Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.map((recipe) => (
                      <tr key={recipe.id}>
                        <td>
                          <strong>#{recipe.id}</strong>
                        </td>
                        <td>
                          <strong>{recipe.ingredientName || `Ingredient #${recipe.inventoryItemId}`}</strong>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: "1.02rem" }}>
                            {recipe.quantityPerGuest != null
                              ? Number(recipe.quantityPerGuest).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 4,
                                })
                              : "—"}
                          </span>
                        </td>
                        <td>{recipe.unit || recipe.inventoryUnit || "—"}</td>
                        <td>
                          {recipe.quantityInStock != null ? (
                            <span>
                              {Number(recipe.quantityInStock).toLocaleString()}{" "}
                              {recipe.inventoryUnit || recipe.unit || ""}
                            </span>
                          ) : (
                            <span style={{ color: "var(--muted, #888)" }}>—</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn secondary sm"
                            onClick={() => handleEdit(recipe)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn danger sm"
                            style={{ marginLeft: 6 }}
                            onClick={() =>
                              handleDelete(
                                recipe.id,
                                recipe.ingredientName || `Ingredient #${recipe.inventoryItemId}`
                              )
                            }
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

            {/* ── Inventory Formula Info ───────────────────────────── */}
            {recipes.length > 0 && (
              <div
                className="card"
                style={{
                  marginTop: 20,
                  background: "rgba(212, 175, 55, 0.06)",
                  borderLeft: "3px solid var(--gold, #d4af37)",
                  padding: "14px 18px",
                }}
              >
                <strong style={{ fontSize: "0.90rem" }}>Inventory Check Formula</strong>
                <p style={{ margin: "6px 0 0", fontSize: "0.87rem", color: "var(--muted, #888)" }}>
                  When an order for <strong>{selectedMenuItemName}</strong> is confirmed,
                  the system calculates:{" "}
                  <strong>Required = Guest Count × Quantity Per Guest</strong> for each ingredient above,
                  then deducts from inventory stock automatically.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Placeholder when no menu item is selected ────────────── */}
        {!selectedMenuItemId && !loadingLists && (
          <div
            className="card"
            style={{ textAlign: "center", padding: "36px", color: "var(--muted, #888)" }}
          >
            <p style={{ fontSize: "1.05rem", marginBottom: 6 }}>
              Select a menu item above to view and manage its recipe ingredients.
            </p>
            <p style={{ fontSize: "0.88rem" }}>
              Recipes define how much of each ingredient is needed per guest,
              which powers the automatic inventory check during order confirmation.
            </p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
