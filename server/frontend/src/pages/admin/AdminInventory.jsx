import { djangoApiUrl } from "../../utils/djangoApi";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const compareObjectIdDesc = (leftId, rightId) => {
  const left = String(leftId || "");
  const right = String(rightId || "");
  if (left === right) return 0;
  return left > right ? -1 : 1;
};

const AdminInventory = () => {
  const { authHeaders, logout } = useAuth();
  const [dealers, setDealers] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterMake, setFilterMake] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterDealership, setFilterDealership] = useState("all");

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const dealersRes = await fetch(djangoApiUrl(`/djangoapp/get_dealers`), {
        headers: { ...authHeaders() },
      });

      if (dealersRes.status === 401) {
        logout();
        return;
      }

      const dealersData = await dealersRes.json();
      if (dealersData.status !== 200 || !Array.isArray(dealersData.dealers)) {
        setError("Unable to load dealerships.");
        return;
      }

      const dealershipList = dealersData.dealers;
      setDealers(dealershipList);

      const dealerNameById = new Map(
        dealershipList.map((dealer) => [Number(dealer.id), dealer.full_name])
      );

      const inventoryResponses = await Promise.all(
        dealershipList.map(async (dealer) => {
          try {
            const response = await fetch(
              djangoApiUrl(`/djangoapp/inventory/dealer/${dealer.id}`),
              { headers: { ...authHeaders() } }
            );

            if (response.status === 401) {
              return { unauthorized: true, vehicles: [] };
            }

            const data = await response.json();
            if (response.status === 200 && Array.isArray(data.vehicles)) {
              return { vehicles: data.vehicles };
            }

            return { vehicles: [] };
          } catch (fetchError) {
            console.error(`Failed to load inventory for dealer ${dealer.id}:`, fetchError);
            return { vehicles: [] };
          }
        })
      );

      if (inventoryResponses.some((result) => result.unauthorized)) {
        logout();
        return;
      }

      const merged = inventoryResponses
        .flatMap((result) => result.vehicles)
        .map((vehicle) => ({
          ...vehicle,
          dealerName: dealerNameById.get(Number(vehicle.dealer_id)) || "Unknown dealership",
        }))
        .sort((a, b) => compareObjectIdDesc(a._id, b._id));

      setAllVehicles(merged);
    } catch (fetchError) {
      console.error("Failed to load platform inventory:", fetchError);
      setError("Unable to load platform inventory.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, logout]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const makeOptions = useMemo(() => {
    const makes = [...new Set(allVehicles.map((vehicle) => vehicle.make).filter(Boolean))];
    return makes.sort((a, b) => a.localeCompare(b));
  }, [allVehicles]);

  const yearOptions = useMemo(() => {
    const years = [
      ...new Set(allVehicles.map((vehicle) => Number(vehicle.year)).filter((year) => !Number.isNaN(year))),
    ];
    return years.sort((a, b) => b - a);
  }, [allVehicles]);

  const filteredVehicles = useMemo(() => {
    return allVehicles.filter((vehicle) => {
      const makeMatch = filterMake === "all" || vehicle.make === filterMake;
      const yearMatch =
        filterYear === "all" || Number(vehicle.year) === Number(filterYear);
      const dealershipMatch =
        filterDealership === "all" ||
        String(vehicle.dealer_id) === String(filterDealership);
      return makeMatch && yearMatch && dealershipMatch;
    });
  }, [allVehicles, filterMake, filterYear, filterDealership]);

  const filtersActive =
    filterMake !== "all" || filterYear !== "all" || filterDealership !== "all";

  const clearFilters = () => {
    setFilterMake("all");
    setFilterYear("all");
    setFilterDealership("all");
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading platform inventory...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Platform Inventory</h1>
        <p className="mt-1 text-slate-600">
          Cross-tenant vehicle listings across all dealerships.
        </p>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Make</label>
            <select
              value={filterMake}
              onChange={(event) => setFilterMake(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Makes</option>
              {makeOptions.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Year</label>
            <select
              value={filterYear}
              onChange={(event) => setFilterYear(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dealership</label>
            <select
              value={filterDealership}
              onChange={(event) => setFilterDealership(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Dealerships</option>
              {dealers.map((dealer) => (
                <option key={dealer.id} value={dealer.id}>
                  {dealer.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtersActive && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <p className="text-sm text-slate-600">
              Showing {filteredVehicles.length} of {allVehicles.length} vehicles
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-brand-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow-md">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Make
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Model
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Body
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Mileage
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                Dealership
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                  {allVehicles.length === 0
                    ? "No vehicles listed across the platform."
                    : "No vehicles match the selected filters."}
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle) => (
                <tr key={vehicle._id}>
                  <td className="px-4 py-3 text-sm text-slate-900">{vehicle.make}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{vehicle.model}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{vehicle.bodyType}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{vehicle.year}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{vehicle.mileage}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {vehicle.dealerName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventory;
