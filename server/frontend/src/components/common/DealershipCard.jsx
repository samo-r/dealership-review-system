import React from "react";
import { Link } from "react-router-dom";

/**
 * DealershipCard — displays a single dealership.
 * Reused on:
 *   - Home page carousel
 *   - /dealers grid
 *   - Admin dashboard table view
 *
 * Props:
 *   dealer: { id, full_name, city, state, address, zip, short_name }
 *   variant?: "card" | "table-row"  — default "card"
 */
const DealershipCard = ({ dealer, variant = "card" }) => {
  if (!dealer) return null;

  if (variant === "table-row") {
    // Admin dashboard table row
    return (
      <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
        <td className="px-4 py-3 text-sm font-medium text-slate-900">{dealer.id}</td>
        <td className="px-4 py-3 text-sm text-slate-900">
          <Link
            to={`/dealer/${dealer.id}`}
            className="text-brand-primary hover:underline font-medium"
          >
            {dealer.full_name}
          </Link>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">{dealer.city}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{dealer.state}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{dealer.address}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{dealer.zip}</td>
        <td className="px-4 py-3 text-sm">
          <Link
            to={`/dealer/${dealer.id}`}
            className="inline-flex items-center px-3 py-1 rounded-md bg-brand-primary text-white text-xs font-medium hover:bg-brand-dark transition-colors"
          >
            View
          </Link>
        </td>
      </tr>
    );
  }

  // Default card variant — for home page and dealers grid
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          {dealer.full_name}
        </h3>
        <p className="text-sm text-slate-600 mb-3">
          {dealer.city}, {dealer.state} {dealer.zip}
        </p>
        <p className="text-xs text-slate-500 mb-4">{dealer.address}</p>
        <Link
          to={`/dealer/${dealer.id}`}
          className="inline-flex items-center px-4 py-2 rounded-md bg-brand-primary text-white text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          View Dealership
        </Link>
      </div>
    </div>
  );
};

export default DealershipCard;
