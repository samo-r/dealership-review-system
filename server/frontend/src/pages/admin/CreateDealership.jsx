import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminFormField from "../../components/admin/AdminFormField";

const CreateDealership = () => {
  const navigate = useNavigate();
  const { authHeaders, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contactNumber: "",
    email: "",
  });

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) nextErrors.name = "Name is required.";
    if (!formData.location.trim()) nextErrors.location = "Location is required.";
    if (!formData.contactNumber.trim()) {
      nextErrors.contactNumber = "Contact number is required.";
    }
    if (!formData.email.trim()) nextErrors.email = "Email is required.";

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((previous) => ({ ...previous, [name]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${window.location.origin}/djangoapp/admin/dealerships`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(formData),
        },
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();
      const dealershipId = data.dealership_id ?? data.dealership?.id;

      if (response.status === 201 && dealershipId) {
        navigate(`/admin/users/create?dealership_id=${dealershipId}`);
        return;
      }

      setError(data.error?.message || "Could not create dealership.");
    } catch (submitError) {
      console.error("Failed to create dealership:", submitError);
      setError("Could not create dealership.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Add New Dealership</h1>
        <p className="mt-1 text-slate-600">
          Onboarding step 1: register the dealership, then assign its dealer admin.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg bg-white p-6 shadow-md">
        <AdminFormField
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Kampala Motors"
          error={formErrors.name}
          required
        />

        <AdminFormField
          label="Location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Plot 12, Jinja Road, Kampala"
          error={formErrors.location}
          required
        />

        <AdminFormField
          label="Contact number"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          placeholder="e.g., +256 700 000000"
          error={formErrors.contactNumber}
          required
        />

        <AdminFormField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="contact@dealership.example"
          error={formErrors.email}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Saving..." : "Save & continue to user setup"}
        </button>
      </form>
    </div>
  );
};

export default CreateDealership;
