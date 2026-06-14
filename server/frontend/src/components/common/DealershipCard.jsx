import React from "react";
import { Link } from "react-router-dom";

/**
 * DealershipCard — displays a single dealership.
 */
const DealershipCard = ({ dealer, variant = "card" }) => {
  if (!dealer) return null;

  const displayName = dealer.name || dealer.full_name;
  const district = dealer.district || dealer.city;
  const address = dealer.physical_address || dealer.address;

  if (variant === "table-row") {
    return (
      <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
        <td className="px-4 py-3 text-sm font-medium text-slate-900">{dealer.id}</td>
        <td className="px-4 py-3 text-sm text-slate-900">
          <Link
            to={`/dealer/${dealer.id}`}
            className="text-brand-primary hover:underline font-medium"
          >
            {displayName}
          </Link>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600">{district}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{address}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{dealer.email}</td>
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

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{displayName}</h3>
        <p className="text-sm text-slate-600 mb-3">{district}</p>
        <p className="text-xs text-slate-500 mb-4">{address}</p>
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
