import { API_BASE_URL } from "./config";

/**
 * All fetch calls for "Package -> Menu Item Assignment" live in this file.
 * This matches the backend's PackageMenuItemController.java one-to-one:
 * every function here calls exactly one endpoint on that controller.
 *
 * Endpoints:
 *   GET    /api/package-menu-items/package/{packageId}  — all menu items assigned to a package
 *   POST   /api/package-menu-items                     — assign a menu item to a package
 *   DELETE /api/package-menu-items/{id}                — remove a menu item assignment
 *
 * Every function returns a Promise — use with async/await in a component.
 */

const BASE = `${API_BASE_URL}/package-menu-items`;

// READ — all menu items assigned to a specific catering package
export async function getPackageMenuItems(packageId) {
  const response = await fetch(`${BASE}/package/${packageId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch menu items for package #${packageId}`);
  }
  return response.json();
}

// CREATE — assign a menu item to a catering package
// Payload: { packageId: number, menuItemId: number }
export async function addMenuItemToPackage(data) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (response.status === 409) {
    const msg = await response.text();
    throw new Error(msg || "This menu item is already assigned to this package.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to assign menu item to package.");
  }

  return response.json();
}

// DELETE — remove a menu item assignment from a package
export async function removeMenuItemFromPackage(id) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to remove package menu item assignment #${id}`);
  }
}
