import { API_BASE_URL } from "./config";

/**
 * All the fetch calls for "6.3 Catering Package Management" live in this one file.
 * This matches the backend's CateringPackageController.java one-to-one:
 * every function here calls exactly one endpoint on that controller.
 *
 * Every function returns a Promise — use it with async/await in a
 * component, e.g.:
 *   const data = await getCateringPackages();
 */

const BASE = `${API_BASE_URL}/catering-packages`;

let cachedPackages = null;
let inFlightPackagesPromise = null;

export function invalidateCateringPackagesCache() {
  cachedPackages = null;
}

// READ (all) with in-flight deduplication and safe caching
export async function getCateringPackages(forceRefresh = false) {
  if (!forceRefresh && cachedPackages) {
    return cachedPackages;
  }
  if (!forceRefresh && inFlightPackagesPromise) {
    return inFlightPackagesPromise;
  }

  inFlightPackagesPromise = (async () => {
    try {
      const response = await fetch(BASE);
      if (!response.ok) throw new Error("Failed to fetch catering-packages");
      const data = await response.json();
      cachedPackages = data;
      return data;
    } finally {
      inFlightPackagesPromise = null;
    }
  })();

  return inFlightPackagesPromise;
}

// READ (one, by id)
export async function getCateringPackageById(id) {
  const response = await fetch(`${BASE}/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch CateringPackage with id ${id}`);
  return response.json();
}

// CREATE
export async function createCateringPackage(cateringPackageData) {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cateringPackageData),
  });
  if (!response.ok) throw new Error("Failed to create CateringPackage");
  invalidateCateringPackagesCache();
  return response.json();
}

// UPDATE
export async function updateCateringPackage(id, cateringPackageData) {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cateringPackageData),
  });
  if (!response.ok) throw new Error(`Failed to update CateringPackage with id ${id}`);
  invalidateCateringPackagesCache();
  return response.json();
}

// DELETE
export async function deleteCateringPackage(id) {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete CateringPackage with id ${id}`);
  invalidateCateringPackagesCache();
}

// STRATEGY PATTERN: Discover available pricing strategies
export async function getPricingStrategies() {
  const response = await fetch(`${BASE}/strategies`);
  if (!response.ok) throw new Error("Failed to fetch pricing strategies");
  return response.json();
}

// STRATEGY PATTERN: Calculate dynamic package price based on strategy & guest count
export async function calculatePackagePrice(id, strategy = "fixed", guests = 50) {
  const response = await fetch(`${BASE}/${id}/calculate-price?strategy=${encodeURIComponent(strategy)}&guests=${guests}`, {
    method: "POST"
  });
  if (!response.ok) throw new Error("Failed to calculate package price");
  return response.json();
}

