import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * ActionButton — global "Add Review" entry point.
 * Handles authentication check and routing.
 *
 * If user is logged in and has permission: navigate to /postreview/:dealerId
 * If user is not logged in: navigate to /login with redirect back
 *
 * Props:
 *   dealerId: number  — the dealership to add a review for
 *   label?: string  — button label (default "Add Review")
 *   className?: string  — additional Tailwind classes
 */
const ActionButton = ({
  dealerId,
  label = "Add Review",
  className = "bg-brand-primary text-white hover:bg-brand-dark",
}) => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    // Allow CUSTOMER and ADMIN to add reviews
    if (user && (role === "CUSTOMER" || role === "ADMIN")) {
      navigate(`/postreview/${dealerId}`);
      return;
    }

    // Redirect anonymous users to login
    if (!user) {
      navigate("/login", { state: { redirectTo: `/postreview/${dealerId}` } });
      return;
    }

    // DEALER_ADMIN cannot add reviews
    alert("Your account type cannot add reviews.");
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
    >
      {label} →
    </button>
  );
};

export default ActionButton;
