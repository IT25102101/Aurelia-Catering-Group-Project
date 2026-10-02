import { createContext, useContext, useState } from "react";

/**
 * Holds "who is logged in right now" for the whole app.
 * This is deliberately simple: it lives in memory only (React state),
 * so refreshing the page logs you out. No localStorage, no cookies,
 * no token — matches the backend, which also doesn't issue a token.
 *
 * Any component can read the logged-in user with:
 *   const { user, login, logout } = useAuth();
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, fullName, email, role } or null

  function login(userData) {
    setUser(userData);
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
