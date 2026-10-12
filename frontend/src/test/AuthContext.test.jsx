import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext";

function TestConsumer() {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="user-info">{user ? JSON.stringify(user) : "No User"}</div>
      <button onClick={() => login({ id: 1, fullName: "Admin User", role: "ADMIN" })}>Login Admin</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  it("provides initial null user state", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("user-info")).toHaveTextContent("No User");
  });

  it("updates user state upon login", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Login Admin").click();
    });

    expect(screen.getByTestId("user-info")).toHaveTextContent("Admin User");
    expect(screen.getByTestId("user-info")).toHaveTextContent("ADMIN");
  });

  it("clears user state upon logout", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByText("Login Admin").click();
    });
    expect(screen.getByTestId("user-info")).toHaveTextContent("Admin User");

    act(() => {
      screen.getByText("Logout").click();
    });
    expect(screen.getByTestId("user-info")).toHaveTextContent("No User");
  });
});
