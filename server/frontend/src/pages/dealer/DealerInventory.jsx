import { getApiUrl } from "../../utils/apiBridge";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import VehicleForm from "../../components/common/VehicleForm";
import { hasCapability } from "../../utils/roleCapabilities";

/**
 * Dealer Inventory — full CRUD interface for managing vehicles
 * DEALER_ADMIN can only manage inventory for their own assigned dealership
 */
const DealerInventory = () => {
  const { user, authHeaders, role } = useAuth();
  const dealerId = user?.assignedDealerId;
  const canManageInventory = hasCapability(role, "inventory.create");
  const canUpdateInventory = hasCapability(role, "inventory.update.own");
  const canDeleteInventory = hasCapability(role, "inventory.delete.own");

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // "add" | "edit" | null
  const [formMode, setFormMode] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchInventory = useCallback(async () => {
    if (!dealerId) {
      setError("No assigned dealership found");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        getApiUrl(`/djangoapp/inventory/dealer/${dealerId}`),
        {
          headers: {
            ...authHeaders(),
          },
        }
      );
      const data = await res.json();
      if (data.status === 200) {
        setVehicles(data.vehicles || []);
      } else {
        setError(data.error?.message || "Failed to load inventory");
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [dealerId, authHeaders]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // ------------------------------------------------------------------
  // Add vehicle
  // ------------------------------------------------------------------
  const handleAdd = async (vehicleData) => {
    setFormLoading(true);
    setError(null);
    try {
      const res = await fetch(
        getApiUrl(`/djangoapp/inventory/add`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ dealer_id: dealerId, ...vehicleData }),
        }
      );
      const data = await res.json();
      if (data.status === 201) {
        setFormMode(null);
        showSuccess("Vehicle added successfully!");
        await fetchInventory();
      } else {
        setError(data.error?.message || "Failed to add vehicle");
      }
    } catch (err) {
      console.error("Error adding vehicle:", err);
      setError("Failed to add vehicle");
    } finally {
      setFormLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Update vehicle
  // ------------------------------------------------------------------
  const handleUpdate = async (vehicleData) => {
    if (!editingVehicle) return;
    setFormLoading(true);
    setError(null);
    try {
      const vehicleId = editingVehicle._id;
      const res = await fetch(
        getApiUrl(`/djangoapp/inventory/${vehicleId}/update`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(vehicleData),
        }
      );
      const data = await res.json();
      if (data.status === 200) {
        setFormMode(null);
        setEditingVehicle(null);
        showSuccess("Vehicle updated successfully!");
        await fetchInventory();
      } else {
        setError(data.error?.message || "Failed to update vehicle");
      }
    } catch (err) {
      console.error("Error updating vehicle:", err);
      setError("Failed to update vehicle");
    } finally {
      setFormLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Delete vehicle
  // ------------------------------------------------------------------
  const handleDelete = async (vehicleId) => {
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch(
        getApiUrl(`/djangoapp/inventory/${vehicleId}/delete`),
        {
          method: "DELETE",
          headers: {
            ...authHeaders(),
          },
        }
      );
      const data = await res.json();
      if (data.status === 200) {
        setConfirmDeleteId(null);
        showSuccess("Vehicle removed from inventory.");
        await fetchInventory();
      } else {
        setError(data.error?.message || "Failed to delete vehicle");
      }
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setError("Failed to delete vehicle");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormMode("edit");
    // Scroll to top to reveal form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingVehicle(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-600 mt-1">
            Manage vehicles for your dealership.
          </p>
        </div>
        {canManageInventory && formMode !== "add" && (
          <button
            onClick={() => {
              setFormMode("add");
              setEditingVehicle(null);
              setError(null);
            }}
            className="px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Add Vehicle
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Add / Edit Form */}
      {formMode && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              {formMode === "add" ? "Add Vehicle" : "Edit Vehicle"}
            </h2>
            <button
              onClick={closeForm}
              className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
              aria-label="Close form"
            >
              &times;
            </button>
          </div>
          <VehicleForm
            fixedDealerId={dealerId}
            vehicle={editingVehicle}
            onSubmit={formMode === "add" ? handleAdd : handleUpdate}
            isLoading={formLoading}
          />
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {vehicles.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-slate-500 text-lg mb-4">
              No vehicles in inventory yet.
            </p>
            {canManageInventory && (
              <button
                onClick={() => setFormMode("add")}
                className="px-4 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-dark transition-colors"
              >
                Add your first vehicle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Make
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Body
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Year
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">
                    Mileage
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((vehicle) => {
                  const id = vehicle._id;
                  return (
                    <tr key={id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {vehicle.make}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {vehicle.model}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {vehicle.bodyType}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {vehicle.year}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {vehicle.mileage != null
                          ? `${Number(vehicle.mileage).toLocaleString()} mi`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(canUpdateInventory || canDeleteInventory) && (
                          <div className="flex justify-end gap-2">
                            {canUpdateInventory && (
                              <button
                                onClick={() => openEdit(vehicle)}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors font-medium"
                              >
                                Edit
                              </button>
                            )}
                            {canDeleteInventory && (
                              <button
                                onClick={() => setConfirmDeleteId(id)}
                                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vehicle count */}
      {vehicles.length > 0 && (
        <p className="text-sm text-slate-500 text-right">
          {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} in
          inventory
        </p>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Delete Vehicle?
            </h3>
            <p className="text-slate-600 mb-6">
              This action cannot be undone. The vehicle will be permanently
              removed from inventory.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleteLoading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerInventory;
