import { API_BASE_URL } from "./config";

/**
 * Login/signup calls — matches the backend's AuthController.java.
 * No token is stored here (this backend doesn't issue one) — the
 * calling component is responsible for remembering the returned user
 * (see AuthContext.jsx) for as long as the page stays open.
 */

const BASE = `${API_BASE_URL}/auth`;

export async function login(email, password) {
  const response = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Login failed");
  }
  return response.json(); // { id, fullName, email, role }
}

export async function register(fullName, email, password, role) {
  const response = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Note: the backend field is called "passwordHash" but expects the
    // PLAIN password here — it hashes it before saving. See
    // AuthController.java's register() method for why it's named that.
    body: JSON.stringify({ fullName, email, passwordHash: password, role }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Registration failed");
  }
  return response.json();
}
