import React, { createContext, useCallback, useContext, useState } from "react";

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

/**
 * Reads initial state from sessionStorage so a page refresh
 * doesn't lose the logged-in session (including role and assignedDealerId).
 */
const readSession = () => {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    return { user: null, token: null, role: null };
  }

  let user = null;
  const userRaw = sessionStorage.getItem(USER_KEY);
  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch {
      user = null;
    }
  }

  // Backward compatibility with older sessions that only stored username/role.
  if (!user?.userName) {
    const userName = sessionStorage.getItem("username");
    const role = sessionStorage.getItem("role");
    if (userName) {
      user = { userName, role: role || null };
    }
  }

  if (!user?.userName) {
    return { user: null, token: null, role: null };
  }

  return {
    user,
    token,
    role: user.role || sessionStorage.getItem("role") || null,
  };
};

export const AuthProvider = ({ children }) => {
  const initial = readSession();
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  const [role, setRole] = useState(initial.role);

  /**
   * Called by Login.jsx and Register.jsx on success.
   * Centralises all sessionStorage writes.
   *
   * Expected shape:
   *   { access, refresh?, user: { userName, role, assignedDealerId?, ... } }
   */
  const login = (data) => {
    const access = data?.access;
    const refresh = data?.refresh;
    const profile = data?.user;

    if (!access || !profile?.userName || !profile?.role) {
      console.error("login(): missing access token or user profile", data);
      return false;
    }

    sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }
    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
    sessionStorage.setItem("username", profile.userName);
    sessionStorage.setItem("role", profile.role);

    setToken(access);
    setUser(profile);
    setRole(profile.role);
    return true;
  };

  const logout = useCallback(() => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("role");
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  /** Returns the Authorization header object for fetch calls. */
  const authHeaders = useCallback(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token],
  );

  const isAuthenticated = Boolean(token && user?.userName);

  return (
    <AuthContext.Provider
      value={{ user, token, role, login, logout, authHeaders, isAuthenticated }}
    >
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
