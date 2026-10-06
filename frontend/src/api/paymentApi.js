import { API_BASE_URL } from "./config";

/**
 * Fetch helper for Phase 2: Payment & Invoicing Management.
 * Communicates with PaymentController.java (/api/payments).
 */
const BASE = `${API_BASE_URL}/payments`;

// Record a new payment (Cash, Bank Transfer, External Card Payment)
export async function recordPayment(paymentData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to record payment.");
  }
  return response.json();
}

// Get full financial summary + calculations + payments list for an order
export async function getPaymentSummary(orderId) {
  const response = await fetch(`${BASE}/summary/${orderId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to fetch payment summary for order #${orderId}`);
  }
  return response.json();
}

// Get list of payments for an order
export async function getPaymentsByOrderId(orderId) {
  const response = await fetch(`${BASE}/order/${orderId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Failed to fetch payments for order #${orderId}`);
  }
  return response.json();
}

// Get all payments across the system
export async function getAllPayments() {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error("Failed to fetch payments ledger");
  return response.json();
}

// Update payment details
export async function updatePayment(id, paymentData) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) throw new Error(`Failed to update payment #${id}`);
  return response.json();
}

// Delete / void a payment
export async function deletePayment(id) {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to void payment #${id}`);
  return response.json();
}
