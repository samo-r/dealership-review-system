import React from "react";
import { Link } from "react-router-dom";

const AdminPageHeader = ({ title, description, actionLabel, actionTo }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      {description && <p className="mt-1 text-slate-600">{description}</p>}
    </div>
    {actionLabel && actionTo && (
      <Link
        to={actionTo}
        className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
      >
        {actionLabel}
      </Link>
    )}
  </div>
);

export default AdminPageHeader;
