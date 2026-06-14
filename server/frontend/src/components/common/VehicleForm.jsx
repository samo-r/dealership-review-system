import React, { useState } from "react";
import PasswordInput from "./PasswordInput";

const BODY_TYPES = ["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Van", "Other"];

/**
 * VehicleForm — add/edit vehicle in dealer or admin context.
 */
const VehicleForm = ({
  fixedDealerId,
  dealerships = [],
  vehicle,
  onSubmit,
  isLoading = false,
}) => {
  const isEdit = Boolean(vehicle);

  const [formData, setFormData] = useState({
    dealership: fixedDealerId || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    year: vehicle?.year || new Date().getFullYear(),
    bodyType: vehicle?.bodyType || "",
    mileage: vehicle?.mileage ?? "",
    chassis_number: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.make.trim()) newErrors.make = "Car make is required.";
    if (!formData.model.trim()) newErrors.model = "Car model is required.";
    if (!formData.year) newErrors.year = "Car year is required.";
    if (!formData.bodyType.trim()) newErrors.bodyType = "Body type is required.";
    if (formData.mileage === "" || Number(formData.mileage) < 0) {
      newErrors.mileage = "Mileage is required and must be non-negative.";
    }
    if (!isEdit && !formData.chassis_number.trim()) {
      newErrors.chassis_number = "Chassis number is required.";
    }
    if (!fixedDealerId && !formData.dealership) {
      newErrors.dealership = "Dealership is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: Number(formData.year),
      bodyType: formData.bodyType.trim(),
      mileage: Number(formData.mileage),
    };

    if (!fixedDealerId) {
      payload.dealer_id = Number(formData.dealership);
    }

    if (formData.chassis_number.trim()) {
      payload.chassis_number = formData.chassis_number.trim();
    }

    onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6 max-w-2xl"
    >
      <h2 className="text-xl font-bold text-slate-900 mb-6">
        {isEdit ? "Edit Vehicle" : "Add Vehicle"}
      </h2>

      {!fixedDealerId && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Dealership
          </label>
          <select
            name="dealership"
            value={formData.dealership}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
              errors.dealership ? "border-red-500" : "border-slate-300"
            }`}
          >
            <option value="">Select a dealership...</option>
            {dealerships.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.name || dealer.full_name} ({dealer.district || dealer.city})
              </option>
            ))}
          </select>
          {errors.dealership && (
            <p className="text-red-600 text-xs mt-1">{errors.dealership}</p>
          )}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Car Make *
        </label>
        <input
          type="text"
          name="make"
          placeholder="e.g., Toyota"
          value={formData.make}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            errors.make ? "border-red-500" : "border-slate-300"
          }`}
        />
        {errors.make && (
          <p className="text-red-600 text-xs mt-1">{errors.make}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Car Model *
        </label>
        <input
          type="text"
          name="model"
          placeholder="e.g., Camry"
          value={formData.model}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            errors.model ? "border-red-500" : "border-slate-300"
          }`}
        />
        {errors.model && (
          <p className="text-red-600 text-xs mt-1">{errors.model}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Body Type *
        </label>
        <select
          name="bodyType"
          value={formData.bodyType}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            errors.bodyType ? "border-red-500" : "border-slate-300"
          }`}
        >
          <option value="">Select body type...</option>
          {BODY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.bodyType && (
          <p className="text-red-600 text-xs mt-1">{errors.bodyType}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Car Year *
        </label>
        <input
          type="number"
          name="year"
          min="1900"
          max={new Date().getFullYear() + 1}
          value={formData.year}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            errors.year ? "border-red-500" : "border-slate-300"
          }`}
        />
        {errors.year && (
          <p className="text-red-600 text-xs mt-1">{errors.year}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Mileage *
        </label>
        <input
          type="number"
          name="mileage"
          min="0"
          placeholder="e.g., 45000"
          value={formData.mileage}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            errors.mileage ? "border-red-500" : "border-slate-300"
          }`}
        />
        {errors.mileage && (
          <p className="text-red-600 text-xs mt-1">{errors.mileage}</p>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Chassis Number {isEdit ? "(optional)" : "*"}
        </label>
        <PasswordInput
          name="chassis_number"
          placeholder={isEdit ? "Leave blank to keep existing" : "Enter chassis number"}
          value={formData.chassis_number}
          onChange={handleChange}
          autoComplete="off"
          hasError={Boolean(errors.chassis_number)}
          showToggleLabel="Show chassis number"
          hideToggleLabel="Hide chassis number"
          inputClassName="w-full px-3 py-2 pr-12 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary border-slate-300"
        />
        {errors.chassis_number && (
          <p className="text-red-600 text-xs mt-1">{errors.chassis_number}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-brand-primary text-white rounded-md font-medium hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Saving..." : isEdit ? "Update Vehicle" : "Add Vehicle"}
      </button>
    </form>
  );
};

export default VehicleForm;
