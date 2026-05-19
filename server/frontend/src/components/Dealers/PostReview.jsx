import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PostReview = () => {
  const { user, token, authHeaders, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [dealer, setDealer] = useState(null);
  const [review, setReview] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carModels, setCarModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const postReview = async () => {
    if (!token) {
      return navigate("/login", { replace: true });
    }

    if (!model || !review || !date || !year) {
      alert("All details are mandatory");
      return;
    }

    const [makeChosen, modelChosen] = model.split(" ");
    const payload = {
      name: user?.userName || "Anonymous",
      dealership: id,
      review,
      purchase: true,
      purchase_date: date,
      car_make: makeChosen,
      car_model: modelChosen,
      car_year: year,
    };

    setSaving(true);
    try {
      const res = await fetch(`/djangoapp/add_review`, {
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
        alert(data.error?.message || "Could not post review.");
      }
    } catch (error) {
      console.error("Error posting review:", error);
      alert("Unable to submit review right now.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const fetchDealer = async () => {
      try {
        const res = await fetch(`/djangoapp/dealer/${id}`);
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

    const fetchCarModels = async () => {
      try {
        const res = await fetch(`/djangoapp/get_cars`);
        const data = await res.json();
        setCarModels(Array.isArray(data.CarModels) ? data.CarModels : []);
      } catch (error) {
        console.error("Error loading car models:", error);
      }
    };

    fetchDealer();
    fetchCarModels();
  }, [id]);

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

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Purchase Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Car year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={2015}
                max={2026}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                placeholder="2024"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Car make and model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="" disabled>
                Choose car make and model
              </option>
              {carModels.map((carModel) => (
                <option key={`${carModel.CarMake}-${carModel.CarModel}`} value={`${carModel.CarMake} ${carModel.CarModel}`}>
                  {carModel.CarMake} {carModel.CarModel}
                </option>
              ))}
            </select>
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
