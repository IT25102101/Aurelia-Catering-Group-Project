import { API_BASE_URL } from "./config";

/**
 * All the fetch calls for "6.7 Event Management" live in this one file.
 * This matches the backend's EventController.java one-to-one:
 * every function here calls exactly one endpoint on that controller.
 *
 * Every function returns a Promise — use it with async/await in a
 * component, e.g.:
 *   const data = await getEvents();
 */

const BASE = `${API_BASE_URL}/events`;

// READ (all)
export async function getEvents() {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error("Failed to fetch events");
  return response.json();
}

// READ (one, by id)
export async function getEventById(id) {
  const response = await fetch(`${BASE}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch Event with id ${id}`);
  return response.json();
}

// READ (by orderId)
export async function getEventByOrderId(orderId) {
  const response = await fetch(`${BASE}/order/${orderId}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to fetch Event for Order #${orderId}`);
  return response.json();
}

// CREATE
export async function createEvent(eventData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) throw new Error("Failed to create Event");
  return response.json();
}

// UPDATE
export async function updateEvent(id, eventData) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) throw new Error(`Failed to update Event with id ${id}`);
  return response.json();
}

// DELETE
export async function deleteEvent(id) {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete Event with id ${id}`);
}
