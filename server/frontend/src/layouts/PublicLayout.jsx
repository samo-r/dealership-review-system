import React from "react";
import { Outlet } from "react-router-dom";
import SmartNavbar from "../components/common/SmartNavbar";

/**
 * Wraps all public-facing pages.
 * Renders the SmartNavbar at the top of all public routes.
 */
const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SmartNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-400 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          © 2026 Autocars UG. Built for trusted dealership reviews.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
