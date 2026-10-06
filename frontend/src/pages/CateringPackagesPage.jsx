import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardLayout, DashboardHeader } from "../components/dashboard";
import {
  getCateringPackages,
  createCateringPackage,
  updateCateringPackage,
  deleteCateringPackage,
} from "../api/cateringPackageApi";
import { getMenuItems } from "../api/menuItemApi";
import {
  getPackageMenuItems,
  addMenuItemToPackage,
  removeMenuItemFromPackage,
} from "../api/packageMenuItemApi";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  minGuestCount: "50",
  maxGuestCount: "300",
};

/**
 * CRUD screen for "6.3 Catering Package Management" & Package Menu Composition.
 * Features guest count validation, package CRUD, and dynamic menu item assignment.
 */
export default function CateringPackagesPage() {
  // --- Packages State ---
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // --- Package Menu Items State ---
  const [menuItemsCatalog, setMenuItemsCatalog] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageItems, setPackageItems] = useState([]);
  const [loadingPackageItems, setLoadingPackageItems] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [assigningItem, setAssigningItem] = useState(false);
  const [packageItemError, setPackageItemError] = useState("");
  const [packageItemSuccess, setPackageItemSuccess] = useState("");

  const menuSectionRef = useRef(null);

  // Load packages and menu catalog on mount
  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
      setError("");
    }
    try {
      const [packagesData, menuData] = await Promise.all([
        getCateringPackages(),
        getMenuItems(),
      ]);
      const pkgList = Array.isArray(packagesData) ? packagesData : [];
      setItems(pkgList);
      setMenuItemsCatalog(Array.isArray(menuData) ? menuData : []);

      // Auto-select first package if none selected
      if (!selectedPackage && pkgList.length > 0) {
        setSelectedPackage(pkgList[0]);
      }
    } catch (err) {
      setError("Failed to load catering packages: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
    }
  }, [selectedPackage]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Load assigned menu items when selectedPackage changes
  const loadAssignedItems = useCallback(async (pkgId) => {
    if (!pkgId) {
      setPackageItems([]);
      return;
    }
    setLoadingPackageItems(true);
    setPackageItemError("");
    try {
      const data = await getPackageMenuItems(pkgId);
      setPackageItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setPackageItemError("Failed to load menu items: " + (err.message || "Server error"));
    } finally {
      setLoadingPackageItems(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPackage?.id) {
      loadAssignedItems(selectedPackage.id);
    }
  }, [selectedPackage, loadAssignedItems]);

  function validate() {
    const errs = {};
    if (!form.name || !form.name.trim()) {
      errs.name = "Please enter the package title.";
    }
    if (form.price === "" || isNaN(Number(form.price))) {
      errs.price = "Please specify a valid package base price.";
    } else if (Number(form.price) < 0) {
      errs.price = "Price cannot be negative.";
    }
    if (form.minGuestCount === "" || isNaN(Number(form.minGuestCount)) || Number(form.minGuestCount) < 1) {
      errs.minGuestCount = "Min guest count must be at least 1.";
    }
    if (form.maxGuestCount === "" || isNaN(Number(form.maxGuestCount)) || Number(form.maxGuestCount) < Number(form.minGuestCount)) {
      errs.maxGuestCount = "Max guest count must be greater than or equal to min guests.";
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
        minGuestCount: parseInt(form.minGuestCount, 10),
        maxGuestCount: parseInt(form.maxGuestCount, 10),
      };

      if (editingId) {
        await updateCateringPackage(editingId, payload);
      } else {
        await createCateringPackage(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      setError(err.message || "Failed to save catering package.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(item) {
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price !== null && item.price !== undefined ? String(item.price) : "",
      minGuestCount: item.minGuestCount !== null && item.minGuestCount !== undefined ? String(item.minGuestCount) : "50",
      maxGuestCount: item.maxGuestCount !== null && item.maxGuestCount !== undefined ? String(item.maxGuestCount) : "300",
    });
    setEditingId(item.id);
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete catering package "${name || `#${id}`}"?`)) {
      return;
    }
    try {
      await deleteCateringPackage(id);
      if (selectedPackage?.id === id) {
        setSelectedPackage(null);
      }
      await loadItems();
    } catch (err) {
      setError("Failed to delete catering package: " + (err.message || "Server error"));
    }
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
  }

  function handleManageMenuItems(pkg) {
    setSelectedPackage(pkg);
    setPackageItemError("");
    setPackageItemSuccess("");
    setTimeout(() => {
      menuSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  // Assign menu item to currently selected package
  async function handleAddMenuItem(e) {
    e.preventDefault();
    if (!selectedPackage?.id) {
      setPackageItemError("Please select a package first.");
      return;
    }
    if (!selectedMenuItemId) {
      setPackageItemError("Please choose a menu item to add.");
      return;
    }

    // Frontend duplicate prevention check
    const alreadyAssigned = packageItems.some(
      (pi) => Number(pi.menuItemId) === Number(selectedMenuItemId)
    );
    if (alreadyAssigned) {
      setPackageItemError("This menu item is already assigned to this catering package.");
      return;
    }

    setAssigningItem(true);
    setPackageItemError("");
    setPackageItemSuccess("");

    try {
      await addMenuItemToPackage({
        packageId: Number(selectedPackage.id),
        menuItemId: Number(selectedMenuItemId),
      });

      setSelectedMenuItemId("");
      setPackageItemSuccess("Menu item successfully added to package!");
      await loadAssignedItems(selectedPackage.id);
    } catch (err) {
      setPackageItemError(err.message || "Failed to assign menu item.");
    } finally {
      setAssigningItem(false);
    }
  }

  // Remove menu item assignment
  async function handleRemovePackageItem(id, itemName) {
    if (!window.confirm(`Remove "${itemName || "this dish"}" from package "${selectedPackage?.name}"?`)) {
      return;
    }
    setPackageItemError("");
    setPackageItemSuccess("");
    try {
      await removeMenuItemFromPackage(id);
      setPackageItemSuccess("Dish removed from package.");
      await loadAssignedItems(selectedPackage.id);
    } catch (err) {
      setPackageItemError(err.message || "Failed to remove menu item.");
    }
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Manage Catering Packages"
        subtitle="Configure full-service packages, guest tiers, fixed rates, and assigned menu items."
        showGreeting={false}
      />
      <div className="dashboard-content">

        {error && (
          <div className="error-text" style={{ padding: "10px", marginBottom: "16px", borderRadius: "6px" }}>
            {error}
          </div>
        )}

        {/* ── Package Form ─────────────────────────────────────────── */}
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h3 style={{ marginTop: 0 }}>{editingId ? `Edit Package #${editingId}` : "Create New Catering Package"}</h3>

          {/* Name */}
          <div className="form-group">
            <label htmlFor="pkg-name-input">
              Package Title <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="pkg-name-input"
              type="text"
              placeholder="e.g. Royal Wedding Grand Package"
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
            <label htmlFor="pkg-desc-input">Description</label>
            <input
              id="pkg-desc-input"
              type="text"
              placeholder="e.g. 5-course plated dinner, mocktail bar, and dedicated captain service..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={submitting}
            />
          </div>

          {/* Price */}
          <div className="form-group">
            <label htmlFor="pkg-price-input">
              Price per Guest (LKR) <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
            </label>
            <input
              id="pkg-price-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 4500"
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

          {/* Guest Limits */}
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="pkg-min-input">
                Min Guests <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
              </label>
              <input
                id="pkg-min-input"
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={form.minGuestCount}
                onChange={(e) => {
                  setForm({ ...form, minGuestCount: e.target.value });
                  if (fieldErrors.minGuestCount) setFieldErrors((prev) => ({ ...prev, minGuestCount: "" }));
                }}
                disabled={submitting}
              />
              {fieldErrors.minGuestCount && (
                <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                  {fieldErrors.minGuestCount}
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="pkg-max-input">
                Max Guests <span style={{ color: "var(--gold, #d4af37)" }}>*</span>
              </label>
              <input
                id="pkg-max-input"
                type="number"
                min="1"
                placeholder="e.g. 300"
                value={form.maxGuestCount}
                onChange={(e) => {
                  setForm({ ...form, maxGuestCount: e.target.value });
                  if (fieldErrors.maxGuestCount) setFieldErrors((prev) => ({ ...prev, maxGuestCount: "" }));
                }}
                disabled={submitting}
              />
              {fieldErrors.maxGuestCount && (
                <div style={{ color: "#e74c3c", fontSize: "0.85rem", marginTop: 4 }}>
                  {fieldErrors.maxGuestCount}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Package"}
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

        {/* ── Packages Table ───────────────────────────────────────── */}
        <h2 style={{ marginTop: 32, marginBottom: 12 }}>Catering Packages Tier</h2>

        {loading ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--muted, #888)" }}>
            Loading catering packages...
          </div>
        ) : items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "28px", color: "var(--muted, #888)" }}>
            No catering packages found. Use the form above to add banqueting package options.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Package Title</th>
                  <th>Price / Guest</th>
                  <th>Guest Range</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isSelected = selectedPackage?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      style={isSelected ? { background: "rgba(212, 175, 55, 0.08)" } : undefined}
                    >
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
                        <strong style={{ color: "var(--gold, #d4af37)", fontSize: "1.05rem" }}>
                          Rs. {Number(item.price || 0).toLocaleString("en-LK")}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.9rem" }}>
                          {item.minGuestCount || 0} – {item.maxGuestCount || 0} guests
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn sm"
                          style={{
                            marginRight: 6,
                            background: isSelected ? "var(--gold, #d4af37)" : "transparent",
                            color: isSelected ? "#000" : "var(--gold, #d4af37)",
                            border: "1px solid var(--gold, #d4af37)",
                          }}
                          onClick={() => handleManageMenuItems(item)}
                          title="Assign and manage dishes for this package"
                        >
                          {isSelected ? "Menu Assigned" : "Manage Menu"}
                        </button>
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

        {/* ── Package Menu Items Composition Section ───────────────── */}
        <div ref={menuSectionRef} style={{ marginTop: 40 }}>
          <div className="card" style={{ border: "1px solid rgba(212, 175, 55, 0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, color: "var(--gold, #d4af37)" }}>
                  Package Menu Composition
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "var(--muted, #888)" }}>
                  Assign dishes from the Menu Catalog to this package. Ingredients are automatically calculated during event bookings.
                </p>
              </div>

              {/* Package Selector */}
              <div style={{ minWidth: 240 }}>
                <label style={{ fontSize: "0.85rem", display: "block", marginBottom: 4 }}>Select Package:</label>
                <select
                  value={selectedPackage?.id || ""}
                  onChange={(e) => {
                    const found = items.find((p) => p.id === Number(e.target.value));
                    setSelectedPackage(found || null);
                    setPackageItemError("");
                    setPackageItemSuccess("");
                  }}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, background: "var(--surface, #1e1e1e)", color: "#fff", border: "1px solid #444" }}
                >
                  {items.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {p.name} (Rs. {Number(p.price || 0).toLocaleString("en-LK")})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {packageItemError && (
              <div className="error-text" style={{ padding: "8px 12px", marginBottom: "12px", borderRadius: "6px" }}>
                {packageItemError}
              </div>
            )}

            {packageItemSuccess && (
              <div style={{ background: "rgba(46, 204, 113, 0.15)", color: "#2ecc71", border: "1px solid #2ecc71", padding: "8px 12px", marginBottom: "12px", borderRadius: "6px", fontSize: "0.9rem" }}>
                {packageItemSuccess}
              </div>
            )}

            {selectedPackage ? (
              <>
                {/* Add Dish to Package Form */}
                <form
                  onSubmit={handleAddMenuItem}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    padding: "16px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: 8,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <label style={{ display: "block", fontSize: "0.85rem", marginBottom: 6 }}>
                      Add Menu Item to <strong>{selectedPackage.name}</strong>:
                    </label>
                    <select
                      value={selectedMenuItemId}
                      onChange={(e) => setSelectedMenuItemId(e.target.value)}
                      disabled={assigningItem}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 6, background: "var(--surface, #1e1e1e)", color: "#fff", border: "1px solid #444" }}
                    >
                      <option value="">-- Choose a dish from Menu Catalog --</option>
                      {menuItemsCatalog.map((mi) => (
                        <option key={mi.id} value={mi.id}>
                          {mi.category ? `[${mi.category}] ` : ""}{mi.name} - Rs. {Number(mi.price || 0).toLocaleString("en-LK")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="btn gold"
                    disabled={assigningItem || !selectedMenuItemId}
                  >
                    {assigningItem ? "Adding..." : "+ Add to Package"}
                  </button>
                </form>

                {/* Assigned Items List */}
                <h4 style={{ margin: "16px 0 8px" }}>
                  Dishes in {selectedPackage.name} ({packageItems.length})
                </h4>

                {loadingPackageItems ? (
                  <div style={{ padding: "16px", textAlign: "center", color: "var(--muted, #888)" }}>
                    Loading assigned menu items...
                  </div>
                ) : packageItems.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 6, color: "var(--muted, #888)" }}>
                    No menu items assigned to this package yet. Use the selector above to include dishes.
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Dish Name</th>
                          <th>A La Carte Price</th>
                          <th style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packageItems.map((pmi) => (
                          <tr key={pmi.id}>
                            <td>
                              <span style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontSize: "0.8rem",
                                background: "rgba(212, 175, 55, 0.15)",
                                color: "var(--gold, #d4af37)",
                                border: "1px solid rgba(212, 175, 55, 0.3)"
                              }}>
                                {pmi.menuItemCategory || "General"}
                              </span>
                            </td>
                            <td>
                              <strong>{pmi.menuItemName || `Dish #${pmi.menuItemId}`}</strong>
                              {pmi.menuItemDescription && (
                                <small style={{ display: "block", color: "var(--muted, #888)", marginTop: 2 }}>
                                  {pmi.menuItemDescription}
                                </small>
                              )}
                            </td>
                            <td>
                              Rs. {Number(pmi.menuItemPrice || 0).toLocaleString("en-LK")}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="btn danger sm"
                                onClick={() => handleRemovePackageItem(pmi.id, pmi.menuItemName)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--muted, #888)" }}>
                Please select a catering package above to view and manage its assigned menu items.
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}


