import { API_BASE_URL } from "./config";

/**
 * Fetch calls for "Order Menu Items".
 * Base URL: /api/order-menu-items
 */
const BASE = `${API_BASE_URL}/order-menu-items`;

// READ (by order id)
export async function getOrderMenuItemsByOrderId(orderId) {
  const response = await fetch(`${BASE}/order/${orderId}`);
  if (response.status === 404) return [];
  if (!response.ok) return [];
  return response.json();
}
