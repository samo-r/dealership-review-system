import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

/**
 * Reads initial state from sessionStorage so a page refresh
 * doesn't lose the logged-in session.
 */
const readSession = () => {
  const token = sessionStorage.getItem("access_token");
  const userName = sessionStorage.getItem("username");
  const role = sessionStorage.getItem("role");
  if (!token || !userName) return { user: null, token: null, role: null };
  return { user: { userName }, token, role };
};

export const AuthProvider = ({ children }) => {
  const initial = readSession();
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  const [role, setRole] = useState(initial.role);

  /**
   * Called by Login.jsx and Register.jsx on success.
   * Centralises all sessionStorage writes.
   */
  const login = (data) => {
    // data = { access, refresh, user: { userName, role, ... } }
    sessionStorage.setItem("access_token", data.access);
    sessionStorage.setItem("refresh_token", data.refresh);
    sessionStorage.setItem("username", data.user.userName);
    sessionStorage.setItem("role", data.user.role);
    setToken(data.access);
    setUser(data.user);
    setRole(data.user.role);
  };

  const logout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    setToken(null);
    setUser(null);
    setRole(null);
  };

  /** Returns the Authorization header object for fetch calls. */
  const authHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export default AuthContext;
