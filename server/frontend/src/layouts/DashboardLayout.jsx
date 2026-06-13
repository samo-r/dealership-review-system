import React from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleLinks = {
  DEALER_ADMIN: [
    { to: "/dealer/dashboard", label: "Overview" },
    { to: "/dealer/inventory", label: "Inventory" },
    { to: "/dealer/reviews", label: "My Reviews" },
    { to: "/dealer/profile", label: "Profile" },
  ],
  ADMIN: [
    { to: "/admin/dashboard", label: "Overview" },
    { to: "/admin/dealerships", label: "Dealerships" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/inventory", label: "Inventory" },
    { to: "/admin/moderation", label: "Moderation" },
  ],
};

const DashboardLayout = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const links = roleLinks[role] || [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-56 bg-dashboard-bg text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-dashboard-border">
          <span className="text-lg font-bold tracking-wide">Autocars UG</span>
          <div className="text-xs text-dashboard-text mt-1">{role}</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-primary text-white"
                    : "text-dashboard-text hover:bg-dashboard-surface hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-dashboard-border">
          <div className="text-sm text-dashboard-text mb-2">{user?.userName}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {role === "ADMIN" ? "System Admin" : "Dealer Admin"} Panel
          </span>
          <Link
            to="/home"
            className="text-sm text-brand-primary hover:underline"
          >
            Public Site
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
