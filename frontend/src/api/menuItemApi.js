import { API_BASE_URL } from "./config";

/**
 * All the fetch calls for "6.2 Menu Management" live in this one file.
 * This matches the backend's MenuItemController.java one-to-one:
 * every function here calls exactly one endpoint on that controller.
 *
 * Every function returns a Promise — use it with async/await in a
 * component, e.g.:
 *   const data = await getMenuItems();
 */

const BASE = `${API_BASE_URL}/menu-items`;

// READ (all)
export async function getMenuItems() {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error("Failed to fetch menu-items");
  return response.json();
}

// READ (one, by id)
export async function getMenuItemById(id) {
  const response = await fetch(`${BASE}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch MenuItem with id ${id}`);
  return response.json();
}

// CREATE
export async function createMenuItem(menuItemData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(menuItemData),
  });
  if (!response.ok) throw new Error("Failed to create MenuItem");
  return response.json();
}

// UPDATE
export async function updateMenuItem(id, menuItemData) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(menuItemData),
  });
  if (!response.ok) throw new Error(`Failed to update MenuItem with id ${id}`);
  return response.json();
}

// DELETE
export async function deleteMenuItem(id) {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete MenuItem with id ${id}`);
}
