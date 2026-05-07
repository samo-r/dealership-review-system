import React, { useState } from "react";

/**
 * VehicleForm — add/edit vehicle in two modes:
 *   - Dealer Admin: fixedDealerId hides the dealer field
 *   - System Admin: selectable=true shows a dropdown of all dealerships
 *
 * Props:
 *   fixedDealerId?: number  — if provided, dealer field is locked and hidden
 *   dealerships?: array  — list of dealerships for admin dropdown
 *   vehicle?: object  — for edit mode; if absent, form is in "add" mode
 *   onSubmit: (vehicleData) => void  — called when form is submitted
 *   isLoading?: boolean  — disables submit button
 */
const VehicleForm = ({
  fixedDealerId,
  dealerships = [],
  vehicle,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    dealership: fixedDealerId || "",
    car_make: "",
    car_model: "",
    car_year: new Date().getFullYear(),
    price: "",
    mileage: "",
    ...vehicle,
  });

  const [errors, setErrors] = useState({});

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

    if (!formData.car_make.trim())
      newErrors.car_make = "Car make is required.";
    if (!formData.car_model.trim())
      newErrors.car_model = "Car model is required.";
    if (!formData.car_year)
      newErrors.car_year = "Car year is required.";
    if (!fixedDealerId && !formData.dealership)
      newErrors.dealership = "Dealership is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      dealership: formData.dealership,
      car_make: formData.car_make,
      car_model: formData.car_model,
      car_year: formData.car_year,
      price: formData.price || null,
      mileage: formData.mileage || null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6 max-w-2xl"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {vehicle ? "Edit Vehicle" : "Add Vehicle"}
      </h2>

      {/* Dealership field — hidden if fixedDealerId, dropdown if admin */}
      {!fixedDealerId && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dealership
          </label>
          <select
            name="dealership"
            value={formData.dealership}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
              errors.dealership ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select a dealership...</option>
            {dealerships.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.full_name} ({dealer.city}, {dealer.state})
              </option>
            ))}
          </select>
          {errors.dealership && (
            <p className="text-red-600 text-xs mt-1">{errors.dealership}</p>
          )}
        </div>
      )}

      {/* Car make */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Car Make *
        </label>
        <input
          type="text"
          name="car_make"
          placeholder="e.g., Toyota"
          value={formData.car_make}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            errors.car_make ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.car_make && (
          <p className="text-red-600 text-xs mt-1">{errors.car_make}</p>
        )}
      </div>

      {/* Car model */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Car Model *
        </label>
        <input
          type="text"
          name="car_model"
          placeholder="e.g., Camry"
          value={formData.car_model}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            errors.car_model ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.car_model && (
          <p className="text-red-600 text-xs mt-1">{errors.car_model}</p>
        )}
      </div>

      {/* Car year */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Car Year *
        </label>
        <input
          type="number"
          name="car_year"
          min="1900"
          max={new Date().getFullYear() + 1}
          value={formData.car_year}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            errors.car_year ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.car_year && (
          <p className="text-red-600 text-xs mt-1">{errors.car_year}</p>
        )}
      </div>

      {/* Price (optional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price (optional)
        </label>
        <input
          type="number"
          name="price"
          placeholder="e.g., 25000"
          value={formData.price}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Mileage (optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mileage (optional)
        </label>
        <input
          type="number"
          name="mileage"
          placeholder="e.g., 45000"
          value={formData.mileage}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-brand-primary text-white rounded-md font-medium hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
      </button>
    </form>
  );
};

export default VehicleForm;
