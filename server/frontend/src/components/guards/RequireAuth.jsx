import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Redirects unauthenticated users to /login.
 * Preserves the intended destination via redirectTo (read by Login after sign-in).
 */
const RequireAuth = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const location = useLocation();

  const authenticated =
    typeof isAuthenticated === "boolean" ? isAuthenticated : Boolean(token);

  if (!authenticated) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to="/login"
        state={{ redirectTo, from: location }}
        replace
      />
    );
  }

  return children;
};

export default RequireAuth;
