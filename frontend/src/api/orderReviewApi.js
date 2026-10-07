import { API_BASE_URL } from "./config";

/**
 * Fetch calls for "Order Review Management".
 * Base URL: /api/order-reviews
 */
const BASE = `${API_BASE_URL}/order-reviews`;

// READ (all reviews)
export async function getOrderReviews() {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error("Failed to fetch order reviews");
  return response.json();
}

// READ (by order id)
export async function getOrderReviewsByOrderId(orderId) {
  const response = await fetch(`${BASE}/order/${orderId}`);
  if (response.status === 404) return [];
  if (!response.ok) return [];
  return response.json();
}

// CREATE (Submit staff order review)
export async function createOrderReview(reviewData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to submit order review");
  }
  return response.json();
}
