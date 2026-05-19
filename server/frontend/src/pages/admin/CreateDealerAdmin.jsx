import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const CreateDealerAdmin = () => {
  const { authHeaders, logout } = useAuth();

  const [dealers, setDealers] = useState([]);
  const [loadingDealers, setLoadingDealers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    userName: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    assignedDealerId: "",
  });

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
          return;
        }

        setError("Unable to load dealerships for assignment.");
      } catch (fetchError) {
        console.error("Failed to fetch dealerships:", fetchError);
        setError("Unable to load dealerships for assignment.");
      } finally {
        setLoadingDealers(false);
      }
    };

    loadDealers();
  }, [authHeaders, logout]);

  const validate = () => {
    const nextErrors = {};

    if (!formData.userName.trim()) nextErrors.userName = "Username is required.";
    if (!formData.password.trim()) nextErrors.password = "Password is required.";
    if (!formData.assignedDealerId) nextErrors.assignedDealerId = "Assigned dealership is required.";

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
    setSuccess("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${window.location.origin}/djangoapp/admin/create_dealer_admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            ...formData,
            assignedDealerId: Number(formData.assignedDealerId),
          }),
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();
      if (response.status === 201) {
        setSuccess(`Dealer admin "${data.user?.userName || formData.userName}" created.`);
        setFormData({
          userName: "",
          password: "",
          firstName: "",
          lastName: "",
          email: "",
          assignedDealerId: "",
        });
      } else {
        setError(data.error?.message || "Could not create dealer admin.");
      }
    } catch (submitError) {
      console.error("Failed to create dealer admin:", submitError);
      setError("Could not create dealer admin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Create Dealer Admin</h1>
        <p className="mt-1 text-slate-600">
          Create a dealer admin account and assign it to a dealership.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg bg-white p-6 shadow-md">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username *</label>
            <input
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                formErrors.userName ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="dealer_admin_user"
            />
            {formErrors.userName && <p className="mt-1 text-xs text-red-600">{formErrors.userName}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                formErrors.password ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Strong password"
            />
            {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">First name</label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder="dealer.admin@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Assigned dealership *
          </label>
          <select
            name="assignedDealerId"
            value={formData.assignedDealerId}
            onChange={handleChange}
            disabled={loadingDealers}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary ${
              formErrors.assignedDealerId ? "border-red-500" : "border-slate-300"
            }`}
          >
            <option value="">
              {loadingDealers ? "Loading dealerships..." : "Select dealership"}
            </option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.full_name} (#{dealer.id})
              </option>
            ))}
          </select>
          {formErrors.assignedDealerId && (
            <p className="mt-1 text-xs text-red-600">{formErrors.assignedDealerId}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || loadingDealers}
          className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Creating..." : "Create dealer admin"}
        </button>
      </form>
    </div>
  );
};

export default CreateDealerAdmin;
