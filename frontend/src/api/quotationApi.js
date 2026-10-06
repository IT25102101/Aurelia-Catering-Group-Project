import { API_BASE_URL } from "./config";

/**
 * Fetch calls for "Quotation Management" (Step 5 Task 1 & Task 2).
 * Endpoints match QuotationController.java and QuotationItemController.java.
 */
const BASE_QUOTATIONS = `${API_BASE_URL}/quotations`;
const BASE_ITEMS = `${API_BASE_URL}/quotation-items`;

// READ (all quotations - Staff/Manager)
export async function getQuotations() {
  const response = await fetch(BASE_QUOTATIONS);
  if (!response.ok) throw new Error("Failed to fetch quotations");
  return response.json();
}

// READ (quotations by customer ID - Customer portal)
export async function getQuotationsByCustomerId(customerId) {
  const response = await fetch(`${BASE_QUOTATIONS}/customer/${customerId}`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error("Failed to fetch customer quotations");
  return response.json();
}

// READ (quotation by ID, optional customerId for ownership check)
export async function getQuotationById(id, customerId = null) {
  const url = customerId ? `${BASE_QUOTATIONS}/${id}?customerId=${customerId}` : `${BASE_QUOTATIONS}/${id}`;
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (response.status === 403) {
    const errText = await response.text();
    throw new Error(errText || "You are not authorized to view this quotation.");
  }
  if (!response.ok) throw new Error(`Failed to fetch quotation #${id}`);
  return response.json();
}

// READ (quotation by Order ID)
export async function getQuotationByOrderId(orderId) {
  const response = await fetch(`${BASE_QUOTATIONS}/order/${orderId}`);
  if (response.status === 404) return null;
  if (!response.ok) return null;
  return response.json();
}

// CREATE (Atomic Quotation + Quotation Items)
export async function createQuotation(quotationData) {
  const response = await fetch(BASE_QUOTATIONS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quotationData),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || "Failed to create quotation");
  }
  return response.json();
}

// UPDATE (Quotation)
export async function updateQuotation(id, quotationData) {
  const response = await fetch(`${BASE_QUOTATIONS}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quotationData),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Failed to update quotation #${id}`);
  }
  return response.json();
}

// UPDATE STATUS (Staff: e.g. Draft -> Sent)
export async function updateQuotationStatus(id, status) {
  const response = await fetch(`${BASE_QUOTATIONS}/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Failed to update status for quotation #${id}`);
  }
  return response.json();
}

// CUSTOMER RESPONSE (Customer: Sent -> Accepted or Sent -> Rejected)
export async function respondToQuotation(id, { customerId, status, reason = "" }) {
  const response = await fetch(`${BASE_QUOTATIONS}/${id}/customer-response`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId, status, reason }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Failed to submit response for quotation #${id}`);
  }
  return response.json();
}

// DELETE (Quotation)
export async function deleteQuotation(id) {
  const response = await fetch(`${BASE_QUOTATIONS}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete quotation #${id}`);
}

// READ (Quotation Items by Quotation ID, optional customerId for ownership check)
export async function getQuotationItems(quotationId, customerId = null) {
  const url = customerId ? `${BASE_ITEMS}/quotation/${quotationId}?customerId=${customerId}` : `${BASE_ITEMS}/quotation/${quotationId}`;
  const response = await fetch(url);
  if (response.status === 404) return [];
  if (response.status === 403) {
    const errText = await response.text();
    throw new Error(errText || "You are not authorized to view these quotation items.");
  }
  if (!response.ok) return [];
  return response.json();
}

// CREATE (Quotation Item)
export async function createQuotationItem(itemData) {
  const response = await fetch(BASE_ITEMS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(itemData),
  });
  if (!response.ok) throw new Error("Failed to create quotation item");
  return response.json();
}

// DELETE (Quotation Item)
export async function deleteQuotationItem(id) {
  const response = await fetch(`${BASE_ITEMS}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete quotation item #${id}`);
}
