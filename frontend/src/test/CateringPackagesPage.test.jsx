import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CateringPackagesPage from "../pages/CateringPackagesPage";
import * as packageApi from "../api/cateringPackageApi";
import * as menuItemApi from "../api/menuItemApi";
import * as packageMenuItemApi from "../api/packageMenuItemApi";
import { AuthProvider } from "../AuthContext";

describe("CateringPackagesPage (User Individual Contribution)", () => {
  const mockPackages = [
    {
      id: 1,
      name: "Grand Wedding Bliss",
      description: "Complete royal wedding feast",
      price: 85000,
      packageType: "Wedding",
      minGuestCount: 50,
      maxGuestCount: 500,
    },
    {
      id: 2,
      name: "Executive Summit Lunch",
      description: "Business conference buffet",
      price: 40000,
      packageType: "Corporate",
      minGuestCount: 30,
      maxGuestCount: 350,
    },
  ];

  const mockMenuItems = [
    { id: 101, name: "Chicken Biryani", category: "Main Course", price: 950 },
    { id: 102, name: "Fish Cutlet", category: "Appetizer", price: 350 },
    { id: 103, name: "Watalappan", category: "Dessert", price: 400 },
  ];

  const mockStrategies = [
    { code: "fixed", name: "Fixed Base Package Pricing", description: "Standard flat fee" },
    { code: "per_guest", name: "Per-Guest Headcount Pricing", description: "Per-person with tiered discounts" },
    { code: "occasion", name: "Occasion-Specific Pricing", description: "Occasion luxury multipliers" },
    { code: "food_value", name: "Menu Food-Value Costing", description: "Dish costs + 25% margin" },
  ];

  const mockAssignedItems = [
    { packageId: 1, menuItemId: 101, menuItemName: "Chicken Biryani", menuItemPrice: 950, quantity: 50 },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(packageApi, "getCateringPackages").mockResolvedValue(mockPackages);
    vi.spyOn(menuItemApi, "getMenuItems").mockResolvedValue(mockMenuItems);
    vi.spyOn(packageApi, "getPricingStrategies").mockResolvedValue(mockStrategies);
    vi.spyOn(packageMenuItemApi, "getPackageMenuItems").mockResolvedValue(mockAssignedItems);
    vi.spyOn(packageApi, "calculatePackagePrice").mockResolvedValue({
      strategyCode: "per_guest",
      strategyName: "Per-Guest Headcount Pricing",
      basePrice: 85000,
      guestCount: 100,
      unitRate: 1700,
      rawTotal: 170000,
      discountAmount: 8500,
      surchargeAmount: 0,
      finalTotalPrice: 161500,
      notes: ["Calculated unit rate per guest: LKR 1700.00", "5% bulk discount applied"],
      calculationNotes: ["Calculated unit rate per guest: LKR 1700.00", "5% bulk discount applied"],
    });

    window.scrollTo = vi.fn();
  });

  function renderPage() {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <CateringPackagesPage />
        </AuthProvider>
      </MemoryRouter>
    );
  }

  it("renders page header, packages list, and pricing strategy selector", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Grand Wedding Bliss").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Executive Summit Lunch").length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Manage Catering Packages/i)).toBeInTheDocument();
    expect(screen.getByText(/Create New Catering Package/i)).toBeInTheDocument();
  });

  it("validates required package name on submission", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Grand Wedding Bliss").length).toBeGreaterThan(0);
    });

    const submitBtn = screen.getByRole("button", { name: /Create Package/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Please enter the package title.")).toBeInTheDocument();
    });
  });

  it("validates non-negative price", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Grand Wedding Bliss").length).toBeGreaterThan(0);
    });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Royal Wedding Grand Package/i);
    const priceInput = screen.getByPlaceholderText(/e\.g\. 50000/i);

    fireEvent.change(nameInput, { target: { value: "Negative Price Pkg" } });
    fireEvent.change(priceInput, { target: { value: "-500" } });

    const submitBtn = screen.getByRole("button", { name: /Create Package/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Price cannot be negative.")).toBeInTheDocument();
    });
  });

  it("creates a package successfully via Factory Pattern payload", async () => {
    const createSpy = vi.spyOn(packageApi, "createCateringPackage").mockResolvedValue({
      id: 3,
      name: "Gala Grand Banquet",
      description: "Fine dining 5-course",
      price: 120000,
      packageType: "Gala",
      minGuestCount: 100,
      maxGuestCount: 1000,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Grand Wedding Bliss").length).toBeGreaterThan(0);
    });

    const nameInput = screen.getByPlaceholderText(/e\.g\. Royal Wedding Grand Package/i);
    const priceInput = screen.getByPlaceholderText(/e\.g\. 50000/i);

    fireEvent.change(nameInput, { target: { value: "Gala Grand Banquet" } });
    fireEvent.change(priceInput, { target: { value: "120000" } });

    const submitBtn = screen.getByRole("button", { name: /Create Package/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Gala Grand Banquet",
          price: 120000,
        })
      );
    });
  });

  it("displays assigned menu items for the selected package", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Chicken Biryani").length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Package Menu Composition/i)).toBeInTheDocument();
  });

  it("assigns a new menu item to the catering package", async () => {
    const assignSpy = vi.spyOn(packageMenuItemApi, "addMenuItemToPackage").mockResolvedValue({
      packageId: 1,
      menuItemId: 103,
      quantity: 50,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Grand Wedding Bliss").length).toBeGreaterThan(0);
    });

    const chooseOption = screen.getByText(/-- Choose a dish from Menu Catalog --/i);
    const selectDropdown = chooseOption.closest("select");
    fireEvent.change(selectDropdown, { target: { value: "103" } });

    const assignBtn = screen.getByRole("button", { name: /\+ Add to Package/i });
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith({ packageId: 1, menuItemId: 103 });
    });
  });

  it("handles duplicate menu item conflict error gracefully", async () => {
    vi.spyOn(packageMenuItemApi, "addMenuItemToPackage").mockRejectedValue(
      new Error("This menu item is already assigned to this catering package.")
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Grand Wedding Bliss").length).toBeGreaterThan(0);
    });

    const chooseOption = screen.getByText(/-- Choose a dish from Menu Catalog --/i);
    const selectDropdown = chooseOption.closest("select");
    fireEvent.change(selectDropdown, { target: { value: "101" } });

    const assignBtn = screen.getByRole("button", { name: /\+ Add to Package/i });
    fireEvent.click(assignBtn);

    await waitFor(() => {
      expect(screen.getByText(/already assigned to this catering package/i)).toBeInTheDocument();
    });
  });

  it("runs the Strategy Pattern dynamic pricing simulator and displays calculation breakdown", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Grand Wedding Bliss").length).toBeGreaterThan(0);
    });

    const execBtn = screen.getByRole("button", { name: /Execute Strategy/i });
    fireEvent.click(execBtn);

    await waitFor(() => {
      expect(screen.getByText(/161,500/i)).toBeInTheDocument();
      expect(screen.getByText(/bulk discount/i)).toBeInTheDocument();
    });
  });

  it("deletes a package after confirmation dialog", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const deleteSpy = vi.spyOn(packageApi, "deleteCateringPackage").mockResolvedValue();

    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Grand Wedding Bliss").length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith(1);
    });
  });
});
