import { API_BASE_URL } from "./config";

/**
 * All the fetch calls for "6.6 Staff Management" live in this one file.
 * This matches the backend's StaffController.java one-to-one:
 * every function here calls exactly one endpoint on that controller.
 *
 * Every function returns a Promise — use it with async/await in a
 * component, e.g.:
 *   const data = await getStaffs();
 */

const BASE = `${API_BASE_URL}/staffs`;

// READ (all)
export async function getStaffs() {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error("Failed to fetch staffs");
  return response.json();
}

// READ (one, by id)
export async function getStaffById(id) {
  const response = await fetch(`${BASE}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch Staff with id ${id}`);
  return response.json();
}

// CREATE
export async function createStaff(staffData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffData),
  });
  if (!response.ok) throw new Error("Failed to create Staff");
  return response.json();
}

// UPDATE
export async function updateStaff(id, staffData) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffData),
  });
  if (!response.ok) throw new Error(`Failed to update Staff with id ${id}`);
  return response.json();
}

// DELETE
export async function deleteStaff(id) {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete Staff with id ${id}`);
}
