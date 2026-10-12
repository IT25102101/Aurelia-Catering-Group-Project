import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequireRole from "../components/RequireRole";
import * as AuthContextModule from "../AuthContext";

describe("RequireRole Component", () => {
  it("redirects unauthenticated user to /login", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({ user: null });

    render(
      <MemoryRouter initialEntries={["/admin-only"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/admin-only"
            element={
              <RequireRole role="ADMIN">
                <div>Protected Admin Content</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Admin Content")).not.toBeInTheDocument();
  });

  it("renders protected content when user has required role", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { id: 1, fullName: "Admin User", role: "ADMIN" },
    });

    render(
      <MemoryRouter initialEntries={["/admin-only"]}>
        <Routes>
          <Route
            path="/admin-only"
            element={
              <RequireRole role="ADMIN">
                <div>Protected Admin Content</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Admin Content")).toBeInTheDocument();
  });

  it("redirects user with unauthorized role to their own role dashboard", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { id: 2, fullName: "John Customer", role: "CUSTOMER" },
    });

    render(
      <MemoryRouter initialEntries={["/admin-only"]}>
        <Routes>
          <Route path="/dashboard/customer" element={<div>Customer Dashboard</div>} />
          <Route
            path="/admin-only"
            element={
              <RequireRole role="ADMIN">
                <div>Protected Admin Content</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Customer Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Protected Admin Content")).not.toBeInTheDocument();
  });

  it("supports allowedRoles array allowing multiple roles", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { id: 3, fullName: "Operations Manager", role: "OPERATIONS_SUPERVISOR" },
    });

    render(
      <MemoryRouter initialEntries={["/operations"]}>
        <Routes>
          <Route
            path="/operations"
            element={
              <RequireRole allowedRoles={["ADMIN", "OPERATIONS_SUPERVISOR"]}>
                <div>Operations Area</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Operations Area")).toBeInTheDocument();
  });
});
