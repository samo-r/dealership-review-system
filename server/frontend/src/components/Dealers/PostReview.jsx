import { getApiUrl } from "../../utils/apiBridge";
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "../common/PasswordInput";

const PostReview = () => {
  const { user, token, authHeaders, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [dealer, setDealer] = useState(null);
  const [review, setReview] = useState("");
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");
  const [date, setDate] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const makeOptions = useMemo(() => {
    const makes = [...new Set(inventoryOptions.map((entry) => entry.make).filter(Boolean))];
    return makes.sort((a, b) => a.localeCompare(b));
  }, [inventoryOptions]);

  const modelOptions = useMemo(() => {
    return inventoryOptions
      .filter((entry) => entry.make === carMake)
      .map((entry) => entry.model)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [inventoryOptions, carMake]);

  const postReview = async () => {
    if (!token) {
      return navigate("/login", { replace: true });
    }

    if (!carMake || !carModel || !review || !date || !chassisNumber.trim()) {
      setError("All details are mandatory, including chassis verification.");
      return;
    }

    setError(null);

    const payload = {
      name: user?.userName || "Anonymous",
      dealership: id,
      review,
      purchase: true,
      purchase_date: date,
      car_make: carMake,
      car_model: carModel,
      chassis_number: chassisNumber.trim(),
    };

    setSaving(true);
    try {
      const res = await fetch(getApiUrl(`/djangoapp/add_review`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        logout();
        return navigate("/login", { replace: true });
      }

      const data = await res.json();
      if (res.ok) {
        navigate(`/dealer/${id}`);
      } else {
        setError(data.error?.message || "Could not post review.");
      }
    } catch (submitError) {
      console.error("Error posting review:", submitError);
      setError("Unable to submit review right now.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchDealer = async () => {
      try {
        const res = await fetch(getApiUrl(`/djangoapp/dealer/${id}`));
        const data = await res.json();
        if (data.status === 200 && Array.isArray(data.dealer)) {
          setDealer(data.dealer[0] || null);
        }
      } catch (error) {
        console.error("Error loading dealer:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchInventoryOptions = async () => {
      if (!token) {
        setInventoryOptions([]);
        setInventoryLoading(false);
        return;
      }

      setInventoryLoading(true);
      try {
        const res = await fetch(getApiUrl(`/djangoapp/inventory/dealer/${id}/options`), {
          headers: authHeaders(),
        });

        if (res.status === 401) {
          logout();
          navigate("/login", { replace: true });
          return;
        }

        const data = await res.json();
        if (data.status === 200 && Array.isArray(data.options)) {
          setInventoryOptions(data.options);
        } else {
          setInventoryOptions([]);
        }
      } catch (fetchError) {
        console.error("Error loading dealership inventory:", fetchError);
        setInventoryOptions([]);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchDealer();
    fetchInventoryOptions();
  }, [id, token, authHeaders, logout, navigate]);

  return (
    <div className="w-full py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-primary">
            Write a review
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            {loading ? "Loading review form..." : dealer?.full_name || "Dealer review"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Share your experience and help other buyers find the right dealership.
          </p>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Review</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Tell us about your visit, service, and purchase experience."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Purchase Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Car Make</label>
              <select
                value={carMake}
                onChange={(e) => {
                  setCarMake(e.target.value);
                  setCarModel("");
                }}
                disabled={inventoryLoading || makeOptions.length === 0}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="" disabled>
                  {inventoryLoading
                    ? "Loading inventory..."
                    : makeOptions.length === 0
                      ? "No vehicles in inventory"
                      : "Choose car make"}
                </option>
                {makeOptions.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Car Model</label>
              <select
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                disabled={inventoryLoading || !carMake || modelOptions.length === 0}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="" disabled>
                  {inventoryLoading
                    ? "Loading inventory..."
                    : !carMake
                      ? "Select make first"
                      : modelOptions.length === 0
                        ? "No models for this make"
                        : "Choose car model"}
                </option>
                {modelOptions.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!inventoryLoading && inventoryOptions.length === 0 && token && (
            <p className="text-sm text-amber-700">
              This dealership has no inventory yet. A dealer admin must add vehicles before you can
              select a make and model for your review.
            </p>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Verify Purchase — Chassis Number *
            </label>
            <PasswordInput
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
              autoComplete="off"
              placeholder="Enter your vehicle chassis number"
              showToggleLabel="Show chassis number"
              hideToggleLabel="Hide chassis number"
            />
            <p className="mt-2 text-xs text-slate-500">
              Your review is only saved after your purchase is verified against dealership inventory.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={postReview}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? "Posting review..." : "Post review"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/dealer/${id}`)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Back to dealer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostReview;
