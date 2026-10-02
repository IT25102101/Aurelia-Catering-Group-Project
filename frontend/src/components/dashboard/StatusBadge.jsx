/**
 * Reusable status badge component for Aurelia dashboard and management pages.
 * Supports all backend entity statuses:
 *   - Events: PENDING, CONFIRMED, COMPLETED, CANCELLED
 *   - Orders: PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED
 *   - Deliveries: ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED
 *   - Inventory: IN_STOCK, LOW_STOCK, OUT_OF_STOCK
 *   - Staff: AVAILABLE, UNAVAILABLE
 */
export default function StatusBadge({ status, label, className = "" }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase().replace(/[-\s]/g, "_");

  // Format label if not explicitly provided (e.g., "IN_TRANSIT" -> "In Transit")
  const displayLabel =
    label ||
    String(status)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`status-badge status-badge--${normalized} ${className}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {displayLabel}
    </span>
  );
}
