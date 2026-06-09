import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getRoleLandingPath } from "../../utils/authRedirect";

/**
 * Allows access only to users whose role is in the `allowed` array.
 * Redirects everyone else to their role landing page.
 */
const RequireRole = ({ allowed, children }) => {
  const { role } = useAuth();

  if (!allowed.includes(role)) {
    return <Navigate to={getRoleLandingPath(role)} replace />;
  }

  return children;
};

export default RequireRole;
