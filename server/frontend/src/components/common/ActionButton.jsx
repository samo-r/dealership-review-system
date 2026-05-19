import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * ActionButton — global "Add Review" entry point.
 * Handles authentication check and routing.
 *
 * If user is logged in (CUSTOMER or ADMIN): navigate to /postreview/:dealerId
 * If user is not logged in: navigate to /login with redirectTo for return after login
 * DEALER_ADMIN: button is not shown (cannot create reviews)
 *
 * Props:
 *   dealerId: number|string — the dealership to add a review for
 *   label?: string  — button label (default "Add Review")
 *   className?: string  — additional Tailwind classes
 */
const ActionButton = ({
  dealerId,
  label = "Add Review",
  className = "bg-brand-primary text-white hover:bg-brand-dark",
}) => {
  const { user, role, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const reviewPath =
    dealerId !== undefined && dealerId !== null && dealerId !== ""
      ? `/postreview/${dealerId}`
      : null;

  const authenticated =
    typeof isAuthenticated === "boolean"
      ? isAuthenticated
      : Boolean((token && user?.userName) || user?.userName);

  const canAddReview =
    authenticated && (role === "CUSTOMER" || role === "ADMIN");

  const handleClick = () => {
    if (!reviewPath) {
      console.warn("ActionButton: dealerId is required");
      return;
    }

    if (canAddReview) {
      navigate(reviewPath);
      return;
    }

    if (!authenticated) {
      navigate("/login", { state: { redirectTo: reviewPath } });
      return;
    }

    alert("Your account type cannot add reviews.");
  };

  if (role === "DEALER_ADMIN") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!reviewPath}
      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {label} →
    </button>
  );
};

export default ActionButton;
