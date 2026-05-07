import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Allows access only to users whose role is in the `allowed` array.
 * Redirects everyone else to the home page.
 *
 * Usage:
 *   <RequireRole allowed={["ADMIN", "DEALER_ADMIN"]}>
 *     <SomePage />
 *   </RequireRole>
 */
const RequireRole = ({ allowed, children }) => {
  const { role } = useAuth();

  if (!allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireRole;
