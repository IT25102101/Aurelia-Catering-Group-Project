import { API_BASE_URL } from "./config";

/**
 * All the fetch calls for "6.1 Order Booking Management" live in this one file.
 * This matches the backend's OrderController.java one-to-one:
 * every function here calls exactly one endpoint on that controller.
 *
 * Every function returns a Promise — use it with async/await in a
 * component, e.g.:
 *   const data = await getOrders();
 */

const BASE = `${API_BASE_URL}/orders`;

// READ (all)
export async function getOrders() {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
}

// READ (one, by id)
export async function getOrderById(id) {
  const response = await fetch(`${BASE}/${id}`);
  if (response.status === 404) {
    throw new Error(`Order #${id} not found.`);
  }
  if (!response.ok) throw new Error(`Failed to fetch Order with id ${id}`);
  return response.json();
}

// STATUS HISTORY (by order id)
export async function getOrderStatusHistory(orderId) {
  const response = await fetch(`${API_BASE_URL}/order-status-history/order/${orderId}`);
  if (response.status === 404) return [];
  if (!response.ok) return [];
  return response.json();
}

// CREATE
export async function createOrder(orderData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) throw new Error("Failed to create Order");
  return response.json();
}

// CREATE GUEST ORDER (Atomic Customer + Order + Event)
export async function createGuestOrder(guestOrderData) {
  const response = await fetch(`${BASE}/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(guestOrderData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to submit catering booking");
  }
  return response.json();
}

// UPDATE
export async function updateOrder(id, orderData) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) throw new Error(`Failed to update Order with id ${id}`);
  return response.json();
}

// DELETE
export async function deleteOrder(id) {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete Order with id ${id}`);
}

// UPDATE STATUS
export async function updateOrderStatus(id, status) {
  const response = await fetch(`${BASE}/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to update status for Order with id ${id}`);
  }
  return response.json();
}

// PHASE 3: CHECK INVENTORY — read-only check, does NOT deduct stock
// Calls GET /api/orders/{id}/inventory-check
export async function checkOrderInventory(id) {
  const response = await fetch(`${BASE}/${id}/inventory-check`);
  if (!response.ok) throw new Error(`Failed to check inventory for Order #${id}`);
  return response.json();
}

// PHASE 3: CONFIRM ORDER — deducts stock and sets status to CONFIRMED
// Calls POST /api/orders/{id}/confirm
// Returns the InventoryCheckResult (with canConfirm=true on success, false on failure)
export async function confirmOrder(id) {
  const response = await fetch(`${BASE}/${id}/confirm`, { method: "POST" });
  // Note: backend returns 400 with result body when inventory is insufficient
  // We always parse the JSON body so the caller can read the message
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Return the data object so the caller can read canConfirm and message
    const err = new Error(data?.message || `Failed to confirm Order #${id}`);
    err.data = data;
    throw err;
  }
  return data;
}

