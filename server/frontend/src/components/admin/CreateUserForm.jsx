import { djangoApiUrl } from "../../utils/djangoApi";
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AdminFormField from "./AdminFormField";

const CreateUserForm = ({ title = "Create User", description }) => {
  const { authHeaders, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const lockedDealerId = searchParams.get("dealership_id") || "";

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
    assignedDealerId: lockedDealerId,
  });

  useEffect(() => {
    setFormData((previous) => ({
      ...previous,
      assignedDealerId: lockedDealerId || previous.assignedDealerId,
    }));
  }, [lockedDealerId]);

  useEffect(() => {
    const loadDealers = async () => {
      try {
        const response = await fetch(djangoApiUrl(`/djangoapp/get_dealers`), {
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

  const dealerOptions = useMemo(() => {
    const base = [
      {
        value: "",
        label: loadingDealers ? "Loading dealerships..." : "Select dealership",
      },
    ];
    return base.concat(
      dealers.map((dealer) => ({
        value: String(dealer.id),
        label: `${dealer.full_name} (#${dealer.id})`,
      })),
    );
  }, [dealers, loadingDealers]);

  const lockedDealer = dealers.find(
    (dealer) => String(dealer.id) === String(formData.assignedDealerId),
  );

  const validate = () => {
    const nextErrors = {};

    if (!formData.userName.trim()) nextErrors.userName = "Username is required.";
    if (!formData.password.trim()) nextErrors.password = "Password is required.";
    if (!formData.assignedDealerId) {
      nextErrors.assignedDealerId = "Assigned dealership is required.";
    }

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
        djangoApiUrl(`/djangoapp/admin/create_dealer_admin`),
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
        },
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
          assignedDealerId: lockedDealerId,
        });
      } else {
        setError(data.error?.message || "Could not create user.");
      }
    } catch (submitError) {
      console.error("Failed to create user:", submitError);
      setError("Could not create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-slate-600">
          {description ||
            "Create a dealer admin account and assign it to a dealership."}
        </p>
      </div>

      {lockedDealerId && (
        <div className="mb-4 rounded-lg border border-brand-primary/30 bg-brand-primary/5 p-4 text-sm text-slate-700">
          Onboarding step 2: assign a dealer admin to{" "}
          <strong>{lockedDealer?.full_name || `dealership #${lockedDealerId}`}</strong>.
          The dealership field is locked for this flow.
        </div>
      )}

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
          <AdminFormField
            label="Username"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            placeholder="dealer_admin_user"
            error={formErrors.userName}
            required
          />
          <AdminFormField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Strong password"
            error={formErrors.password}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AdminFormField
            label="First name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First name"
          />
          <AdminFormField
            label="Last name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last name"
          />
        </div>

        <AdminFormField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="dealer.admin@example.com"
        />

        <AdminFormField
          label="Assigned dealership"
          name="assignedDealerId"
          as="select"
          value={formData.assignedDealerId}
          onChange={handleChange}
          options={dealerOptions}
          error={formErrors.assignedDealerId}
          required
          readOnly={Boolean(lockedDealerId)}
          disabled={loadingDealers}
          hint={
            lockedDealerId
              ? "Pre-selected from the dealership you just registered."
              : undefined
          }
        />

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

export default CreateUserForm;
