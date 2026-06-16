import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const AdminDealerships = () => {
  const { authHeaders, logout } = useAuth();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDealers = async () => {
      try {
        const response = await fetch(`${window.location.origin}/djangoapp/get_dealers`, {
          headers: { ...authHeaders() },
        });

        if (response.status === 401) {
          logout();
          return;
        }

        const data = await response.json();
        if (data.status === 200 && Array.isArray(data.dealers)) {
          setDealers(data.dealers);
        } else {
          setError("Unable to load dealerships.");
        }
      } catch (fetchError) {
        console.error("Failed to load dealerships:", fetchError);
        setError("Unable to load dealerships.");
      } finally {
        setLoading(false);
      }
    };

    loadDealers();
  }, [authHeaders, logout]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dealerships...</div>;
  }

  return (
    <div>
      <AdminPageHeader
        title="Dealerships"
        description="All registered dealerships on the platform."
        actionLabel="Add New Dealership"
        actionTo="/admin/dealerships/create"
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">District</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Address</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dealers.map((dealer) => (
              <tr key={dealer.id}>
                <td className="px-4 py-3 text-sm text-slate-700">{dealer.id}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {dealer.name || dealer.full_name}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {dealer.district || dealer.city}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {dealer.physical_address || dealer.address}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{dealer.email}</td>
                <td className="px-4 py-3 text-sm">
                  <Link to={`/dealer/${dealer.id}`} className="text-brand-primary hover:underline">
                    View public page
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDealerships;
