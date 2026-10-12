import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCateringPackages,
  getCateringPackageById,
  createCateringPackage,
  updateCateringPackage,
  deleteCateringPackage,
  getPricingStrategies,
  calculatePackagePrice,
  invalidateCateringPackagesCache,
} from "../api/cateringPackageApi";
import {
  getPackageMenuItems,
  addMenuItemToPackage,
  removeMenuItemFromPackage,
} from "../api/packageMenuItemApi";

describe("cateringPackageApi & packageMenuItemApi Client Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    invalidateCateringPackagesCache();
  });

  it("getCateringPackages fetches packages from /api/catering-packages and caches result", async () => {
    const mockPackages = [
      { id: 1, name: "Wedding Feast", price: 65000, packageType: "Wedding" },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockPackages,
    });

    const result = await getCateringPackages();
    expect(result).toEqual(mockPackages);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second call should hit memory cache without second fetch
    const cachedResult = await getCateringPackages();
    expect(cachedResult).toEqual(mockPackages);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("getCateringPackageById fetches specific package by ID", async () => {
    const mockPackage = { id: 5, name: "Gala Banquet", price: 120000 };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockPackage,
    });

    const result = await getCateringPackageById(5);
    expect(result).toEqual(mockPackage);
  });

  it("createCateringPackage sends POST request with JSON payload and invalidates cache", async () => {
    const newPkg = { name: "Birthday Blast", price: 30000, packageType: "Birthday" };
    const savedPkg = { id: 10, ...newPkg };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => savedPkg,
    });

    const result = await createCateringPackage(newPkg);
    expect(result).toEqual(savedPkg);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8080/api/catering-packages",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPkg),
      })
    );
  });

  it("updateCateringPackage sends PUT request with updated data", async () => {
    const updateData = { name: "Updated Gala", price: 140000 };
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ id: 5, ...updateData }),
    });

    const result = await updateCateringPackage(5, updateData);
    expect(result.name).toBe("Updated Gala");
  });

  it("deleteCateringPackage sends DELETE request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
    });

    await deleteCateringPackage(7);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8080/api/catering-packages/7",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("getPricingStrategies returns strategy catalog", async () => {
    const strategies = [
      { code: "fixed", name: "Fixed Base Package Pricing" },
      { code: "per_guest", name: "Per-Guest Headcount Pricing" },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => strategies,
    });

    const result = await getPricingStrategies();
    expect(result).toEqual(strategies);
  });

  it("calculatePackagePrice calls /calculate-price with strategy and guest parameters", async () => {
    const breakdown = {
      strategyCode: "per_guest",
      finalTotalPrice: 95000,
      discountAmount: 5000,
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => breakdown,
    });

    const result = await calculatePackagePrice(1, "per_guest", 100);
    expect(result).toEqual(breakdown);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8080/api/catering-packages/1/calculate-price?strategy=per_guest&guests=100",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("getPackageMenuItems fetches assigned items for package", async () => {
    const items = [
      { packageId: 1, menuItemId: 101, menuItemName: "Biryani", quantity: 50 },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => items,
    });

    const result = await getPackageMenuItems(1);
    expect(result).toEqual(items);
  });

  it("addMenuItemToPackage handles 409 conflict duplicate assignment", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => "This menu item is already assigned to this catering package.",
    });

    await expect(
      addMenuItemToPackage({ packageId: 1, menuItemId: 101, quantity: 50 })
    ).rejects.toThrow("already assigned");
  });

  it("removeMenuItemFromPackage sends DELETE request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
    });

    await removeMenuItemFromPackage(101);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8080/api/package-menu-items/101",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
