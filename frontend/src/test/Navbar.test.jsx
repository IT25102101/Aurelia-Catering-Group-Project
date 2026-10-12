import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";
import * as AuthContextModule from "../AuthContext";

describe("Navbar Component", () => {
  it("renders Aurelia brand logo and main navigation links", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getAllByText("AURELIA").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Catering Packages").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Food Menu").length).toBeGreaterThan(0);
  });

  it("shows Staff Portal and Book Catering links when user is logged out", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText("Staff Portal")).toBeInTheDocument();
    expect(screen.getAllByText("Book Catering").length).toBeGreaterThan(0);
  });

  it("shows user name and Logout button when user is authenticated", () => {
    const logoutMock = vi.fn();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { id: 1, fullName: "Sarah Jenkins", role: "CUSTOMER" },
      logout: logoutMock,
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Sarah Jenkins").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Logout").length).toBeGreaterThan(0);

    const logoutBtn = screen.getAllByText("Logout")[0];
    fireEvent.click(logoutBtn);

    expect(logoutMock).toHaveBeenCalled();
  });
});
