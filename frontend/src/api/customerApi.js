import { API_BASE_URL } from "./config";

/**
 * Fetch calls for "Customer Management".
 * Base URL: /api/customers
 */
const BASE = `${API_BASE_URL}/customers`;

// READ (all customers)
export async function getCustomers() {
  const response = await fetch(BASE);
  if (!response.ok) throw new Error("Failed to fetch customers");
  return response.json();
}

// READ (by id)
export async function getCustomerById(id) {
  const response = await fetch(`${BASE}/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to fetch customer with id ${id}`);
  return response.json();
}
