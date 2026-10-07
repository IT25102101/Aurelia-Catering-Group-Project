import { API_BASE_URL } from "./config";

/**
 * All the fetch calls for "6.5 Delivery Management" live in this one file.
 * This matches the backend's DeliveryController.java one-to-one:
 * every function here calls exactly one endpoint on that controller.
 *
 * Every function returns a Promise — use it with async/await in a
 * component, e.g.:
 *   const data = await getDeliverys();
 */

const BASE = `${API_BASE_URL}/deliveries`;

// READ (all)
export async function getDeliverys() {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error("Failed to fetch deliveries");
  return response.json();
}

// READ (one, by id)
export async function getDeliveryById(id) {
  const response = await fetch(`${BASE}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch Delivery with id ${id}`);
  return response.json();
}

// CREATE
export async function createDelivery(deliveryData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deliveryData),
  });
  if (!response.ok) throw new Error("Failed to create Delivery");
  return response.json();
}

// UPDATE
export async function updateDelivery(id, deliveryData) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(deliveryData),
  });
  if (!response.ok) throw new Error(`Failed to update Delivery with id ${id}`);
  return response.json();
}

// DELETE
export async function deleteDelivery(id) {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete Delivery with id ${id}`);
}
