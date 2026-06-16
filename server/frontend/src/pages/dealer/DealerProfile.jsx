import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { hasCapability } from "../../utils/roleCapabilities";

const DealerProfile = () => {
  const { user, authHeaders, role } = useAuth();
  const dealerId = user?.assignedDealerId;
  const canUpdateProfile = hasCapability(role, "dealership.update.own");

  const [dealership, setDealership] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    district: "",
    physical_address: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!dealerId) {
      setError("No assigned dealership found");
      setLoading(false);
      return;
    }

    const fetchDealership = async () => {
      try {
        const res = await fetch(
          `${window.location.origin}/djangoapp/dealer/${dealerId}`
        );
        const data = await res.json();
        const dealer = Array.isArray(data.dealer) ? data.dealer[0] : data.dealer;

        if (data.status === 200 && dealer) {
          setDealership(dealer);
          setFormData({
            name: dealer.name || dealer.full_name || "",
            district: dealer.district || dealer.city || "",
            physical_address: dealer.physical_address || dealer.address || "",
            email: dealer.email || "",
          });
        } else {
          setError("Failed to load dealership information");
        }
      } catch (err) {
        console.error("Error fetching dealership:", err);
        setError("Failed to load dealership information");
      } finally {
        setLoading(false);
      }
    };

    fetchDealership();
  }, [dealerId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.district.trim()) newErrors.district = "District is required.";
    if (!formData.physical_address.trim()) {
      newErrors.physical_address = "Physical address is required.";
    }
    if (!formData.email.trim()) newErrors.email = "Email is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `${window.location.origin}/djangoapp/dealer/${dealerId}/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.status === 200) {
        setSuccess("Dealership information updated successfully!");
        if (data.dealer) {
          setDealership(data.dealer);
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error?.message || "Failed to update dealership information");
      }
    } catch (err) {
      console.error("Error updating dealership:", err);
      setError("Failed to update dealership information");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Loading profile...</p>
      </div>
    );
  }

  if (error && !dealership) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dealership Profile</h1>
        <p className="text-slate-600 mt-1">Manage your dealership information.</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6 space-y-6"
      >
        <fieldset disabled={!canUpdateProfile} className="space-y-6 border-0 p-0 m-0">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                errors.name ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">TIN</label>
            <input
              type="text"
              value={dealership?.tin || ""}
              readOnly
              className="w-full px-4 py-2 border rounded-lg text-sm bg-slate-100 border-slate-300 text-slate-600"
            />
          </div>

          <div>
            <label htmlFor="district" className="block text-sm font-medium text-slate-700 mb-2">
              District *
            </label>
            <input
              type="text"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                errors.district ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.district && (
              <p className="text-red-600 text-xs mt-1">{errors.district}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="physical_address"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Physical address *
            </label>
            <input
              type="text"
              id="physical_address"
              name="physical_address"
              value={formData.physical_address}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                errors.physical_address ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.physical_address && (
              <p className="text-red-600 text-xs mt-1">{errors.physical_address}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                errors.email ? "border-red-500" : "border-slate-300"
              }`}
            />
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>
        </fieldset>

        <div className="flex gap-4 pt-4">
          {canUpdateProfile && (
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DealerProfile;
