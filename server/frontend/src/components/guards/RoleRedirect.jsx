import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Dealers from "../Dealers/Dealers";

/**
 * Used at the root route "/".
 * Sends each role to their natural landing page.
 * Anonymous and CUSTOMER users see the public Dealers page.
 */
const RoleRedirect = () => {
  const { role } = useAuth();

  if (role === "DEALER_ADMIN") return <Navigate to="/dealer/dashboard" replace />;
  if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;

  // CUSTOMER and anonymous see the public home (dealers list for now,
  // replaced by the full Home page in Sprint C)
  return <Dealers />;
};

export default RoleRedirect;
