import { API_BASE_URL } from "./config";

/**
 * All the fetch calls for "6.4 Inventory & Supply Management" live in this one file.
 * This matches the backend's InventoryItemController.java one-to-one:
 * every function here calls exactly one endpoint on that controller.
 *
 * Every function returns a Promise — use it with async/await in a
 * component, e.g.:
 *   const data = await getInventoryItems();
 */

const BASE = `${API_BASE_URL}/inventory-items`;

// READ (all)
export async function getInventoryItems() {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error("Failed to fetch inventory-items");
  return response.json();
}

// READ (one, by id)
export async function getInventoryItemById(id) {
  const response = await fetch(`${BASE}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch InventoryItem with id ${id}`);
  return response.json();
}

// CREATE
export async function createInventoryItem(inventoryItemData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inventoryItemData),
  });
  if (!response.ok) throw new Error("Failed to create InventoryItem");
  return response.json();
}

// UPDATE
export async function updateInventoryItem(id, inventoryItemData) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inventoryItemData),
  });
  if (!response.ok) throw new Error(`Failed to update InventoryItem with id ${id}`);
  return response.json();
}

// DELETE
export async function deleteInventoryItem(id) {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete InventoryItem with id ${id}`);
}
