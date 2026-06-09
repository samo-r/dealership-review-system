import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Used at the root route "/".
 * Sends each role to their natural landing page (redirect bounce).
 */
const RoleRedirect = () => {
  const { role } = useAuth();

  if (role === "DEALER_ADMIN") return <Navigate to="/dealer/dashboard" replace />;
  if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;

  return <Navigate to="/home" replace />;
};

export default RoleRedirect;
