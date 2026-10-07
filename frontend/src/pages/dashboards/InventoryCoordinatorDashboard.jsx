import { useEffect, useState, useCallback, useMemo } from "react";
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
import { getInventoryItems } from "../../api/inventoryItemApi";

/* ── SVG Icons ─────────────────────────────────────────────────── */
const InventoryIcons = {
  inventory: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  healthy: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  lowStock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  outOfStock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
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
 * Determine stock level status strictly from backend fields:
 * - OUT_OF_STOCK: quantityInStock <= 0
 * - LOW_STOCK: quantityInStock > 0 && quantityInStock <= reorderThreshold
 * - IN_STOCK: quantityInStock > reorderThreshold
 */
function getStockStatus(qty, threshold) {
  const q = Number(qty || 0);
  const t = Number(threshold || 0);
  if (q <= 0) return "OUT_OF_STOCK";
  if (q <= t) return "LOW_STOCK";
  return "IN_STOCK";
}

/**
 * Inventory Coordinator Dashboard — B8.6 Redesign
 * Unanimously unified with Admin Dashboard visual language.
 */
function InventoryCoordinatorDashboardContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | OUT_OF_STOCK | LOW_STOCK | IN_STOCK
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const data = await getInventoryItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load inventory stock data: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = items.length;
    let outOfStock = 0;
    let lowStock = 0;
    let inStock = 0;

    items.forEach((item) => {
      const status = getStockStatus(item.quantityInStock, item.reorderThreshold);
      if (status === "OUT_OF_STOCK") outOfStock++;
      else if (status === "LOW_STOCK") lowStock++;
      else inStock++;
    });

    return { total, inStock, lowStock, outOfStock };
  }, [items]);

  // Items requiring immediate replenishment
  const attentionItems = useMemo(() => {
    return items
      .filter((item) => {
        const status = getStockStatus(item.quantityInStock, item.reorderThreshold);
        return status === "OUT_OF_STOCK" || status === "LOW_STOCK";
      })
      .sort((a, b) => {
        const statusA = getStockStatus(a.quantityInStock, a.reorderThreshold);
        const statusB = getStockStatus(b.quantityInStock, b.reorderThreshold);
        if (statusA === "OUT_OF_STOCK" && statusB !== "OUT_OF_STOCK") return -1;
        if (statusB === "OUT_OF_STOCK" && statusA !== "OUT_OF_STOCK") return 1;
        return (Number(a.quantityInStock) || 0) - (Number(b.quantityInStock) || 0);
      });
  }, [items]);

  // Filtered list for the stock catalog table
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const status = getStockStatus(item.quantityInStock, item.reorderThreshold);
      if (statusFilter !== "ALL" && status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = item.ingredientName?.toLowerCase().includes(q);
        const unitMatch = item.unit?.toLowerCase().includes(q);
        const idMatch = String(item.id).includes(q);
        if (!nameMatch && !unitMatch && !idMatch) return false;
      }

      return true;
    });
  }, [items, statusFilter, searchQuery]);

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Inventory Coordination"
        subtitle="Manage ingredient stock levels, unit quantities, and supplier replenishment thresholds."
        actions={
          <button
            type="button"
            className={`dashboard-refresh-btn ${refreshing ? "refreshing" : ""}`}
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            title="Sync inventory stock from live backend"
          >
            {InventoryIcons.refresh}
            <span>{refreshing ? "Refreshing..." : "Sync Data"}</span>
          </button>
        }
      />

      <div className="dashboard-content">
        {/* Error Alert */}
        {error && (
          <AlertCard
            type="danger"
            title="Failed to Load Inventory"
            message={error}
          />
        )}

        {/* ── 1. Summary Stat Cards Grid ────────────────────────────── */}
        <section>
          <SectionHeader
            title="Pantry Stock Summary"
            subtitle="Real-time ingredient levels and inventory threshold health"
          />
          <div className="dashboard-stat-grid">
            <StatCard
              icon={InventoryIcons.inventory}
              label="Total Stock Items"
              value={stats.total}
              tag="Catalog"
              supportingText="Tracked ingredients & supplies"
              accentColor="var(--color-primary)"
              loading={loading}
            />
            <StatCard
              icon={InventoryIcons.healthy}
              label="In Stock / Healthy"
              value={stats.inStock}
              tag="Above Threshold"
              supportingText="Comfortable stock buffer"
              accentColor="var(--color-success)"
              iconBg="rgba(46, 107, 55, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={InventoryIcons.lowStock}
              label="Low Stock Items"
              value={stats.lowStock}
              tag={stats.lowStock > 0 ? "Reorder Soon" : "None"}
              supportingText="At or below reorder threshold"
              accentColor="var(--color-warning)"
              iconBg="rgba(181, 119, 30, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={InventoryIcons.outOfStock}
              label="Out of Stock"
              value={stats.outOfStock}
              tag={stats.outOfStock > 0 ? "Urgent Reorder" : "Stocked"}
              supportingText="Depleted ingredient items"
              accentColor="var(--color-danger)"
              iconBg="rgba(143, 52, 52, 0.1)"
              loading={loading}
            />
          </div>
        </section>

        {/* ── 2. Restock Alerts & Stock Attention Section ──────────── */}
        <section>
          <SectionHeader
            title="Stock Attention & Restock Alerts"
            subtitle="Live automated notifications based on threshold rules"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {stats.outOfStock > 0 && (
              <AlertCard
                type="danger"
                title={`${stats.outOfStock} Ingredient${stats.outOfStock > 1 ? "s" : ""} Currently Out of Stock`}
                message={`The following supplies are completely depleted: ${items
                  .filter((i) => getStockStatus(i.quantityInStock, i.reorderThreshold) === "OUT_OF_STOCK")
                  .map((i) => i.ingredientName)
                  .join(", ")}. Immediate reorder recommended.`}
                action={
                  <Link to="/manage/inventory" className="btn sm gold" style={{ textDecoration: "none" }}>
                    Update Stock
                  </Link>
                }
              />
            )}

            {stats.lowStock > 0 && (
              <AlertCard
                type="warning"
                title={`${stats.lowStock} Item${stats.lowStock > 1 ? "s" : ""} Below Reorder Threshold`}
                message={`${items
                  .filter((i) => getStockStatus(i.quantityInStock, i.reorderThreshold) === "LOW_STOCK")
                  .map((i) => `${i.ingredientName} (${i.quantityInStock} ${i.unit || "units"} left)`)
                  .join(", ")}.`}
                action={
                  <Link to="/manage/inventory" className="btn sm secondary" style={{ textDecoration: "none" }}>
                    Review Supplies
                  </Link>
                }
              />
            )}

            {stats.total > 0 && stats.outOfStock === 0 && stats.lowStock === 0 && (
              <AlertCard
                type="success"
                title="All Inventory Stock Levels Healthy"
                message="All tracked ingredient and supply quantities are comfortably above their respective reorder thresholds."
              />
            )}

            {stats.total === 0 && !loading && (
              <AlertCard
                type="info"
                title="No Inventory Items Tracked"
                message="There are currently no ingredients or supplies recorded in the database. Use the management link to create items."
                action={
                  <Link to="/manage/inventory" className="btn sm secondary" style={{ textDecoration: "none" }}>
                    Add Stock Items
                  </Link>
                }
              />
            )}
          </div>
        </section>

        {/* ── 3. Priority Replenishment Watchlist ─────────────────── */}
        {attentionItems.length > 0 && (
          <section>
            <SectionHeader
              title="Priority Replenishment Watchlist"
              subtitle="Items requiring immediate purchase orders or supplier replenishment"
              actionLabel="Manage Stock &rarr;"
              actionTo="/manage/inventory"
            />
            <DashboardTable
              title="Urgent Replenishment Queue"
              headerAction={
                <Link to="/manage/inventory" className="dashboard-section-header__action">
                  Manage Inventory &rarr;
                </Link>
              }
              headers={["ID", "Ingredient / Supply", "Current Stock", "Reorder Threshold", "Stock Status", "Action"]}
              loading={loading}
              empty={attentionItems.length === 0}
              emptyTitle="All Supplies Stocked"
              emptyDesc="No ingredients are currently depleted or below threshold levels."
            >
              {attentionItems.map((item) => {
                const status = getStockStatus(item.quantityInStock, item.reorderThreshold);
                const isOut = status === "OUT_OF_STOCK";

                return (
                  <tr key={item.id} style={{ background: isOut ? "rgba(143, 52, 52, 0.04)" : "rgba(181, 119, 30, 0.04)" }}>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>
                        #{item.id}
                      </span>
                    </td>
                    <td>
                      <strong>{item.ingredientName}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: isOut ? "var(--color-danger)" : "var(--color-warning)",
                        }}
                      >
                        {item.quantityInStock !== null && item.quantityInStock !== undefined
                          ? Number(item.quantityInStock).toLocaleString()
                          : "0"}{" "}
                        <small style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>
                          {item.unit || "units"}
                        </small>
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "var(--color-text-muted)" }}>
                        {item.reorderThreshold !== null && item.reorderThreshold !== undefined
                          ? Number(item.reorderThreshold).toLocaleString()
                          : "0"}{" "}
                        {item.unit || "units"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={status} />
                    </td>
                    <td>
                      <Link
                        to="/manage/inventory"
                        className="btn sm gold"
                        style={{ textDecoration: "none", display: "inline-block" }}
                      >
                        Restock
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </DashboardTable>
          </section>
        )}

        {/* ── 4. Complete Stock Catalog Overview ───────────────────── */}
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
              title="Current Stock Catalog"
              subtitle={`Showing ${filteredItems.length} of ${items.length} total inventory items`}
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
                { id: "ALL", label: `All (${items.length})` },
                { id: "OUT_OF_STOCK", label: `Out of Stock (${stats.outOfStock})` },
                { id: "LOW_STOCK", label: `Low Stock (${stats.lowStock})` },
                { id: "IN_STOCK", label: `In Stock (${stats.inStock})` },
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
              placeholder="Search ingredient by name, unit, or ID..."
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
            title="Ingredient & Supplies Catalog"
            headerAction={
              <Link to="/manage/inventory" className="dashboard-section-header__action">
                Full Stock Manager &rarr;
              </Link>
            }
            headers={["ID", "Ingredient / Supply Name", "Current Quantity", "Unit", "Reorder Threshold", "Stock Status", "Actions"]}
            loading={loading}
            empty={filteredItems.length === 0}
            emptyTitle="No Matching Items"
            emptyDesc={
              searchQuery || statusFilter !== "ALL"
                ? "No inventory records match the selected filter criteria or search query."
                : "No inventory items have been registered in the system yet."
            }
          >
            {filteredItems.map((item) => {
              const status = getStockStatus(item.quantityInStock, item.reorderThreshold);

              return (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: "var(--color-text-muted)" }}>
                      #{item.id}
                    </span>
                  </td>
                  <td>
                    <strong>{item.ingredientName}</strong>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                      {item.quantityInStock !== null && item.quantityInStock !== undefined
                        ? Number(item.quantityInStock).toLocaleString()
                        : "0"}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--color-text-muted)" }}>{item.unit || "units"}</span>
                  </td>
                  <td>
                    <span>
                      {item.reorderThreshold !== null && item.reorderThreshold !== undefined
                        ? Number(item.reorderThreshold).toLocaleString()
                        : "0"}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  <td>
                    <Link
                      to="/manage/inventory"
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

        {/* ── 5. Quick Actions Section ─────────────────────────────── */}
        <section>
          <SectionHeader
            title="Inventory Management"
            subtitle="Authorized inventory replenishment controls and stock catalog access"
          />
          <div className="quick-action-grid">
            <QuickActionCard
              to="/manage/inventory"
              title="Stock Levels & Supplies"
              description="Add new inventory items, record incoming stock, edit quantities, and adjust reorder alert thresholds."
              icon={InventoryIcons.inventory}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

export default function InventoryCoordinatorDashboard() {
  return (
    <RequireRole role="INVENTORY_COORDINATOR">
      <InventoryCoordinatorDashboardContent />
    </RequireRole>
  );
}


