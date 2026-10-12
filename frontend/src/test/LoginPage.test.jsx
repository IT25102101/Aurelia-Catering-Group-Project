import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import * as authApi from "../api/authApi";
import { AuthProvider } from "../AuthContext";

describe("LoginPage Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function renderLoginPage() {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
  }

  it("renders email, password, and log in button", () => {
    renderLoginPage();

    expect(screen.getByPlaceholderText(/name@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log in/i })).toBeInTheDocument();
  });

  it("validates required email and password", async () => {
    renderLoginPage();

    const submitBtn = screen.getByRole("button", { name: /Log in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Please enter your email address.")).toBeInTheDocument();
    });
  });

  it("displays error alert when credentials are invalid", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(new Error("Incorrect email/username or password."));

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/name@example\.com/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitBtn = screen.getByRole("button", { name: /Log in/i });

    fireEvent.change(emailInput, { target: { value: "wrong@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "WrongPass" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Incorrect email/username or password.")).toBeInTheDocument();
    });
  });

  it("authenticates and submits valid credentials", async () => {
    const loginSpy = vi.spyOn(authApi, "login").mockResolvedValue({
      id: 1,
      fullName: "Admin User",
      role: "ADMIN",
    });

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText(/name@example\.com/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitBtn = screen.getByRole("button", { name: /Log in/i });

    fireEvent.change(emailInput, { target: { value: "admin@aurelia.com" } });
    fireEvent.change(passwordInput, { target: { value: "Secret#123" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith("admin@aurelia.com", "Secret#123");
    });
  });
});
