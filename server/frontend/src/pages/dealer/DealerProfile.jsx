import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

/**
 * Dealer Profile — edit dealership information
 * DEALER_ADMIN can only edit their own assigned dealership
 */
const DealerProfile = () => {
  const { user } = useAuth();
  const dealerId = user?.assignedDealerId;

  const [dealership, setDealership] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    short_name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});

  // Fetch current dealership info
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

        if (data.status === 200 && data.dealer) {
          setDealership(data.dealer);
          setFormData({
            full_name: data.dealer.full_name || "",
            short_name: data.dealer.short_name || "",
            address: data.dealer.address || "",
            city: data.dealer.city || "",
            state: data.dealer.state || "",
            zip: data.dealer.zip || "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.full_name.trim())
      newErrors.full_name = "Full name is required.";
    if (!formData.short_name.trim())
      newErrors.short_name = "Short name is required.";
    if (!formData.address.trim())
      newErrors.address = "Address is required.";
    if (!formData.city.trim())
      newErrors.city = "City is required.";
    if (!formData.state.trim())
      newErrors.state = "State is required.";
    if (!formData.zip.trim())
      newErrors.zip = "ZIP code is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.status === 200) {
        setSuccess("Dealership information updated successfully!");
        // Update local dealership state
        if (data.dealer) {
          setDealership(data.dealer);
        }
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(
          data.error?.message ||
            "Failed to update dealership information"
        );
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
        <p className="text-gray-500">Loading profile...</p>
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dealership Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your dealership information.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-md p-6 space-y-6"
      >
        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
              errors.full_name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Downtown Auto Sales"
          />
          {errors.full_name && (
            <p className="text-red-600 text-xs mt-1">{errors.full_name}</p>
          )}
        </div>

        {/* Short Name */}
        <div>
          <label htmlFor="short_name" className="block text-sm font-medium text-gray-700 mb-2">
            Short Name *
          </label>
          <input
            type="text"
            id="short_name"
            name="short_name"
            value={formData.short_name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
              errors.short_name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Downtown Auto"
          />
          {errors.short_name && (
            <p className="text-red-600 text-xs mt-1">{errors.short_name}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
              errors.address ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., 123 Main Street"
          />
          {errors.address && (
            <p className="text-red-600 text-xs mt-1">{errors.address}</p>
          )}
        </div>

        {/* City, State, ZIP Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                errors.city ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Austin"
            />
            {errors.city && (
              <p className="text-red-600 text-xs mt-1">{errors.city}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              maxLength="2"
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors uppercase ${
                errors.state ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., TX"
            />
            {errors.state && (
              <p className="text-red-600 text-xs mt-1">{errors.state}</p>
            )}
          </div>

          {/* ZIP */}
          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code *
            </label>
            <input
              type="text"
              id="zip"
              name="zip"
              value={formData.zip}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors ${
                errors.zip ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., 78701"
            />
            {errors.zip && (
              <p className="text-red-600 text-xs mt-1">{errors.zip}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Changes to your dealership information will be
          reflected across the platform immediately. All fields marked with * are
          required.
        </p>
      </div>
    </div>
  );
};

export default DealerProfile;
