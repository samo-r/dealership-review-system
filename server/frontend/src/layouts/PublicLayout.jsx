import React from "react";
import { Outlet } from "react-router-dom";
import SmartNavbar from "../components/common/SmartNavbar";

/**
 * Wraps all public-facing pages.
 * Renders the SmartNavbar at the top of all public routes.
 */
const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-white">
      <SmartNavbar />
      <Outlet />
    </div>
  );
};

export default PublicLayout;
