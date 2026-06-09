import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const AdminInventory = () => {
  const { authHeaders, logout } = useAuth();
  const [dealers, setDealers] = useState([]);
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [loadingDealers, setLoadingDealers] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(false);
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
          if (data.dealers.length > 0) {
            setSelectedDealerId(String(data.dealers[0].id));
          }
        } else {
          setError("Unable to load dealerships.");
        }
      } catch (fetchError) {
        console.error("Failed to load dealerships:", fetchError);
        setError("Unable to load dealerships.");
      } finally {
        setLoadingDealers(false);
      }
    };

    loadDealers();
  }, [authHeaders, logout]);

  useEffect(() => {
    if (!selectedDealerId) return;

    const loadInventory = async () => {
      setLoadingInventory(true);
      setError("");
      try {
        const response = await fetch(
          `${window.location.origin}/djangoapp/inventory/dealer/${selectedDealerId}`,
          { headers: { ...authHeaders() } }
        );

        if (response.status === 401) {
          logout();
          return;
        }

        const data = await response.json();
        if (data.status === 200) {
          setVehicles(data.vehicles || []);
        } else {
          setError(data.error?.message || "Unable to load inventory.");
        }
      } catch (fetchError) {
        console.error("Failed to load inventory:", fetchError);
        setError("Unable to load inventory.");
      } finally {
        setLoadingInventory(false);
      }
    };

    loadInventory();
  }, [selectedDealerId, authHeaders, logout]);

  if (loadingDealers) {
    return <div className="p-8 text-center text-slate-500">Loading inventory view...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Platform Inventory</h1>
        <p className="mt-1 text-slate-600">Cross-tenant vehicle listings by dealership.</p>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">Dealership</label>
        <select
          value={selectedDealerId}
          onChange={(event) => setSelectedDealerId(event.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {dealers.map((dealer) => (
            <option key={dealer.id} value={dealer.id}>
              {dealer.full_name} ({dealer.city}, {dealer.state})
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loadingInventory ? (
        <div className="text-slate-500">Loading vehicles...</div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Make</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Body</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Year</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mileage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    No vehicles listed for this dealership.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle._id}>
                    <td className="px-4 py-3 text-sm text-slate-900">{vehicle.make}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{vehicle.model}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{vehicle.bodyType}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{vehicle.year}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{vehicle.mileage}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
