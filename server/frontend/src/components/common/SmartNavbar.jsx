import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * SmartNavbar — role-aware top navigation.
 * Renders different menu items based on user role.
 * Replaces the existing Header.jsx for new pages.
 */
const SmartNavbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  // Guest menu — no authentication
  const guestMenu = [
    { label: "Home", to: "/home" },
    { label: "Dealers", to: "/dealers" },
    { label: "Reviews", to: "/reviews" },
    { label: "Login", to: "/login", button: true },
    { label: "Register", to: "/register", button: true, secondary: true },
  ];

  // Customer menu — can create reviews
  const customerMenu = [
    { label: "Home", to: "/home" },
    { label: "Dealers", to: "/dealers" },
    { label: "Reviews", to: "/reviews" },
    { label: "My Reviews", to: "/customer/my-reviews" },
  ];

  // Dealer Admin menu — store management
  const dealerAdminMenu = [
    { label: "My Dashboard", to: "/dealer/dashboard" },
    { label: "My Store", to: "/dealer/inventory" },
  ];

  // System Admin menu — global control
  const adminMenu = [
    { label: "Admin Panel", to: "/admin/dashboard" },
    { label: "Platform Stats", to: "/admin/dashboard" },
  ];

  const getMenu = () => {
    if (role === "DEALER_ADMIN") return dealerAdminMenu;
    if (role === "ADMIN") return adminMenu;
    if (role === "CUSTOMER") return customerMenu;
    return guestMenu;
  };

  const menu = getMenu();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center text-xl font-bold text-brand-primary"
          >
            Autocars UG
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-1">
            {menu.map((item) => {
              if (item.button) {
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.secondary
                        ? "border border-brand-primary text-brand-primary hover:bg-brand-light"
                        : "bg-brand-primary text-white hover:bg-brand-dark"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-brand-primary hover:bg-slate-50 transition-colors"
                >
                  {item.label}
                </Link>
              );
            })}

            {/* User info + logout for authenticated */}
            {user && (
              <div className="ml-4 flex items-center space-x-3 border-l border-slate-200 pl-4">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{user.userName}</div>
                  <div className="text-slate-500 text-xs">{role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-brand-primary hover:bg-slate-100 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menu.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  item.button
                    ? "bg-brand-primary text-white hover:bg-brand-dark"
                    : "text-slate-700 hover:text-brand-primary hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile user info + logout */}
            {user && (
              <>
                <div className="px-3 py-2 border-t border-slate-200 mt-2">
                  <div className="text-sm font-medium text-slate-900">
                    {user.userName}
                  </div>
                  <div className="text-slate-500 text-xs">{role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-slate-50"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default SmartNavbar;
