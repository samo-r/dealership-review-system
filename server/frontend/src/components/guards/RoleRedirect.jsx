import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Used at the root route "/".
 * Sends each role to their natural landing page.
 */
const RoleRedirect = () => {
  const { role } = useAuth();

  if (role === "DEALER_ADMIN") return <Navigate to="/dealer/dashboard" replace />;
  if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;

  // CUSTOMER and anonymous both land on the public dealers page
  return <Navigate to="/dealers" replace />;
};

export default RoleRedirect;
